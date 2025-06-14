import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { User, CreditType } from '@prisma/client';

export interface CreateUserDto {
  email: string;
  password: string;
}

export interface UpdateUserDto {
  password?: string;
  isActive?: boolean;
}

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password } = createUserDto;

    // 检查用户是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('用户已存在');
    }

    // 加密密码
    const bcryptRounds = this.configService.get<number>('security.bcryptRounds') || 12;
    const hashedPassword = await bcrypt.hash(password, bcryptRounds);

    // 获取新用户奖励积分
    const newUserBonus = this.configService.get<number>('credits.newUserBonus') || 1000;

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        credits: newUserBonus,
      },
    });

    // 记录积分历史
    await this.prisma.creditHistory.create({
      data: {
        userId: user.id,
        amount: newUserBonus,
        balance: newUserBonus,
        reason: '新用户注册奖励',
        type: CreditType.BONUS,
      },
    });

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const updateData: any = { ...updateUserDto };

    // 如果更新密码，需要加密
    if (updateUserDto.password) {
      const bcryptRounds = this.configService.get<number>('security.bcryptRounds') || 12;
      updateData.password = await bcrypt.hash(updateUserDto.password, bcryptRounds);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async getUserProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        credits: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async getUserStats(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 获取今日API使用次数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayUsage = await this.prisma.apiUsageRecord.count({
      where: {
        userId: id,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // 获取总API使用次数
    const totalUsage = await this.prisma.apiUsageRecord.count({
      where: { userId: id },
    });

    // 获取连续签到天数
    const latestCheckin = await this.prisma.checkinRecord.findFirst({
      where: { userId: id },
      orderBy: { checkinDate: 'desc' },
    });

    return {
      credits: user.credits,
      todayUsage,
      totalUsage,
      consecutiveDays: latestCheckin?.consecutiveDays || 0,
    };
  }
}