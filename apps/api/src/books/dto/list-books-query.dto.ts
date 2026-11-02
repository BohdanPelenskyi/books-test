import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Trim } from '../../common/transforms/trim.transform';
import { BookSort } from '../book-sort';

const SEARCH_MAX_LENGTH = 100;

export class ListBooksQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Case-insensitive match on title or author' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(SEARCH_MAX_LENGTH)
  search?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Hide books owned by this user' })
  @IsOptional()
  @IsUUID()
  excludeOwnerId?: string;

  @ApiPropertyOptional({ enum: Object.values(BookSort), default: BookSort.NEWEST })
  @IsOptional()
  @IsIn(Object.values(BookSort))
  sort: BookSort = BookSort.NEWEST;
}
