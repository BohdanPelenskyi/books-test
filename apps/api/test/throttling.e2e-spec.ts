import './set-e2e-env';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyGlobalSetup } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

const LOGIN_LIMIT_PER_MINUTE = 5;

// Stand-in for PrismaService: no account exists, so every login fails with 401.
const prisma = { user: { findUnique: jest.fn().mockResolvedValue(null) } };

describe('Rate limiting (e2e)', () => {
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

  it('answers 429 once the login limit per minute is used up', async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'wrong-password' });

    for (let count = 0; count < LOGIN_LIMIT_PER_MINUTE; count += 1) {
      await attempt().expect(401);
    }

    await attempt().expect(429);
  });
});
