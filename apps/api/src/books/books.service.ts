import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  buildPaginationMeta,
  getPaginationSkip,
  PaginatedResponse,
} from '../common/dto/paginated-response';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../uploads/storage.service';
import { BOOK_ORDER_BY, BookSort } from './book-sort';
import { CreateBookDto } from './dto/create-book.dto';
import { ListBooksQueryDto } from './dto/list-books-query.dto';
import { UpdateBookDto } from './dto/update-book.dto';

const BOOK_WITH_OWNER_INCLUDE = {
  owner: { select: { id: true, name: true } },
} satisfies Prisma.BookInclude;

export type BookWithOwner = Prisma.BookGetPayload<{ include: typeof BOOK_WITH_OWNER_INCLUDE }>;

@Injectable()
export class BooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  findAll({
    search,
    excludeOwnerId,
    sort,
    page,
    limit,
  }: ListBooksQueryDto): Promise<PaginatedResponse<BookWithOwner>> {
    return this.findPage(buildBookWhere(search, excludeOwnerId), BOOK_ORDER_BY[sort], {
      page,
      limit,
    });
  }

  async findOne(id: string): Promise<BookWithOwner> {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: BOOK_WITH_OWNER_INCLUDE,
    });
    if (!book) {
      throw new NotFoundException('Книгу не знайдено');
    }
    return book;
  }

  findAllByOwner(
    ownerId: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponse<BookWithOwner>> {
    return this.findPage({ ownerId }, BOOK_ORDER_BY[BookSort.NEWEST], pagination);
  }

  create(
    ownerId: string,
    { name, author, photoUrl }: CreateBookDto,
    file?: Express.Multer.File,
  ): Promise<BookWithOwner> {
    return this.withUploadCleanup(file, () =>
      this.prisma.book.create({
        data: { name, author, ownerId, photoUrl: this.resolvePhotoUrl(photoUrl, file) },
        include: BOOK_WITH_OWNER_INCLUDE,
      }),
    );
  }

  async update(
    userId: string,
    id: string,
    { name, author, photoUrl }: UpdateBookDto,
    file?: Express.Multer.File,
  ): Promise<BookWithOwner> {
    const { book, updatedBook } = await this.withUploadCleanup(file, async () => {
      const existingBook = await this.findOwnedBook(userId, id);
      const newPhotoUrl = this.resolvePhotoUrl(photoUrl, file);
      const result = await this.prisma.book.update({
        where: { id },
        data: { name, author, photoUrl: newPhotoUrl },
        include: BOOK_WITH_OWNER_INCLUDE,
      });
      return { book: existingBook, updatedBook: result };
    });

    if (updatedBook.photoUrl !== book.photoUrl) {
      await this.storage.deleteByUrl(book.photoUrl);
    }
    return updatedBook;
  }

  async remove(userId: string, id: string): Promise<void> {
    const book = await this.findOwnedBook(userId, id);
    await this.deleteBook(book);
  }

  async removeAsAdmin(id: string): Promise<void> {
    const book = await this.findOne(id);
    await this.deleteBook(book);
  }

  private async findPage(
    where: Prisma.BookWhereInput,
    orderBy: Prisma.BookOrderByWithRelationInput,
    pagination: { page: number; limit: number },
  ): Promise<PaginatedResponse<BookWithOwner>> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.book.findMany({
        where,
        orderBy,
        skip: getPaginationSkip(pagination),
        take: pagination.limit,
        include: BOOK_WITH_OWNER_INCLUDE,
      }),
      this.prisma.book.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(total, pagination) };
  }

  private async findOwnedBook(userId: string, id: string): Promise<BookWithOwner> {
    const book = await this.findOne(id);
    if (book.ownerId !== userId) {
      throw new ForbiddenException('Ви можете змінювати лише власні книги');
    }
    return book;
  }

  private async deleteBook(book: BookWithOwner): Promise<void> {
    await this.prisma.book.delete({ where: { id: book.id } });
    await this.storage.deleteByUrl(book.photoUrl);
  }

  private resolvePhotoUrl(photoUrl?: string, file?: Express.Multer.File): string | undefined {
    if (file && photoUrl) {
      throw new BadRequestException('Вкажіть або файл, або посилання на обкладинку');
    }
    return file ? this.storage.getPublicUrl(file) : photoUrl;
  }

  private async withUploadCleanup<T>(
    file: Express.Multer.File | undefined,
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (file) {
        await this.storage.discardUploadedFile(file);
      }
      throw error;
    }
  }
}

function buildBookWhere(search?: string, excludeOwnerId?: string): Prisma.BookWhereInput {
  return {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(excludeOwnerId && { ownerId: { not: excludeOwnerId } }),
  };
}
