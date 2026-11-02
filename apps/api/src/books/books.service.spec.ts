import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../uploads/storage.service';
import { BookSort } from './book-sort';
import { BooksService } from './books.service';

const OWNER_ID = 'owner-id';
const OTHER_USER_ID = 'other-user-id';
const BOOK_ID = 'book-id';

const storedBook = {
  id: BOOK_ID,
  name: 'Dune',
  author: 'Frank Herbert',
  photoUrl: 'http://localhost:4000/uploads/cover.jpg',
  ownerId: OWNER_ID,
  createdAt: new Date('2026-01-01'),
  owner: { id: OWNER_ID, name: 'Anna' },
};

describe('BooksService', () => {
  let booksService: BooksService;
  const prisma = {
    book: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const storage = {
    getPublicUrl: jest.fn(),
    assertIsImage: jest.fn(),
    deleteByUrl: jest.fn(),
    discardUploadedFile: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.$transaction.mockResolvedValue([[], 0]);
    const moduleRef = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    booksService = moduleRef.get(BooksService);
  });

  describe('findAll', () => {
    it('searches title and author case-insensitively', async () => {
      await booksService.findAll({ search: 'dune', sort: BookSort.NAME_ASC, page: 1, limit: 12 });

      expect(prisma.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'dune', mode: 'insensitive' } },
              { author: { contains: 'dune', mode: 'insensitive' } },
            ],
            status: 'AVAILABLE',
          },
          orderBy: { name: 'asc' },
        }),
      );
    });

    it('excludes books of the given owner', async () => {
      await booksService.findAll({
        excludeOwnerId: OWNER_ID,
        sort: BookSort.NEWEST,
        page: 1,
        limit: 12,
      });

      expect(prisma.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ownerId: { not: OWNER_ID }, status: 'AVAILABLE' } }),
      );
    });

    it('includes exchanged books when all availability is requested', async () => {
      await booksService.findAll({
        availability: 'all',
        sort: BookSort.NEWEST,
        page: 1,
        limit: 12,
      });

      expect(prisma.book.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });

    it('sorts alphabetically by author', async () => {
      await booksService.findAll({ sort: BookSort.AUTHOR_ASC, page: 1, limit: 12 });

      expect(prisma.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { author: 'asc' } }),
      );
    });

    it('applies no filter without a search term and paginates', async () => {
      await booksService.findAll({ sort: BookSort.NEWEST, page: 3, limit: 10 });

      expect(prisma.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'AVAILABLE' },
          skip: 20,
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('returns items with pagination meta', async () => {
      prisma.$transaction.mockResolvedValue([[storedBook], 25]);

      const result = await booksService.findAll({ sort: BookSort.NEWEST, page: 2, limit: 12 });

      expect(result).toEqual({
        items: [storedBook],
        meta: { page: 2, limit: 12, total: 25, totalPages: 3 },
      });
    });
  });

  describe('ownership', () => {
    beforeEach(() => {
      prisma.book.findUnique.mockResolvedValue(storedBook);
    });

    it('forbids updating a book owned by someone else', async () => {
      await expect(
        booksService.update(OTHER_USER_ID, BOOK_ID, { name: 'Hacked' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.book.update).not.toHaveBeenCalled();
    });

    it('forbids deleting a book owned by someone else', async () => {
      await expect(booksService.remove(OTHER_USER_ID, BOOK_ID)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.book.delete).not.toHaveBeenCalled();
      expect(storage.deleteByUrl).not.toHaveBeenCalled();
    });

    it('deletes the cover file together with the book', async () => {
      await booksService.remove(OWNER_ID, BOOK_ID);

      expect(prisma.book.delete).toHaveBeenCalledWith({ where: { id: BOOK_ID } });
      expect(storage.deleteByUrl).toHaveBeenCalledWith(storedBook.photoUrl);
    });

    it('discards a freshly uploaded file when the update is forbidden', async () => {
      const file = { path: '/tmp/new.jpg' } as Express.Multer.File;

      await expect(booksService.update(OTHER_USER_ID, BOOK_ID, {}, file)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(storage.discardUploadedFile).toHaveBeenCalledWith(file);
    });
  });
});
