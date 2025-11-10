import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { config } from './config';
import authorizeRoutes from './routes/authorize.routes';
import tokenRoutes from './routes/token.routes';
import userinfoRoutes from './routes/userinfo.routes';

dotenv.config();

const app = express();

// Configure EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/oauth', authorizeRoutes);
app.use('/oauth', tokenRoutes);
app.use('/oauth', userinfoRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const port = config.port;
app.listen(port, () => {
  console.log(`Fake OAuth server running on port ${port}`);
  console.log('Available OAuth providers:');
  Object.keys(config.providers).forEach(provider => {
    console.log(`- ${provider}`);
  });
});
