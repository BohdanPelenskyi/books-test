import './set-e2e-env';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyGlobalSetup } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'USER' | 'ADMIN';
  tokenVersion: number;
  avatarUrl: string | null;
  createdAt: Date;
}

interface UserQuery {
  where: { id?: string; email?: string };
  select: Record<string, boolean>;
}

// In-memory stand-in for PrismaService so the suite runs without a database.
function createFakePrisma() {
  const users: StoredUser[] = [];
  const applySelect = (user: StoredUser, select: Record<string, boolean>) =>
    Object.fromEntries(Object.entries(user).filter(([key]) => select[key]));

  return {
    user: {
      findUnique: ({ where, select }: UserQuery) => {
        const user = users.find((u) => u.id === where.id || u.email === where.email);
        return Promise.resolve(user ? applySelect(user, select) : null);
      },
      create: ({
        data,
        select,
      }: {
        data: Pick<StoredUser, 'name' | 'email' | 'passwordHash'>;
        select: Record<string, boolean>;
      }) => {
        const user: StoredUser = {
          ...data,
          id: randomUUID(),
          role: 'USER',
          tokenVersion: 0,
          avatarUrl: null,
          createdAt: new Date(),
        };
        users.push(user);
        return Promise.resolve(applySelect(user, select));
      },
    },
  };
}

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(createFakePrisma())
      .compile();

    app = moduleRef.createNestApplication();
    applyGlobalSetup(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers, logs in and returns the current user without passwordHash', async () => {
    const credentials = { email: 'e2e@example.com', password: 'Secret123!' };

    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'E2E', email: '  E2E@Example.com ', password: credentials.password })
      .expect(201);
    expect(registerResponse.body.user).not.toHaveProperty('passwordHash');

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(credentials)
      .expect(200);
    const { accessToken } = loginResponse.body as { accessToken: string };

    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(meResponse.body).toMatchObject({ email: credentials.email, role: 'USER' });
    expect(meResponse.body).not.toHaveProperty('passwordHash');
  });

  it('rejects a duplicate email with 409', async () => {
    const body = { name: 'Dup', email: 'dup@example.com', password: 'Secret123!' };
    await request(app.getHttpServer()).post('/api/auth/register').send(body).expect(201);

    await request(app.getHttpServer()).post('/api/auth/register').send(body).expect(409);
  });

  it('rejects /auth/me without a token with 401', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });
});
