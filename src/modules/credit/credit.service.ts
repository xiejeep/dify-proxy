import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreditType, CreditHistory } from '@prisma/client';

export interface DeductCreditsDto {
  userId: string;
  amount: number;
  reason: string;
  endpoint?: string;
}

export interface AddCreditsDto {
  userId: string;
  amount: number;
  reason: string;
  type: CreditType;
}

@Injectable()
export class CreditService {
  constructor(private prisma: PrismaService) {}

  async getUserCredits(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    return user.credits;
  }

  async deductCredits(deductDto: DeductCreditsDto): Promise<{ success: boolean; newBalance: number }> {
    const { userId, amount, reason } = deductDto;

    if (amount <= 0) {
      throw new BadRequestException('扣除积分数量必须大于0');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 获取当前用户积分
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { credits: true },
        });

        if (!user) {
          throw new BadRequestException('用户不存在');
        }

        if (user.credits < amount) {
          throw new BadRequestException('积分不足');
        }

        // 扣除积分
        const newBalance = user.credits - amount;
        await tx.user.update({
          where: { id: userId },
          data: { credits: newBalance },
        });

        // 记录积分历史
        await tx.creditHistory.create({
          data: {
            userId,
            amount: -amount,
            balance: newBalance,
            reason,
            type: CreditType.CONSUMPTION,
          },
        });

        return { success: true, newBalance };
      });

      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('扣除积分失败');
    }
  }

  async addCredits(addDto: AddCreditsDto): Promise<{ success: boolean; newBalance: number }> {
    const { userId, amount, reason, type } = addDto;

    if (amount <= 0) {
      throw new BadRequestException('添加积分数量必须大于0');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 获取当前用户积分
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { credits: true },
        });

        if (!user) {
          throw new BadRequestException('用户不存在');
        }

        // 添加积分
        const newBalance = user.credits + amount;
        await tx.user.update({
          where: { id: userId },
          data: { credits: newBalance },
        });

        // 记录积分历史
        await tx.creditHistory.create({
          data: {
            userId,
            amount,
            balance: newBalance,
            reason,
            type,
          },
        });

        return { success: true, newBalance };
      });

      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('添加积分失败');
    }
  }

  async getCreditHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: CreditHistory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.creditHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.creditHistory.count({
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

  async checkSufficientCredits(userId: string, requiredAmount: number): Promise<boolean> {
    const currentCredits = await this.getUserCredits(userId);
    return currentCredits >= requiredAmount;
  }
}