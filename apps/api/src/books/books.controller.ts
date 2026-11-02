import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { BookResponseDto, PaginatedBooksResponseDto } from './dto/book-response.dto';
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
  @ApiOkResponse({ type: PaginatedBooksResponseDto })
  findAll(@Query() query: ListBooksQueryDto): Promise<PaginatedResponse<BookWithOwner>> {
    return this.booksService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a book with its owner' })
  @ApiOkResponse({ type: BookResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BookWithOwner> {
    return this.booksService.findOne(id);
  }
}
