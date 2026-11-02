import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TrimToUndefined } from '../../common/transforms/trim.transform';

export const MESSAGE_MAX_LENGTH = 1000;
const MAX_OFFERED_BOOKS = 20;

export class CreateExchangeRequestDto {
  @ApiProperty({ format: 'uuid', description: 'The book the user wants to receive' })
  @IsUUID()
  bookId!: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Own available books the user offers in exchange; listed in the email',
    minItems: 1,
    maxItems: MAX_OFFERED_BOOKS,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_OFFERED_BOOKS)
  @IsUUID('all', { each: true })
  offeredBookIds!: string[];

  @ApiPropertyOptional({ maxLength: MESSAGE_MAX_LENGTH })
  @IsOptional()
  @TrimToUndefined()
  @IsString()
  @MaxLength(MESSAGE_MAX_LENGTH)
  message?: string;
}
