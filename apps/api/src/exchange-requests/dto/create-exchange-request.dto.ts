import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrimToUndefined } from '../../common/transforms/trim.transform';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export const MESSAGE_MAX_LENGTH = 1000;

export class CreateExchangeRequestDto {
  @ApiProperty({ format: 'uuid', description: 'The book the user wants to receive' })
  @IsUUID()
  bookId!: string;

  @ApiPropertyOptional({ maxLength: MESSAGE_MAX_LENGTH })
  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(MESSAGE_MAX_LENGTH)
  message?: string;
}
