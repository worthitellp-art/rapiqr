const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { requestLogger, logger } = require('./middleware/loggerMiddleware');

// Single project-wide env file lives at the repo root (shared with Vite) —
// see .env.example for the documented template.
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const authRoutes = require('./routes/authRoutes');
const qrRoutes = require('./routes/qrRoutes');
const alertRoutes = require('./routes/alertRoutes');
const logRoutes = require('./routes/logRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const productRoutes = require('./routes/productRoutes');
const twilioRoutes = require('./routes/twilioRoutes');
const exotelRoutes = require('./routes/exotelRoutes');
const cloudshopeRoutes = require('./routes/cloudshopeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const distributorRoutes = require('./routes/distributorRoutes');
const orderRoutes = require('./routes/orderRoutes');
const shopProductRoutes = require('./routes/shopProductRoutes');
const shiprocketRoutes = require('./routes/shiprocketRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || 'https://rapiqr.worthitellp.workers.dev';

// Enable CORS & Request Parsing — only the configured frontend (plus local dev) may send credentials
const ALLOWED_ORIGINS = [FRONTEND_ORIGIN, 'http://localhost:3000', 'http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach Live Console Logger Middleware
app.use(requestLogger);

// API Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'RapiQR Secure Backend Engine',
    frontendUrl: FRONTEND_ORIGIN
  });
});

// Mount MVC Route Modules
app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/twilio', twilioRoutes);
app.use('/api/exotel', exotelRoutes);
app.use('/api/cloudshope', cloudshopeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/distributors', distributorRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shop-products', shopProductRoutes);
app.use('/api/shiprocket', shiprocketRoutes);


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
  logger.event('SERVER', '🚀', `RapiQR Backend Server running securely on port ${PORT}`);
  logger.event('SERVER', '🌐', `Expected Frontend Origin: ${FRONTEND_ORIGIN}`);
  logger.event('SERVER', '📡', `Health Check URL: http://localhost:${PORT}/api/health${process.env.APP_URL ? ` (production: ${process.env.APP_URL}/api/health)` : ''}`);
  logger.event('SERVER', '📊', 'Live Console Request & Event Logging ENABLED');
  logger.event('SERVER', '🔍', 'Waiting for frontend connection... a 🎉 FRONTEND_CONNECTED log will appear when the site reaches this API');
  console.log('==================================================\n');
});
