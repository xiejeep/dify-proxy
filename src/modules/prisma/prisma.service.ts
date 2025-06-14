import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    await this.runMigrations();
  }

  private async runMigrations() {
    try {
      console.log('检查数据库迁移状态...');
      
      // 在生产环境使用 prisma migrate deploy，在开发环境使用 prisma migrate dev
      const isProduction = process.env.NODE_ENV === 'production';
      const migrateCommand = isProduction 
        ? 'npx prisma migrate deploy'
        : 'npx prisma migrate dev --name auto-migration';
      
      console.log(`运行迁移命令: ${migrateCommand}`);
      const { stdout, stderr } = await execAsync(migrateCommand);
      
      if (stdout) {
        console.log('迁移输出:', stdout);
      }
      if (stderr && !stderr.includes('warning')) {
        console.error('迁移警告/错误:', stderr);
      }
      
      console.log('数据库迁移完成');
    } catch (error) {
      console.error('数据库迁移失败:', error);
      // 在生产环境中，迁移失败应该阻止应用启动
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: any) {
    process.on('beforeExit', async () => {
      await this.$disconnect();
      await app.close();
    });
  }
}