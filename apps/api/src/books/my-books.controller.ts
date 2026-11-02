import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { BookResponseDto, PaginatedBooksResponseDto } from './dto/book-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginatedResponse } from '../common/dto/paginated-response';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { imageUploadOptions } from '../uploads/image-upload.options';
import { UPLOAD_FIELD_NAME } from '../uploads/uploads.constants';
import { PublicUser } from '../users/user.select';
import { BookWithOwner, BooksService } from './books.service';
import { BOOK_FORM_SCHEMA } from './dto/book-form.schema';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@ApiTags('my books')
@ApiBearerAuth()
@Controller('me/books')
export class MyBooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @ApiOperation({ summary: 'List my books' })
  @ApiOkResponse({ type: PaginatedBooksResponseDto })
  findAll(
    @CurrentUser() user: PublicUser,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<BookWithOwner>> {
    return this.booksService.findAllByOwner(user.id, query);
  }

  @Post()
  @UseInterceptors(FileInterceptor(UPLOAD_FIELD_NAME, imageUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { ...BOOK_FORM_SCHEMA, required: ['name', 'author'] } })
  @ApiOperation({ summary: 'Add a book; the cover is an optional file or URL' })
  @ApiCreatedResponse({ type: BookResponseDto })
  create(
    @CurrentUser() user: PublicUser,
    @Body() dto: CreateBookDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<BookWithOwner> {
    return this.booksService.create(user.id, dto, file);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor(UPLOAD_FIELD_NAME, imageUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: BOOK_FORM_SCHEMA })
  @ApiOperation({ summary: 'Update my book' })
  @ApiOkResponse({ type: BookResponseDto })
  update(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<BookWithOwner> {
    return this.booksService.update(user.id, id, dto, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete my book and its cover file' })
  remove(@CurrentUser() user: PublicUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.booksService.remove(user.id, id);
  }
}
