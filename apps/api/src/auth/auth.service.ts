import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash, hashSync } from 'bcrypt';
import { randomBytes } from 'crypto';
import { BCRYPT_ROUNDS } from '../common/security';
import { PublicUser } from '../users/user.select';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { AuthResponseDto } from './dto/auth-response.dto';
import type { JwtPayload } from './jwt-payload';

const INVALID_CREDENTIALS_MESSAGE = 'Невірний email або пароль';
// Compared against when the email is unknown so that response time does not reveal it.
const UNKNOWN_USER_PASSWORD_HASH = hashSync(randomBytes(16).toString('hex'), BCRYPT_ROUNDS);

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register({ name, email, password }: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.usersService.findWithCredentialsByEmail(email);
    if (existingUser) {
      throw new ConflictException('Користувач з таким email вже існує');
    }

    const passwordHash = await hash(password, BCRYPT_ROUNDS);
    const user = await this.usersService.createUser({ name, email, passwordHash });

    return this.buildAuthResponse(user);
  }

  async login({ email, password }: LoginDto): Promise<AuthResponseDto> {
    const userWithCredentials = await this.usersService.findWithCredentialsByEmail(email);
    if (!userWithCredentials) {
      await compare(password, UNKNOWN_USER_PASSWORD_HASH);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const { passwordHash, ...user } = userWithCredentials;
    if (!(await compare(password, passwordHash))) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return this.buildAuthResponse(user);
  }

  private async buildAuthResponse(user: PublicUser): Promise<AuthResponseDto> {
    const payload: JwtPayload = { sub: user.id, role: user.role };

    return { accessToken: await this.jwtService.signAsync(payload), user };
  }
}
