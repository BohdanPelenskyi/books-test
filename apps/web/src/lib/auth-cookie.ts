export const ACCESS_TOKEN_COOKIE = 'access_token';

const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export function setAccessTokenCookie(token: string): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${token}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function clearAccessTokenCookie(): void {
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
