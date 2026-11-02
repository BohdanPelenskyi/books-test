import { QueryClient } from '@tanstack/react-query';

const STALE_TIME_MS = 60 * 1000;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  });
}
