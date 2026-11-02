import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { EXTENSION_BY_MIME_TYPE, MAX_UPLOAD_SIZE_BYTES, UPLOADS_DIR } from './uploads.constants';

export const imageUploadOptions: MulterOptions = {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (_request, file, callback) => {
      callback(null, `${randomUUID()}${EXTENSION_BY_MIME_TYPE[file.mimetype]}`);
    },
  }),
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
  fileFilter: (_request, file, callback) => {
    if (file.mimetype in EXTENSION_BY_MIME_TYPE) {
      callback(null, true);
      return;
    }
    callback(new BadRequestException('Дозволені лише зображення JPEG, PNG або WebP'), false);
  },
};
