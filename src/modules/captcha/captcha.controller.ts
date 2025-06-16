import { Controller, Get, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { CaptchaService } from './captcha.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyCaptchaDto {
  @IsString({ message: '会话ID必须是字符串' })
  sessionId: string;

  @IsString({ message: '验证码必须是字符串' })
  code: string;
}

@ApiTags('验证码')
@Controller('api/captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get('generate')
  @ApiOperation({ summary: '生成图形验证码' })
  @ApiResponse({ status: 200, description: '验证码生成成功' })
  async generateCaptcha(@Res() res: Response) {
    try {
      const { sessionId, svg } = await this.captchaService.generateCaptcha();
      
      res.status(HttpStatus.OK).json({
        sessionId,
        captcha: svg,
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: '验证码生成失败',
        error: error.message,
      });
    }
  }

  @Post('verify')
  @ApiOperation({ summary: '验证图形验证码' })
  @ApiResponse({ status: 200, description: '验证码验证成功' })
  @ApiResponse({ status: 400, description: '验证码验证失败' })
  async verifyCaptcha(@Body() dto: VerifyCaptchaDto, @Res() res: Response) {
    try {
      const isValid = await this.captchaService.verifyCaptcha(dto.sessionId, dto.code);
      
      if (isValid) {
        res.status(HttpStatus.OK).json({
          message: '验证码验证成功',
          valid: true,
        });
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: '验证码无效或已过期',
          valid: false,
        });
      }
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: '验证码验证失败',
        error: error.message,
      });
    }
  }
}