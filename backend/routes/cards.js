const express = require('express');
const { body } = require('express-validator');
const cardController = require('../controllers/cardController');
const { auth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Валидации
const createCardValidation = [
  body('deck_id').isInt(),
  body('question').isLength({ min: 1 }).trim(),
  body('answer').isLength({ min: 1 }).trim(),
  body('question_type').optional().isIn(['text', 'image', 'code']),
  body('answer_type').optional().isIn(['text', 'image', 'code'])
];

const updateCardValidation = [
  body('question').optional().isLength({ min: 1 }).trim(),
  body('answer').optional().isLength({ min: 1 }).trim(),
  body('question_type').optional().isIn(['text', 'image', 'code']),
  body('answer_type').optional().isIn(['text', 'image', 'code'])
];

const bulkCreateValidation = [
  body('deck_id').isInt(),
  body('cards').isArray({ min: 1 }),
  body('cards.*.question').isLength({ min: 1 }).trim(),
  body('cards.*.answer').isLength({ min: 1 }).trim()
];

// Маршруты
router.post('/', auth, createCardValidation, handleValidationErrors, cardController.createCard);
router.post('/bulk', auth, bulkCreateValidation, handleValidationErrors, cardController.bulkCreateCards);
router.get('/deck/:deckId', auth, cardController.getDeckCards);
router.put('/:id', auth, updateCardValidation, handleValidationErrors, cardController.updateCard);
router.delete('/:id', auth, cardController.deleteCard);

module.exports = router;