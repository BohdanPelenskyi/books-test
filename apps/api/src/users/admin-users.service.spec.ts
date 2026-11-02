import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { compare } from 'bcrypt';
import { BooksService } from '../books/books.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../uploads/storage.service';
import { AdminUsersService } from './admin-users.service';

const ADMIN_ID = 'admin-id';
const USER_ID = 'user-id';

const storedUser = {
  id: USER_ID,
  name: 'Anna',
  email: 'anna@example.com',
  role: 'USER' as const,
  avatarUrl: null,
  createdAt: new Date('2026-01-01'),
  _count: { books: 3 },
};

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  const prisma = {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const booksService = { findAllByOwner: jest.fn() };
  const storage = { deleteByUrl: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: BooksService, useValue: booksService },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = moduleRef.get(AdminUsersService);
  });

  describe('findAll', () => {
    it('searches name and email case-insensitively and exposes booksCount', async () => {
      prisma.$transaction.mockResolvedValue([[storedUser], 1]);

      const result = await service.findAll({ search: 'anna', page: 2, limit: 5 });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'anna', mode: 'insensitive' } },
              { email: { contains: 'anna', mode: 'insensitive' } },
            ],
          },
          skip: 5,
          take: 5,
        }),
      );
      expect(result.items[0]).toMatchObject({ id: USER_ID, booksCount: 3 });
      expect(result.items[0]).not.toHaveProperty('_count');
      expect(result.meta).toEqual({ page: 2, limit: 5, total: 1, totalPages: 1 });
    });
  });

  describe('create', () => {
    it('hashes the password and keeps the requested role', async () => {
      prisma.user.create.mockResolvedValue({ ...storedUser, role: 'ADMIN' });

      await service.create({
        name: 'Admin 2',
        email: 'admin2@example.com',
        password: 'Secret123!',
        role: 'ADMIN',
      });

      const { data } = prisma.user.create.mock.calls[0][0] as {
        data: { passwordHash: string; role: string; password?: string };
      };
      expect(data.role).toBe('ADMIN');
      expect(data).not.toHaveProperty('password');
      expect(await compare('Secret123!', data.passwordHash)).toBe(true);
    });
  });

  describe('update', () => {
    it('leaves the password untouched when it is not provided', async () => {
      prisma.user.update.mockResolvedValue(storedUser);

      await service.update(ADMIN_ID, USER_ID, { name: 'New name' });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { name: 'New name', passwordHash: undefined } }),
      );
    });

    it('re-hashes the password when it is provided', async () => {
      prisma.user.update.mockResolvedValue(storedUser);

      await service.update(ADMIN_ID, USER_ID, { password: 'NewSecret123!' });

      const { data } = prisma.user.update.mock.calls[0][0] as { data: { passwordHash: string } };
      expect(await compare('NewSecret123!', data.passwordHash)).toBe(true);
    });
  });

  describe('update by the same admin', () => {
    it('refuses to remove the admin role from the current admin', async () => {
      await expect(service.update(ADMIN_ID, ADMIN_ID, { role: 'USER' })).rejects.toThrow(
        new BadRequestException('Не можна позбавити себе ролі адміністратора'),
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('allows the current admin to edit their own name', async () => {
      prisma.user.update.mockResolvedValue(storedUser);

      await service.update(ADMIN_ID, ADMIN_ID, { name: 'Renamed', role: 'ADMIN' });

      expect(prisma.user.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('refuses to delete the current admin', async () => {
      await expect(service.remove(ADMIN_ID, ADMIN_ID)).rejects.toThrow(
        new BadRequestException('Не можна видалити власний акаунт'),
      );
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove(ADMIN_ID, USER_ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes the user and the files of their books and avatar', async () => {
      prisma.user.findUnique.mockResolvedValue({
        avatarUrl: 'http://localhost:4000/uploads/avatar.png',
        books: [{ photoUrl: 'http://localhost:4000/uploads/cover.jpg' }, { photoUrl: null }],
      });

      await service.remove(ADMIN_ID, USER_ID);

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: USER_ID } });
      expect(storage.deleteByUrl).toHaveBeenCalledTimes(3);
      expect(storage.deleteByUrl).toHaveBeenCalledWith('http://localhost:4000/uploads/cover.jpg');
    });
  });

  describe('findBooks', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findBooks(USER_ID, { page: 1, limit: 10 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('delegates to the books service for an existing user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: USER_ID });
      booksService.findAllByOwner.mockResolvedValue({ items: [], meta: {} });

      await service.findBooks(USER_ID, { page: 1, limit: 10 });

      expect(booksService.findAllByOwner).toHaveBeenCalledWith(USER_ID, { page: 1, limit: 10 });
    });
  });
});
