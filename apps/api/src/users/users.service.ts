import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AUTH_STATE_USER_SELECT,
  CREDENTIALS_USER_SELECT,
  PUBLIC_USER_SELECT,
  PublicUser,
  UserAuthState,
  UserWithCredentials,
} from './user.select';

interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findWithCredentialsByEmail(email: string): Promise<UserWithCredentials | null> {
    return this.prisma.user.findUnique({ where: { email }, select: CREDENTIALS_USER_SELECT });
  }

  findPublicById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({ where: { id }, select: PUBLIC_USER_SELECT });
  }

  findAuthStateById(id: string): Promise<UserAuthState | null> {
    return this.prisma.user.findUnique({ where: { id }, select: AUTH_STATE_USER_SELECT });
  }

  createUser(input: CreateUserInput): Promise<PublicUser> {
    return this.prisma.user.create({ data: input, select: PUBLIC_USER_SELECT });
  }
}
