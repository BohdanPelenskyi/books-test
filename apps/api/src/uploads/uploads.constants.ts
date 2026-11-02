import { join } from 'path';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');
export const UPLOADS_URL_PREFIX = '/uploads';
export const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024;
export const UPLOAD_FIELD_NAME = 'photo';

export const EXTENSION_BY_MIME_TYPE: Readonly<Record<string, string>> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
