import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { NormalizeEmail } from '../../common/transforms/normalize-email.transform';

export class LoginDto {
  @ApiProperty({ example: 'anna@example.com' })
  @NormalizeEmail()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;
}
