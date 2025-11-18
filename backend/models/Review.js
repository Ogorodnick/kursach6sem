const pool = require('../config/database');

class Review {
  // Создание записи о повторении
  static async create(reviewData) {
    const { user_id, card_id, deck_id, quality, review_duration, previous_interval, previous_ease_factor, previous_repetitions } = reviewData;
    
    const query = `
      INSERT INTO reviews 
        (user_id, card_id, deck_id, quality, review_duration, 
         previous_interval, previous_ease_factor, previous_repetitions)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [user_id, card_id, deck_id, quality, review_duration, previous_interval, previous_ease_factor, previous_repetitions];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // Получение истории повторений пользователя
  static async findByUser(userId, limit = 50) {
    const query = `
      SELECT r.*, c.question, d.title as deck_title
      FROM reviews r
      JOIN cards c ON r.card_id = c.id
      JOIN decks d ON r.deck_id = d.id
      WHERE r.user_id = $1
      ORDER BY r.reviewed_at DESC
      LIMIT $2
    `;
    
    const { rows } = await pool.query(query, [userId, limit]);
    return rows;
  }

  // Получение статистики повторений по датам
  static async getReviewStats(userId, days = 30) {
    const query = `
      SELECT 
        DATE(reviewed_at) as date,
        COUNT(*) as total_reviews,
        SUM(CASE WHEN quality >= 3 THEN 1 ELSE 0 END) as correct_reviews,
        AVG(quality) as average_quality,
        AVG(review_duration) as average_duration
      FROM reviews 
      WHERE user_id = $1 AND reviewed_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(reviewed_at)
      ORDER BY date DESC
    `;
    
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }
}

module.exports = Review;