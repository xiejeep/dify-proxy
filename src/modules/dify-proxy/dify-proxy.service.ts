import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreditService } from '../credit/credit.service';
import { AxiosResponse } from 'axios';

export interface DifyApiRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

@Injectable()
export class DifyProxyService {
  private readonly difyApiUrl: string;
  private readonly difyApiKey: string;
  private readonly timeout: number;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private creditService: CreditService,
  ) {
    this.difyApiUrl = this.configService.get<string>('dify.apiUrl') || 'https://api.dify.ai/v1';
    this.difyApiKey = this.configService.get<string>('dify.apiKey') || '';
    this.timeout = this.configService.get<number>('dify.timeout') || 30000;
  }

  async proxyRequest(
    userId: string,
    request: DifyApiRequest,
  ): Promise<{ data: any; usage?: TokenUsage; creditCost: number }> {
    const { endpoint, method, data, headers = {} } = request;

    // 计算预估积分消耗（这里可以根据不同的endpoint设置不同的费率）
    const estimatedCost = this.calculateCreditCost(endpoint, data);

    // 检查用户积分是否足够
    const hasSufficientCredits = await this.creditService.checkSufficientCredits(
      userId,
      estimatedCost,
    );

    if (!hasSufficientCredits) {
      throw new BadRequestException('积分不足，请充值后再试');
    }

    // 构建请求URL
    const url = `${this.difyApiUrl}${endpoint}`;

    // 设置请求头
    const requestHeaders = {
      'Authorization': `Bearer ${this.difyApiKey}`,
      'Content-Type': 'application/json',
      ...headers,
    };

    let response: AxiosResponse;
    let actualCost = estimatedCost;
    let usage: TokenUsage | undefined;
    let errorMessage: string | undefined;
    let status = 'success';

    try {
      // 发送请求到Dify API
      response = await firstValueFrom(
        this.httpService.request({
          method,
          url,
          data,
          headers: requestHeaders,
          timeout: this.timeout,
        }),
      );

      // 从响应中提取token使用情况（如果有）
      if (response.data && response.data.metadata && response.data.metadata.usage) {
        usage = response.data.metadata.usage;
        // 根据实际token使用量重新计算积分消耗
        if (usage) {
          actualCost = this.calculateCreditCostByTokens(usage);
        }
      }

    } catch (error) {
      status = 'error';
      errorMessage = error.response?.data?.message || error.message || '请求失败';
      
      // 如果是客户端错误（4xx），仍然扣除积分
      if (error.response?.status >= 400 && error.response?.status < 500) {
        // 客户端错误，扣除基础积分
        actualCost = Math.min(estimatedCost, 1);
      } else {
        // 服务器错误或网络错误，不扣除积分
        actualCost = 0;
      }

      // 重新抛出HTTP异常
      if (error.response) {
        throw new HttpException(
          error.response.data || errorMessage,
          error.response.status,
        );
      } else {
        throw new InternalServerErrorException('Dify API请求失败');
      }
    } finally {
      // 记录API使用情况
      try {
        await this.recordApiUsage({
          userId,
          endpoint,
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
          creditCost: actualCost,
          status,
          errorMessage,
        });

        // 扣除积分（如果有消耗）
        if (actualCost > 0) {
          await this.creditService.deductCredits({
            userId,
            amount: actualCost,
            reason: `API调用: ${endpoint}`,
            endpoint,
          });
        }
      } catch (recordError) {
        console.error('记录API使用情况失败:', recordError);
        // 记录失败不影响主要流程
      }
    }

    return {
      data: response.data,
      usage,
      creditCost: actualCost,
    };
  }

  private calculateCreditCost(endpoint: string, data?: any): number {
    // 根据不同的endpoint计算积分消耗
    // 这里可以根据实际需求调整费率
    const costMap: Record<string, number> = {
      '/chat-messages': 10,
      '/completion-messages': 8,
      '/workflows/run': 15,
      '/audio-to-text': 5,
      '/text-to-audio': 5,
    };

    // 查找匹配的endpoint
    for (const [pattern, cost] of Object.entries(costMap)) {
      if (endpoint.includes(pattern)) {
        return cost;
      }
    }

    // 默认费率
    return 5;
  }

  private calculateCreditCostByTokens(usage: TokenUsage): number {
    // 根据token使用量计算积分消耗
    // 这里的费率可以根据实际情况调整
    const promptTokenCost = 0.001; // 每个prompt token的积分成本
    const completionTokenCost = 0.002; // 每个completion token的积分成本

    const cost = 
      usage.prompt_tokens * promptTokenCost +
      usage.completion_tokens * completionTokenCost;

    // 最小消耗1积分，向上取整
    return Math.max(1, Math.ceil(cost));
  }

  private async recordApiUsage(record: {
    userId: string;
    endpoint: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    creditCost: number;
    status: string;
    errorMessage?: string;
  }): Promise<void> {
    await this.prisma.apiUsageRecord.create({
      data: {
        userId: record.userId,
        endpoint: record.endpoint,
        promptTokens: record.promptTokens,
        completionTokens: record.completionTokens,
        totalTokens: record.totalTokens,
        creditCost: record.creditCost,
        status: record.status,
        errorMessage: record.errorMessage,
      },
    });
  }

  async getApiUsageStats(userId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const records = await this.prisma.apiUsageRecord.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const stats = {
      totalRequests: records.length,
      successfulRequests: records.filter(r => r.status === 'success').length,
      failedRequests: records.filter(r => r.status === 'error').length,
      totalTokensUsed: records.reduce((sum, r) => sum + r.totalTokens, 0),
      totalCreditsSpent: records.reduce((sum, r) => sum + r.creditCost, 0),
      endpointStats: {} as Record<string, { count: number; credits: number }>,
    };

    // 统计各endpoint的使用情况
    records.forEach(record => {
      if (!stats.endpointStats[record.endpoint]) {
        stats.endpointStats[record.endpoint] = { count: 0, credits: 0 };
      }
      stats.endpointStats[record.endpoint].count++;
      stats.endpointStats[record.endpoint].credits += record.creditCost;
    });

    return stats;
  }
}