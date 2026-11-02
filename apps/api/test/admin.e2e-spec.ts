import './set-e2e-env';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyGlobalSetup } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

const USER_ID = '6f1f9c0e-5a53-4a7d-9d0c-0d6c1f5f1a11';
const TARGET_ID = '0c2f5c3e-8a1d-4c55-8f0b-2d6f4a9a7e22';

const regularUser = {
  id: USER_ID,
  name: 'Anna',
  email: 'anna@example.com',
  role: 'USER',
  avatarUrl: null,
  createdAt: new Date(),
};

// Stand-in for PrismaService; admin routes must be rejected before any data access.
const prisma = { user: { findUnique: jest.fn() } };

const ADMIN_ROUTES = [
  ['get', '/api/admin/users'],
  ['post', '/api/admin/users'],
  ['patch', `/api/admin/users/${TARGET_ID}`],
  ['delete', `/api/admin/users/${TARGET_ID}`],
  ['get', `/api/admin/users/${TARGET_ID}/books`],
  ['delete', `/api/admin/books/${TARGET_ID}`],
] as const;

describe('Admin routes (e2e)', () => {
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

    userToken = await moduleRef.get(JwtService).signAsync({ sub: USER_ID, role: 'USER' });
  });

  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(regularUser);
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(ADMIN_ROUTES)('answers 403 to a regular user on %s %s', async (method, path) => {
    await request(app.getHttpServer())
      [method](path)
      .set('Authorization', `Bearer ${userToken}`)
      .send({})
      .expect(403);
  });

  it.each(ADMIN_ROUTES)('answers 401 to an anonymous request on %s %s', async (method, path) => {
    await request(app.getHttpServer())[method](path).send({}).expect(401);
  });
});
