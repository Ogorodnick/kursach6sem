// routes/test.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const rateLimit = require('express-rate-limit');

router.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT version()');
    res.json({ 
      status: '✅ Database connected successfully',
      postgresVersion: result.rows[0].version 
    });
  } catch (error) {
    res.status(500).json({ 
      status: '❌ Database connection failed',
      error: error.message 
    });
  }
});

// routes/test.js - добавьте этот маршрут
router.get('/db-tables', async (req, res) => {
  try {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const result = await pool.query(query);
    
    const expectedTables = [
      'users', 'decks', 'cards', 'user_card_progress', 
      'reviews', 'tags', 'deck_tags', 'user_decks'
    ];
    
    const existingTables = result.rows.map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    res.json({
      existingTables,
      missingTables,
      allTablesExist: missingTables.length === 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// routes/test.js


// Добавьте в routes/test.js
router.get('/error-handling-test', asyncHandler(async (req, res) => {
  // Тест 1: Синхронная ошибка
  if (req.query.test === 'sync') {
    throw new Error('Test sync error handling');
  }
  
  // Тест 2: Асинхронная ошибка
  if (req.query.test === 'async') {
    const result = await pool.query('SELECT * FROM non_existent_table');
    return res.json(result.rows);
  }
  
  // Тест 3: Валидация параметров
  if (req.query.test === 'validation') {
    if (!req.query.id) {
      return res.status(400).json({ 
        error: 'ID parameter is required',
        code: 'VALIDATION_ERROR'
      });
    }
    res.json({ success: true, id: req.query.id });
  }
  
  res.json({ message: 'Use ?test=sync|async|validation to test error handling' });
}));

const testLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минута для тестов
  max: 3, // максимум 3 запроса в минуту
  message: { 
    error: 'Too many test requests, please try again in a minute',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/rate-limit-test', testLimiter, (req, res) => {
  res.json({ 
    message: 'Rate limit test successful',
    requestsRemaining: req.rateLimit.remaining,
    limitReset: new Date(req.rateLimit.resetTime).toISOString(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;