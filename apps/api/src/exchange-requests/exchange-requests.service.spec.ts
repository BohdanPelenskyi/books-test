import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ExchangeAction } from '@book-exchange/shared';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExchangeRequestsService } from './exchange-requests.service';

const REQUESTER = {
  id: 'requester-id',
  name: 'Petro',
  email: 'petro@example.com',
  role: 'USER' as const,
  avatarUrl: null,
  createdAt: new Date('2026-01-01'),
};
const OWNER = { id: 'owner-id', name: 'Anna', email: 'anna@example.com', avatarUrl: null };
const BOOK_ID = 'book-id';
const REQUEST_ID = 'request-id';
const OFFERED_BOOK_ID = 'offered-book-id';

const desiredBook = {
  id: BOOK_ID,
  name: 'Dune',
  author: 'Frank Herbert',
  photoUrl: null,
  status: 'AVAILABLE' as const,
  ownerId: OWNER.id,
  owner: OWNER,
};
const offeredBook = { id: OFFERED_BOOK_ID, name: '1984', author: 'George Orwell', photoUrl: null };

const pendingRequest = {
  id: REQUEST_ID,
  status: 'PENDING' as const,
  message: null,
  createdAt: new Date('2026-02-01'),
  bookId: BOOK_ID,
  requesterId: REQUESTER.id,
  ownerId: OWNER.id,
  book: { id: BOOK_ID, name: 'Dune', author: 'Frank Herbert', photoUrl: null },
  offeredBooks: [offeredBook],
  requester: REQUESTER,
  owner: OWNER,
};

