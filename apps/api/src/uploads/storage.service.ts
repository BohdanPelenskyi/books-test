import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { open, rm } from 'fs/promises';
import { basename, join } from 'path';
import type { Env } from '../config/env.schema';
import { UPLOADS_DIR, UPLOADS_URL_PREFIX } from './uploads.constants';

const SIGNATURE_BYTES = 12;
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function hasImageSignature(header: Buffer): boolean {
  const isJpeg = header.subarray(0, JPEG_SIGNATURE.length).equals(JPEG_SIGNATURE);
  const isPng = header.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
  const isWebp =
    header.subarray(0, 4).toString('ascii') === 'RIFF' &&
    header.subarray(8, 12).toString('ascii') === 'WEBP';

  return isJpeg || isPng || isWebp;
}

/** The only place that knows how uploaded files are stored; swap it to move to S3. */
@Injectable()
export class StorageService {
  private readonly publicBaseUrl: string;

  constructor(config: ConfigService<Env, true>) {
    this.publicBaseUrl = `${config.get('API_PUBLIC_URL', { infer: true })}${UPLOADS_URL_PREFIX}`;
  }

  getPublicUrl(file: Express.Multer.File): string {
    return `${this.publicBaseUrl}/${file.filename}`;
  }

  /** The mime type comes from the client, so the real content has to be checked too. */
  async assertIsImage(file: Express.Multer.File): Promise<void> {
    const handle = await open(file.path, 'r');
    try {
      const header = Buffer.alloc(SIGNATURE_BYTES);
      await handle.read(header, 0, SIGNATURE_BYTES, 0);
      if (!hasImageSignature(header)) {
        throw new BadRequestException('Файл не є зображенням JPEG, PNG або WebP');
      }
    } finally {
      await handle.close();
    }
  }

  /** Removes a file that was just received but is not going to be used. */
  async discardUploadedFile(file: Express.Multer.File): Promise<void> {
    await rm(file.path, { force: true });
  }

  /** Removes a stored file by its public URL; URLs that are not ours are ignored. */
  async deleteByUrl(fileUrl: string | null): Promise<void> {
    if (!fileUrl?.startsWith(`${this.publicBaseUrl}/`)) {
      return;
    }
    const filename = basename(fileUrl);
    await rm(join(UPLOADS_DIR, filename), { force: true });
  }
}
