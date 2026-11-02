import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { hash } from 'bcrypt';
import { UsersService } from '../users/users.service';
import { BCRYPT_ROUNDS } from '../common/security';
import { AuthService } from './auth.service';

const PASSWORD = 'Secret123!';

const publicUser = {
  id: 'user-id',
  name: 'Anna',
  email: 'anna@example.com',
  role: 'USER' as const,
  avatarUrl: null,
  createdAt: new Date('2026-01-01'),
};

describe('AuthService', () => {
  let authService: AuthService;
  const usersService = {
    findWithCredentialsByEmail: jest.fn(),
    createUser: jest.fn(),
  };
  const jwtService = { signAsync: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    jwtService.signAsync.mockResolvedValue('token');
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  describe('register', () => {
    const dto = { name: 'Anna', email: publicUser.email, password: PASSWORD };

    it('throws ConflictException when the email is already taken', async () => {
      usersService.findWithCredentialsByEmail.mockResolvedValue({
        ...publicUser,
        passwordHash: 'x',
      });

      await expect(authService.register(dto)).rejects.toBeInstanceOf(ConflictException);
      expect(usersService.createUser).not.toHaveBeenCalled();
    });

    it('stores a hashed password and returns a token without the hash', async () => {
      usersService.findWithCredentialsByEmail.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue(publicUser);

      const result = await authService.register(dto);

      const { passwordHash } = usersService.createUser.mock.calls[0][0] as { passwordHash: string };
      expect(passwordHash).not.toBe(PASSWORD);
      expect(result).toEqual({ accessToken: 'token', user: publicUser });
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException for a wrong password', async () => {
      const passwordHash = await hash(PASSWORD, BCRYPT_ROUNDS);
      usersService.findWithCredentialsByEmail.mockResolvedValue({ ...publicUser, passwordHash });

      await expect(
        authService.login({ email: publicUser.email, password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException for an unknown email', async () => {
      usersService.findWithCredentialsByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: publicUser.email, password: PASSWORD }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('puts the token version into the token and keeps it out of the response', async () => {
      const passwordHash = await hash(PASSWORD, BCRYPT_ROUNDS);
      usersService.findWithCredentialsByEmail.mockResolvedValue({
        ...publicUser,
        passwordHash,
        tokenVersion: 3,
      });

      const result = await authService.login({ email: publicUser.email, password: PASSWORD });

      expect(jwtService.signAsync).toHaveBeenCalledWith(expect.objectContaining({ tv: 3 }));
      expect(result.user).not.toHaveProperty('tokenVersion');

      expect(result.user).toEqual(publicUser);
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });
});
