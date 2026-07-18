const { Pool } = require('pg');
require('dotenv').config();

// Render DATABASE_URL ni qo'llab-quvvatlash
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

pool.on('connect', () => {
  console.log('PostgreSQL bazasiga ulandi');
});

pool.on('error', (err) => {
  console.error('PostgreSQL xatosi:', err);
});

module.exports = pool;
