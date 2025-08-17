import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { connectDatabase } from './config/database';
import { schedulerService } from '../services/SchedulerService';
import { browserAutomation } from '../services/BrowserAutomation';
import { apiLimiter } from './middleware/rateLimiter';
import { responseHelpers } from './middleware/responseHelpers';
import { logger } from '../utils/logger';

// Import routes
import postRoutes from './routes/posts';

// Load environment variables
dotenv.config();

// Create uploads directory if it doesn't exist
import fs from 'fs';
const uploadsDir = path.join(process.cwd(), 'uploads');
const logsDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Rate limiting
app.use('/api/', apiLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Response helpers middleware
app.use(responseHelpers);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use('/api/posts', postRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database (optional for basic automation)
    try {
      await connectDatabase();
    } catch (error) {
      logger.warn('Database connection failed, continuing without database:', error);
    }

    // Start scheduler service (optional)
    try {
      schedulerService.start();
    } catch (error) {
      logger.warn('Scheduler service failed to start, continuing without scheduler:', error);
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📁 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔍 Health check: http://localhost:${PORT}/health`);
      logger.info(`🤖 Facebook automation ready!`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use`);
      } else {
        logger.error('❌ Server error:', error);
      }
      process.exit(1);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      try {
        // Stop accepting new requests
        server.close(() => {
          logger.info('HTTP server closed');
        });

        // Stop scheduler (if running)
        try {
          schedulerService.stop();
        } catch (error) {
          logger.warn('Error stopping scheduler:', error);
        }

        // Close browser instances
        await browserAutomation.closeBrowsers();

        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;