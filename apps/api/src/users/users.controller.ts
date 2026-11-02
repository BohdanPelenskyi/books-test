import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { imageUploadOptions } from '../uploads/image-upload.options';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponse, ProfileService } from './profile.service';
import { PublicUser } from './user.select';

const AVATAR_FIELD_NAME = 'avatar';
const CHANGE_PASSWORD_THROTTLE = { limit: 5, ttl: 60_000 };

@ApiTags('profile')
@ApiBearerAuth()
@Controller('users/me')
export class UsersController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'My profile with book and exchange counters' })
  getProfile(@CurrentUser() user: PublicUser): Promise<ProfileResponse> {
    return this.profileService.getProfile(user.id);
  }

  @Patch()
  @UseInterceptors(FileInterceptor(AVATAR_FIELD_NAME, imageUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        [AVATAR_FIELD_NAME]: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Update name, email and avatar' })
  updateProfile(
    @CurrentUser() user: PublicUser,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ): Promise<ProfileResponse> {
    return this.profileService.updateProfile(user.id, dto, avatar);
  }

  @Patch('password')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: CHANGE_PASSWORD_THROTTLE })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change my password; the current one is required' })
  changePassword(@CurrentUser() user: PublicUser, @Body() dto: ChangePasswordDto): Promise<void> {
    return this.profileService.changePassword(user.id, dto);
  }
}
