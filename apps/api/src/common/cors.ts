const LOOPBACK_HOSTS = ['localhost', '127.0.0.1'];

/**
 * The web app is reachable as both localhost and 127.0.0.1 during development; browsers treat
 * them as different origins, so either one must be allowed to call the API.
 */
export function buildAllowedOrigins(webUrl: string): string[] {
  const { protocol, hostname, port, origin } = new URL(webUrl);
  if (!LOOPBACK_HOSTS.includes(hostname)) {
    return [origin];
  }

  const portSuffix = port ? `:${port}` : '';
  return LOOPBACK_HOSTS.map((host) => `${protocol}//${host}${portSuffix}`);
}
