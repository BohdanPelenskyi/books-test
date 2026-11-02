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

const desiredBook = {
  id: BOOK_ID,
  name: 'Dune',
  author: 'Frank Herbert',
  photoUrl: null,
  ownerId: OWNER.id,
  owner: OWNER,
};
const requesterBooks = [{ name: '1984', author: 'George Orwell' }];

const pendingRequest = {
  id: REQUEST_ID,
  status: 'PENDING' as const,
  message: null,
  createdAt: new Date('2026-02-01'),
  bookId: BOOK_ID,
  requesterId: REQUESTER.id,
  ownerId: OWNER.id,
  book: desiredBook,
  requester: REQUESTER,
  owner: OWNER,
};

describe('ExchangeRequestsService', () => {
  let service: ExchangeRequestsService;
  const prisma = {
    book: { findUnique: jest.fn(), findMany: jest.fn() },
    exchangeRequest: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const mailService = { sendExchangeRequest: jest.fn(), sendExchangeStatus: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
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
    const dto = { bookId: BOOK_ID, message: 'Давайте обміняємось' };

    beforeEach(() => {
      prisma.book.findUnique.mockResolvedValue(desiredBook);
      prisma.book.findMany.mockResolvedValue(requesterBooks);
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

    it('rejects a sender who has no books to offer', async () => {
      prisma.book.findMany.mockResolvedValue([]);

      await expect(service.create(REQUESTER, dto)).rejects.toThrow(
        new BadRequestException('Додайте хоча б одну книгу для обміну'),
      );
      expect(prisma.exchangeRequest.create).not.toHaveBeenCalled();
    });

    it('rejects a second pending request for the same book', async () => {
      prisma.exchangeRequest.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create(REQUESTER, dto)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.exchangeRequest.create).not.toHaveBeenCalled();
    });

    it('saves the request and emails the owner with the sender books', async () => {
      const result = await service.create(REQUESTER, dto);

      expect(result).toMatchObject({ id: REQUEST_ID, status: 'PENDING' });
      expect(prisma.exchangeRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            bookId: BOOK_ID,
            requesterId: REQUESTER.id,
            ownerId: OWNER.id,
            message: dto.message,
          },
        }),
      );
      expect(mailService.sendExchangeRequest).toHaveBeenCalledWith({
        to: OWNER.email,
        ownerName: OWNER.name,
        requesterName: REQUESTER.name,
        requesterEmail: REQUESTER.email,
        desiredBook: { name: 'Dune', author: 'Frank Herbert' },
        requesterBooks,
        message: dto.message,
      });
    });

    it('still returns the saved request when the email fails', async () => {
      mailService.sendExchangeRequest.mockRejectedValue(new Error('SMTP down'));

      await expect(service.create(REQUESTER, dto)).resolves.toMatchObject({ id: REQUEST_ID });
    });
  });

  describe('respond', () => {
    let storedRequest:
      typeof pendingRequest | (Omit<typeof pendingRequest, 'status'> & { status: string });

    beforeEach(() => {
      storedRequest = pendingRequest;
      prisma.exchangeRequest.findUnique.mockImplementation(() => Promise.resolve(storedRequest));
      prisma.exchangeRequest.findUniqueOrThrow.mockImplementation(() =>
        Promise.resolve(storedRequest),
      );
      prisma.exchangeRequest.updateMany.mockImplementation(({ data }: { data: object }) => {
        storedRequest = { ...storedRequest, ...data };
        return Promise.resolve({ count: 1 });
      });
    });

    it('throws NotFoundException for an unknown request', async () => {
      prisma.exchangeRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.respond(OWNER.id, REQUEST_ID, ExchangeAction.ACCEPT),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lets the owner accept and emails the requester', async () => {
      const result = await service.respond(OWNER.id, REQUEST_ID, ExchangeAction.ACCEPT);

      expect(result.status).toBe('ACCEPTED');
      expect(mailService.sendExchangeStatus).toHaveBeenCalledWith({
        to: REQUESTER.email,
        requesterName: REQUESTER.name,
        ownerName: OWNER.name,
        bookName: 'Dune',
        isAccepted: true,
      });
    });

    it('lets the owner decline and emails the requester', async () => {
      const result = await service.respond(OWNER.id, REQUEST_ID, ExchangeAction.DECLINE);

      expect(result.status).toBe('DECLINED');
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
  });
  describe('concurrent responses', () => {
    it('lets only one of two simultaneous responses win and emails once', async () => {
      prisma.exchangeRequest.findUnique.mockResolvedValue(pendingRequest);
      prisma.exchangeRequest.findUniqueOrThrow.mockResolvedValue({
        ...pendingRequest,
        status: 'ACCEPTED',
      });
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

    it('does not leak the owner email in the response to a new request', async () => {
      prisma.book.findUnique.mockResolvedValue(desiredBook);
      prisma.book.findMany.mockResolvedValue(requesterBooks);
      prisma.exchangeRequest.findFirst.mockResolvedValue(null);
      prisma.exchangeRequest.create.mockResolvedValue(pendingRequest);

      const result = await service.create(REQUESTER, { bookId: BOOK_ID });

      expect(result.owner.email).toBeNull();
    });
  });
});
