import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { compare } from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { hashResetToken, PasswordResetService } from './password-reset.service';

const USER = { id: 'user-id', name: 'Anna', email: 'anna@example.com' };

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  const transaction = {
    passwordResetToken: { updateMany: jest.fn() },
    user: { update: jest.fn() },
  };
  const prisma = {
    user: { findUnique: jest.fn() },
    passwordResetToken: { findUnique: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const mailService = { sendPasswordReset: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((operation: unknown) =>
      typeof operation === 'function'
        ? operation(transaction)
        : Promise.all(operation as unknown[]),
    );
    const moduleRef = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mailService },
        { provide: ConfigService, useValue: { get: () => 'http://localhost:3000' } },
      ],
    }).compile();

    service = moduleRef.get(PasswordResetService);
  });

  describe('requestReset', () => {
    it('does nothing for an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await service.requestReset('nobody@example.com');

      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('stores only the SHA-256 hash and emails the raw token', async () => {
      prisma.user.findUnique.mockResolvedValue(USER);

      await service.requestReset(USER.email);

      const { data } = prisma.passwordResetToken.create.mock.calls[0][0] as {
        data: { tokenHash: string; expiresAt: Date; userId: string };
      };
      const { resetUrl } = mailService.sendPasswordReset.mock.calls[0][0] as { resetUrl: string };
      const token = new URL(resetUrl).searchParams.get('token') as string;

      expect(token).toHaveLength(64);
      expect(data.tokenHash).toBe(hashResetToken(token));
      expect(data.tokenHash).not.toBe(token);
      expect(data.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(30 * 60 * 1000);
      expect(data.expiresAt.getTime() - Date.now()).toBeGreaterThan(29 * 60 * 1000);
    });

    it('drops older unused tokens of the same user', async () => {
      prisma.user.findUnique.mockResolvedValue(USER);

      await service.requestReset(USER.email);

      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: USER.id, usedAt: null },
      });
    });

    it('does not fail when the email cannot be sent', async () => {
      prisma.user.findUnique.mockResolvedValue(USER);
      mailService.sendPasswordReset.mockRejectedValue(new Error('SMTP down'));

      await expect(service.requestReset(USER.email)).resolves.toBeUndefined();
    });
  });

  describe('resetPassword', () => {
    const validToken = {
      id: 'token-id',
      userId: USER.id,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    };

    it('rejects an unknown token', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword('bad', 'NewSecret123!')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects an expired token', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        ...validToken,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.resetPassword('t', 'NewSecret123!')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects an already used token', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({ ...validToken, usedAt: new Date() });

      await expect(service.resetPassword('t', 'NewSecret123!')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('looks the token up by its hash, not the raw value', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await service.resetPassword('raw-token', 'NewSecret123!').catch(() => undefined);

      expect(prisma.passwordResetToken.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: hashResetToken('raw-token') },
      });
    });

    it('sets the new password and marks the token as used', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(validToken);
      transaction.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });

      await service.resetPassword('t', 'NewSecret123!');

      const { data } = transaction.user.update.mock.calls[0][0] as {
        data: { passwordHash: string };
      };
      expect(await compare('NewSecret123!', data.passwordHash)).toBe(true);
      expect(transaction.passwordResetToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'token-id', usedAt: null } }),
      );
    });

    it('refuses a token that was consumed by a concurrent request', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(validToken);
      transaction.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.resetPassword('t', 'NewSecret123!')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(transaction.user.update).not.toHaveBeenCalled();
    });
  });
});
