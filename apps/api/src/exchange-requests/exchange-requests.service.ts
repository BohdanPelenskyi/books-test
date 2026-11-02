import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ExchangeAction } from '@book-exchange/shared';
import { BookStatus, ExchangeStatus, Prisma } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUser } from '../users/user.select';
import { CreateExchangeRequestDto } from './dto/create-exchange-request.dto';

const PARTY_SELECT = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

const BOOK_SUMMARY_SELECT = {
  id: true,
  name: true,
  author: true,
  photoUrl: true,
} satisfies Prisma.BookSelect;

const EXCHANGE_REQUEST_INCLUDE = {
  book: { select: BOOK_SUMMARY_SELECT },
  offeredBooks: { select: BOOK_SUMMARY_SELECT },
  requester: { select: PARTY_SELECT },
  owner: { select: PARTY_SELECT },
} satisfies Prisma.ExchangeRequestInclude;

export type ExchangeRequestWithParties = Prisma.ExchangeRequestGetPayload<{
  include: typeof EXCHANGE_REQUEST_INCLUDE;
}>;

/** What the API returns; the owner's email is withheld from the requester until acceptance. */
export type ExchangeRequestView = Omit<ExchangeRequestWithParties, 'owner'> & {
  owner: Omit<ExchangeRequestWithParties['owner'], 'email'> & { email: string | null };
};

const STATUS_BY_ACTION: Readonly<Record<ExchangeAction, ExchangeStatus>> = {
  [ExchangeAction.ACCEPT]: ExchangeStatus.ACCEPTED,
  [ExchangeAction.DECLINE]: ExchangeStatus.DECLINED,
  [ExchangeAction.CANCEL]: ExchangeStatus.CANCELLED,
};

const MESSAGES = {
  bookNotFound: 'Книгу не знайдено',
  requestNotFound: 'Запит не знайдено',
  ownBook: 'Не можна запросити обмін на власну книгу',
  bookExchanged: 'Ця книга вже обміняна',
  noBooksToOffer: 'Додайте хоча б одну книгу для обміну',
  offeredBooksInvalid: 'Пропонувати можна лише власні доступні книги',
  duplicateRequest: 'Ви вже надсилали запит на цю книгу',
  notOwner: 'Лише власник книги може прийняти або відхилити запит',
  notRequester: 'Лише відправник може скасувати запит',
  alreadyHandled: 'Запит уже опрацьовано',
} as const;

@Injectable()
export class ExchangeRequestsService {
  private readonly logger = new Logger(ExchangeRequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async create(
    requester: PublicUser,
    { bookId, message, offeredBookIds }: CreateExchangeRequestDto,
  ): Promise<ExchangeRequestView> {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: { owner: { select: PARTY_SELECT } },
    });
    if (!book) {
      throw new NotFoundException(MESSAGES.bookNotFound);
    }
    if (book.ownerId === requester.id) {
      throw new BadRequestException(MESSAGES.ownBook);
    }
    if (book.status !== BookStatus.AVAILABLE) {
      throw new ConflictException(MESSAGES.bookExchanged);
    }

    const offeredBooks = await this.pickOfferedBooks(requester.id, offeredBookIds);

    const pendingDuplicate = await this.prisma.exchangeRequest.findFirst({
      where: { bookId, requesterId: requester.id, status: ExchangeStatus.PENDING },
      select: { id: true },
    });
    if (pendingDuplicate) {
      throw new ConflictException(MESSAGES.duplicateRequest);
    }

    const exchangeRequest = await this.prisma.exchangeRequest.create({
      data: {
        bookId,
        requesterId: requester.id,
        ownerId: book.ownerId,
        message,
        offeredBooks: { connect: offeredBooks.map(({ id }) => ({ id })) },
      },
      include: EXCHANGE_REQUEST_INCLUDE,
    });

    await this.notify('exchange request', () =>
      this.mailService.sendExchangeRequest({
        to: book.owner.email,
        ownerName: book.owner.name,
        requesterName: requester.name,
        requesterEmail: requester.email,
        desiredBook: { name: book.name, author: book.author },
        requesterBooks: offeredBooks.map(({ name, author }) => ({ name, author })),
        message: message ?? null,
      }),
    );

