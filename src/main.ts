import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { PrismaService } from './modules/prisma/prisma.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;
  
  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe());
  
  // CORS配置
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  // 全局路由前缀
  app.setGlobalPrefix('api');
  
  // Prisma关闭钩子
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  
  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('Dify 代理服务 API 文档')
    .setDescription('Dify Proxy API Swagger 文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/api-docs', app, document);
  
  await app.listen(port);
  console.log(`应用已启动，端口: ${port}`);
  console.log(`API文档: http://localhost:${port}/api`);
}

bootstrap().catch(error => {
  console.error('应用启动失败:', error);
  process.exit(1);
});
