import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { NormalizeEmail } from '../../common/transforms/normalize-email.transform';
import { Trim } from '../../common/transforms/trim.transform';

export const NAME_MAX_LENGTH = 100;
export const PASSWORD_MIN_LENGTH = 8;
// bcrypt ignores everything after 72 bytes
export const PASSWORD_MAX_LENGTH = 72;

export class RegisterDto {
  @ApiProperty({ example: 'Anna', maxLength: NAME_MAX_LENGTH })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  name!: string;

  @ApiProperty({ example: 'anna@example.com' })
  @NormalizeEmail()
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string;
}
