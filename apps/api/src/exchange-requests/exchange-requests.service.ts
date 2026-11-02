import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ExchangeAction } from '@book-exchange/shared';
import { ExchangeStatus, Prisma } from '@prisma/client';
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

const EXCHANGE_REQUEST_INCLUDE = {
  book: { select: { id: true, name: true, author: true, photoUrl: true } },
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
  noBooksToOffer: 'Додайте хоча б одну книгу для обміну',
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
    { bookId, message }: CreateExchangeRequestDto,
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

    const requesterBooks = await this.prisma.book.findMany({
      where: { ownerId: requester.id },
      select: { name: true, author: true },
      orderBy: { createdAt: 'desc' },
    });
    if (requesterBooks.length === 0) {
      throw new BadRequestException(MESSAGES.noBooksToOffer);
    }

    const pendingDuplicate = await this.prisma.exchangeRequest.findFirst({
      where: { bookId, requesterId: requester.id, status: ExchangeStatus.PENDING },
      select: { id: true },
    });
    if (pendingDuplicate) {
      throw new ConflictException(MESSAGES.duplicateRequest);
    }

    const exchangeRequest = await this.prisma.exchangeRequest.create({
      data: { bookId, requesterId: requester.id, ownerId: book.ownerId, message },
      include: EXCHANGE_REQUEST_INCLUDE,
    });

    await this.notify('exchange request', () =>
      this.mailService.sendExchangeRequest({
        to: book.owner.email,
        ownerName: book.owner.name,
        requesterName: requester.name,
        requesterEmail: requester.email,
        desiredBook: { name: book.name, author: book.author },
        requesterBooks,
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

    // Conditional on PENDING so that two concurrent responses cannot both succeed.
    const { count } = await this.prisma.exchangeRequest.updateMany({
      where: { id, status: ExchangeStatus.PENDING },
      data: { status: STATUS_BY_ACTION[action] },
    });
    if (count === 0) {
      throw new ConflictException(MESSAGES.alreadyHandled);
    }

    const updatedRequest = await this.prisma.exchangeRequest.findUniqueOrThrow({
      where: { id },
      include: EXCHANGE_REQUEST_INCLUDE,
    });

    if (action !== ExchangeAction.CANCEL) {
      await this.notify('exchange status', () =>
        this.mailService.sendExchangeStatus({
          to: updatedRequest.requester.email,
          requesterName: updatedRequest.requester.name,
          ownerName: updatedRequest.owner.name,
          bookName: updatedRequest.book.name,
          isAccepted: action === ExchangeAction.ACCEPT,
        }),
      );
    }

    return this.toViewFor(userId, updatedRequest);
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
