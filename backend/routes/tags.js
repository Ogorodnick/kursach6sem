const express = require('express');
const { body } = require('express-validator');
const tagController = require('../controllers/tagController');
const { auth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Валидации
const createTagValidation = [
  body('name').isLength({ min: 1, max: 50 }).trim(),
  body('color').optional().isHexColor()
];

// Маршруты
router.post('/', auth, createTagValidation, handleValidationErrors, tagController.createTag);
router.get('/', auth, tagController.getUserTags);
router.get('/search', auth, tagController.searchTags);
router.get('/deck/:deckId', auth, tagController.getDeckTags);
router.post('/deck/:deckId', auth, tagController.addTagToDeck);
router.delete('/deck/:deckId/:tagId', auth, tagController.removeTagFromDeck);

module.exports = router;