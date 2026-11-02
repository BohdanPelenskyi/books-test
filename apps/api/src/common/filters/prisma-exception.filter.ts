import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

const PRISMA_UNIQUE_VIOLATION = 'P2002';
const PRISMA_RECORD_NOT_FOUND = 'P2025';

interface ErrorResponse {
  status: HttpStatus;
  message: string;
}

const KNOWN_ERRORS: Record<string, ErrorResponse> = {
  [PRISMA_UNIQUE_VIOLATION]: {
    status: HttpStatus.CONFLICT,
    message: 'Запис з такими даними вже існує',
  },
  [PRISMA_RECORD_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: 'Запис не знайдено',
  },
};

const UNKNOWN_ERROR: ErrorResponse = {
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  message: 'Внутрішня помилка сервера',
};

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter<Prisma.PrismaClientKnownRequestError> {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const knownError = KNOWN_ERRORS[exception.code];
    if (!knownError) {
      this.logger.error(`Unhandled Prisma error ${exception.code}`, exception.stack);
    }
    const { status, message } = knownError ?? UNKNOWN_ERROR;

    response.status(status).json({ statusCode: status, message });
  }
}
