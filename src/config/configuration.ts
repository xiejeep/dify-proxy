export default () => ({
  port: parseInt(process.env.PORT || '3000', 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10) || 0,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  dify: {
    apiUrl: process.env.DIFY_API_URL || 'https://api.dify.ai/v1',
    apiKey: process.env.DIFY_API_KEY,
    timeout: parseInt(process.env.DIFY_TIMEOUT || '30000', 10) || 30000,
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.FROM_EMAIL,
  },
  credits: {
    newUserBonus: parseInt(process.env.NEW_USER_BONUS || '1000', 10) || 1000,
    dailyCheckinBase: parseInt(process.env.DAILY_CHECKIN_BASE || '10', 10) || 10,
    dailyCheckinBonus: parseInt(process.env.DAILY_CHECKIN_BONUS || '5', 10) || 5,
    maxConsecutiveDays: parseInt(process.env.MAX_CONSECUTIVE_DAYS || '30', 10) || 30,
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10) || 12,
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10) || 60,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10) || 100,
  },
});