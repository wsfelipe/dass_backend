const { Router } = require('express');
const db = require('../config/db');

const router = Router();

// Também serve pra "acordar" o banco quando ele está em plano que hiberna
router.get('/', async (req, res) => {
  try {
    await db.query('select 1');
    res.json({ status: 'ok', database: 'up' });
  } catch (err) {
    console.error('Health check falhou:', err.message);
    res.status(503).json({ status: 'error', database: 'down' });
  }
});

module.exports = router;
