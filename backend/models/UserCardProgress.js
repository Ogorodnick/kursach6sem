const pool = require('../config/database');

class UserCardProgress {
  // Инициализация прогресса для карточки
  static async initializeProgress(userId, cardId, deckId) {
    const query = `
      INSERT INTO user_card_progress 
        (user_id, card_id, deck_id, next_review_date)
      VALUES ($1, $2, $3, CURRENT_DATE)
      ON CONFLICT (user_id, card_id) DO NOTHING
      RETURNING *
    `;
    
    const values = [userId, cardId, deckId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // Получение прогресса по карточке
  static async findByUserAndCard(userId, cardId) {
    const query = `
      SELECT * FROM user_card_progress 
      WHERE user_id = $1 AND card_id = $2
    `;
    const { rows } = await pool.query(query, [userId, cardId]);
    return rows[0];
  }

  // Получение карточек для повторения на сегодня
  static async getDueCards(userId, deckId = null) {
    let query = `
      SELECT ucp.*, c.question, c.answer, c.question_type, c.answer_type,
             d.title as deck_title
      FROM user_card_progress ucp
      JOIN cards c ON ucp.card_id = c.id
      JOIN decks d ON ucp.deck_id = d.id
      WHERE ucp.user_id = $1 AND ucp.next_review_date <= CURRENT_DATE
    `;
    
    const values = [userId];
    
    if (deckId) {
      query += ' AND ucp.deck_id = $2';
      values.push(deckId);
    }
    
    query += ' ORDER BY ucp.next_review_date, ucp.interval';
    
    const { rows } = await pool.query(query, values);
    return rows;
  }

  // Обновление прогресса после повторения (алгоритм SM-2)
  static async updateAfterReview(progressId, quality) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Получаем текущий прогресс
      const progressQuery = 'SELECT * FROM user_card_progress WHERE id = $1';
      const { rows } = await client.query(progressQuery, [progressId]);
      const progress = rows[0];
      
      if (!progress) {
        throw new Error('Progress not found');
      }
      
      let { interval, repetitions, ease_factor } = progress;
      
      // Алгоритм SM-2
      if (quality >= 3) {
        if (repetitions === 0) {
          interval = 1;
        } else if (repetitions === 1) {
          interval = 6;
        } else {
          interval = Math.round(interval * ease_factor);
        }
        repetitions += 1;
      } else {
        repetitions = 0;
        interval = 1;
      }
      
      // Обновляем ease factor (ограничиваем диапазоном 1.3-2.5)
      ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      ease_factor = Math.max(1.3, Math.min(2.5, ease_factor));
      
      // Рассчитываем дату следующего повторения
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);
      
      // Обновляем прогресс
      const updateQuery = `
        UPDATE user_card_progress 
        SET interval = $1, repetitions = $2, ease_factor = $3,
            next_review_date = $4, last_reviewed = CURRENT_TIMESTAMP,
            total_reviews = total_reviews + 1,
            correct_reviews = correct_reviews + $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
      `;
      
      const isCorrect = quality >= 3 ? 1 : 0;
      const updateValues = [interval, repetitions, ease_factor, nextReviewDate, isCorrect, progressId];
      const { rows: updatedRows } = await client.query(updateQuery, updateValues);
      
      await client.query('COMMIT');
      return updatedRows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Получение статистики по колоде
  static async getDeckStats(userId, deckId) {
    const query = `
      SELECT 
        COUNT(*) as total_cards,
        COUNT(ucp.id) as learned_cards,
        SUM(CASE WHEN ucp.next_review_date <= CURRENT_DATE THEN 1 ELSE 0 END) as due_cards,
        AVG(ucp.ease_factor) as average_ease,
        SUM(ucp.total_reviews) as total_reviews,
        SUM(ucp.correct_reviews) as correct_reviews
      FROM cards c
      LEFT JOIN user_card_progress ucp ON c.id = ucp.card_id AND ucp.user_id = $1
      WHERE c.deck_id = $2
    `;
    
    const { rows } = await pool.query(query, [userId, deckId]);
    return rows[0];
  }
}

module.exports = UserCardProgress;