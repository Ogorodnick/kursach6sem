// routes/decks.js
const express = require('express');
const { body } = require('express-validator');
const deckController = require('../controllers/deckController');
const { auth, optionalAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Валидации
const createDeckValidation = [
  body('title').isLength({ min: 1, max: 200 }).trim(),
  body('description').optional().trim(),
  body('is_public').optional().isBoolean()
];

const updateDeckValidation = [
  body('title').optional().isLength({ min: 1, max: 200 }).trim(),
  body('description').optional().trim(),
  body('is_public').optional().isBoolean()
];

// Все маршруты требуют аутентификации, кроме получения публичных колод
router.post('/', auth, createDeckValidation, handleValidationErrors, deckController.createDeck);
router.get('/my', auth, deckController.getUserDecks);
router.get('/public', optionalAuth, deckController.getPublicDecks);
router.get('/:id', optionalAuth, deckController.getDeck);
router.put('/:id', auth, createDeckValidation, handleValidationErrors, deckController.updateDeck);
router.patch('/:id', auth, updateDeckValidation, handleValidationErrors, deckController.updateDeck); // Добавляем PATCH
router.delete('/:id', auth, deckController.deleteDeck);
router.post('/:id/copy', auth, deckController.copyDeck);

module.exports = router;