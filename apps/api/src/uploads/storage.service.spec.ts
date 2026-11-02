import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { StorageService } from './storage.service';

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];
const JPEG_HEADER = [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0];
const WEBP_HEADER = [...Buffer.from('RIFF'), 1, 2, 3, 4, ...Buffer.from('WEBP')];

describe('StorageService.assertIsImage', () => {
  let directory: string;
  const storage = new StorageService({
    get: () => 'http://localhost:4000',
  } as unknown as ConfigService<never, true>);

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'storage-spec-'));
  });

  afterAll(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  async function fileWith(name: string, bytes: number[] | string): Promise<Express.Multer.File> {
    const path = join(directory, name);
    await writeFile(path, typeof bytes === 'string' ? bytes : Buffer.from(bytes));
    return { path } as Express.Multer.File;
  }

  it.each([
    ['PNG', PNG_HEADER],
    ['JPEG', JPEG_HEADER],
    ['WebP', WEBP_HEADER],
  ])('accepts a real %s file', async (name, header) => {
    await expect(
      storage.assertIsImage(await fileWith(`${name}.bin`, header)),
    ).resolves.toBeUndefined();
  });

  it('rejects text that only claims to be an image', async () => {
    const file = await fileWith('fake.png', '<script>alert(1)</script>');

    await expect(storage.assertIsImage(file)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an empty file', async () => {
    await expect(storage.assertIsImage(await fileWith('empty.png', []))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
