import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '../../common/transforms/trim.transform';
import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

const BOOK_TEXT_MAX_LENGTH = 200;
const PHOTO_URL_MAX_LENGTH = 2048;

export class CreateBookDto {
  @ApiProperty({ example: 'Dune', maxLength: BOOK_TEXT_MAX_LENGTH })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(BOOK_TEXT_MAX_LENGTH)
  name!: string;

  @ApiProperty({ example: 'Frank Herbert', maxLength: BOOK_TEXT_MAX_LENGTH })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(BOOK_TEXT_MAX_LENGTH)
  author!: string;

  @ApiPropertyOptional({
    description: 'Cover URL. Mutually exclusive with the `photo` file.',
    maxLength: PHOTO_URL_MAX_LENGTH,
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
  @MaxLength(PHOTO_URL_MAX_LENGTH)
  photoUrl?: string;
}
