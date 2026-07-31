const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { requestLogger, logger } = require('./middleware/loggerMiddleware');

dotenv.config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/authRoutes');
const qrRoutes = require('./routes/qrRoutes');
const alertRoutes = require('./routes/alertRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || 'https://rapiqr.worthitellp.workers.dev';

// Enable CORS & Request Parsing
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach Live Console Logger Middleware
app.use(requestLogger);

// API Health Check Endpoint — also acts as the frontend connection detector
app.get('/api/health', (req, res) => {
  const origin = req.headers.origin || 'NO-ORIGIN';
  const isFrontend = origin.includes('worthitellp.workers.dev') || origin.includes(FRONTEND_ORIGIN);
  logger.success('HEALTH', `Health check ping received from: ${origin}`);
  if (isFrontend) {
    logger.event('FRONTEND_CONNECTED', '🎉', `Frontend successfully connected to backend! Origin: ${origin}`);
  } else {
    logger.info('HEALTH', `Non-frontend ping (${origin}) — verifying external connectivity`);
  }
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'NamoQR Secure Backend Engine',
    frontendUrl: FRONTEND_ORIGIN
  });
});

// Mount MVC Route Modules
app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/alerts', alertRoutes);

// Global 404 Route Handler
app.use((req, res) => {
  logger.warn('404', `Route ${req.method} ${req.url} not found`);
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.url} not found` });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error('SERVER_ERROR', 'Global error caught in middleware', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log('\n==================================================');
  logger.event('SERVER', '🚀', `NamoQR Backend Server running securely on port ${PORT}`);
  logger.event('SERVER', '🌐', `Expected Frontend Origin: ${FRONTEND_ORIGIN}`);
  logger.event('SERVER', '📡', `Health Check URL: ${process.env.APP_URL || ''}/api/health (or http://localhost:${PORT}/api/health)`);
  logger.event('SERVER', '📊', 'Live Console Request & Event Logging ENABLED');
  logger.event('SERVER', '🔍', 'Waiting for frontend connection... a 🎉 FRONTEND_CONNECTED log will appear when the site reaches this API');
  console.log('==================================================\n');
});
