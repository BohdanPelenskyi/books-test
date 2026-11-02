import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { USER_PASSWORD_MAX_LENGTH, USER_PASSWORD_MIN_LENGTH } from './create-user.dto';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ minLength: USER_PASSWORD_MIN_LENGTH, maxLength: USER_PASSWORD_MAX_LENGTH })
  @IsString()
  @MinLength(USER_PASSWORD_MIN_LENGTH)
  @MaxLength(USER_PASSWORD_MAX_LENGTH)
  newPassword!: string;
}
