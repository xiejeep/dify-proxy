import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CreditService } from './credit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Get('balance')
  async getBalance(@CurrentUser() user: User) {
    const credits = await this.creditService.getUserCredits(user.id);
    return { credits };
  }

  @Get('history')
  async getHistory(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    return this.creditService.getCreditHistory(user.id, page, limit);
  }
}