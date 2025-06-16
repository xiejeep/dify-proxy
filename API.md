# Dify 代理服务 API 文档

## 1. 认证相关 API

### 1.1 发送验证码
- **路径**: `/api/auth/send-code`
- **方法**: `POST`
- **请求体**:
```json
{
  "email": "string" // 邮箱地址
}
```
- **响应**:
```json
{
  "message": "string" // 成功/失败消息
}
```

### 1.2 用户注册
- **路径**: `/api/auth/register`
- **方法**: `POST`
- **请求体**:
```json
{
  "email": "string",    // 邮箱地址
  "password": "string", // 密码
  "username": "string", // 用户名
  "code": "string"      // 6位验证码
}
```
- **响应**:
```json
{
  "access_token": "string", // JWT token
  "user": {
    "id": "string",
    "email": "string",
    "username": "string"
  }
}
```

### 1.3 用户登录
- **路径**: `/api/auth/login`
- **方法**: `POST`
- **请求体**:
```json
{
  "email": "string",    // 邮箱地址
  "password": "string"  // 密码
}
```
- **响应**:
```json
{
  "access_token": "string", // JWT token
  "user": {
    "id": "string",
    "email": "string",
    "username": "string"
  }
}
```

## 2. 积分相关 API

### 2.1 查询积分余额
- **路径**: `/api/credits/balance`
- **方法**: `GET`
- **请求头**: 
  - `Authorization: Bearer <token>`
- **响应**:
```json
{
  "credits": number // 积分余额
}
```

### 2.2 查询积分历史
- **路径**: `/api/credits/history`
- **方法**: `GET`
- **请求头**: 
  - `Authorization: Bearer <token>`
- **查询参数**:
  - `page`: number (默认: 1)
  - `limit`: number (默认: 20)
- **响应**:
```json
{
  "items": [
    {
      "id": "string",
      "amount": number,
      "type": "string",
      "reason": "string",
      "createdAt": "string"
    }
  ],
  "total": number,
  "page": number,
  "limit": number
}
```

## 3. 签到相关 API

### 3.1 每日签到
- **路径**: `/api/checkin`
- **方法**: `POST`
- **请求头**: 
  - `Authorization: Bearer <token>`
- **响应**:
```json
{
  "success": boolean,
  "creditEarned": number,
  "consecutiveDays": number,
  "totalCredits": number,
  "message": "string"
}
```

### 3.2 获取签到状态
- **路径**: `/api/checkin/status`
- **方法**: `GET`
- **请求头**: 
  - `Authorization: Bearer <token>`
- **响应**:
```json
{
  "hasCheckedIn": boolean,
  "consecutiveDays": number,
  "lastCheckinDate": "string"
}
```

### 3.3 获取签到历史
- **路径**: `/api/checkin/history`
- **方法**: `GET`
- **请求头**: 
  - `Authorization: Bearer <token>`
- **查询参数**:
  - `page`: number (默认: 1)
  - `limit`: number (默认: 20)
- **响应**:
```json
{
  "items": [
    {
      "id": "string",
      "checkinDate": "string",
      "creditEarned": number,
      "consecutiveDays": number
    }
  ],
  "total": number,
  "page": number,
  "limit": number
}
```

## 4. Dify 代理 API

### 4.1 发送聊天消息
- **路径**: `/api/dify/chat-messages`
- **方法**: `POST`
- **请求头**: 
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **请求体**:
```json
{
  "inputs": object,
  "query": "string",
  "response_mode": "streaming" | "blocking",
  "conversation_id": "string"
}
```
- **响应**:
```json
{
  "answer": "string",
  "conversation_id": "string",
  "task_id": "string"
}
```

### 4.2 发送完成消息
- **路径**: `/api/dify/completion-messages`
- **方法**: `POST`
- **请求头**: 
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **请求体**:
```json
{
  "inputs": object,
  "query": "string",
  "response_mode": "streaming" | "blocking"
}
```
- **响应**:
```json
{
  "answer": "string",
  "task_id": "string"
}
```

### 4.3 运行工作流
- **路径**: `/api/dify/workflows/run`
- **方法**: `POST`
- **请求头**: 
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **请求体**:
```json
{
  "inputs": object,
  "response_mode": "streaming" | "blocking"
}
```
- **响应**:
```json
{
  "workflow_run_id": "string",
  "task_id": "string",
  "data": object
}
```

### 4.4 音频转文本
- **路径**: `/api/dify/audio-to-text`
- **方法**: `POST`
- **请求头**: 
  - `Authorization: Bearer <token>`
  - `Content-Type: multipart/form-data`
- **请求体**:
```json
{
  "file": "File"
}
```
- **响应**:
```json
{
  "text": "string"
}
```

### 4.5 文本转语音
- **路径**: `/api/dify/text-to-audio`
- **方法**: `POST`
- **请求头**: 
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **请求体**:
```json
{
  "text": "string"
}
```
- **响应**:
```json
{
  "audio_url": "string" // 或 "audio_base64": "string"
}
```

### 4.6 通用代理请求
- **路径**: `/api/dify/proxy`
- **方法**: `POST`
- **请求头**: 
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **请求体**:
```json
{
  "endpoint": "string",
  "data": object,
  "headers": object
}
```
- **响应**:
```json
{
  "data": object
}
```

