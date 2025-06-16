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
  Delete,
} from '@nestjs/common';
import { Response } from 'express';
import { DifyProxyService, DifyApiRequest } from './dify-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

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

@ApiTags('Dify代理')
@ApiBearerAuth()
@Controller('dify')
@UseGuards(JwtAuthGuard)
export class DifyProxyController {
  constructor(private readonly difyProxyService: DifyProxyService) {}

  @Post('chat-messages')
  @ApiOperation({ summary: '发送聊天消息' })
  @ApiBody({ description: '聊天消息数据', type: Object })
  @ApiResponse({ status: 200, description: '聊天消息响应' })
  async chatMessages(
    @CurrentUser() user: User,
    @Body() data: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response,
  ) {
    data.user = user.id;
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
  @ApiOperation({ summary: '发送完成消息' })
  @ApiBody({ description: '完成消息数据', type: Object })
  @ApiResponse({ status: 200, description: '完成消息响应' })
  async completionMessages(
    @CurrentUser() user: User,
    @Body() data: any,
    @Headers() headers: Record<string, string>,
  ) {
    data.user = user.id;
    return this.difyProxyService.proxyRequest(user.id, {
      endpoint: '/completion-messages',
      method: 'POST',
      data,
      headers,
    });
  }

  @Post('workflows/run')
  @ApiOperation({ summary: '运行工作流' })
  @ApiBody({ description: '工作流数据', type: Object })
  @ApiResponse({ status: 200, description: '工作流响应' })
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
  @ApiOperation({ summary: '音频转文本' })
  @ApiBody({ description: '音频数据', type: Object })
  @ApiResponse({ status: 200, description: '音频转文本响应' })
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
  @ApiOperation({ summary: '文本转音频' })
  @ApiBody({ description: '文本数据', type: Object })
  @ApiResponse({ status: 200, description: '文本转音频响应' })
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
  @ApiOperation({ summary: '通用代理请求' })
  @ApiBody({ description: '代理请求数据', type: ProxyRequestDto })
  @ApiResponse({ status: 200, description: '代理请求响应' })
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

  @Post('chat-messages/:taskId/stop')
  @ApiOperation({ summary: '停止聊天消息' })
  @ApiBody({ description: '停止数据', type: Object })
  @ApiResponse({ status: 200, description: '停止响应' })
  async stopChatMessage(
    @CurrentUser() user: User,
    @Param('taskId') taskId: string,
    @Body() data: any,
    @Headers() headers: Record<string, string>,
  ) {
    data = data || {};
    data.user = user.id;
    return this.difyProxyService.proxyRequest(user.id, {
      endpoint: `/chat-messages/${taskId}/stop`,
      method: 'POST',
      data,
      headers,
    });
  }

  @Get('messages/:messageId/suggested')
  async getSuggestedQuestions(
    @CurrentUser() user: User,
    @Param('messageId') messageId: string,
    @Headers() headers: Record<string, string>,
  ) {
    return this.difyProxyService.proxyRequest(user.id, {
      endpoint: `/messages/${messageId}/suggested?user=${encodeURIComponent(user.id)}`,
      method: 'GET',
      headers,
    });
  }

  @Post('messages/:messageId/feedbacks')
  @ApiOperation({ summary: '消息反馈' })
  @ApiBody({ description: '反馈数据', type: Object })
  @ApiResponse({ status: 200, description: '反馈响应' })
  async messageFeedback(
    @CurrentUser() user: User,
    @Param('messageId') messageId: string,
    @Body() data: any,
    @Headers() headers: Record<string, string>,
  ) {
    data.user = user.id;
    return this.difyProxyService.proxyRequest(user.id, {
      endpoint: `/messages/${messageId}/feedbacks`,
      method: 'POST',
      data,
      headers,
    });
  }

  @Get('messages/:messageId/feedback-stats')
  @ApiOperation({ summary: '获取消息反馈统计' })
  @ApiResponse({ status: 200, description: '反馈统计响应' })
  async messageFeedbackStats(
    @CurrentUser() user: User,
    @Param('messageId') messageId: string,
    @Headers() headers: Record<string, string>,
  ) {
    return this.difyProxyService.proxyRequest(user.id, {
      endpoint: `/messages/${messageId}/feedback-stats`,
      method: 'GET',
      headers,
    });
  }

  @Get('conversations/:conversationId/messages')
  async getConversationMessages(
    @CurrentUser() user: User,
    @Param('conversationId') conversationId: string,
    @Headers() headers: Record<string, string>,
    @Query() query: any,
  ) {
    const params = new URLSearchParams({ ...query, conversation_id: conversationId, user: user.id });
    return this.difyProxyService.proxyRequest(user.id, {
      endpoint: `/messages?${params.toString()}`,
      method: 'GET',
      headers,
    });
  }

  @Get('conversations')
  async getConversations(
    @CurrentUser() user: User,
    @Headers() headers: Record<string, string>,
    @Query() query: any,
  ) {
    const params = new URLSearchParams({ ...query, user: user.id });
    const queryString = params.toString() ? '?' + params.toString() : '';
    return this.difyProxyService.proxyRequest(user.id, {
      endpoint: `/conversations${queryString}`,
      method: 'GET',
      headers,
    });
  }

  @Delete('conversations/:conversationId')
  @ApiOperation({ summary: '删除会话' })
  @ApiBody({ description: '删除数据', type: Object })
  @ApiResponse({ status: 200, description: '删除响应' })
  async deleteConversation(
    @CurrentUser() user: User,
    @Param('conversationId') conversationId: string,
    @Body() data: any,
    @Headers() headers: Record<string, string>,
  ) {
    data = data || {};
    data.user = user.id;
    return this.difyProxyService.proxyRequest(user.id, {
      endpoint: `/conversations/${conversationId}`,
      method: 'DELETE',
      data,
      headers,
    });
  }

  @Post('conversations/:conversationId/name')
  @ApiOperation({ summary: '重命名会话' })
  @ApiBody({ description: '重命名数据', type: Object })
  @ApiResponse({ status: 200, description: '重命名响应' })
  async renameConversation(
    @CurrentUser() user: User,
    @Param('conversationId') conversationId: string,
    @Body() data: any,
    @Headers() headers: Record<string, string>,
  ) {
    data.user = user.id;
    return this.difyProxyService.proxyRequest(user.id, {
      endpoint: `/conversations/${conversationId}/name`,
      method: 'POST',
      data,
      headers,
    });
  }

  @Get('conversations/:conversationId/variables')
  async getConversationVariables(
    @CurrentUser() user: User,
    @Param('conversationId') conversationId: string,
    @Headers() headers: Record<string, string>,
    @Query() query: any,
  ) {
    const params = new URLSearchParams({ ...query, user: user.id });
    return this.difyProxyService.proxyRequest(user.id, {
      endpoint: `/conversations/${conversationId}/variables?${params.toString()}`,
      method: 'GET',
      headers,
    });
  }

  @Get('meta')
  async getMetaInfo(
    @CurrentUser() user: User,
    @Headers() headers: Record<string, string>,
  ) {
    return this.difyProxyService.proxyRequest(user.id, {
      endpoint: '/meta',
      method: 'GET',
      headers,
    });
  }

  @Get('parameters')
  async getAppParameters(
    @CurrentUser() user: User,
    @Headers() headers: Record<string, string>,
  ) {
    return this.difyProxyService.proxyRequest(user.id, {
      endpoint: '/parameters',
      method: 'GET',
      headers,
    });
  }
}