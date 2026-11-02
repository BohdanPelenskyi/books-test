import { BookStatus } from '@book-exchange/shared';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { CreateBookDto } from './create-book.dto';

export class UpdateBookDto extends PartialType(CreateBookDto) {
  @ApiPropertyOptional({
    enum: Object.values(BookStatus),
    description: 'Lets the owner return an exchanged book to the catalog or mark it as exchanged',
  })
  @IsOptional()
  @IsIn(Object.values(BookStatus))
  status?: BookStatus;
}
