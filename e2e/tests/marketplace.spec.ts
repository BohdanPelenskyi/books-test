import { expect, test } from '@playwright/test';
const WEB_URL = process.env.E2E_WEB_URL ?? 'http://localhost:3000';

import { addBook, PASSWORD, SEEDED_USERS, signIn, signOut, uniqueSuffix } from './helpers';

test.describe('accounts', () => {
  test('a visitor can register, sign out and sign back in', async ({ page }) => {
    const email = `reader.${uniqueSuffix()}@example.com`;

    await page.goto('/register');
    await page.getByLabel("Ім'я").fill('Playwright Reader');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Пароль', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Зареєструватися' }).click();

    await expect(page).toHaveURL(/\/books/);
    await expect(page.getByRole('button', { name: 'Меню користувача' })).toBeVisible();

    await signOut(page);
    await signIn(page, { email, password: PASSWORD });
  });

  test('registration shows an error under the field for a taken email', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel("Ім'я").fill('Duplicate');
    await page.getByLabel('Email').fill(SEEDED_USERS.anna.email);
    await page.getByLabel('Пароль', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Зареєструватися' }).click();

    await expect(page.getByText('Користувач з таким email вже існує')).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });

  test('guests are sent to the login page and back after signing in', async ({ page }) => {
    await page.goto('/me/books');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fme%2Fbooks/);

    await page.getByLabel('Email').fill(SEEDED_USERS.anna.email);
    await page.getByLabel('Пароль', { exact: true }).fill(SEEDED_USERS.anna.password);
    await page.getByRole('button', { name: 'Увійти' }).click();

    await expect(page).toHaveURL(/\/me\/books/);
  });

  test('a leftover cookie never locks anybody out of the login page', async ({ page, context }) => {
    await context.addCookies([{ name: 'access_token', value: 'stale-token', url: WEB_URL }]);

    await page.goto('/login');

    await expect(page.getByRole('button', { name: 'Увійти' })).toBeVisible();
  });
});

test.describe('catalog', () => {
  test('search and alphabetical sorting work from the URL', async ({ page }) => {
    await page.goto('/books');
    await page.getByLabel('Пошук книг').fill('orwell');
    await expect(page).toHaveURL(/search=orwell/);
    await expect(page.getByRole('heading', { name: '1984', level: 2 })).toBeVisible();

    await page.getByLabel('Сортування').selectOption('author:asc');
    await expect(page).toHaveURL(/sort=author/);
  });

  test('the pages fit a 375px phone without horizontal scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    for (const path of ['/books', '/login', '/register']) {
      await page.goto(path);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth, `horizontal overflow on ${path}`).toBeLessThanOrEqual(375);
    }
  });
});

test.describe('books and exchanges', () => {
  test('a user manages their books', async ({ page }) => {
    const name = `Managed ${uniqueSuffix()}`;
    await signIn(page, SEEDED_USERS.anna);

    await addBook(page, name, 'E2E Author');

    await page.getByRole('button', { name: `Видалити «${name}»` }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Видалити' }).click();
    await expect(page.getByRole('heading', { name, level: 2 })).toHaveCount(0);
  });

  test('two users exchange: choose books, accept, and the book leaves the catalog', async ({
    browser,
  }) => {
    const bookName = `Exchange ${uniqueSuffix()}`;
    const annaPage = await (await browser.newContext()).newPage();
    const petroPage = await (await browser.newContext()).newPage();

    await signIn(annaPage, SEEDED_USERS.anna);
    await addBook(annaPage, bookName, 'E2E Author');

    await signIn(petroPage, SEEDED_USERS.petro);
    await petroPage.goto(`/books?search=${encodeURIComponent(bookName)}`);
    await petroPage.getByRole('heading', { name: bookName, level: 2 }).click();
    await petroPage.getByRole('button', { name: 'Запросити обмін' }).click();

    const dialog = petroPage.getByRole('dialog');
    await expect(dialog.getByRole('checkbox').first()).toBeChecked();
    await dialog.getByLabel('Повідомлення (необовʼязково)').fill('Привіт! Давай обміняємось.');
    await dialog.getByRole('button', { name: 'Надіслати' }).click();
    await expect(petroPage.getByRole('button', { name: 'Запит надіслано' })).toBeDisabled();

    await annaPage.goto('/exchanges');
    const card = annaPage.getByRole('article').filter({ hasText: bookName });
    await expect(card.getByText('Пропонує:')).toBeVisible();
    await expect(card.getByText('Очікує відповіді')).toBeVisible();
    await card.getByRole('button', { name: 'Прийняти' }).click();
    await expect(card.getByText('Прийнято')).toBeVisible();

    await petroPage.goto('/exchanges?tab=outgoing');
    await expect(
      petroPage.getByRole('article').filter({ hasText: bookName }).getByText('Прийнято'),
    ).toBeVisible();

    await annaPage.goto(`/books?search=${encodeURIComponent(bookName)}`);
    await expect(annaPage.getByText('Нічого не знайдено')).toBeVisible();
    await annaPage.getByLabel('Показувати обміняні').check();
    await expect(annaPage.getByText('Обміняно').first()).toBeVisible();
  });

  test('the owner cannot ask for an exchange on their own book', async ({ page }) => {
    const bookName = `Own ${uniqueSuffix()}`;
    await signIn(page, SEEDED_USERS.anna);
    await addBook(page, bookName, 'E2E Author');

    await page.goto(`/books?search=${encodeURIComponent(bookName)}`);
    await page.getByRole('heading', { name: bookName, level: 2 }).click();

    await expect(page.getByText('Це ваша книга')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Запросити обмін' })).toHaveCount(0);
  });
});

test.describe('administration', () => {
  test('a regular user sees the 403 state and an admin sees the users table', async ({ page }) => {
    await signIn(page, SEEDED_USERS.anna);
    await page.goto('/admin');
    await expect(page.getByText('Доступ заборонено')).toBeVisible();

    await signOut(page);
    await signIn(page, SEEDED_USERS.admin);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Користувачі' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'anna@example.com' })).toBeVisible();
  });
});
