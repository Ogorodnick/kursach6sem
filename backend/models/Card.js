const pool = require('../config/database');

class Card {
  // Создание карточки
  static async create(cardData) {
    const { deck_id, question, answer, question_type = 'text', answer_type = 'text' } = cardData;
    
    const query = `
      INSERT INTO cards (deck_id, question, answer, question_type, answer_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [deck_id, question, answer, question_type, answer_type];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // Получение карточек колоды
  static async findByDeck(deckId) {
    const query = `
      SELECT * FROM cards 
      WHERE deck_id = $1 
      ORDER BY position, created_at
    `;
    const { rows } = await pool.query(query, [deckId]);
    return rows;
  }

  // Получение карточки по ID
  static async findById(id) {
    const query = 'SELECT * FROM cards WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  // Обновление карточки
  static async update(id, updateData) {
    const { question, answer, question_type, answer_type } = updateData;
    
    const query = `
      UPDATE cards 
      SET question = $1, answer = $2, question_type = $3, answer_type = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    
    const values = [question, answer, question_type, answer_type, id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // Удаление карточки
  static async delete(id) {
    const query = 'DELETE FROM cards WHERE id = $1';
    await pool.query(query, [id]);
  }

  // Массовое создание карточек
  static async bulkCreate(deckId, cards) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const query = `
        INSERT INTO cards (deck_id, question, answer, question_type, answer_type)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      for (const card of cards) {
        await client.query(query, [
          deckId,
          card.question,
          card.answer,
          card.question_type || 'text',
          card.answer_type || 'text'
        ]);
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Card;