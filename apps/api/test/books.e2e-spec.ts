import './set-e2e-env';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyGlobalSetup } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

const USER_ID = '6f1f9c0e-5a53-4a7d-9d0c-0d6c1f5f1a11';
const BOOK_ID = '0c2f5c3e-8a1d-4c55-8f0b-2d6f4a9a7e22';

const regularUser = {
  id: USER_ID,
  name: 'Anna',
  email: 'anna@example.com',
  role: 'USER',
  avatarUrl: null,
  createdAt: new Date(),
};

// Stand-in for PrismaService so the suite runs without a database.
const prisma = {
  user: { findUnique: jest.fn() },
  book: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('Books (e2e)', () => {
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
    jest.resetAllMocks();
    prisma.user.findUnique.mockResolvedValue(regularUser);
    prisma.$transaction.mockResolvedValue([[], 0]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/books', () => {
    it('is public and returns a paginated response', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/books?search=dune&sort=name:asc&page=2&limit=5')
        .expect(200);

      expect(response.body).toEqual({
        items: [],
        meta: { page: 2, limit: 5, total: 0, totalPages: 0 },
      });
    });

    it.each(['sort=price:asc', 'limit=51', 'page=0'])('rejects invalid query %s', async (query) => {
      await request(app.getHttpServer()).get(`/api/books?${query}`).expect(400);
    });

    it('rejects a malformed book id', async () => {
      await request(app.getHttpServer()).get('/api/books/not-a-uuid').expect(400);
    });
  });

  describe('/api/me/books', () => {
    it('requires authentication', async () => {
      await request(app.getHttpServer()).get('/api/me/books').expect(401);
      await request(app.getHttpServer()).post('/api/me/books').expect(401);
    });

    it('creates a book with a photo URL', async () => {
      prisma.book.create.mockResolvedValue({ id: BOOK_ID });

      await request(app.getHttpServer())
        .post('/api/me/books')
        .set('Authorization', `Bearer ${userToken}`)
        .field('name', ' Dune ')
        .field('author', 'Frank Herbert')
        .field('photoUrl', 'https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg')
        .expect(201);

      expect(prisma.book.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Dune', ownerId: USER_ID }),
        }),
      );
    });

    it('creates a book without any cover', async () => {
      prisma.book.create.mockResolvedValue({ id: BOOK_ID });

      await request(app.getHttpServer())
        .post('/api/me/books')
        .set('Authorization', `Bearer ${userToken}`)
        .field('name', 'Dune')
        .field('author', 'Frank Herbert')
        .expect(201);
    });

    it('rejects a non-image upload', async () => {
      await request(app.getHttpServer())
        .post('/api/me/books')
        .set('Authorization', `Bearer ${userToken}`)
        .field('name', 'Dune')
        .field('author', 'Frank Herbert')
        .attach('photo', Buffer.from('not an image'), {
          filename: 'notes.txt',
          contentType: 'text/plain',
        })
        .expect(400);
    });

    it('rejects an image above 2 MB', async () => {
      await request(app.getHttpServer())
        .post('/api/me/books')
        .set('Authorization', `Bearer ${userToken}`)
        .field('name', 'Dune')
        .field('author', 'Frank Herbert')
        .attach('photo', Buffer.alloc(2 * 1024 * 1024 + 1), {
          filename: 'big.png',
          contentType: 'image/png',
        })
        .expect(413);
    });

    it('rejects an invalid photo URL', async () => {
      await request(app.getHttpServer())
        .post('/api/me/books')
        .set('Authorization', `Bearer ${userToken}`)
        .field('name', 'Dune')
        .field('author', 'Frank Herbert')
        .field('photoUrl', 'javascript:alert(1)')
        .expect(400);
    });
  });

  describe('DELETE /api/admin/books/:id', () => {
    it('rejects anonymous requests with 401', async () => {
      await request(app.getHttpServer()).delete(`/api/admin/books/${BOOK_ID}`).expect(401);
    });

    it('rejects a regular user with 403', async () => {
      await request(app.getHttpServer())
        .delete(`/api/admin/books/${BOOK_ID}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('Swagger document', () => {
    it('describes every books endpoint', () => {
      const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().addBearerAuth().build(),
      );

      expect(Object.keys(document.paths)).toEqual(
        expect.arrayContaining([
          '/api/books',
          '/api/books/{id}',
          '/api/me/books',
          '/api/me/books/{id}',
          '/api/admin/books/{id}',
        ]),
      );
    });
  });
});
