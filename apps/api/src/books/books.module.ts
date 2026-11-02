import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { AdminBooksController } from './admin-books.controller';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { MyBooksController } from './my-books.controller';

@Module({
  imports: [UploadsModule],
  controllers: [BooksController, MyBooksController, AdminBooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
