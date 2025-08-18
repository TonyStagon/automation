import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDatabase } from './config/database';
import { schedulerService } from '../services/SchedulerService';
import { browserAutomation } from '../services/BrowserAutomation';
import { apiLimiter } from './middleware/rateLimiter';
import { responseHelpers } from './middleware/responseHelpers';
import { logger } from '../utils/logger';

// Import routes
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import automationRoutes from './routes/automation';
import dashboardRoutes from './routes/dashboard';
import aiRoutes from './routes/ai';

// Load environment variables
dotenv.config();

// Create required directories
const uploadsDir = path.join(process.cwd(), 'uploads');
const logsDir = path.join(process.cwd(), 'logs');

[uploadsDir, logsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created directory: ${dir}`);
  }
});

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
    scheduler: schedulerService.getStatus()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

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
    // Connect to database
    try {
      await connectDatabase();
      logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.warn('⚠️  Database connection failed, continuing without database:', error);
    }

    // Start scheduler service
    try {
      schedulerService.start();
      logger.info('✅ Scheduler service started');
    } catch (error) {
      logger.warn('⚠️  Scheduler service failed to start:', error);
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📁 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔍 Health check: http://localhost:${PORT}/health`);
      logger.info(`🤖 Social media automation server ready!`);
      
      // Log available routes
      logger.info('📍 Available routes:');
      logger.info('   POST /api/auth/register - User registration');
      logger.info('   POST /api/auth/login - User login');
      logger.info('   POST /api/posts/facebook - Facebook posting');
      logger.info('   GET  /api/dashboard/stats - Dashboard statistics');
      logger.info('   GET  /api/automation/platforms - Available platforms');
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use`);
        logger.info('💡 Try using a different port by setting PORT environment variable');
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
          logger.info('✅ HTTP server closed');
        });

        // Stop scheduler
        try {
          schedulerService.stop();
          logger.info('✅ Scheduler stopped');
        } catch (error) {
          logger.warn('⚠️  Error stopping scheduler:', error);
        }

        // Close browser instances
        try {
          await browserAutomation.closeBrowsers();
          logger.info('✅ Browser instances closed');
        } catch (error) {
          logger.warn('⚠️  Error closing browsers:', error);
        }

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