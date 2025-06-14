import { Controller, Post, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('checkin')
@UseGuards(JwtAuthGuard)
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post()
  async dailyCheckin(@CurrentUser() user: User) {
    return this.checkinService.dailyCheckin(user.id);
  }

  @Get('status')
  async getStatus(@CurrentUser() user: User) {
    return this.checkinService.getCheckinStatus(user.id);
  }

  @Get('history')
  async getHistory(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    return this.checkinService.getCheckinHistory(user.id, page, limit);
  }
}