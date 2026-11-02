import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import type { Env } from '../config/env.schema';

const THROTTLE_WINDOW_MS = 60_000;
const DEFAULT_THROTTLE_LIMIT = 100;

/**
 * Provides the throttler storage; endpoints opt in with ThrottlerGuard and @Throttle.
 * Rate limiting can be switched off for automated browser tests, never in production.
 */
export const THROTTLER_MODULE = ThrottlerModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>) => ({
    throttlers: [{ ttl: THROTTLE_WINDOW_MS, limit: DEFAULT_THROTTLE_LIMIT }],
    skipIf: () => config.get('DISABLE_RATE_LIMITING', { infer: true }),
  }),
});
