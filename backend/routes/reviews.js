const express = require('express');
const router = express.Router();
const UserCardProgress = require('../models/UserCardProgress');
const { auth } = require('../middleware/auth');

// Получить карточки для повторения
router.get('/due-cards', auth, async (req, res) => {
  try {
    const { deckId } = req.query;
    
    if (!deckId) {
      return res.status(400).json({
        success: false,
        message: 'ID колоды обязателен'
      });
    }

    console.log('=== DEBUG: due-cards called ===');
    console.log('User ID:', req.user.id, 'Deck ID:', deckId);

    // Сначала пытаемся получить карточки для повторения
    let dueCards = await UserCardProgress.getDueCards(req.user.id, deckId);
    
    // Если карточек нет, инициализируем прогресс для колоды
    if (dueCards.length === 0) {
      console.log('No due cards found, initializing deck progress...');
      
      try {
        await UserCardProgress.initializeDeckProgress(req.user.id, deckId);
        console.log('Deck progress initialized, fetching due cards again...');
        
        // Пробуем снова получить карточки
        dueCards = await UserCardProgress.getDueCards(req.user.id, deckId);
        console.log('Due cards after initialization:', dueCards.length);
      } catch (initError) {
        console.error('Error initializing deck progress:', initError);
        return res.status(500).json({
          success: false,
          message: 'Ошибка при инициализации прогресса колоды: ' + initError.message
        });
      }
    }

    res.json({
      success: true,
      cards: dueCards,
      count: dueCards.length
    });
  } catch (error) {
    console.error('Error fetching due cards:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке карточек для повторения: ' + error.message
    });
  }
});

// Сохранить результат повторения
// Сохранить результат повторения
router.post('/save', auth, async (req, res) => {
  try {
    let { cardId, quality, reviewDuration } = req.body;
    
    console.log('=== DEBUG: save review ===');
    console.log('Raw request body:', req.body);
    
    // Преобразуем параметры в числа для безопасности
    cardId = parseInt(cardId);
    quality = parseInt(quality);
    reviewDuration = parseInt(reviewDuration) || 0;
    
    // Проверяем, что преобразование прошло успешно
    if (isNaN(cardId) || isNaN(quality)) {
      console.error('Invalid parameters:', { cardId, quality, reviewDuration });
      return res.status(400).json({
        success: false,
        message: 'Неверные параметры: cardId и quality должны быть числами'
      });
    }

    console.log('Parsed values:', { cardId, quality, reviewDuration, userId: req.user.id });

    // Находим прогресс по карточке
    const progress = await UserCardProgress.findByUserAndCard(req.user.id, cardId);
    
    if (!progress) {
      console.log('Progress not found for card:', cardId);
      return res.status(404).json({
        success: false,
        message: 'Прогресс по карточке не найден'
      });
    }

    console.log('Found progress:', progress.id);
    
    // Обновляем прогресс
    const updatedProgress = await UserCardProgress.updateAfterReview(
      progress.id, 
      quality, 
      reviewDuration
    );
    
    res.json({
      success: true,
      progress: updatedProgress,
      message: 'Прогресс сохранен'
    });
    
  } catch (error) {
    console.error('Error saving review:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при сохранении прогресса: ' + error.message
    });
  }
});
// Получить статистику по колоде
router.get('/deck-stats/:deckId', auth, async (req, res) => {
  try {
    const { deckId } = req.params;
    const stats = await UserCardProgress.getDeckStats(req.user.id, deckId);
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching deck stats:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке статистики: ' + error.message
    });
  }
});

// Добавим тестовый эндпоинт для проверки
router.get('/test', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Reviews router is working!',
    user: req.user.id
  });
});

module.exports = router;