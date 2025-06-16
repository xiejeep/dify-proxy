import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as svgCaptcha from 'svg-captcha';
import { randomBytes } from 'crypto';

@Injectable()
export class CaptchaService {
  constructor(private prisma: PrismaService) {}

  async generateCaptcha(): Promise<{ sessionId: string; svg: string }> {
    // 生成验证码
    const captcha = svgCaptcha.create({
      size: 4, // 验证码长度
      noise: 2, // 干扰线条数
      color: true, // 彩色
      background: '#f0f0f0', // 背景色
      width: 120,
      height: 40,
    });

    // 生成会话ID
    const sessionId = randomBytes(16).toString('hex');

    // 设置过期时间（5分钟）
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 保存到数据库
    await this.prisma.captchaCode.create({
      data: {
        sessionId,
        code: captcha.text.toLowerCase(), // 转为小写便于比较
        expiresAt,
      },
    });

    return {
      sessionId,
      svg: captcha.data,
    };
  }

  async verifyCaptcha(sessionId: string, userInput: string): Promise<boolean> {
    const captchaRecord = await this.prisma.captchaCode.findUnique({
      where: { sessionId },
    });

    if (!captchaRecord) {
      return false;
    }

    // 检查是否过期
    if (new Date() > captchaRecord.expiresAt) {
      // 删除过期记录
      await this.prisma.captchaCode.delete({
        where: { sessionId },
      });
      return false;
    }

    // 检查是否已使用
    if (captchaRecord.used) {
      return false;
    }

    // 验证码比较（不区分大小写）
    const isValid = captchaRecord.code === userInput.toLowerCase();

    if (isValid) {
      // 标记为已使用
      await this.prisma.captchaCode.update({
        where: { sessionId },
        data: { used: true },
      });
    }

    return isValid;
  }

  async cleanupExpiredCaptchas(): Promise<void> {
    await this.prisma.captchaCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}