import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema';

export interface MailBook {
  name: string;
  author: string;
}

export interface ExchangeRequestMailInput {
  to: string;
  ownerName: string;
  requesterName: string;
  requesterEmail: string;
  desiredBook: MailBook;
  requesterBooks: MailBook[];
  message: string | null;
}

export interface ExchangeStatusMailInput {
  to: string;
  requesterName: string;
  ownerName: string;
  bookName: string;
  isAccepted: boolean;
}

export interface PasswordResetMailInput {
  to: string;
  name: string;
  resetUrl: string;
}

@Injectable()
export class MailService {
  private readonly exchangesUrl: string;

  constructor(
    private readonly mailer: MailerService,
    config: ConfigService<Env, true>,
  ) {
    this.exchangesUrl = `${config.get('WEB_URL', { infer: true })}/exchanges`;
  }

  async sendExchangeRequest({ to, ...context }: ExchangeRequestMailInput): Promise<void> {
    await this.mailer.sendMail({
      to,
      subject: `Новий запит на обмін: «${context.desiredBook.name}»`,
      template: 'exchange-request',
      context: { ...context, exchangesUrl: this.exchangesUrl },
    });
  }

  async sendExchangeStatus({ to, ...context }: ExchangeStatusMailInput): Promise<void> {
    const outcome = context.isAccepted ? 'прийнято' : 'відхилено';

    await this.mailer.sendMail({
      to,
      subject: `Запит на обмін ${outcome}: «${context.bookName}»`,
      template: 'exchange-status',
      context: { ...context, exchangesUrl: this.exchangesUrl },
    });
  }

  async sendPasswordReset({ to, ...context }: PasswordResetMailInput): Promise<void> {
    await this.mailer.sendMail({
      to,
      subject: 'Відновлення пароля',
      template: 'reset-password',
      context,
    });
  }
}
