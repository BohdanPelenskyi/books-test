import { describe, expect, it } from 'vitest';
import { DEFAULT_REDIRECT_PATH, getSafeRedirectPath } from './safe-redirect';

describe('getSafeRedirectPath', () => {
  it('keeps internal paths including the query', () => {
    expect(getSafeRedirectPath('/me/books?page=2')).toBe('/me/books?page=2');
  });

  it.each([
    ['an absolute URL', 'https://evil.example.com'],
    ['a protocol-relative URL', '//evil.example.com'],
    ['a relative path', 'books'],
    ['a javascript: URL', 'javascript:alert(1)'],
  ])('falls back for %s', (_label, value) => {
    expect(getSafeRedirectPath(value)).toBe(DEFAULT_REDIRECT_PATH);
  });

  it('falls back when nothing is provided', () => {
    expect(getSafeRedirectPath(undefined)).toBe(DEFAULT_REDIRECT_PATH);
  });
});
