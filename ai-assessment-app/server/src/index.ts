/**
 * Main server entry point
 * Configures and starts the Express application
 * 
 * Requirements:
 * - 1.1: Express.js backend with TypeScript
 * - 1.2: Connect to Railway database using environment variables
 * - 1.3: Serve static files from dist directory
 * - 1.4: Implement CORS middleware
 * - 1.5: Implement request body parsing middleware
 * - 1.6: Listen on PORT from environment variable
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import assessmentRoutes from './routes/assessments.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestSizeLimiter } from './middleware/validator.js';
import { logger } from './utils/logger.js';
import { checkDatabaseHealth, closeDatabasePool } from './config/database.js';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create and configure Express application
 */
function createApp(): Application {
  const app = express();

  // Security middleware - helmet sets various HTTP headers for security
  // Validates: Requirement 1.1
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for now to allow frontend assets
    crossOriginEmbedderPolicy: false, // Allow embedding for development
  }));

  // CORS middleware - allow cross-origin requests from frontend
  // Validates: Requirement 1.4
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*', // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsing middleware - parse JSON request bodies
  // Validates: Requirement 1.5
  app.use(requestSizeLimiter);

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    
    // Log after response is sent
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.request({
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration,
        ip: req.ip,
      });
    });
    
    next();
  });

  // Health check endpoint
  app.get('/health', async (_req, res) => {
    const dbHealthy = await checkDatabaseHealth();
    
    if (dbHealthy) {
      res.status(200).json({
        success: true,
        status: 'healthy',
        database: 'connected',
      });
    } else {
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        database: 'disconnected',
      });
    }
  });

  // Mount API routes
  // Validates: Requirements 2.1, 3.1, 4.1, 5.1
  app.use('/api', assessmentRoutes);

  // Serve static files from frontend dist directory
  // Validates: Requirement 1.3
  const distPath = path.join(__dirname, '../../dist');
  app.use(express.static(distPath));

  // Serve index.html for all non-API routes (SPA fallback)
  // This allows client-side routing to work properly
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        next(err);
      }
    });
  });

  // 404 handler for API routes
  app.use('/api/*', notFoundHandler);

  // Global error handler - must be last
  // Validates: Requirements 11.1, 11.2, 11.5
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Check database connection before starting server
    // Validates: Requirement 1.2
    logger.info('检查数据库连接...');
    const dbHealthy = await checkDatabaseHealth();
    
    if (!dbHealthy) {
      logger.error('数据库连接失败，无法启动服务器');
      process.exit(1);
    }
    
    logger.info('数据库连接成功');

    // Create Express app
    const app = createApp();

    // Get port from environment variable or use default
    // Validates: Requirement 1.6
    const PORT = process.env.PORT || 3000;
    const NODE_ENV = process.env.NODE_ENV || 'development';

    // Start listening
    const server = app.listen(PORT, () => {
      logger.info(`服务器启动成功`, {
        port: PORT,
        environment: NODE_ENV,
        nodeVersion: process.version,
      });
      
      if (NODE_ENV === 'development') {
        logger.info(`本地访问地址: http://localhost:${PORT}`);
        logger.info(`API 端点: http://localhost:${PORT}/api`);
        logger.info(`健康检查: http://localhost:${PORT}/health`);
      }
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`收到 ${signal} 信号，开始优雅关闭...`);
      
      server.close(async () => {
        logger.info('HTTP 服务器已关闭');
        
        try {
          await closeDatabasePool();
          logger.info('数据库连接池已关闭');
          process.exit(0);
        } catch (err) {
          logger.error('关闭数据库连接池时出错', { 
            error: err instanceof Error ? err.message : String(err) 
          });
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('强制关闭服务器（超时）');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常', {
        error: error.message,
        stack: error.stack,
      });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('未处理的 Promise 拒绝', {
        error: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
      });
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('启动服务器失败', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Start the server
startServer();

// Export for testing purposes
export { createApp };
