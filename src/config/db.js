const { Pool } = require('pg');
require('./env');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não definida. Copie o .env.example para .env e preencha.');
}

module.exports = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});
