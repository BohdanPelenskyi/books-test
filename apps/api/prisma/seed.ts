import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcrypt';

const BCRYPT_ROUNDS = 10;
const COVER_URL_BASE = 'https://covers.openlibrary.org/b/isbn';

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: Role;
}

interface SeedBook {
  name: string;
  author: string;
  isbn: string;
}

const ADMIN: SeedUser = {
  name: 'Admin',
  email: 'admin@example.com',
  password: 'Admin123!',
  role: Role.ADMIN,
};

const READERS: SeedUser[] = [
  { name: 'Anna', email: 'anna@example.com', password: 'User123!', role: Role.USER },
  { name: 'Petro', email: 'petro@example.com', password: 'User123!', role: Role.USER },
];

const BOOKS: SeedBook[] = [
  { name: '1984', author: 'George Orwell', isbn: '9780451524935' },
  { name: 'The Hobbit', author: 'J. R. R. Tolkien', isbn: '9780547928227' },
  { name: 'Pride and Prejudice', author: 'Jane Austen', isbn: '9780141439518' },
  { name: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '9780061120084' },
  { name: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '9780743273565' },
  { name: 'Dune', author: 'Frank Herbert', isbn: '9780441172719' },
  { name: 'Brave New World', author: 'Aldous Huxley', isbn: '9780060850524' },
  { name: 'Fahrenheit 451', author: 'Ray Bradbury', isbn: '9781451673319' },
  { name: 'The Catcher in the Rye', author: 'J. D. Salinger', isbn: '9780316769488' },
  {
    name: 'One Hundred Years of Solitude',
    author: 'Gabriel García Márquez',
    isbn: '9780060883287',
  },
  { name: 'Crime and Punishment', author: 'Fyodor Dostoevsky', isbn: '9780140449136' },
  { name: 'The Little Prince', author: 'Antoine de Saint-Exupéry', isbn: '9780156012195' },
  { name: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316110' },
  { name: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884' },
  { name: 'The Pragmatic Programmer', author: 'Andrew Hunt, David Thomas', isbn: '9780135957059' },
  {
    name: "Harry Potter and the Philosopher's Stone",
    author: 'J. K. Rowling',
    isbn: '9780747532699',
  },
  { name: 'The Alchemist', author: 'Paulo Coelho', isbn: '9780062315007' },
  { name: 'Animal Farm', author: 'George Orwell', isbn: '9780451526342' },
  { name: 'The Lord of the Rings', author: 'J. R. R. Tolkien', isbn: '9780618640157' },
  { name: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '9780374533557' },
];

const prisma = new PrismaClient();

async function upsertUser({ password, ...profile }: SeedUser) {
  const passwordHash = await hash(password, BCRYPT_ROUNDS);

  return prisma.user.upsert({
    where: { email: profile.email },
    update: { ...profile, passwordHash },
    create: { ...profile, passwordHash },
  });
}

async function seedBooks(ownerIds: string[]): Promise<void> {
  await prisma.book.deleteMany({ where: { ownerId: { in: ownerIds } } });
  await prisma.book.createMany({
    data: BOOKS.map(({ isbn, ...book }, index) => ({
      ...book,
      photoUrl: `${COVER_URL_BASE}/${isbn}-L.jpg`,
      ownerId: ownerIds[index % ownerIds.length],
    })),
  });
}

async function main(): Promise<void> {
  await upsertUser(ADMIN);
  const readers = await Promise.all(READERS.map(upsertUser));
  await seedBooks(readers.map((reader) => reader.id));
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
