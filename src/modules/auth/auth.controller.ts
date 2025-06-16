import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService, RegisterDto, LoginDto, SendCodeDto, SendResetCodeDto, ResetPasswordDto } from './auth.service';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

export class SendCodeRequestDto implements SendCodeDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;
}

export class RegisterRequestDto implements RegisterDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度至少6位' })
  @MaxLength(50, { message: '密码长度不能超过50位' })
  password: string;

  @IsString({ message: '验证码必须是字符串' })
  @MinLength(6, { message: '验证码长度为6位' })
  @MaxLength(6, { message: '验证码长度为6位' })
  code: string;
}

export class LoginRequestDto implements LoginDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度至少6位' })
  password: string;
}

export class SendResetCodeRequestDto implements SendResetCodeDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;
}

export class ResetPasswordRequestDto implements ResetPasswordDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString({ message: '验证码必须是字符串' })
  @MinLength(6, { message: '验证码长度为6位' })
  @MaxLength(6, { message: '验证码长度为6位' })
  code: string;

  @IsString({ message: '新密码必须是字符串' })
  @MinLength(6, { message: '新密码长度至少6位' })
  @MaxLength(50, { message: '新密码长度不能超过50位' })
  newPassword: string;
}

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发送验证码' })
  @ApiBody({ description: '发送验证码请求', type: SendCodeRequestDto })
  @ApiResponse({ status: 200, description: '验证码发送成功' })
  async sendCode(@Body() sendCodeDto: SendCodeRequestDto) {
    return this.authService.sendVerificationCode(sendCodeDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '用户注册' })
  @ApiBody({ description: '注册请求', type: RegisterRequestDto })
  @ApiResponse({ status: 201, description: '注册成功' })
  async register(@Body() registerDto: RegisterRequestDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录' })
  @ApiBody({ description: '登录请求', type: LoginRequestDto })
  @ApiResponse({ status: 200, description: '登录成功' })
  async login(@Body() loginDto: LoginRequestDto) {
    return this.authService.login(loginDto);
  }

  @Post('send-reset-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发送密码重置验证码' })
  @ApiBody({ description: '发送密码重置验证码请求', type: SendResetCodeRequestDto })
  @ApiResponse({ status: 200, description: '密码重置验证码发送成功' })
  async sendResetCode(@Body() sendResetCodeDto: SendResetCodeRequestDto) {
    return this.authService.sendResetCode(sendResetCodeDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '重置密码' })
  @ApiBody({ description: '重置密码请求', type: ResetPasswordRequestDto })
  @ApiResponse({ status: 200, description: '密码重置成功' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordRequestDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}