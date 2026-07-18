const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const documentRoutes = require('./src/routes/documents');
const adminRoutes = require('./src/routes/admin');
const aiDetectRoutes = require('./src/routes/ai-detect');
const { generalLimiter, authLimiter, uploadLimiter, securityHeaders, detectSuspicious } = require('./src/middleware/security');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(securityHeaders);
app.use(cors({
  origin: function(origin, callback) {
    // Origin yo'q bo'lsa (curl, mobile app) yoki ruxsat berilgan bo'lsa
    const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, ''); // oxiridagi / ni olib tashlash
    const allowedOrigins = [
      frontendUrl,
      'https://antiplagiatuz.netlify.app',
      'http://localhost:3000',
      'http://localhost:5173'
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // development da hammaga ruxsat
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(detectSuspicious);

// Rate Limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/documents/upload', uploadLimiter);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req.method, req.originalUrl, res.statusCode, duration);
  });
  next();
});

// Statik fayllar
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai-detect', aiDetectRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Antiplagiat API ishlayapti',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route topilmadi.' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Server xatosi', { error: err.message, stack: err.stack, path: req.path });

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Fayl hajmi juda katta. Maksimum 10MB.' });
  }

  res.status(500).json({ error: 'Ichki server xatosi.' });
});

app.listen(PORT, () => {
  logger.info(`Antiplagiat server ${PORT}-portda ishlayapti`);
  logger.info(`API: http://localhost:${PORT}/api`);
});

module.exports = app;
