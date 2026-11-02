import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { validateEnv } from './config/env.schema';
import { ExchangeRequestsModule } from './exchange-requests/exchange-requests.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    MailModule,
    UsersModule,
    AuthModule,
    BooksModule,
    ExchangeRequestsModule,
  ],
})
export class AppModule {}
