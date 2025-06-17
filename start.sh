#!/bin/bash
set -e

echo "🚀 启动应用..."

# 等待数据库就绪
echo "⏳ 等待数据库连接..."
until node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => { console.log('Database connected'); process.exit(0); })
  .catch(() => process.exit(1))
  .finally(() => prisma.\$disconnect());
" > /dev/null 2>&1; do
  echo "数据库未就绪，等待5秒..."
  sleep 5
done

echo "✅ 数据库连接成功"

# 生成Prisma客户端
echo "🔧 生成Prisma客户端..."
npx prisma generate

# 执行数据库迁移
echo "📦 执行数据库迁移..."
if [ "$NODE_ENV" = "production" ]; then
  npx prisma migrate deploy
else
  npx prisma migrate dev --name auto-migration || true
fi

echo "✅ 迁移完成，启动应用..."

# 启动应用
exec npm run start:prod