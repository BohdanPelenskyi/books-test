import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { compare, hash } from 'bcrypt';
import { BCRYPT_ROUNDS } from '../common/security';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../uploads/storage.service';
import { ProfileService } from './profile.service';

const USER_ID = 'user-id';

const storedProfile = {
  id: USER_ID,
  name: 'Anna',
  email: 'anna@example.com',
  role: 'USER' as const,
  avatarUrl: null,
  createdAt: new Date('2026-01-01'),
  _count: { books: 4, receivedRequests: 3, sentRequests: 2 },
};

describe('ProfileService', () => {
  let service: ProfileService;
  const prisma = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    exchangeRequest: { count: jest.fn() },
  };
  const storage = {
    assertIsImage: jest.fn(),
    getPublicUrl: jest.fn(),
    deleteByUrl: jest.fn(),
    discardUploadedFile: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = moduleRef.get(ProfileService);
  });

  describe('getProfile', () => {
    it('returns the user with all counters and without _count', async () => {
      prisma.user.findUnique.mockResolvedValue(storedProfile);
      prisma.exchangeRequest.count.mockResolvedValue(1);

      const profile = await service.getProfile(USER_ID);

      expect(profile).toMatchObject({
        booksCount: 4,
        incomingRequestsCount: 3,
        outgoingRequestsCount: 2,
        pendingIncomingCount: 1,
      });
      expect(profile).not.toHaveProperty('_count');
      expect(profile).not.toHaveProperty('passwordHash');
    });
  });

  describe('updateProfile', () => {
    beforeEach(() => {
      prisma.exchangeRequest.count.mockResolvedValue(0);
    });

    it('rejects an email that belongs to another user', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ email: 'anna@example.com', avatarUrl: null })
        .mockResolvedValueOnce({ id: 'someone-else' });

      await expect(
        service.updateProfile(USER_ID, { email: 'taken@example.com' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('skips the uniqueness check when the email is unchanged', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...storedProfile, avatarUrl: null });

      await service.updateProfile(USER_ID, { email: 'anna@example.com', name: 'Anna K' });

      expect(prisma.user.findUnique).not.toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'anna@example.com' } }),
      );
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('stores the new avatar and deletes the previous file', async () => {
      const avatar = { filename: 'new.png' } as Express.Multer.File;
      storage.getPublicUrl.mockReturnValue('http://localhost:4000/uploads/new.png');
      prisma.user.findUnique.mockResolvedValue({
        ...storedProfile,
        avatarUrl: 'http://localhost:4000/uploads/old.png',
      });

      await service.updateProfile(USER_ID, {}, avatar);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ avatarUrl: 'http://localhost:4000/uploads/new.png' }),
        }),
      );
      expect(storage.deleteByUrl).toHaveBeenCalledWith('http://localhost:4000/uploads/old.png');
    });

    it('discards the uploaded avatar when the update fails', async () => {
      const avatar = { filename: 'new.png' } as Express.Multer.File;
      prisma.user.findUnique
        .mockResolvedValueOnce({ email: 'anna@example.com', avatarUrl: null })
        .mockResolvedValueOnce({ id: 'someone-else' });

      await expect(
        service.updateProfile(USER_ID, { email: 'taken@example.com' }, avatar),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(storage.discardUploadedFile).toHaveBeenCalledWith(avatar);
    });
  });

  describe('changePassword', () => {
    it('rejects a wrong current password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        passwordHash: await hash('Correct123!', BCRYPT_ROUNDS),
      });

      await expect(
        service.changePassword(USER_ID, { currentPassword: 'wrong', newPassword: 'NewSecret123!' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('stores a hash of the new password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        passwordHash: await hash('Correct123!', BCRYPT_ROUNDS),
      });

      await service.changePassword(USER_ID, {
        currentPassword: 'Correct123!',
        newPassword: 'NewSecret123!',
      });

      const { data } = prisma.user.update.mock.calls[0][0] as { data: { passwordHash: string } };
      expect(await compare('NewSecret123!', data.passwordHash)).toBe(true);
    });
  });
});
