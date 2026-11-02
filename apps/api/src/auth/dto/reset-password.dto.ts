import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './register.dto';

const TOKEN_MAX_LENGTH = 200;

export class ResetPasswordDto {
  @ApiProperty({ description: 'The token from the emailed link' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(TOKEN_MAX_LENGTH)
  token!: string;

  @ApiProperty({ minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string;
}
