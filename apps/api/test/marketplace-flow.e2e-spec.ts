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
const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000';

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
  let olena: Account;
  let annaBookId: string;
  let petroBookId: string;
  let petroSecondBookId: string;
  let olenaBookId: string;
  let petroRequestId: string;
  let olenaRequestId: string;

  const http = () => request(app.getHttpServer());
  const as = (account: Account) => ({ Authorization: `Bearer ${account.token}` });

  function expectNoPasswordHash(body: unknown): void {
    expect(JSON.stringify(body)).not.toContain('passwordHash');
  }

  async function register(name: string, email: string): Promise<Account> {
    const response = await http()
      .post('/api/auth/register')
      .send({ name, email, password: PASSWORD })
      .expect(201);
    expectNoPasswordHash(response.body);
    expect(response.body.user).not.toHaveProperty('tokenVersion');
    return { id: response.body.user.id, email, token: response.body.accessToken };
  }

  async function createBook(account: Account, name: string, author: string): Promise<string> {
    const response = await http()
      .post('/api/me/books')
      .set(as(account))
      .field('name', name)
      .field('author', author)
      .expect(201);
    return response.body.id;
  }

  const catalogIds = async (query: Record<string, string> = {}): Promise<string[]> => {
    const response = await http().get('/api/books').query(query).expect(200);
    return response.body.items.map((book: { id: string }) => book.id);
  };

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

  it('reports a healthy API and database', async () => {
    const response = await http().get('/api/health').expect(200);

    expect(response.body).toEqual({ status: 'ok', database: 'up' });
  });

  it('registers three users', async () => {
    anna = await register('Anna', 'anna@example.com');
    petro = await register('Petro', 'petro@example.com');
    olena = await register('Olena', 'olena@example.com');
  });

  it('lets a user add a book', async () => {
    annaBookId = await createBook(anna, 'Dune', 'Frank Herbert');

    const response = await http().get(`/api/books/${annaBookId}`).expect(200);
    expect(response.body).toMatchObject({ status: 'AVAILABLE', owner: { id: anna.id } });
  });

  it('refuses an upload whose content is not an image, whatever its mime type says', async () => {
    await http()
      .post('/api/me/books')
      .set(as(anna))
      .field('name', 'Fake cover')
      .field('author', 'Nobody')
      .attach('photo', Buffer.from('<script>alert(1)</script>'), {
        filename: 'cover.png',
        contentType: 'image/png',
      })
      .expect(400);

    const mine = await http().get('/api/me/books').set(as(anna)).expect(200);
    expect(mine.body.meta.total).toBe(1);
  });

  it('finds the book through a case-insensitive search by title and by author', async () => {
    for (const search of ['dUNe', 'herbert']) {
      expect(await catalogIds({ search })).toEqual([annaBookId]);
    }
    expect(await catalogIds({ search: 'nothing-like-this' })).toEqual([]);
  });

  it('sorts alphabetically by title and by author', async () => {
    await createBook(anna, 'Animal Farm', 'George Orwell');
    const byTitle = await http().get('/api/books').query({ sort: 'name:asc' }).expect(200);
    const byAuthor = await http().get('/api/books').query({ sort: 'author:asc' }).expect(200);

    expect(byTitle.body.items.map((book: { name: string }) => book.name)).toEqual([
      'Animal Farm',
      'Dune',
    ]);
    expect(byAuthor.body.items.map((book: { author: string }) => book.author)).toEqual([
      'Frank Herbert',
      'George Orwell',
    ]);
  });

  it('hides a book from the catalog when its owner is excluded', async () => {
    expect(await catalogIds({ excludeOwnerId: anna.id })).toEqual([]);
  });

  it('rejects an exchange request from a user who has no books to offer', async () => {
    const response = await http()
      .post('/api/exchange-requests')
      .set(as(petro))
      .send({ bookId: annaBookId, offeredBookIds: [UNKNOWN_UUID] })
      .expect(400);

    expect(response.body.message).toContain('Додайте хоча б одну книгу');
  });

  it('rejects an exchange request for the sender own book with 400', async () => {
    const response = await http()
      .post('/api/exchange-requests')
      .set(as(anna))
      .send({ bookId: annaBookId, offeredBookIds: [UNKNOWN_UUID] })
      .expect(400);

    expect(response.body.message).toContain('власну книгу');
  });

  it('requires at least one offered book', async () => {
    await http()
      .post('/api/exchange-requests')
      .set(as(petro))
      .send({ bookId: annaBookId, offeredBookIds: [] })
      .expect(400);
  });

  it('lets the second user offer a chosen book and emails only that book to the owner', async () => {
    petroBookId = await createBook(petro, '1984', 'George Orwell');
    petroSecondBookId = await createBook(petro, 'Brave New World', 'Aldous Huxley');

    await http()
      .post('/api/exchange-requests')
      .set(as(petro))
      .send({ bookId: annaBookId, offeredBookIds: [annaBookId] })
      .expect(400);

    const response = await http()
      .post('/api/exchange-requests')
      .set(as(petro))
      .send({
        bookId: annaBookId,
        offeredBookIds: [petroBookId],
        message: 'Давайте обміняємось!',
      })
      .expect(201);
    expectNoPasswordHash(response.body);

    petroRequestId = response.body.id;
    expect(response.body.status).toBe('PENDING');
    expect(response.body.offeredBooks.map((book: { name: string }) => book.name)).toEqual(['1984']);
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
      .send({ bookId: annaBookId, offeredBookIds: [petroSecondBookId] })
      .expect(409);
  });

  it('rejects a request for the requester own book with 400', async () => {
    await http()
      .post('/api/exchange-requests')
      .set(as(petro))
      .send({ bookId: petroBookId, offeredBookIds: [petroSecondBookId] })
      .expect(400);
  });

  it('lets a third user compete for the same book', async () => {
    olenaBookId = await createBook(olena, 'The Hobbit', 'J. R. R. Tolkien');

    const response = await http()
      .post('/api/exchange-requests')
      .set(as(olena))
      .send({ bookId: annaBookId, offeredBookIds: [olenaBookId] })
      .expect(201);
    olenaRequestId = response.body.id;
  });

  it('shows the requests to the right participants and hides the owner email until acceptance', async () => {
    const incoming = await http().get('/api/exchange-requests/incoming').set(as(anna)).expect(200);
    const outgoing = await http().get('/api/exchange-requests/outgoing').set(as(petro)).expect(200);
    expectNoPasswordHash([incoming.body, outgoing.body]);

    expect(incoming.body).toHaveLength(2);
    expect(outgoing.body).toHaveLength(1);
    expect(outgoing.body[0].owner.email).toBeNull();
  });

  it('only lets the owner accept, once', async () => {
    await http()
      .patch(`/api/exchange-requests/${petroRequestId}`)
      .set(as(petro))
      .send({ action: 'accept' })
      .expect(403);

    const response = await http()
      .patch(`/api/exchange-requests/${petroRequestId}`)
      .set(as(anna))
      .send({ action: 'accept' })
      .expect(200);
    expect(response.body.status).toBe('ACCEPTED');

    await http()
      .patch(`/api/exchange-requests/${petroRequestId}`)
      .set(as(anna))
      .send({ action: 'decline' })
      .expect(409);
  });

  it('closes the book, declines the competing request and tells everyone', async () => {
    const outgoing = await http().get('/api/exchange-requests/outgoing').set(as(petro)).expect(200);
    expect(outgoing.body[0].owner.email).toBe(anna.email);

    const competitor = await http()
      .get('/api/exchange-requests/outgoing')
      .set(as(olena))
      .expect(200);
    expect(competitor.body[0]).toMatchObject({ id: olenaRequestId, status: 'DECLINED' });

    expect(mailService.sendExchangeStatus).toHaveBeenCalledWith(
      expect.objectContaining({ to: petro.email, isAccepted: true }),
    );
    expect(mailService.sendExchangeStatus).toHaveBeenCalledWith(
      expect.objectContaining({ to: olena.email, isAccepted: false }),
    );

    await http()
      .post('/api/exchange-requests')
      .set(as(olena))
      .send({ bookId: annaBookId, offeredBookIds: [olenaBookId] })
      .expect(409);
  });

  it('hides exchanged books from the default catalog but can still list them', async () => {
    expect(await catalogIds()).not.toContain(annaBookId);

    const all = await http().get('/api/books').query({ availability: 'all' }).expect(200);
    const exchanged = all.body.items.find((book: { id: string }) => book.id === annaBookId);
    expect(exchanged.status).toBe('EXCHANGED');
  });

  it('lets the owner return an exchanged book to the catalog', async () => {
    await http()
      .patch(`/api/me/books/${annaBookId}`)
      .set(as(anna))
      .send({ status: 'AVAILABLE' })
      .expect(200);
    await http()
      .patch(`/api/me/books/${annaBookId}`)
      .set(as(petro))
      .send({ status: 'AVAILABLE' })
      .expect(403);

    expect(await catalogIds()).toContain(annaBookId);
  });

  it('keeps admin routes for admins only and never exposes password hashes', async () => {
    await http().get('/api/admin/users').set(as(petro)).expect(403);

    await prisma.user.update({ where: { id: anna.id }, data: { role: 'ADMIN' } });
    const response = await http().get('/api/admin/users').set(as(anna)).expect(200);

    expectNoPasswordHash(response.body);
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[0]).toHaveProperty('booksCount');

    await http()
      .patch(`/api/admin/users/${anna.id}`)
      .set(as(anna))
      .send({ role: 'USER' })
      .expect(400);
    await http().delete(`/api/admin/users/${anna.id}`).set(as(anna)).expect(400);
  });

  it('resets a forgotten password with a single-use token that also ends old sessions', async () => {
    await http().post('/api/auth/forgot-password').send({ email: 'ANNA@example.com ' }).expect(204);

    const { resetUrl } = mailService.sendPasswordReset.mock.calls[0][0] as { resetUrl: string };
    const token = new URL(resetUrl).searchParams.get('token') as string;

    const stored = await prisma.passwordResetToken.findMany();
    expect(stored).toHaveLength(1);
    expect(stored[0]?.tokenHash).not.toBe(token);

    await http().get('/api/auth/me').set(as(anna)).expect(200);

    await http()
      .post('/api/auth/reset-password')
      .send({ token, password: 'NewSecret456!' })
      .expect(204);
    await http()
      .post('/api/auth/reset-password')
      .send({ token, password: 'AnotherSecret789!' })
      .expect(400);

    // The token issued before the reset no longer works.
    await http().get('/api/auth/me').set(as(anna)).expect(401);

    const login = await http()
      .post('/api/auth/login')
      .send({ email: anna.email, password: 'NewSecret456!' })
      .expect(200);
    expectNoPasswordHash(login.body);
    expect(login.body.user).not.toHaveProperty('tokenVersion');

    await http()
      .get('/api/auth/me')
      .set({ Authorization: `Bearer ${login.body.accessToken}` })
      .expect(200);
  });

  it('ends sessions after the user changes the password', async () => {
    await http()
      .patch('/api/users/me/password')
      .set(as(petro))
      .send({ currentPassword: PASSWORD, newPassword: 'ChangedSecret1!' })
      .expect(204);

    await http().get('/api/auth/me').set(as(petro)).expect(401);
  });
});
