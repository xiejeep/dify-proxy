import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DifyProxyService } from './dify-proxy.service';
import { DifyProxyController } from './dify-proxy.controller';
import { CreditModule } from '../credit/credit.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    CreditModule,
  ],
  providers: [DifyProxyService],
  controllers: [DifyProxyController],
  exports: [DifyProxyService],
})
export class DifyProxyModule {}