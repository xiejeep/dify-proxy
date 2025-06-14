import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreditService } from '../credit/credit.service';
import { CreditType } from '@prisma/client';

export interface CheckinResult {
  success: boolean;
  creditEarned: number;
  consecutiveDays: number;
  totalCredits: number;
  message: string;
}

@Injectable()
export class CheckinService {
  constructor(
    private prisma: PrismaService,
    private creditService: CreditService,
    private configService: ConfigService,
  ) {}

  async dailyCheckin(userId: string): Promise<CheckinResult> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 检查今天是否已经签到
    const todayCheckin = await this.prisma.checkinRecord.findUnique({
      where: {
        userId_checkinDate: {
          userId,
          checkinDate: today,
        },
      },
    });

    if (todayCheckin) {
      throw new ConflictException('今天已经签到过了');
    }

    // 获取昨天的签到记录
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayCheckin = await this.prisma.checkinRecord.findUnique({
      where: {
        userId_checkinDate: {
          userId,
          checkinDate: yesterday,
        },
      },
    });

    // 计算连续签到天数
    let consecutiveDays = 1;
    if (yesterdayCheckin) {
      consecutiveDays = yesterdayCheckin.consecutiveDays + 1;
    }

    // 获取配置
    const baseCredits = this.configService.get<number>('credits.dailyCheckinBase') || 10;
    const bonusCredits = this.configService.get<number>('credits.dailyCheckinBonus') || 5;
    const maxConsecutiveDays = this.configService.get<number>('credits.maxConsecutiveDays') || 30;

    // 计算奖励积分
    let creditEarned = baseCredits;
    
    // 连续签到奖励（每连续签到一天额外获得奖励积分）
    if (consecutiveDays > 1) {
      const bonusDays = Math.min(consecutiveDays - 1, maxConsecutiveDays - 1);
      creditEarned += bonusDays * bonusCredits;
    }

    // 特殊奖励：连续签到7天、15天、30天
    if (consecutiveDays === 7) {
      creditEarned += 50; // 连续7天额外奖励
    } else if (consecutiveDays === 15) {
      creditEarned += 100; // 连续15天额外奖励
    } else if (consecutiveDays === 30) {
      creditEarned += 200; // 连续30天额外奖励
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 创建签到记录
        await tx.checkinRecord.create({
          data: {
            userId,
            checkinDate: today,
            creditEarned,
            consecutiveDays,
          },
        });

        // 添加积分
        const creditResult = await this.creditService.addCredits({
          userId,
          amount: creditEarned,
          reason: `每日签到奖励（连续${consecutiveDays}天）`,
          type: CreditType.CHECKIN,
        });

        return {
          success: true,
          creditEarned,
          consecutiveDays,
          totalCredits: creditResult.newBalance,
        };
      });

      let message = `签到成功！获得 ${creditEarned} 积分`;
      if (consecutiveDays > 1) {
        message += `，连续签到 ${consecutiveDays} 天`;
      }
      if (consecutiveDays === 7 || consecutiveDays === 15 || consecutiveDays === 30) {
        message += `，获得连续签到特殊奖励！`;
      }

      return {
        ...result,
        message,
      };
    } catch (error) {
      throw new BadRequestException('签到失败，请稍后重试');
    }
  }

  async getCheckinStatus(userId: string): Promise<{
    hasCheckedToday: boolean;
    consecutiveDays: number;
    totalCheckins: number;
    lastCheckinDate?: Date;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 检查今天是否已签到
    const todayCheckin = await this.prisma.checkinRecord.findUnique({
      where: {
        userId_checkinDate: {
          userId,
          checkinDate: today,
        },
      },
    });

    // 获取最近的签到记录
    const latestCheckin = await this.prisma.checkinRecord.findFirst({
      where: { userId },
      orderBy: { checkinDate: 'desc' },
    });

    // 获取总签到次数
    const totalCheckins = await this.prisma.checkinRecord.count({
      where: { userId },
    });

    // 计算当前连续签到天数
    let consecutiveDays = 0;
    if (latestCheckin) {
      const latestDate = new Date(latestCheckin.checkinDate);
      latestDate.setHours(0, 0, 0, 0);
      
      // 如果最近签到是今天或昨天，则连续天数有效
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (latestDate.getTime() === today.getTime() || latestDate.getTime() === yesterday.getTime()) {
        consecutiveDays = latestCheckin.consecutiveDays;
      }
    }

    return {
      hasCheckedToday: !!todayCheckin,
      consecutiveDays,
      totalCheckins,
      lastCheckinDate: latestCheckin?.checkinDate,
    };
  }

  async getCheckinHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.checkinRecord.findMany({
        where: { userId },
        orderBy: { checkinDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.checkinRecord.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }
}