### 4.7 获取API使用统计
- **路径**: `/api/dify/usage-stats`
- **方法**: `GET`
- **请求头**: 
  - `Authorization: Bearer <token>`
- **查询参数**:
  - `days`: number (默认: 7)
- **响应**:
```json
{
  "totalRequests": number,
  "totalCreditsUsed": number,
  "dailyStats": [
    {
      "date": "string",
      "requests": number,
      "creditsUsed": number
    }
  ]
}
```

### 4.8 获取建议问题
- **路径**: `/api/dify/messages/{messageId}/suggested`
- **方法**: `GET`
- **请求头**: 
  - `Authorization: Bearer <token>`
- **响应**:
```json
{
  "data": [
    {
      "question": "string"
    }
  ]
}
```

### 4.9 获取会话列表
- **路径**: `/api/dify/conversations`
- **方法**: `GET`
- **请求头**: 
  - `Authorization: Bearer <token>`
- **响应**:
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "created_at": "string"
    }
  ]
}
```

### 4.10 获取会话消息
- **路径**: `/api/dify/conversations/{conversationId}/messages`
- **方法**: `GET`
- **请求头**: 
  - `Authorization: Bearer <token>`
- **响应**:
```json
{
  "data": [
    {
      "id": "string",
      "content": "string",
      "role": "string",
      "created_at": "string"
    }
  ]
}
```

### 4.11 删除会话
- **路径**: `/api/dify/conversations/{conversationId}`
- **方法**: `DELETE`
- **请求头**: 
  - `Authorization: Bearer <token>`
- **响应**:
```json
{
  "success": boolean,
  "message": "string"
}
```

### 4.12 重命名会话
- **路径**: `/api/dify/conversations/{conversationId}/name`
- **方法**: `POST`
- **请求头**: 
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **请求体**:
```json
{
  "name": "string"
}
```
- **响应**:
```json
{
  "success": boolean,
  "message": "string"
}
```

### 4.13 获取会话变量
- **路径**: `/api/dify/conversations/{conversationId}/variables`
- **方法**: `GET`
- **请求头**: 
  - `Authorization: Bearer <token>`
- **响应**:
```json
{
  "variables": object
}
```

### 4.14 消息反馈
- **路径**: `/api/dify/messages/{messageId}/feedbacks`
- **方法**: `POST`
- **请求头**: 
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **请求体**:
```json
{
  "rating": "like" | "dislike"
}
```
- **响应**:
```json
{
  "success": boolean,
  "message": "string"
}
```

### 4.15 获取消息反馈统计
- **路径**: `/api/dify/messages/{messageId}/feedback-stats`
- **方法**: `GET`
- **请求头**: 
  - `Authorization: Bearer <token>`
- **响应**:
```json
{
  "likes": number,
  "dislikes": number
}
```

### 4.16 停止响应
- **路径**: `/api/dify/chat-messages/{taskId}/stop`
- **方法**: `POST`
- **请求头**: 
  - `Authorization: Bearer <token>`
- **响应**:
```json
{
  "success": boolean,
  "message": "string"
}
```

### 4.17 获取应用 Meta 信息
- **路径**: `/api/dify/meta`
- **方法**: `GET`
- **请求头**: 
  - `Authorization: Bearer <token>`
- **响应**:
```json
{
  "app": {
    "id": "string",
    "name": "string",
    "description": "string"
  }
}
```

### 4.18 获取应用参数
- **路径**: `/api/dify/parameters`
- **方法**: `GET`
- **请求头**: 
  - `Authorization: Bearer <token>`
- **响应**:
```json
{
  "parameters": object
}
```

## 5. 用户相关 API

### 5.1 获取用户资料
- **路径**: `/api/user/profile`
- **方法**: `GET`
- **请求头**: 
  - `Authorization: Bearer <token>`
- **响应**:
```json
{
  "id": "string",
  "email": "string",
  "username": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### 5.2 获取用户统计
- **路径**: `/api/user/stats`
- **方法**: `GET`
- **请求头**: 
  - `Authorization: Bearer <token>`
- **响应**:
```json
{
  "totalCredits": number,
  "totalApiCalls": number,
  "totalCheckins": number,
  "consecutiveCheckins": number
}
```

## 6. 健康检查 API

### 6.1 服务状态检查
- **路径**: `/api/health`
- **方法**: `GET`
- **响应**:
```json
{
  "success": boolean,
  "status": "ok",
  "timestamp": "string",
  "uptime": number,
  "environment": "string"
}
```

### 6.2 根路径
- **路径**: `/`
- **方法**: `GET`
- **响应**:
```json
"Hello World!"
```

## 注意事项

1. 所有需要认证的接口都需要在请求头中携带 `Authorization: Bearer <token>`
2. 所有请求和响应都使用 JSON 格式
3. 时间戳格式为 ISO 8601 标准
4. 分页接口默认每页 20 条数据
5. 错误响应格式统一为：
```json
{
  "success": false,
  "statusCode": number,
  "error": "string",
  "message": "string",
  "timestamp": "string",
  "path": "string"
}
```