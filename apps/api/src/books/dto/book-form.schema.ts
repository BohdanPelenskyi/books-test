import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { UPLOAD_FIELD_NAME } from '../../uploads/uploads.constants';

/** Multipart body description for Swagger, where the cover can be a file or a URL. */
export const BOOK_FORM_SCHEMA: SchemaObject = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    author: { type: 'string' },
    photoUrl: { type: 'string', format: 'uri' },
    [UPLOAD_FIELD_NAME]: { type: 'string', format: 'binary' },
  },
};
