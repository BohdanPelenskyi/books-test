export const DEFAULT_REDIRECT_PATH = '/books';

/** Accepts only same-origin paths so `?redirect=` cannot send users to another site. */
export function getSafeRedirectPath(
  redirectPath: string | undefined,
  fallback: string = DEFAULT_REDIRECT_PATH,
): string {
  const isInternalPath =
    redirectPath !== undefined && redirectPath.startsWith('/') && !redirectPath.startsWith('//');

  return isInternalPath ? redirectPath : fallback;
}
