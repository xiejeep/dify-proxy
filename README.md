# Dify 代理服务

一个基于 NestJS 的 Dify API 代理服务，提供用户认证、积分管理、签到系统等功能。

## 功能特性

- 🔐 **用户认证系统**：邮箱验证码注册/登录
- 💰 **积分管理**：积分充值、消费、历史记录
- 📅 **签到系统**：每日签到获取积分，连续签到奖励
- 🔄 **API代理**：安全代理 Dify API 调用
- 📊 **使用统计**：API 调用统计和分析
- 🛡️ **安全防护**：限流、认证、错误处理

## 技术栈

- **框架**：NestJS + TypeScript
- **数据库**：PostgreSQL + Prisma ORM
- **缓存**：Redis
- **认证**：JWT + Passport
- **邮件**：Resend
- **部署**：Docker + Docker Compose + Nginx

## 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 12+
- Redis 6+

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 修改 `.env` 文件中的配置：
```env
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/dify_proxy"

# Dify API配置
DIFY_API_KEY=your-dify-api-key

# 邮件服务配置
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=noreply@yourdomain.com

# JWT密钥（生产环境请使用强密钥）
JWT_SECRET=your-super-secret-jwt-key
```

### 数据库设置

1. 创建数据库：
```bash
createdb dify_proxy
```

2. 运行数据库迁移：
```bash
npx prisma db push
```

3. 生成 Prisma 客户端：
```bash
npx prisma generate
```

### 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

服务将在 `http://localhost:3000` 启动。

## Docker 部署

### 使用 Docker Compose（推荐）

1. 创建环境变量文件：
```bash
cp .env.example .env
```

2. 修改必要的环境变量（特别是 API 密钥）

3. 启动所有服务：
```bash
docker-compose up -d
```

这将启动：
- PostgreSQL 数据库（端口 5432）
- Redis 缓存（端口 6379）
- 应用服务（端口 3000）
- Nginx 反向代理（端口 80）

### 单独构建 Docker 镜像

```bash
docker build -t dify-proxy .
docker run -p 3000:3000 --env-file .env dify-proxy
```

## API 文档

### 认证相关

#### 发送验证码
```http
POST /api/auth/send-code
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "code": "123456"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 用户相关

#### 获取用户信息
```http
GET /api/user/profile
Authorization: Bearer <token>
```

#### 获取用户统计
```http
GET /api/user/stats
Authorization: Bearer <token>
```

### 积分相关

#### 获取积分余额
```http
GET /api/credits/balance
Authorization: Bearer <token>
```

#### 获取积分历史
```http
GET /api/credits/history?page=1&limit=20
Authorization: Bearer <token>
```

### 签到相关

#### 每日签到
```http
POST /api/checkin
Authorization: Bearer <token>
```

#### 获取签到状态
```http
GET /api/checkin/status
Authorization: Bearer <token>
```

#### 获取签到历史
```http
GET /api/checkin/history?page=1&limit=20
Authorization: Bearer <token>
```

### Dify API 代理

#### 聊天消息
```http
POST /api/dify/chat-messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "inputs": {},
  "query": "Hello, world!",
  "response_mode": "blocking",
  "conversation_id": "",
  "user": "user-123"
}
```

#### 完成消息
```http
POST /api/dify/completion-messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "inputs": {},
  "query": "Hello, world!",
  "response_mode": "blocking",
  "user": "user-123"
}
```

#### 工作流运行
```http
POST /api/dify/workflows/run
Authorization: Bearer <token>
Content-Type: application/json

{
  "inputs": {},
  "response_mode": "blocking",
  "user": "user-123"
}
```

#### 获取使用统计
```http
GET /api/dify/usage-stats?days=7
Authorization: Bearer <token>
```

## 项目结构

```
src/
├── common/                 # 公共模块
│   ├── decorators/        # 装饰器
│   ├── filters/           # 异常过滤器
│   ├── guards/            # 守卫
│   ├── interceptors/      # 拦截器
│   └── pipes/             # 管道
├── config/                # 配置文件
├── modules/               # 功能模块
│   ├── auth/              # 认证模块
│   ├── checkin/           # 签到模块
│   ├── credit/            # 积分模块
│   ├── dify-proxy/        # Dify代理模块
│   ├── email/             # 邮件模块
│   ├── prisma/            # 数据库模块
│   └── user/              # 用户模块
├── app.module.ts          # 主模块
└── main.ts                # 应用入口
```

## 数据库模型

### 用户表 (User)
- id: 用户ID
- email: 邮箱
- password: 密码（加密）
- credits: 积分余额
- isActive: 是否激活
- createdAt: 创建时间
- updatedAt: 更新时间

### 积分历史表 (CreditHistory)
- id: 记录ID
- userId: 用户ID
- amount: 变动金额
- balance: 变动后余额
- reason: 变动原因
- type: 变动类型
- createdAt: 创建时间

### 签到记录表 (CheckinRecord)
- id: 记录ID
- userId: 用户ID
- checkinDate: 签到日期
- creditEarned: 获得积分
- consecutiveDays: 连续天数
- createdAt: 创建时间

### API使用记录表 (ApiUsageRecord)
- id: 记录ID
- userId: 用户ID
- endpoint: API端点
- promptTokens: 提示词Token数
- completionTokens: 完成Token数
- totalTokens: 总Token数
- creditCost: 积分消耗
- status: 状态
- errorMessage: 错误信息
- createdAt: 创建时间

### 验证码表 (VerificationCode)
- id: 记录ID
- email: 邮箱
- code: 验证码
- expiresAt: 过期时间
- used: 是否已使用
- createdAt: 创建时间

## 积分系统

### 积分获取方式
- 新用户注册：1000积分
- 每日签到：10积分（基础）+ 连续签到奖励
- 连续签到奖励：每连续一天额外5积分
- 特殊奖励：
  - 连续7天：额外50积分
  - 连续15天：额外100积分
  - 连续30天：额外200积分

### 积分消费
- API调用根据不同端点消费不同积分
- 基于Token使用量的动态计费
- 失败请求根据错误类型决定是否扣费

## 安全特性

- JWT Token 认证
- 密码 bcrypt 加密
- API 限流保护
- CORS 跨域配置
- 请求验证和过滤
- 错误信息脱敏

## 监控和日志

- 全局异常处理
- API 调用日志
- 错误日志记录
- 性能监控（可扩展）

## 开发指南

### 添加新的 API 端点

1. 在对应模块的 controller 中添加路由
2. 在 service 中实现业务逻辑
3. 添加必要的 DTO 验证
4. 更新 API 文档

### 数据库迁移

```bash
# 修改 schema.prisma 后
npx prisma db push

# 或者生成迁移文件
npx prisma migrate dev --name migration_name
```

### 运行测试

```bash
# 单元测试
npm run test

# e2e测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
```

## 部署建议

### 生产环境配置

1. 使用强密钥和密码
2. 配置 HTTPS
3. 设置适当的限流规则
4. 配置日志轮转
5. 设置监控和告警
6. 定期备份数据库

### 性能优化

1. 使用 Redis 缓存
2. 数据库连接池配置
3. API 响应缓存
4. 静态资源 CDN
5. 负载均衡

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务是否启动
   - 验证连接字符串是否正确
   - 确认网络连接

2. **邮件发送失败**
   - 检查 Resend API 密钥
   - 验证发件人邮箱配置
   - 查看邮件服务商限制

3. **Dify API 调用失败**
   - 检查 Dify API 密钥
   - 验证 API 端点 URL
   - 查看网络连接和防火墙

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue 或联系维护者。
