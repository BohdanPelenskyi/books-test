import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { StorageService } from './storage.service';
import { UPLOADS_DIR, UPLOADS_URL_PREFIX } from './uploads.constants';

@Module({
  imports: [ServeStaticModule.forRoot({ rootPath: UPLOADS_DIR, serveRoot: UPLOADS_URL_PREFIX })],
  providers: [StorageService],
  exports: [StorageService],
})
export class UploadsModule {}
