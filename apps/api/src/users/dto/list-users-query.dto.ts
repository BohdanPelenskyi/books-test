import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Trim } from '../../common/transforms/trim.transform';

const USER_SEARCH_MAX_LENGTH = 100;

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Case-insensitive match on name or email' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(USER_SEARCH_MAX_LENGTH)
  search?: string;
}
