import { useSyncExternalStore } from 'react';

const subscribeToNothing = () => () => {};

/**
 * False during SSR and the hydrating render, true afterwards. Lets client-only state
 * (persisted auth) be shown without causing a hydration mismatch.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}
