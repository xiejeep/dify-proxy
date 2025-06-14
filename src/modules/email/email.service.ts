import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('email.resendApiKey');
    this.resend = new Resend(apiKey);
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const fromEmail = this.configService.get<string>('email.fromEmail') || 'noreply@example.com';
    const apiKey = this.configService.get<string>('email.resendApiKey');
    
    console.log('发送验证码邮件:', { email, fromEmail, hasApiKey: !!apiKey });
    
    await this.resend.emails.send({
      from: fromEmail,
      to: email,
      subject: '验证码 - Dify代理服务',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">验证码</h2>
          <p>您的验证码是：</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #666;">验证码有效期为5分钟，请及时使用。</p>
          <p style="color: #999; font-size: 12px;">如果您没有请求此验证码，请忽略此邮件。</p>
        </div>
      `,
    });
  }

  async sendWelcomeEmail(email: string): Promise<void> {
    const fromEmail = this.configService.get<string>('email.fromEmail') || 'noreply@example.com';
    
    await this.resend.emails.send({
      from: fromEmail,
      to: email,
      subject: '欢迎使用 Dify代理服务',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">欢迎加入！</h2>
          <p>感谢您注册 Dify代理服务！</p>
          <p>您已获得 <strong>1000</strong> 积分作为新用户奖励。</p>
          <p>您可以使用这些积分来调用 Dify API 服务。</p>
          <p>记得每日签到获取更多积分哦！</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">祝您使用愉快！</p>
        </div>
      `,
    });
  }
}