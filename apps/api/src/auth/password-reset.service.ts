import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { BCRYPT_ROUNDS } from '../common/security';
import type { Env } from '../config/env.schema';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const INVALID_TOKEN_MESSAGE = 'Посилання недійсне або застаріло';

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly webUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    config: ConfigService<Env, true>,
  ) {
    this.webUrl = config.get('WEB_URL', { infer: true });
  }

  /** Never reveals whether the email is registered: unknown emails are silently ignored. */
  async requestReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      return;
    }

    const token = randomBytes(RESET_TOKEN_BYTES).toString('hex');
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashResetToken(token),
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      }),
    ]);

    try {
      await this.mailService.sendPasswordReset({
        to: user.email,
        name: user.name,
        resetUrl: `${this.webUrl}/reset-password?token=${token}`,
      });
    } catch (error) {
      this.logger.error(
        'Failed to send password reset email',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
    });
    const isUsable =
      resetToken !== null && resetToken.usedAt === null && resetToken.expiresAt > new Date();
    if (!isUsable) {
      throw new BadRequestException(INVALID_TOKEN_MESSAGE);
    }

    const passwordHash = await hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.$transaction(async (transaction) => {
      // The conditional update makes the token single-use even for concurrent requests.
      const { count } = await transaction.passwordResetToken.updateMany({
        where: { id: resetToken.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (count === 0) {
        throw new BadRequestException(INVALID_TOKEN_MESSAGE);
      }
      await transaction.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });
    });
  }
}
