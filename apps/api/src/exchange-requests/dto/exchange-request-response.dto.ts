import { ExchangeStatus } from '@book-exchange/shared';
import { ApiProperty } from '@nestjs/swagger';

export class ExchangePartyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Hidden from the requester until the owner accepts the request',
  })
  email!: string | null;

  @ApiProperty({ type: String, nullable: true })
  avatarUrl!: string | null;
}

export class ExchangeBookResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  author!: string;

  @ApiProperty({ type: String, nullable: true })
  photoUrl!: string | null;
}

export class ExchangeRequestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: Object.values(ExchangeStatus) })
  status!: ExchangeStatus;

  @ApiProperty({ type: String, nullable: true })
  message!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: ExchangeBookResponseDto })
  book!: ExchangeBookResponseDto;

  @ApiProperty({ type: [ExchangeBookResponseDto], description: 'Books the sender offers' })
  offeredBooks!: ExchangeBookResponseDto[];

  @ApiProperty({ type: ExchangePartyResponseDto })
  requester!: ExchangePartyResponseDto;

  @ApiProperty({ type: ExchangePartyResponseDto })
  owner!: ExchangePartyResponseDto;
}
