import { ThrottlerModule } from '@nestjs/throttler';

const THROTTLE_WINDOW_MS = 60_000;
const DEFAULT_THROTTLE_LIMIT = 100;

/** Provides the throttler storage; endpoints opt in with ThrottlerGuard and @Throttle. */
export const THROTTLER_MODULE = ThrottlerModule.forRoot([
  { ttl: THROTTLE_WINDOW_MS, limit: DEFAULT_THROTTLE_LIMIT },
]);
