import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import { getApiErrorMessage, getApiErrorStatus } from './api-error';

function apiError(status: number, data: unknown): AxiosError {
  return new AxiosError('failed', String(status), undefined, undefined, {
    status,
    data,
  } as AxiosResponse);
}

describe('getApiErrorMessage', () => {
  it('shows the message sent by the server', () => {
    expect(getApiErrorMessage(apiError(409, { message: 'Запис уже існує' }))).toBe(
      'Запис уже існує',
    );
  });

  it('never shows English validation messages', () => {
    const error = apiError(400, { message: ['email must be an email'] });

    expect(getApiErrorMessage(error)).toBe('Перевірте правильність введених даних');
  });

  it('localizes rate limiting and oversized uploads', () => {
    expect(getApiErrorMessage(apiError(429, { message: 'ThrottlerException' }))).toContain(
      'Забагато спроб',
    );
    expect(getApiErrorMessage(apiError(413, { message: 'File too large' }))).toContain('2 МБ');
  });

  it('explains a network failure instead of showing a generic error', () => {
    const networkError = new AxiosError('Network Error', 'ERR_NETWORK');

    expect(getApiErrorMessage(networkError)).toContain('Не вдалося звʼязатися з сервером');
  });

  it('uses the fallback for errors that did not come from the API', () => {
    expect(getApiErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
  });
});

describe('getApiErrorStatus', () => {
  it('reads the HTTP status of API errors only', () => {
    expect(getApiErrorStatus(apiError(404, {}))).toBe(404);
    expect(getApiErrorStatus(new Error('boom'))).toBeUndefined();
  });
});
