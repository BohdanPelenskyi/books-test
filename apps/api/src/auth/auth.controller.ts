import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { PublicUser } from '../users/user.select';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const LOGIN_THROTTLE = { limit: 5, ttl: 60_000 };
const REGISTER_THROTTLE = { limit: 10, ttl: 60_000 };
const PASSWORD_RESET_THROTTLE = { limit: 5, ttl: 60_000 };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: REGISTER_THROTTLE })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: LOGIN_THROTTLE })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: PASSWORD_RESET_THROTTLE })
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Email a password reset link; always answers 204' })
  forgotPassword(@Body() { email }: ForgotPasswordDto): Promise<void> {
    return this.passwordResetService.requestReset(email);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: PASSWORD_RESET_THROTTLE })
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Set a new password using a reset token' })
  resetPassword(@Body() { token, password }: ResetPasswordDto): Promise<void> {
    return this.passwordResetService.resetPassword(token, password);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current user' })
  getCurrentUser(@CurrentUser() user: PublicUser): UserResponseDto {
    return user;
  }
}
