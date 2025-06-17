# 使用官方Node.js运行时作为基础镜像
FROM node:18-slim

# 安装必要的系统依赖
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 清理npm缓存并安装依赖（跳过postinstall脚本）
RUN npm cache clean --force && npm install --ignore-scripts

# 复制源代码
COPY . .

# 生成Prisma客户端
RUN npx prisma generate

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 创建非root用户
RUN groupadd -r nodejs --gid=1001 && useradd -r -g nodejs --uid=1001 nestjs

# 复制启动脚本并设置权限
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# 更改文件所有权
RUN chown -R nestjs:nodejs /app
USER nestjs

# 启动应用
CMD ["/app/start.sh"]