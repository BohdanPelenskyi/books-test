import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Role } from '@book-exchange/shared';
import { hash } from 'bcrypt';
import { BooksService, BookWithOwner } from '../books/books.service';
import {
  buildPaginationMeta,
  getPaginationSkip,
  PaginatedResponse,
} from '../common/dto/paginated-response';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { BCRYPT_ROUNDS } from '../common/security';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../uploads/storage.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PUBLIC_USER_SELECT, PublicUser } from './user.select';

const ADMIN_USER_SELECT = {
  ...PUBLIC_USER_SELECT,
  _count: { select: { books: true } },
} satisfies Prisma.UserSelect;

type UserWithCount = Prisma.UserGetPayload<{ select: typeof ADMIN_USER_SELECT }>;

export type AdminUserResponse = PublicUser & { booksCount: number };

const MESSAGES = {
  userNotFound: 'Користувача не знайдено',
  selfDelete: 'Не можна видалити власний акаунт',
  selfDemote: 'Не можна позбавити себе ролі адміністратора',
} as const;

function toAdminUser({ _count, ...user }: UserWithCount): AdminUserResponse {
  return { ...user, booksCount: _count.books };
}

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly booksService: BooksService,
    private readonly storage: StorageService,
  ) {}

  async findAll({
    search,
    page,
    limit,
  }: ListUsersQueryDto): Promise<PaginatedResponse<AdminUserResponse>> {
    const where = buildUserWhere(search);
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: ADMIN_USER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: getPaginationSkip({ page, limit }),
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items: users.map(toAdminUser), meta: buildPaginationMeta(total, { page, limit }) };
  }

  async create({ password, ...profile }: CreateUserDto): Promise<AdminUserResponse> {
    const passwordHash = await hash(password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { ...profile, passwordHash },
      select: ADMIN_USER_SELECT,
    });

    return toAdminUser(user);
  }

  async update(
    currentUserId: string,
    id: string,
    { password, ...profile }: UpdateUserDto,
  ): Promise<AdminUserResponse> {
    if (id === currentUserId && profile.role && profile.role !== Role.ADMIN) {
      throw new BadRequestException(MESSAGES.selfDemote);
    }

    const passwordHash = password ? await hash(password, BCRYPT_ROUNDS) : undefined;
    const user = await this.prisma.user.update({
      where: { id },
      data: { ...profile, passwordHash },
      select: ADMIN_USER_SELECT,
    });

    return toAdminUser(user);
  }

  async remove(currentUserId: string, id: string): Promise<void> {
    if (id === currentUserId) {
      throw new BadRequestException(MESSAGES.selfDelete);
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { avatarUrl: true, books: { select: { photoUrl: true } } },
    });
    if (!user) {
      throw new NotFoundException(MESSAGES.userNotFound);
    }

    await this.prisma.user.delete({ where: { id } });

    const storedFileUrls = [user.avatarUrl, ...user.books.map((book) => book.photoUrl)];
    await Promise.all(storedFileUrls.map((fileUrl) => this.storage.deleteByUrl(fileUrl)));
  }

  async findBooks(
    id: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponse<BookWithOwner>> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) {
      throw new NotFoundException(MESSAGES.userNotFound);
    }

    return this.booksService.findAllByOwner(id, pagination);
  }
}

function buildUserWhere(search?: string): Prisma.UserWhereInput {
  if (!search) {
    return {};
  }
  return {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ],
  };
}
