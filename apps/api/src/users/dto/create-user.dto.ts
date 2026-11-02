import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@book-exchange/shared';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NormalizeEmail } from '../../common/transforms/normalize-email.transform';
import { Trim } from '../../common/transforms/trim.transform';

const USER_NAME_MAX_LENGTH = 100;
export const USER_PASSWORD_MIN_LENGTH = 8;
// bcrypt ignores everything after 72 bytes
export const USER_PASSWORD_MAX_LENGTH = 72;

export class CreateUserDto {
  @ApiProperty({ maxLength: USER_NAME_MAX_LENGTH })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(USER_NAME_MAX_LENGTH)
  name!: string;

  @ApiProperty({ example: 'user@example.com' })
  @NormalizeEmail()
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: USER_PASSWORD_MIN_LENGTH, maxLength: USER_PASSWORD_MAX_LENGTH })
  @IsString()
  @MinLength(USER_PASSWORD_MIN_LENGTH)
  @MaxLength(USER_PASSWORD_MAX_LENGTH)
  password!: string;

  @ApiPropertyOptional({ enum: Object.values(Role), default: Role.USER })
  @IsOptional()
  @IsIn(Object.values(Role))
  role?: Role;
}
