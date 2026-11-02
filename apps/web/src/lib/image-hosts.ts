const OPEN_LIBRARY_HOST = 'covers.openlibrary.org';

/** Hosts configured in next.config; images from other hosts are served unoptimized. */
export function isOptimizableImageUrl(imageUrl: string): boolean {
  try {
    const { hostname } = new URL(imageUrl);
    const apiHostname = new URL(process.env.NEXT_PUBLIC_API_URL ?? '').hostname;
    return hostname === OPEN_LIBRARY_HOST || hostname === apiHostname;
  } catch {
    return false;
  }
}
