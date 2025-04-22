export const settings = {
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    accessTokenExpiry: Number(process.env.ACCESS_TOKEN_EXPIRY) || 15, // in seconds
    refreshTokenExpiry: Number(process.env.REFRESH_TOKEN_EXPIRY) || 7 * 24 * 60 * 60, // 7 days in seconds
  },
  server: {
    port: Number(process.env.PORT) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  cors: {
    allowedOrigins: ['http://localhost:3000', 'http://localhost:5173'] as string[],
  },
} as const;
