import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../auth/dto/auth-response.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';

export class AdminUserResponseDto extends UserResponseDto {
  @ApiProperty()
  booksCount!: number;
}

export class PaginatedAdminUsersResponseDto {
  @ApiProperty({ type: [AdminUserResponseDto] })
  items!: AdminUserResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

export class ProfileResponseDto extends UserResponseDto {
  @ApiProperty()
  booksCount!: number;

  @ApiProperty()
  incomingRequestsCount!: number;

  @ApiProperty()
  outgoingRequestsCount!: number;

  @ApiProperty({ description: 'Incoming requests that are still waiting for an answer' })
  pendingIncomingCount!: number;
}
