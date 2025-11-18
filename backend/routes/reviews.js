const express = require('express');
const { body } = require('express-validator');
const reviewController = require('../controllers/reviewController');
const { auth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Валидации
const saveReviewValidation = [
  body('progressId').isInt(),
  body('cardId').isInt(),
  body('quality').isInt({ min: 0, max: 5 }),
  body('reviewDuration').optional().isInt({ min: 0 })
];

const initProgressValidation = [
  body('cardId').isInt(),
  body('deckId').isInt()
];

// Маршруты
router.get('/due-cards', auth, reviewController.getDueCards);
router.post('/save', auth, saveReviewValidation, handleValidationErrors, reviewController.saveReview);
router.post('/init-progress', auth, initProgressValidation, handleValidationErrors, reviewController.initializeCardProgress);
router.get('/deck-stats/:deckId', auth, reviewController.getDeckStats);
router.get('/user-stats', auth, reviewController.getUserStats);

module.exports = router;