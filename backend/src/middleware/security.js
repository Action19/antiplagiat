const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Juda ko\'p so\'rov. 15 daqiqadan so\'ng qayta urinib ko\'ring.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Juda ko\'p kirish urinishlari. 15 daqiqadan so\'ng urinib ko\'ring.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Fayl yuklash limiti tugadi. 1 soatdan so\'ng urinib ko\'ring.' },
  standardHeaders: true,
  legacyHeaders: false
});

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
};

const detectSuspicious = (req, res, next) => {
  const suspicious = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b.*\b(FROM|INTO|TABLE|WHERE)\b)/i,
    /<script[\s>]/i,
    /javascript:/i,
    /eval\s*\(/i
  ];

  const checkValue = (value) => {
    if (typeof value !== 'string') return false;
    return suspicious.some(pattern => pattern.test(value));
  };

  for (const [key, value] of Object.entries(req.query || {})) {
    if (checkValue(value)) {
      return res.status(400).json({ error: 'Noto\'g\'ri so\'rov parametri.' });
    }
  }

  if (req.body && typeof req.body === 'object') {
    const bodyStr = JSON.stringify(req.body);
    if (suspicious.some(pattern => pattern.test(bodyStr))) {
      return res.status(400).json({ error: 'Noto\'g\'ri so\'rov.' });
    }
  }

  next();
};

module.exports = { generalLimiter, authLimiter, uploadLimiter, securityHeaders, detectSuspicious };