describe('ExchangeRequestsService', () => {
  let service: ExchangeRequestsService;
  const prisma = {
    book: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    exchangeRequest: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const mailService = { sendExchangeRequest: jest.fn(), sendExchangeStatus: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((callback: (client: typeof prisma) => unknown) =>
      callback(prisma),
    );
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExchangeRequestsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = moduleRef.get(ExchangeRequestsService);
  });

  describe('create', () => {
    const dto = {
      bookId: BOOK_ID,
      message: 'Давайте обміняємось',
      offeredBookIds: [OFFERED_BOOK_ID],
    };

    beforeEach(() => {
      prisma.book.findUnique.mockResolvedValue(desiredBook);
      prisma.book.findMany.mockResolvedValue([offeredBook]);
      prisma.exchangeRequest.findFirst.mockResolvedValue(null);
      prisma.exchangeRequest.create.mockResolvedValue(pendingRequest);
    });

    it('throws NotFoundException when the book does not exist', async () => {
      prisma.book.findUnique.mockResolvedValue(null);

      await expect(service.create(REQUESTER, dto)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a request for the sender own book', async () => {
      prisma.book.findUnique.mockResolvedValue({ ...desiredBook, ownerId: REQUESTER.id });

      await expect(service.create(REQUESTER, dto)).rejects.toThrow(
        new BadRequestException('Не можна запросити обмін на власну книгу'),
      );
      expect(prisma.exchangeRequest.create).not.toHaveBeenCalled();
    });

    it('rejects a request for a book that was already exchanged', async () => {
      prisma.book.findUnique.mockResolvedValue({ ...desiredBook, status: 'EXCHANGED' });

      await expect(service.create(REQUESTER, dto)).rejects.toThrow(
        new ConflictException('Ця книга вже обміняна'),
      );
      expect(prisma.exchangeRequest.create).not.toHaveBeenCalled();
    });

    it('rejects a sender who has no available books to offer', async () => {
      prisma.book.findMany.mockResolvedValue([]);

      await expect(service.create(REQUESTER, dto)).rejects.toThrow(
        new BadRequestException('Додайте хоча б одну книгу для обміну'),
      );
      expect(prisma.exchangeRequest.create).not.toHaveBeenCalled();
    });

    it('rejects offering a book that is not an available book of the sender', async () => {
      await expect(
        service.create(REQUESTER, {
          ...dto,
          offeredBookIds: [OFFERED_BOOK_ID, 'someone-elses-book'],
        }),
      ).rejects.toThrow(new BadRequestException('Пропонувати можна лише власні доступні книги'));
      expect(prisma.exchangeRequest.create).not.toHaveBeenCalled();
    });

    it('rejects a second pending request for the same book', async () => {
      prisma.exchangeRequest.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create(REQUESTER, dto)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.exchangeRequest.create).not.toHaveBeenCalled();
    });

    it('saves the offered books and emails the owner with exactly those books', async () => {
      prisma.book.findMany.mockResolvedValue([
        offeredBook,
        { id: 'not-offered', name: 'Brave New World', author: 'Aldous Huxley', photoUrl: null },
      ]);

      const result = await service.create(REQUESTER, dto);

      expect(result).toMatchObject({ id: REQUEST_ID, status: 'PENDING' });
      expect(prisma.exchangeRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            bookId: BOOK_ID,
            requesterId: REQUESTER.id,
            ownerId: OWNER.id,
            message: dto.message,
            offeredBooks: { connect: [{ id: OFFERED_BOOK_ID }] },
          },
        }),
      );
      expect(mailService.sendExchangeRequest).toHaveBeenCalledWith({
        to: OWNER.email,
        ownerName: OWNER.name,
        requesterName: REQUESTER.name,
        requesterEmail: REQUESTER.email,
        desiredBook: { name: 'Dune', author: 'Frank Herbert' },
        requesterBooks: [{ name: '1984', author: 'George Orwell' }],
        message: dto.message,
      });
    });

    it('still returns the saved request when the email fails', async () => {
      mailService.sendExchangeRequest.mockRejectedValue(new Error('SMTP down'));

      await expect(service.create(REQUESTER, dto)).resolves.toMatchObject({ id: REQUEST_ID });
    });

    it('does not leak the owner email in the response to a new request', async () => {
      const result = await service.create(REQUESTER, dto);

      expect(result.owner.email).toBeNull();
    });
  });

  describe('respond', () => {
    let storedRequest: Omit<typeof pendingRequest, 'status'> & { status: string };
    const competitor = {
      ...pendingRequest,
      id: 'competitor-request',
      requesterId: 'competitor-id',
      requester: { ...REQUESTER, id: 'competitor-id', name: 'Olena', email: 'olena@example.com' },
    };

    beforeEach(() => {
      storedRequest = pendingRequest;
      prisma.exchangeRequest.findUnique.mockImplementation(() => Promise.resolve(storedRequest));
      prisma.exchangeRequest.findUniqueOrThrow.mockImplementation(() =>
        Promise.resolve(storedRequest),
      );
      prisma.exchangeRequest.findMany.mockResolvedValue([]);
      prisma.exchangeRequest.updateMany.mockImplementation(
        ({ where, data }: { where: { id: unknown }; data: object }) => {
          if (typeof where.id === 'string') {
            storedRequest = { ...storedRequest, ...data };
          }
          return Promise.resolve({ count: 1 });
        },
      );
    });

    it('throws NotFoundException for an unknown request', async () => {
      prisma.exchangeRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.respond(OWNER.id, REQUEST_ID, ExchangeAction.ACCEPT),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lets the owner accept, marks the book exchanged and emails the requester', async () => {
      const result = await service.respond(OWNER.id, REQUEST_ID, ExchangeAction.ACCEPT);

      expect(result.status).toBe('ACCEPTED');
      expect(prisma.book.update).toHaveBeenCalledWith({
        where: { id: BOOK_ID },
        data: { status: 'EXCHANGED' },
      });
      expect(mailService.sendExchangeStatus).toHaveBeenCalledWith({
        to: REQUESTER.email,
        requesterName: REQUESTER.name,
        ownerName: OWNER.name,
        bookName: 'Dune',
        isAccepted: true,
      });
    });

    it('declines the other pending requests for the same book and tells their senders', async () => {
      prisma.exchangeRequest.findMany.mockResolvedValue([competitor]);

      await service.respond(OWNER.id, REQUEST_ID, ExchangeAction.ACCEPT);

      expect(prisma.exchangeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { bookId: BOOK_ID, status: 'PENDING', id: { not: REQUEST_ID } },
        }),
      );
      expect(prisma.exchangeRequest.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['competitor-request'] } },
        data: { status: 'DECLINED' },
      });
      expect(mailService.sendExchangeStatus).toHaveBeenCalledTimes(2);
      expect(mailService.sendExchangeStatus).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'olena@example.com', isAccepted: false }),
      );
    });

    it('lets the owner decline without touching the book', async () => {
      const result = await service.respond(OWNER.id, REQUEST_ID, ExchangeAction.DECLINE);

      expect(result.status).toBe('DECLINED');
      expect(prisma.book.update).not.toHaveBeenCalled();
      expect(mailService.sendExchangeStatus).toHaveBeenCalledWith(
        expect.objectContaining({ isAccepted: false }),
      );
    });

    it('forbids accepting a request for someone else book', async () => {
      await expect(
        service.respond(REQUESTER.id, REQUEST_ID, ExchangeAction.ACCEPT),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.exchangeRequest.updateMany).not.toHaveBeenCalled();
    });

    it('forbids the owner from cancelling the sender request', async () => {
      await expect(
        service.respond(OWNER.id, REQUEST_ID, ExchangeAction.CANCEL),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lets the sender cancel without sending an email', async () => {
      const result = await service.respond(REQUESTER.id, REQUEST_ID, ExchangeAction.CANCEL);

      expect(result.status).toBe('CANCELLED');
      expect(mailService.sendExchangeStatus).not.toHaveBeenCalled();
    });

    it('rejects a request that is no longer pending', async () => {
      prisma.exchangeRequest.findUnique.mockResolvedValue({
        ...pendingRequest,
        status: 'ACCEPTED',
      });

      await expect(
        service.respond(OWNER.id, REQUEST_ID, ExchangeAction.DECLINE),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('still returns the updated request when the status email fails', async () => {
      mailService.sendExchangeStatus.mockRejectedValue(new Error('SMTP down'));

      const result = await service.respond(OWNER.id, REQUEST_ID, ExchangeAction.ACCEPT);

      expect(result.status).toBe('ACCEPTED');
    });

    it('lets only one of two simultaneous responses win and emails once', async () => {
      prisma.exchangeRequest.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });

      const results = await Promise.allSettled([
        service.respond(OWNER.id, REQUEST_ID, ExchangeAction.ACCEPT),
        service.respond(OWNER.id, REQUEST_ID, ExchangeAction.ACCEPT),
      ]);

      expect(results.map(({ status }) => status).sort()).toEqual(['fulfilled', 'rejected']);
      expect(mailService.sendExchangeStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('owner contact privacy', () => {
    it('hides the owner email from the requester while the request is pending', async () => {
      prisma.exchangeRequest.findMany.mockResolvedValue([pendingRequest]);

      const [outgoing] = await service.findOutgoing(REQUESTER.id);

      expect(outgoing?.owner.email).toBeNull();
      expect(outgoing?.owner.name).toBe(OWNER.name);
    });

    it('reveals the owner email to the requester after acceptance', async () => {
      prisma.exchangeRequest.findMany.mockResolvedValue([
        { ...pendingRequest, status: 'ACCEPTED' },
      ]);

      const [outgoing] = await service.findOutgoing(REQUESTER.id);

      expect(outgoing?.owner.email).toBe(OWNER.email);
    });

    it('always shows the requester email to the owner', async () => {
      prisma.exchangeRequest.findMany.mockResolvedValue([pendingRequest]);

      const [incoming] = await service.findIncoming(OWNER.id);

      expect(incoming?.requester.email).toBe(REQUESTER.email);
      expect(incoming?.owner.email).toBe(OWNER.email);
    });
  });
});
