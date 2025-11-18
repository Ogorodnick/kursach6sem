const { UserCardProgress, Review, Card, Deck } = require('../models');

const reviewController = {
  // Получение карточек для повторения
  async getDueCards(req, res) {
    try {
      const { deckId } = req.query;
      const dueCards = await UserCardProgress.getDueCards(req.user.id, deckId);
      
      res.json({
        count: dueCards.length,
        cards: dueCards
      });
    } catch (error) {
      console.error('Get due cards error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Сохранение результата повторения
  async saveReview(req, res) {
    try {
      const { progressId, cardId, quality, reviewDuration = 0 } = req.body;

      // Проверяем владение прогрессом
      const progress = await UserCardProgress.findByUserAndCard(req.user.id, cardId);
      if (!progress || progress.id !== parseInt(progressId)) {
        return res.status(404).json({ error: 'Progress not found' });
      }

      // Сохраняем предыдущие значения для истории
      const previousState = {
        interval: progress.interval,
        ease_factor: progress.ease_factor,
        repetitions: progress.repetitions
      };

      // Обновляем прогресс
      const updatedProgress = await UserCardProgress.updateAfterReview(progressId, quality);

      // Сохраняем в историю
      await Review.create({
        user_id: req.user.id,
        card_id: cardId,
        deck_id: progress.deck_id,
        quality,
        review_duration: reviewDuration,
        previous_interval: previousState.interval,
        previous_ease_factor: previousState.ease_factor,
        previous_repetitions: previousState.repetitions
      });

      res.json({
        message: 'Review saved successfully',
        progress: updatedProgress,
        nextReviewDate: updatedProgress.next_review_date
      });
    } catch (error) {
      console.error('Save review error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Инициализация прогресса для новой карточки
  async initializeCardProgress(req, res) {
    try {
      const { cardId, deckId } = req.body;

      // Проверяем доступ к карточке
      const card = await Card.findById(cardId);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      const deck = await Deck.findById(deckId);
      if (!deck || (deck.user_id !== req.user.id && !deck.is_public)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const progress = await UserCardProgress.initializeProgress(req.user.id, cardId, deckId);

      res.json({
        message: 'Card progress initialized',
        progress
      });
    } catch (error) {
      console.error('Initialize progress error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Получение статистики колоды
  async getDeckStats(req, res) {
    try {
      const { deckId } = req.params;

      // Проверяем доступ к колоде
      const deck = await Deck.findById(deckId);
      if (!deck || (deck.user_id !== req.user.id && !deck.is_public)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const stats = await UserCardProgress.getDeckStats(req.user.id, deckId);

      res.json({ stats });
    } catch (error) {
      console.error('Get deck stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Получение общей статистики пользователя
  async getUserStats(req, res) {
    try {
      // Статистика по повторениям
      const reviewStats = await Review.getReviewStats(req.user.id, 30);
      
      // Общая статистика
      const totalQuery = `
        SELECT 
          COUNT(DISTINCT deck_id) as total_decks,
          COUNT(DISTINCT card_id) as total_cards_learned,
          SUM(total_reviews) as total_reviews,
          SUM(correct_reviews) as total_correct_reviews
        FROM user_card_progress 
        WHERE user_id = $1
      `;
      
      const pool = require('../config/database');
      const { rows } = await pool.query(totalQuery, [req.user.id]);
      const totalStats = rows[0];

      res.json({
        reviewStats,
        totalStats,
        streak: await calculateStreak(req.user.id) // Функция для расчета серии
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Вспомогательная функция для расчета серии дней
async function calculateStreak(userId) {
  const pool = require('../config/database');
  const query = `
    WITH daily_reviews AS (
      SELECT DISTINCT DATE(reviewed_at) as review_date
      FROM reviews 
      WHERE user_id = $1
      ORDER BY review_date DESC
    ),
    streaks AS (
      SELECT 
        review_date,
        review_date - INTERVAL '1 day' * 
        ROW_NUMBER() OVER (ORDER BY review_date DESC) as streak_group
      FROM daily_reviews
    )
    SELECT COUNT(*) as current_streak
    FROM streaks
    WHERE streak_group = (SELECT streak_group FROM streaks LIMIT 1)
  `;
  
  const { rows } = await pool.query(query, [userId]);
  return rows[0]?.current_streak || 0;
}

module.exports = reviewController;