import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CreditService } from './credit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('积分')
@ApiBearerAuth()
@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Get('balance')
  @ApiOperation({ summary: '获取积分余额' })
  @ApiResponse({ status: 200, description: '积分余额' })
  async getBalance(@CurrentUser() user: User) {
    const credits = await this.creditService.getUserCredits(user.id);
    return { credits };
  }

  @Get('history')
  @ApiOperation({ summary: '获取积分历史' })
  @ApiResponse({ status: 200, description: '积分历史' })
  async getHistory(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    return this.creditService.getCreditHistory(user.id, page, limit);
  }
}