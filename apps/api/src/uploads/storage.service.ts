import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { rm } from 'fs/promises';
import { basename, join } from 'path';
import type { Env } from '../config/env.schema';
import { UPLOADS_DIR, UPLOADS_URL_PREFIX } from './uploads.constants';

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