    return this.toViewFor(requester.id, exchangeRequest);
  }

  async findIncoming(userId: string): Promise<ExchangeRequestView[]> {
    const requests = await this.findByParticipant({ ownerId: userId });
    return requests.map((request) => this.toViewFor(userId, request));
  }

  async findOutgoing(userId: string): Promise<ExchangeRequestView[]> {
    const requests = await this.findByParticipant({ requesterId: userId });
    return requests.map((request) => this.toViewFor(userId, request));
  }

  async respond(userId: string, id: string, action: ExchangeAction): Promise<ExchangeRequestView> {
    const exchangeRequest = await this.prisma.exchangeRequest.findUnique({
      where: { id },
      include: EXCHANGE_REQUEST_INCLUDE,
    });
    if (!exchangeRequest) {
      throw new NotFoundException(MESSAGES.requestNotFound);
    }

    this.assertCanRespond(exchangeRequest, userId, action);

    const declinedCompetitors = await this.prisma.$transaction(async (transaction) => {
      // Conditional on PENDING so that two concurrent responses cannot both succeed.
      const { count } = await transaction.exchangeRequest.updateMany({
        where: { id, status: ExchangeStatus.PENDING },
        data: { status: STATUS_BY_ACTION[action] },
      });
      if (count === 0) {
        throw new ConflictException(MESSAGES.alreadyHandled);
      }

      return action === ExchangeAction.ACCEPT
        ? this.closeBookAndDeclineCompetitors(transaction, exchangeRequest)
        : [];
    });

    const updatedRequest = await this.prisma.exchangeRequest.findUniqueOrThrow({
      where: { id },
      include: EXCHANGE_REQUEST_INCLUDE,
    });

    if (action !== ExchangeAction.CANCEL) {
      await this.notifyRequester(updatedRequest, action === ExchangeAction.ACCEPT);
    }
    for (const competitor of declinedCompetitors) {
      await this.notifyRequester(competitor, false);
    }

    return this.toViewFor(userId, updatedRequest);
  }

  /** Accepting hands the book over, so nobody else can still be waiting for it. */
  private async closeBookAndDeclineCompetitors(
    transaction: Prisma.TransactionClient,
    acceptedRequest: ExchangeRequestWithParties,
  ): Promise<ExchangeRequestWithParties[]> {
    await transaction.book.update({
      where: { id: acceptedRequest.book.id },
      data: { status: BookStatus.EXCHANGED },
    });

    const competitors = await transaction.exchangeRequest.findMany({
      where: {
        bookId: acceptedRequest.book.id,
        status: ExchangeStatus.PENDING,
        id: { not: acceptedRequest.id },
      },
      include: EXCHANGE_REQUEST_INCLUDE,
    });
    if (competitors.length > 0) {
      await transaction.exchangeRequest.updateMany({
        where: { id: { in: competitors.map(({ id }) => id) } },
        data: { status: ExchangeStatus.DECLINED },
      });
    }
    return competitors;
  }

  private async pickOfferedBooks(requesterId: string, offeredBookIds: string[]) {
    const availableOwnBooks = await this.prisma.book.findMany({
      where: { ownerId: requesterId, status: BookStatus.AVAILABLE },
      select: BOOK_SUMMARY_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    if (availableOwnBooks.length === 0) {
      throw new BadRequestException(MESSAGES.noBooksToOffer);
    }

    const uniqueIds = new Set(offeredBookIds);
    const offeredBooks = availableOwnBooks.filter(({ id }) => uniqueIds.has(id));
    if (offeredBooks.length !== uniqueIds.size) {
      throw new BadRequestException(MESSAGES.offeredBooksInvalid);
    }
    return offeredBooks;
  }

  private toViewFor(viewerId: string, request: ExchangeRequestWithParties): ExchangeRequestView {
    const isRequester = viewerId === request.requesterId;
    const isOwnerContactVisible = !isRequester || request.status === ExchangeStatus.ACCEPTED;

    return isOwnerContactVisible
      ? request
      : { ...request, owner: { ...request.owner, email: null } };
  }

  private findByParticipant(
    where: Prisma.ExchangeRequestWhereInput,
  ): Promise<ExchangeRequestWithParties[]> {
    return this.prisma.exchangeRequest.findMany({
      where,
      include: EXCHANGE_REQUEST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  private assertCanRespond(
    exchangeRequest: ExchangeRequestWithParties,
    userId: string,
    action: ExchangeAction,
  ): void {
    const isCancel = action === ExchangeAction.CANCEL;
    const actorId = isCancel ? exchangeRequest.requesterId : exchangeRequest.ownerId;

    if (userId !== actorId) {
      throw new ForbiddenException(isCancel ? MESSAGES.notRequester : MESSAGES.notOwner);
    }
    if (exchangeRequest.status !== ExchangeStatus.PENDING) {
      throw new ConflictException(MESSAGES.alreadyHandled);
    }
  }

  private notifyRequester(request: ExchangeRequestWithParties, isAccepted: boolean): Promise<void> {
    return this.notify('exchange status', () =>
      this.mailService.sendExchangeStatus({
        to: request.requester.email,
        requesterName: request.requester.name,
        ownerName: request.owner.name,
        bookName: request.book.name,
        isAccepted,
      }),
    );
  }

  /** Mail problems must never fail the request the user has already saved. */
  private async notify(description: string, sendMail: () => Promise<void>): Promise<void> {
    try {
      await sendMail();
    } catch (error) {
      this.logger.error(
        `Failed to send ${description} email`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
