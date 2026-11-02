import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExchangeStatus } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { BCRYPT_ROUNDS } from '../common/security';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../uploads/storage.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PUBLIC_USER_SELECT, PublicUser } from './user.select';

const PROFILE_SELECT = {
  ...PUBLIC_USER_SELECT,
  _count: { select: { books: true, receivedRequests: true, sentRequests: true } },
} as const;

export type ProfileResponse = PublicUser & {
  booksCount: number;
  incomingRequestsCount: number;
  outgoingRequestsCount: number;
  pendingIncomingCount: number;
};

const MESSAGES = {
  userNotFound: 'Користувача не знайдено',
  emailTaken: 'Користувач з таким email вже існує',
  wrongPassword: 'Невірний поточний пароль',
} as const;

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getProfile(userId: string): Promise<ProfileResponse> {
    const [user, pendingIncomingCount] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: PROFILE_SELECT }),
      this.prisma.exchangeRequest.count({
        where: { ownerId: userId, status: ExchangeStatus.PENDING },
      }),
    ]);
    if (!user) {
      throw new NotFoundException(MESSAGES.userNotFound);
    }

    const { _count, ...publicUser } = user;
    return {
      ...publicUser,
      booksCount: _count.books,
      incomingRequestsCount: _count.receivedRequests,
      outgoingRequestsCount: _count.sentRequests,
      pendingIncomingCount,
    };
  }

  async updateProfile(
    userId: string,
    { name, email }: UpdateProfileDto,
    avatar?: Express.Multer.File,
  ): Promise<ProfileResponse> {
    try {
      const currentUser = await this.findCurrentUser(userId);
      if (email && email !== currentUser.email) {
        await this.assertEmailIsFree(email);
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { name, email, avatarUrl: avatar ? this.storage.getPublicUrl(avatar) : undefined },
      });

      if (avatar) {
        await this.storage.deleteByUrl(currentUser.avatarUrl);
      }
    } catch (error) {
      if (avatar) {
        await this.storage.discardUploadedFile(avatar);
      }
      throw error;
    }

    return this.getProfile(userId);
  }

  async changePassword(
    userId: string,
    { currentPassword, newPassword }: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) {
      throw new NotFoundException(MESSAGES.userNotFound);
    }
    // 400 rather than 401: the web client treats any 401 as an expired session.
    if (!(await compare(currentPassword, user.passwordHash))) {
      throw new BadRequestException(MESSAGES.wrongPassword);
    }

    const passwordHash = await hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  private async findCurrentUser(
    userId: string,
  ): Promise<{ email: string; avatarUrl: string | null }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, avatarUrl: true },
    });
    if (!user) {
      throw new NotFoundException(MESSAGES.userNotFound);
    }
    return user;
  }

  private async assertEmailIsFree(email: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException(MESSAGES.emailTaken);
    }
  }
}
