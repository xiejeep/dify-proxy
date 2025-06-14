import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { DifyProxyService, DifyApiRequest } from './dify-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class ProxyRequestDto implements Omit<DifyApiRequest, 'method'> {
  @IsString()
  endpoint: string;

  @IsOptional()
  @IsObject()
  data?: any;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;
}

@Controller('dify')
@UseGuards(JwtAuthGuard)
export class DifyProxyController {
  constructor(private readonly difyProxyService: DifyProxyService) {}

  @Post('chat-messages')
  async chatMessages(
    @CurrentUser() user: User,
    @Body() data: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response,
  ) {
    if (data && data.response_mode === 'streaming') {
      return this.difyProxyService.proxyStreamRequest(user.id, {
        endpoint: '/chat-messages',
        method: 'POST',
        data,
        headers,
      }, res);
    } else {
      const result = await this.difyProxyService.proxyRequest(user.id, {
        endpoint: '/chat-messages',
        method: 'POST',
        data,
        headers,
      });
      return res.json(result);
    }
  }

  @Post('completion-messages')
  async completionMessages(
    @CurrentUser() user: User,
    @Body() data: any,
    @Headers() headers: Record<string, string>,
  ) {
    return this.difyProxyService.proxyRequest(user.id, {
      endpoint: '/completion-messages',
      method: 'POST',
      data,
      headers,
    });
  }

  @Post('workflows/run')
  async workflowRun(
    @CurrentUser() user: User,
    @Body() data: any,
    @Headers() headers: Record<string, string>,
  ) {
    return this.difyProxyService.proxyRequest(user.id, {
      endpoint: '/workflows/run',
      method: 'POST',
      data,
      headers,
    });
  }

  @Post('audio-to-text')
  async audioToText(
    @CurrentUser() user: User,
    @Body() data: any,
    @Headers() headers: Record<string, string>,
  ) {
    return this.difyProxyService.proxyRequest(user.id, {
      endpoint: '/audio-to-text',
      method: 'POST',
      data,
      headers,
    });
  }

  @Post('text-to-audio')
  async textToAudio(
    @CurrentUser() user: User,
    @Body() data: any,
    @Headers() headers: Record<string, string>,
  ) {
    return this.difyProxyService.proxyRequest(user.id, {
      endpoint: '/text-to-audio',
      method: 'POST',
      data,
      headers,
    });
  }

  @Post('proxy')
  async genericProxy(
    @CurrentUser() user: User,
    @Body() requestDto: ProxyRequestDto,
  ) {
    return this.difyProxyService.proxyRequest(user.id, {
      ...requestDto,
      method: 'POST',
    });
  }

  @Get('usage-stats')
  async getUsageStats(
    @CurrentUser() user: User,
    @Query('days', new ParseIntPipe({ optional: true })) days: number = 7,
  ) {
    return this.difyProxyService.getApiUsageStats(user.id, days);
  }
}