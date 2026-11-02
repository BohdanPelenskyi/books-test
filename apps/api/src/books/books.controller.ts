import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginatedResponse } from '../common/dto/paginated-response';
import { Public } from '../common/decorators/public.decorator';
import { BookWithOwner, BooksService } from './books.service';
import { ListBooksQueryDto } from './dto/list-books-query.dto';

@ApiTags('books')
@Public()
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @ApiOperation({ summary: 'Search and list books' })
  findAll(@Query() query: ListBooksQueryDto): Promise<PaginatedResponse<BookWithOwner>> {
    return this.booksService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a book with its owner' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BookWithOwner> {
    return this.booksService.findOne(id);
  }
}
