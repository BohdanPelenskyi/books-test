import './set-e2e-env';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyGlobalSetup } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

const USER_ID = '6f1f9c0e-5a53-4a7d-9d0c-0d6c1f5f1a11';
const REQUEST_ID = '0c2f5c3e-8a1d-4c55-8f0b-2d6f4a9a7e22';

const regularUser = {
  id: USER_ID,
  name: 'Anna',
  email: 'anna@example.com',
  role: 'USER',
  avatarUrl: null,
  createdAt: new Date(),
};

// Stand-in for PrismaService so the suite runs without a database.
const prisma = { user: { findUnique: jest.fn() } };

describe('Exchange requests (e2e)', () => {
  let app: INestApplication;
  let userToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    applyGlobalSetup(app);
    await app.init();

    userToken = await moduleRef.get(JwtService).signAsync({ sub: USER_ID, role: regularUser.role });
  });

  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(regularUser);
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['post', '/api/exchange-requests'],
    ['get', '/api/exchange-requests/incoming'],
    ['get', '/api/exchange-requests/outgoing'],
    ['patch', `/api/exchange-requests/${REQUEST_ID}`],
  ] as const)('requires authentication for %s %s', async (method, path) => {
    await request(app.getHttpServer())[method](path).expect(401);
  });

  it('rejects a request without a valid bookId', async () => {
    await request(app.getHttpServer())
      .post('/api/exchange-requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookId: 'not-a-uuid' })
      .expect(400);
  });

  it('rejects an unknown action', async () => {
    await request(app.getHttpServer())
      .patch(`/api/exchange-requests/${REQUEST_ID}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ action: 'delete' })
      .expect(400);
  });
});
