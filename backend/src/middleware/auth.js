const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token topilmadi. Iltimos, tizimga kiring.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query('SELECT id, email, full_name, role, is_active FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Foydalanuvchi topilmadi.' });
    }
    if (!result.rows[0].is_active) {
      return res.status(403).json({ error: 'Hisobingiz bloklangan.' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token muddati tugagan. Qaytadan kiring.' });
    }
    return res.status(401).json({ error: 'Noto\'g\'ri token.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bu amalni faqat admin bajara oladi.' });
  }
  next();
};

module.exports = { authenticate, requireAdmin };
