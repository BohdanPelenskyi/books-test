import { Module } from '@nestjs/common';
import { THROTTLER_MODULE } from '../common/throttler.config';
import { MailModule } from '../mail/mail.module';
import { ExchangeRequestsController } from './exchange-requests.controller';
import { ExchangeRequestsService } from './exchange-requests.service';

@Module({
  imports: [MailModule, THROTTLER_MODULE],
  controllers: [ExchangeRequestsController],
  providers: [ExchangeRequestsService],
})
export class ExchangeRequestsModule {}
