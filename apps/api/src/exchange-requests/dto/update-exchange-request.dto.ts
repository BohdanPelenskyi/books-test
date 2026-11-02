import { ApiProperty } from '@nestjs/swagger';
import { ExchangeAction } from '@book-exchange/shared';
import { IsIn } from 'class-validator';

export class UpdateExchangeRequestDto {
  @ApiProperty({ enum: Object.values(ExchangeAction) })
  @IsIn(Object.values(ExchangeAction))
  action!: ExchangeAction;
}
