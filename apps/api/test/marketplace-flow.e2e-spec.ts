import './set-e2e-env';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyGlobalSetup } from '../src/app.setup';
import { MailService } from '../src/mail/mail.service';
import { PrismaService } from '../src/prisma/prisma.service';

// Needs a migrated PostgreSQL database; CI provides one through E2E_DATABASE_URL.
const describeWithDatabase = process.env.E2E_DATABASE_URL ? describe : describe.skip;

interface Account {
  id: string;
  email: string;
  token: string;
}

const PASSWORD = 'Secret123!';

describeWithDatabase('Marketplace flow (e2e, real database)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const mailService = {
    sendExchangeRequest: jest.fn().mockResolvedValue(undefined),
    sendExchangeStatus: jest.fn().mockResolvedValue(undefined),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
  };

  let anna: Account;
  let petro: Account;
  let annaBookId: string;
  let petroBookId: string;
  let exchangeRequestId: string;

  const http = () => request(app.getHttpServer());

  function expectNoPasswordHash(body: unknown): void {
    expect(JSON.stringify(body)).not.toContain('passwordHash');
  }

  async function register(name: string, email: string): Promise<Account> {
    const response = await http()
      .post('/api/auth/register')
      .send({ name, email, password: PASSWORD })
      .expect(201);
    expectNoPasswordHash(response.body);
    return { id: response.body.user.id, email, token: response.body.accessToken };
  }

  const as = (account: Account) => ({ Authorization: `Bearer ${account.token}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue(mailService)
      .compile();

    app = moduleRef.createNestApplication();
    applyGlobalSetup(app);
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.exchangeRequest.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers two users', async () => {
    anna = await register('Anna', 'anna@example.com');
    petro = await register('Petro', 'petro@example.com');
  });

  it('lets a user add a book', async () => {
    const response = await http()
      .post('/api/me/books')
      .set(as(anna))
      .field('name', 'Dune')
      .field('author', 'Frank Herbert')
      .expect(201);

    annaBookId = response.body.id;
    expect(response.body.owner.id).toBe(anna.id);
  });

  it('finds the book through a case-insensitive search by title and by author', async () => {
    for (const search of ['dUNe', 'herbert']) {
      const response = await http().get('/api/books').query({ search }).expect(200);
      expect(response.body.items.map((book: { id: string }) => book.id)).toContain(annaBookId);
      expect(response.body.meta.total).toBe(1);
    }

    const noMatch = await http()
      .get('/api/books')
      .query({ search: 'nothing-like-this' })
      .expect(200);
    expect(noMatch.body.items).toEqual([]);
  });

  it('hides a book from the catalog when its owner is excluded', async () => {
    const response = await http().get('/api/books').query({ excludeOwnerId: anna.id }).expect(200);

    expect(response.body.items).toEqual([]);
  });

  it('rejects an exchange request from a user who has no books to offer', async () => {
    const response = await http()
      .post('/api/exchange-requests')
      .set(as(petro))
      .send({ bookId: annaBookId })
      .expect(400);

    expect(response.body.message).toContain('Додайте хоча б одну книгу');
  });

  it('rejects an exchange request for the sender own book with 400', async () => {
    const response = await http()
      .post('/api/exchange-requests')
      .set(as(anna))
      .send({ bookId: annaBookId })
      .expect(400);

    expect(response.body.message).toContain('власну книгу');
  });

  it('lets the second user request an exchange and emails the owner', async () => {
    const petroBook = await http()
      .post('/api/me/books')
      .set(as(petro))
      .field('name', '1984')
      .field('author', 'George Orwell')
      .expect(201);
    petroBookId = petroBook.body.id;

    const response = await http()
      .post('/api/exchange-requests')
      .set(as(petro))
      .send({ bookId: annaBookId, message: 'Давайте обміняємось!' })
      .expect(201);
    expectNoPasswordHash(response.body);

    exchangeRequestId = response.body.id;
    expect(response.body.status).toBe('PENDING');
    expect(mailService.sendExchangeRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        to: anna.email,
        requesterEmail: petro.email,
        desiredBook: { name: 'Dune', author: 'Frank Herbert' },
        requesterBooks: [{ name: '1984', author: 'George Orwell' }],
        message: 'Давайте обміняємось!',
      }),
    );
  });

  it('rejects a second pending request for the same book with 409', async () => {
    await http()
      .post('/api/exchange-requests')
      .set(as(petro))
      .send({ bookId: annaBookId })
      .expect(409);
  });

  it('rejects a request for the requester own book with 400', async () => {
    await http()
      .post('/api/exchange-requests')
      .set(as(petro))
      .send({ bookId: petroBookId })
      .expect(400);
  });

  it('shows the request to both participants', async () => {
    const incoming = await http().get('/api/exchange-requests/incoming').set(as(anna)).expect(200);
    const outgoing = await http().get('/api/exchange-requests/outgoing').set(as(petro)).expect(200);
    expectNoPasswordHash([incoming.body, outgoing.body]);

    expect(incoming.body).toHaveLength(1);
    expect(outgoing.body).toHaveLength(1);
    expect(incoming.body[0].requester.email).toBe(petro.email);
    expect(outgoing.body[0].owner.email).toBeNull();
  });

  it('only lets the owner accept, once, and emails the requester', async () => {
    await http()
      .patch(`/api/exchange-requests/${exchangeRequestId}`)
      .set(as(petro))
      .send({ action: 'accept' })
      .expect(403);

    const response = await http()
      .patch(`/api/exchange-requests/${exchangeRequestId}`)
      .set(as(anna))
      .send({ action: 'accept' })
      .expect(200);
    expect(response.body.status).toBe('ACCEPTED');

    const outgoing = await http().get('/api/exchange-requests/outgoing').set(as(petro)).expect(200);
    expect(outgoing.body[0].owner.email).toBe(anna.email);
    expect(mailService.sendExchangeStatus).toHaveBeenCalledWith(
      expect.objectContaining({ to: petro.email, isAccepted: true }),
    );

    await http()
      .patch(`/api/exchange-requests/${exchangeRequestId}`)
      .set(as(anna))
      .send({ action: 'decline' })
      .expect(409);
  });

  it('keeps admin routes for admins only and never exposes password hashes', async () => {
    await http().get('/api/admin/users').set(as(petro)).expect(403);

    await prisma.user.update({ where: { id: anna.id }, data: { role: 'ADMIN' } });
    const response = await http().get('/api/admin/users').set(as(anna)).expect(200);

    expectNoPasswordHash(response.body);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items[0]).toHaveProperty('booksCount');

    await http()
      .patch(`/api/admin/users/${anna.id}`)
      .set(as(anna))
      .send({ role: 'USER' })
      .expect(400);
    await http().delete(`/api/admin/users/${anna.id}`).set(as(anna)).expect(400);
  });

  it('resets a forgotten password with a single-use token', async () => {
    await http().post('/api/auth/forgot-password').send({ email: 'ANNA@example.com ' }).expect(204);

    const { resetUrl } = mailService.sendPasswordReset.mock.calls[0][0] as { resetUrl: string };
    const token = new URL(resetUrl).searchParams.get('token') as string;

    const stored = await prisma.passwordResetToken.findMany();
    expect(stored).toHaveLength(1);
    expect(stored[0]?.tokenHash).not.toBe(token);

    await http()
      .post('/api/auth/reset-password')
      .send({ token, password: 'NewSecret456!' })
      .expect(204);
    await http()
      .post('/api/auth/reset-password')
      .send({ token, password: 'AnotherSecret789!' })
      .expect(400);

    const login = await http()
      .post('/api/auth/login')
      .send({ email: anna.email, password: 'NewSecret456!' })
      .expect(200);
    expectNoPasswordHash(login.body);
  });
});
