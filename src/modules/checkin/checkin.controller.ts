import { Controller, Post, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('签到')
@ApiBearerAuth()
@Controller('checkin')
@UseGuards(JwtAuthGuard)
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post()
  @ApiOperation({ summary: '每日签到' })
  @ApiResponse({ status: 200, description: '签到成功' })
  async dailyCheckin(@CurrentUser() user: User) {
    return this.checkinService.dailyCheckin(user.id);
  }

  @Get('status')
  @ApiOperation({ summary: '获取签到状态' })
  @ApiResponse({ status: 200, description: '签到状态' })
  async getStatus(@CurrentUser() user: User) {
    return this.checkinService.getCheckinStatus(user.id);
  }

  @Get('history')
  @ApiOperation({ summary: '获取签到历史' })
  @ApiResponse({ status: 200, description: '签到历史' })
  async getHistory(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    return this.checkinService.getCheckinHistory(user.id, page, limit);
  }
}