import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

export interface RegisterDto {
  email: string;
  password: string;
  code: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface SendCodeDto {
  email: string;
}

export interface SendResetCodeDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  code: string;
  newPassword: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async sendVerificationCode(sendCodeDto: SendCodeDto): Promise<{ message: string }> {
    const { email } = sendCodeDto;

    // 检查用户是否已存在
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('该邮箱已注册，请直接登录或使用密码重置功能');
    }

    // 生成6位数验证码
    const code = Math.random().toString().slice(2, 8).padStart(6, '0');
    
    // 设置过期时间（5分钟）
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 删除该邮箱之前未使用的验证码
    await this.prisma.verificationCode.deleteMany({
      where: {
        email,
        used: false,
      },
    });

    // 保存新验证码
    await this.prisma.verificationCode.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    // 发送邮件
    try {
      await this.emailService.sendVerificationCode(email, code);
    } catch (error) {
      console.error('邮件发送失败:', error);
      throw new BadRequestException('邮件发送失败，请稍后重试');
    }

    return { message: '验证码已发送到您的邮箱' };
  }

  async register(registerDto: RegisterDto): Promise<{ access_token: string; user: any }> {
    const { email, password, code } = registerDto;

    // 验证验证码
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verificationCode) {
      throw new BadRequestException('验证码无效或已过期');
    }

    // 检查用户是否已存在
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('用户已存在');
    }

    // 创建用户
    const user = await this.userService.create({ email, password });

    // 标记验证码为已使用
    await this.prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    });

    // 发送欢迎邮件
    try {
      await this.emailService.sendWelcomeEmail(email);
    } catch (error) {
      // 邮件发送失败不影响注册流程
      console.error('发送欢迎邮件失败:', error);
    }

    // 生成JWT token
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        credits: user.credits,
        createdAt: user.createdAt,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: any }> {
    const { email, password } = loginDto;

    // 查找用户
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 检查用户是否激活
    if (!user.isActive) {
      throw new UnauthorizedException('账户已被禁用');
    }

    // 验证密码
    const isPasswordValid = await this.userService.validatePassword(user, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 生成JWT token
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        credits: user.credits,
        createdAt: user.createdAt,
      },
    };
  }

  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.userService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }
    return user;
  }

  async sendResetCode(sendResetCodeDto: SendResetCodeDto): Promise<{ message: string }> {
    const { email } = sendResetCodeDto;

    // 检查用户是否存在
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('该邮箱未注册');
    }

    // 生成6位数验证码
    const code = Math.random().toString().slice(2, 8).padStart(6, '0');
    
    // 设置过期时间（5分钟）
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 删除该邮箱之前未使用的验证码
    await this.prisma.verificationCode.deleteMany({
      where: {
        email,
        used: false,
      },
    });

    // 保存新验证码
    await this.prisma.verificationCode.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    // 发送密码重置邮件
    try {
      await this.emailService.sendPasswordResetCode(email, code);
    } catch (error) {
      console.error('密码重置邮件发送失败:', error);
      throw new BadRequestException('邮件发送失败，请稍后重试');
    }

    return { message: '密码重置验证码已发送到您的邮箱' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { email, code, newPassword } = resetPasswordDto;

    // 验证验证码
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verificationCode) {
      throw new BadRequestException('验证码无效或已过期');
    }

    // 检查用户是否存在
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    // 更新用户密码
    await this.userService.update(user.id, { password: newPassword });

    // 标记验证码为已使用
    await this.prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    });

    return { message: '密码重置成功' };
  }
}