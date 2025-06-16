import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { LoginFailureService } from './login-failure.service';
import { UserModule } from '../user/user.module';
import { EmailModule } from '../email/email.module';
import { CaptchaModule } from '../captcha/captcha.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    UserModule,
    EmailModule,
    CaptchaModule,
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret-key',
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') || '7d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, LoginFailureService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, LoginFailureService],
})
export class AuthModule {}