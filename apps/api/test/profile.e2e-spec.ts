import './set-e2e-env';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyGlobalSetup } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

// Stand-in for PrismaService: no user exists, so a reset can never succeed.
const prisma = {
  user: { findUnique: jest.fn().mockResolvedValue(null) },
  passwordResetToken: { findUnique: jest.fn().mockResolvedValue(null) },
};

describe('Profile and password reset (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    applyGlobalSetup(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['get', '/api/users/me'],
    ['patch', '/api/users/me'],
    ['patch', '/api/users/me/password'],
  ] as const)('requires authentication for %s %s', async (method, path) => {
    await request(app.getHttpServer())[method](path).expect(401);
  });

  it('answers 204 to forgot-password for an unknown email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' })
      .expect(204);
  });

  it('rejects forgot-password with an invalid email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'not-an-email' })
      .expect(400);
  });

  it('rejects an unknown reset token with 400', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: 'unknown', password: 'NewSecret123!' })
      .expect(400);
  });

  it('rejects a too short new password with 400', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: 'unknown', password: 'short' })
      .expect(400);
  });
});
