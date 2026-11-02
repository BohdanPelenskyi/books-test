import { BookStatus } from '@book-exchange/shared';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';

export class BookOwnerResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

export class BookResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  author!: string;

  @ApiProperty({ type: String, nullable: true })
  photoUrl!: string | null;

  @ApiProperty({ enum: Object.values(BookStatus) })
  status!: BookStatus;

  @ApiProperty({ format: 'uuid' })
  ownerId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: BookOwnerResponseDto })
  owner!: BookOwnerResponseDto;
}

export class PaginatedBooksResponseDto {
  @ApiProperty({ type: [BookResponseDto] })
  items!: BookResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
