# 数据库设置指南

本项目已配置自动数据库初始化功能，确保应用启动时数据库表结构正确。

## 自动初始化功能

### 应用启动时自动迁移

应用在启动时会自动执行以下操作：

1. **连接数据库**
2. **检查迁移状态**
3. **自动运行迁移**
   - 开发环境：使用 `prisma migrate dev`
   - 生产环境：使用 `prisma migrate deploy`

### 环境区分

- **开发环境** (`NODE_ENV !== 'production'`)：
  - 自动创建新的迁移文件
  - 迁移失败不会阻止应用启动（仅记录错误）

- **生产环境** (`NODE_ENV === 'production'`)：
  - 只应用已存在的迁移文件
  - 迁移失败会阻止应用启动

## 手动数据库操作

### 可用的 npm 脚本

```bash
# 完整的数据库初始化（推荐用于首次设置）
npm run db:init

# 生成 Prisma 客户端
npm run db:generate

# 创建并应用新迁移（开发环境）
npm run db:migrate

# 应用已存在的迁移（生产环境）
npm run db:migrate:deploy

# 重置数据库（危险操作！）
npm run db:reset
```

### 初始化脚本功能

`npm run db:init` 脚本会执行：

1. ✅ 检查数据库连接
2. 🔧 生成 Prisma 客户端
3. 📦 运行数据库迁移
4. 🔍 验证表结构

## 部署到生产环境

### Docker 部署

项目的 Dockerfile 已配置为包含 Prisma CLI，支持生产环境的自动迁移。

### 环境变量

确保设置以下环境变量：

```env
# 生产环境标识
NODE_ENV=production

# 数据库连接
DATABASE_URL=your_production_database_url
```

### 部署流程

1. **构建镜像**：
   ```bash
   docker build -t dify-proxy .
   ```

2. **启动容器**：
   ```bash
   docker run -e NODE_ENV=production -e DATABASE_URL=your_db_url dify-proxy
   ```

3. **应用会自动**：
   - 连接数据库
   - 运行迁移
   - 启动服务

## 故障排除

### 常见问题

1. **迁移失败**：
   - 检查数据库连接
   - 确认 `DATABASE_URL` 正确
   - 查看应用日志获取详细错误信息

2. **表不存在**：
   - 运行 `npm run db:init` 手动初始化
   - 检查 `prisma/migrations` 目录是否存在迁移文件

3. **权限问题**：
   - 确保数据库用户有创建表的权限
   - 检查数据库连接字符串中的用户权限

### 日志信息

应用启动时会输出以下日志：

```
检查数据库迁移状态...
运行迁移命令: npx prisma migrate deploy
迁移输出: [迁移详情]
数据库迁移完成
应用已启动，端口: 3000
```

## 开发建议

1. **本地开发**：
   - 首次克隆项目后运行 `npm run db:init`
   - 修改数据库模式后运行 `npm run db:migrate`

2. **生产部署**：
   - 确保 `NODE_ENV=production`
   - 迁移文件应通过版本控制系统部署
   - 不要在生产环境手动修改数据库结构

3. **团队协作**：
   - 提交迁移文件到版本控制
   - 团队成员拉取代码后应用会自动迁移
   - 避免同时修改数据库模式造成冲突