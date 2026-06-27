import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';

// Load Environment Variables
dotenv.config();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173', // Default Vite port
    credentials: true,
  })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple mock for cookie parser (handles req.cookies)
app.use((req: any, res, next) => {
  const cookieHeader = req.headers.cookie || '';
  req.cookies = cookieHeader.split(';').reduce((cookies: any, cookie: string) => {
    const [name, val] = cookie.split('=').map((c) => c.trim());
    if (name) cookies[name] = val;
    return cookies;
  }, {});
  next();
});

// Logger Middleware
app.use(requestLogger);

// REST API Router
app.use('/api', apiRouter);

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'NxtWave LMS & SMS API Service is running!' });
});

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use(errorHandler);

export default app;
