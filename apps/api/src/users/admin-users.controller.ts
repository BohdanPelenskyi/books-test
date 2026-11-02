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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AdminUserResponseDto, PaginatedAdminUsersResponseDto } from './dto/user-response.dto';
import { PaginatedBooksResponseDto } from '../books/dto/book-response.dto';
import { Role } from '@book-exchange/shared';
import { BookWithOwner } from '../books/books.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginatedResponse } from '../common/dto/paginated-response';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AdminUserResponse, AdminUsersService } from './admin-users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PublicUser } from './user.select';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Search users with their book counts' })
  @ApiOkResponse({ type: PaginatedAdminUsersResponseDto })
  findAll(@Query() query: ListUsersQueryDto): Promise<PaginatedResponse<AdminUserResponse>> {
    return this.adminUsersService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a user with a given role' })
  @ApiCreatedResponse({ type: AdminUserResponseDto })
  create(@Body() dto: CreateUserDto): Promise<AdminUserResponse> {
    return this.adminUsersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update name, email, role and optionally the password' })
  @ApiOkResponse({ type: AdminUserResponseDto })
  update(
    @CurrentUser() currentUser: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<AdminUserResponse> {
    return this.adminUsersService.update(currentUser.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user with their books; you cannot delete yourself' })
  remove(
    @CurrentUser() currentUser: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.adminUsersService.remove(currentUser.id, id);
  }

  @Get(':id/books')
  @ApiOperation({ summary: "List a user's books" })
  @ApiOkResponse({ type: PaginatedBooksResponseDto })
  findBooks(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<BookWithOwner>> {
    return this.adminUsersService.findBooks(id, query);
  }
}
