const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/authRoutes');
const qrRoutes = require('./routes/qrRoutes');
const alertRoutes = require('./routes/alertRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & Request Parsing
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'NamoQR Secure Backend Engine'
  });
});

// Mount MVC Route Modules
app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/alerts', alertRoutes);

// Global 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.url} not found` });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('💥 Server Global Error:', err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 NamoQR Backend Server running securely on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
});
