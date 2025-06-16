import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoginFailureService {
  private readonly MAX_FAILURES = 3; // 最大失败次数
  private readonly LOCK_DURATION = 15 * 60 * 1000; // 锁定时间：15分钟

  constructor(private prisma: PrismaService) {}

  async recordFailure(ipAddress: string, email?: string): Promise<void> {
    const key = this.getRecordKey(ipAddress, email);
    
    let existingRecord;
    if (key) {
      existingRecord = await this.prisma.loginFailureRecord.findUnique({
        where: key,
      });
    } else {
      // Use findFirst when we can't use unique constraint
      existingRecord = await this.prisma.loginFailureRecord.findFirst({
        where: this.getWhereCondition(ipAddress, email),
      });
    }

    if (existingRecord) {
      const newFailureCount = existingRecord.failureCount + 1;
      const shouldLock = newFailureCount >= this.MAX_FAILURES;
      
      if (key) {
        await this.prisma.loginFailureRecord.update({
          where: key,
          data: {
            failureCount: newFailureCount,
            lastFailureAt: new Date(),
            lockedUntil: shouldLock ? new Date(Date.now() + this.LOCK_DURATION) : null,
          },
        });
      } else {
        await this.prisma.loginFailureRecord.update({
          where: { id: existingRecord.id },
          data: {
            failureCount: newFailureCount,
            lastFailureAt: new Date(),
            lockedUntil: shouldLock ? new Date(Date.now() + this.LOCK_DURATION) : null,
          },
        });
      }
    } else {
      await this.prisma.loginFailureRecord.create({
        data: {
          ipAddress,
          email,
          failureCount: 1,
          lastFailureAt: new Date(),
        },
      });
    }
  }

  async isLocked(ipAddress: string, email?: string): Promise<boolean> {
    const key = this.getRecordKey(ipAddress, email);
    
    let record;
    if (key) {
      record = await this.prisma.loginFailureRecord.findUnique({
        where: key,
      });
    } else {
      record = await this.prisma.loginFailureRecord.findFirst({
        where: this.getWhereCondition(ipAddress, email),
      });
    }

    if (!record || !record.lockedUntil) {
      return false;
    }

    // 检查锁定是否已过期
    if (new Date() > record.lockedUntil) {
      // 清除过期的锁定
      if (key) {
        await this.prisma.loginFailureRecord.update({
          where: key,
          data: {
            lockedUntil: null,
            failureCount: 0,
          },
        });
      } else {
        await this.prisma.loginFailureRecord.update({
          where: { id: record.id },
          data: {
            lockedUntil: null,
            failureCount: 0,
          },
        });
      }
      return false;
    }

    return true;
  }

  async requiresCaptcha(ipAddress: string, email?: string): Promise<boolean> {
    const key = this.getRecordKey(ipAddress, email);
    
    let record;
    if (key) {
      record = await this.prisma.loginFailureRecord.findUnique({
        where: key,
      });
    } else {
      record = await this.prisma.loginFailureRecord.findFirst({
        where: this.getWhereCondition(ipAddress, email),
      });
    }

    if (!record) {
      return false;
    }

    // 失败次数达到阈值时需要验证码
    return record.failureCount >= this.MAX_FAILURES;
  }

  async clearFailures(ipAddress: string, email?: string): Promise<void> {
    const whereCondition = this.getWhereCondition(ipAddress, email);
    
    await this.prisma.loginFailureRecord.deleteMany({
      where: whereCondition,
    });
  }

  async getFailureCount(ipAddress: string, email?: string): Promise<number> {
    const key = this.getRecordKey(ipAddress, email);
    
    let record;
    if (key) {
      record = await this.prisma.loginFailureRecord.findUnique({
        where: key,
      });
    } else {
      record = await this.prisma.loginFailureRecord.findFirst({
        where: this.getWhereCondition(ipAddress, email),
      });
    }

    return record?.failureCount || 0;
  }

  async getRemainingLockTime(ipAddress: string, email?: string): Promise<number> {
    const key = this.getRecordKey(ipAddress, email);
    
    let record;
    if (key) {
      record = await this.prisma.loginFailureRecord.findUnique({
        where: key,
      });
    } else {
      record = await this.prisma.loginFailureRecord.findFirst({
        where: this.getWhereCondition(ipAddress, email),
      });
    }

    if (!record || !record.lockedUntil) {
      return 0;
    }

    const remaining = record.lockedUntil.getTime() - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000)); // 返回秒数
  }

  async cleanupExpiredRecords(): Promise<void> {
    // 清理超过24小时的失败记录
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    await this.prisma.loginFailureRecord.deleteMany({
      where: {
        lastFailureAt: {
          lt: oneDayAgo,
        },
        lockedUntil: null,
      },
    });
  }

  private getRecordKey(ipAddress: string, email?: string) {
    // For compound unique constraint, we need both fields as strings
    if (email) {
      return {
        ipAddress_email: {
          ipAddress,
          email,
        },
      };
    }
    // If no email, we need to use a different approach
    // Since compound unique requires both fields, we'll use regular where condition
    return null;
  }

  private getWhereCondition(ipAddress: string, email?: string) {
    return {
      ipAddress,
      email: email || null,
    };
  }
}