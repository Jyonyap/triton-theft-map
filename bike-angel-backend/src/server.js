import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import reportCleanupService from './services/reportCleanupService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://localhost:5173',
    'https://localhost:5174',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
import { requestLogger } from './middleware/requestLogger.js';
app.use(requestLogger);

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bike Angel API is running' });
});

app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const { query } = await import('./config/database.js');
    await query('SELECT 1');
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      storage: process.env.STORAGE_SERVICE || 'configured',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Import routes
import uploadExampleRoutes from './routes/uploadExample.js';
import authRoutes from './routes/authRoutes.js';
import zoneRoutes from './routes/zoneRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import monitoringRoutes from './routes/monitoringRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import adminZoneRoutes from './routes/adminZoneRoutes.js';

// API routes
app.use('/api/upload', uploadExampleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/admin', adminZoneRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.name || 'Error',
    message: err.message || 'Internal server error',
    statusCode: err.statusCode || 500
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
    statusCode: 404
  });
});

// Start server (only in non-Vercel environments)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Bike Angel API server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5174'}`);
    
    // Start cleanup service for expired parking reports
    reportCleanupService.start();
  });
}

export default app;
