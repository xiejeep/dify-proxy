#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function initDatabase() {
  try {
    console.log('🚀 开始数据库初始化...');
    
    // 检查数据库连接
    console.log('📡 检查数据库连接...');
    await execAsync('npx prisma db pull --force');
    console.log('✅ 数据库连接正常');
    
    // 生成Prisma客户端
    console.log('🔧 生成Prisma客户端...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma客户端生成完成');
    
    // 运行迁移
    console.log('📦 运行数据库迁移...');
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // 生产环境使用 migrate deploy
      await execAsync('npx prisma migrate deploy');
      console.log('✅ 生产环境迁移完成');
    } else {
      // 开发环境使用 migrate dev
      try {
        await execAsync('npx prisma migrate dev --name init-migration');
        console.log('✅ 开发环境迁移完成');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('ℹ️  迁移已存在，跳过创建');
        } else {
          throw error;
        }
      }
    }
    
    // 验证表结构
    console.log('🔍 验证数据库表结构...');
    const { stdout } = await execAsync('npx prisma db pull --print');
    
    if (stdout.includes('verification_codes')) {
      console.log('✅ verification_codes 表已存在');
    } else {
      console.log('⚠️  verification_codes 表不存在，可能需要手动检查');
    }
    
    console.log('🎉 数据库初始化完成！');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };