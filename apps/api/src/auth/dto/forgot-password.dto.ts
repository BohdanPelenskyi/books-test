import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { NormalizeEmail } from '../../common/transforms/normalize-email.transform';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'anna@example.com' })
  @NormalizeEmail()
  @IsEmail()
  email!: string;
}
