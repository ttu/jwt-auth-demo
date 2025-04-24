import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import oauthRoutes from './routes/oauth.routes';
import userRoutes from './routes/user.routes';
import { settings } from './config/settings';

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: settings.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id', 'user-agent', 'sec-ch-ua-platform'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Other middleware
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(settings.server.port, () => {
  console.log(`Server running on port ${settings.server.port}`);
  console.log(`Environment: ${settings.server.nodeEnv}`);
  console.log(`Access token expiry: ${settings.jwt.accessTokenExpiry} seconds`);
  console.log(`Refresh token expiry: ${settings.jwt.refreshTokenExpiry} seconds`);
});

export default app;
