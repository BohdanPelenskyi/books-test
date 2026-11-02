import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'User123!';

export const SEEDED_USERS = {
  anna: { email: 'anna@example.com', password: PASSWORD },
  petro: { email: 'petro@example.com', password: PASSWORD },
  admin: { email: 'admin@example.com', password: 'Admin123!' },
} as const;

export function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export async function signIn(
  page: Page,
  { email, password }: { email: string; password: string },
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Увійти' }).click();
  await expect(page).toHaveURL(/\/books/);
  await expect(page.getByRole('button', { name: 'Меню користувача' })).toBeVisible();
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Меню користувача' }).click();
  await page.getByRole('menuitem', { name: 'Вийти' }).click();
  await expect(page).toHaveURL(/\/login/);
}

export async function addBook(page: Page, name: string, author: string): Promise<void> {
  await page.goto('/me/books');
  await page.getByRole('button', { name: 'Додати книгу' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Назва').fill(name);
  await dialog.getByLabel('Автор').fill(author);
  await dialog.getByRole('button', { name: 'Додати', exact: true }).click();
  await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
}
