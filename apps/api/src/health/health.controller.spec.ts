import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import type { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  const queryRaw = jest.fn();
  const controller = new HealthController({ $queryRaw: queryRaw } as unknown as PrismaService);

  beforeEach(() => queryRaw.mockReset());

  it('reports ok when the database answers', async () => {
    queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(controller.check()).resolves.toEqual({ status: 'ok', database: 'up' });
  });

  it('answers 503 when the database is down', async () => {
    queryRaw.mockRejectedValue(new Error('connection refused'));

    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
