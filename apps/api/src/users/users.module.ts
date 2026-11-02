import { Module } from '@nestjs/common';
import { BooksModule } from '../books/books.module';
import { THROTTLER_MODULE } from '../common/throttler.config';
import { UploadsModule } from '../uploads/uploads.module';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { ProfileService } from './profile.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [BooksModule, UploadsModule, THROTTLER_MODULE],
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService, AdminUsersService, ProfileService],
  exports: [UsersService],
})
export class UsersModule {}
