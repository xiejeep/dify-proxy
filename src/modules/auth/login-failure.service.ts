import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoginFailureService {
  private readonly MAX_FAILURES = 3; // 最大失败次数
  private readonly LOCK_DURATION = 15 * 60 * 1000; // 锁定时间：15分钟

  constructor(private prisma: PrismaService) {}

  async recordFailure(ipAddress: string, email?: string): Promise<void> {
    const existingRecord = email
      ? await this.prisma.loginFailureRecord.findUnique({ 
          where: { ipAddress_email: { ipAddress, email } }
        })
      : await this.prisma.loginFailureRecord.findFirst({ 
          where: { ipAddress, email: null }
        });

    if (existingRecord) {
      const newFailureCount = existingRecord.failureCount + 1;
      const shouldLock = newFailureCount >= this.MAX_FAILURES;
      
      const updateWhereClause = email 
        ? { ipAddress_email: { ipAddress, email } }
        : { id: existingRecord.id };
      
      await this.prisma.loginFailureRecord.update({
        where: updateWhereClause,
        data: {
          failureCount: newFailureCount,
          lastFailureAt: new Date(),
          lockedUntil: shouldLock ? new Date(Date.now() + this.LOCK_DURATION) : null,
        },
      });
    } else {
      await this.prisma.loginFailureRecord.create({
        data: {
          ipAddress,
          email: email || null,
          failureCount: 1,
          lastFailureAt: new Date(),
        },
      });
    }
  }

  async isLocked(ipAddress: string, email?: string): Promise<boolean> {
    const record = email
      ? await this.prisma.loginFailureRecord.findUnique({ 
          where: { ipAddress_email: { ipAddress, email } }
        })
      : await this.prisma.loginFailureRecord.findFirst({ 
          where: { ipAddress, email: null }
        });

    if (!record || !record.lockedUntil) {
      return false;
    }

    // 检查锁定是否已过期
    if (new Date() > record.lockedUntil) {
      // 清除过期的锁定
      const updateWhereClause = email 
        ? { ipAddress_email: { ipAddress, email } }
        : { id: record.id };
      
      await this.prisma.loginFailureRecord.update({
        where: updateWhereClause,
        data: {
          lockedUntil: null,
          failureCount: 0,
        },
      });
      return false;
    }

    return true;
  }

  async requiresCaptcha(ipAddress: string, email?: string): Promise<boolean> {
    const record = email
      ? await this.prisma.loginFailureRecord.findUnique({ 
          where: { ipAddress_email: { ipAddress, email } }
        })
      : await this.prisma.loginFailureRecord.findFirst({ 
          where: { ipAddress, email: null }
        });

    if (!record) {
      return false;
    }

    // 失败次数达到阈值时需要验证码
    return record.failureCount >= this.MAX_FAILURES;
  }

  async clearFailures(ipAddress: string, email?: string): Promise<void> {
    await this.prisma.loginFailureRecord.deleteMany({
      where: {
        ipAddress,
        email: email || null,
      },
    });
  }

  async getFailureCount(ipAddress: string, email?: string): Promise<number> {
    const record = email
      ? await this.prisma.loginFailureRecord.findUnique({ 
          where: { ipAddress_email: { ipAddress, email } }
        })
      : await this.prisma.loginFailureRecord.findFirst({ 
          where: { ipAddress, email: null }
        });

    return record?.failureCount || 0;
  }

  async getRemainingLockTime(ipAddress: string, email?: string): Promise<number> {
    const record = email
      ? await this.prisma.loginFailureRecord.findUnique({ 
          where: { ipAddress_email: { ipAddress, email } }
        })
      : await this.prisma.loginFailureRecord.findFirst({ 
          where: { ipAddress, email: null }
        });

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


}