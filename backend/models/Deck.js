const pool = require('../config/database');

class Deck {
  // Создание колоды
  static async create(deckData) {
    const { title, description, is_public, user_id, copied_from_deck_id = null } = deckData;
    
    const query = `
      INSERT INTO decks (title, description, is_public, user_id, copied_from_deck_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [title, description, is_public, user_id, copied_from_deck_id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // Получение колод пользователя
  static async findByUser(userId, includePublic = false) {
    let query = `
      SELECT d.*, u.username as author_username,
             COUNT(DISTINCT c.id) as card_count
      FROM decks d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN cards c ON d.id = c.deck_id
      WHERE d.user_id = $1
    `;
    
    const values = [userId];
    
    if (includePublic) {
      query += ' OR d.is_public = true';
    }
    
    query += ' GROUP BY d.id, u.username ORDER BY d.created_at DESC';
    
    const { rows } = await pool.query(query, values);
    return rows;
  }

  // Получение публичных колод
  static async findPublicDecks(limit = 50, offset = 0, search = '') {
    let query = `
      SELECT d.*, u.username as author_username,
             COUNT(DISTINCT c.id) as card_count,
             COUNT(DISTINCT ud.user_id) as user_count
      FROM decks d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN cards c ON d.id = c.deck_id
      LEFT JOIN user_decks ud ON d.id = ud.deck_id
      WHERE d.is_public = true
    `;
    
    const values = [limit, offset];
    
    // Добавляем условие поиска если передан search
    if (search && search.trim()) {
      query += ` AND (d.title ILIKE $3 OR d.description ILIKE $3)`;
      values.push(`%${search.trim()}%`);
    }
    
    query += `
      GROUP BY d.id, u.username
      ORDER BY user_count DESC, d.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    console.log('SQL запрос поиска колод:', query);
    console.log('Параметры:', values);
    
    const { rows } = await pool.query(query, values);
    return rows;
  }

  // Поиск колоды по ID
  static async findById(id) {
    const query = `
      SELECT d.*, u.username as author_username,
             COUNT(DISTINCT c.id) as card_count
      FROM decks d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN cards c ON d.id = c.deck_id
      WHERE d.id = $1
      GROUP BY d.id, u.username
    `;
    
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  // Обновление колоды
  static async update(id, updateData) {
    const { title, description, is_public } = updateData;
    
    // Получаем текущую колоду чтобы сохранить существующие значения
    const currentDeck = await this.findById(id);
    if (!currentDeck) {
      throw new Error('Deck not found');
    }
    
    // Используем переданные значения или существующие
    const finalTitle = title !== undefined ? title : currentDeck.title;
    const finalDescription = description !== undefined ? description : currentDeck.description;
    const finalIsPublic = is_public !== undefined ? is_public : currentDeck.is_public;
    
    const query = `
      UPDATE decks 
      SET title = $1, description = $2, is_public = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const values = [finalTitle, finalDescription, finalIsPublic, id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // Удаление колоды
  static async delete(id) {
    const query = 'DELETE FROM decks WHERE id = $1';
    await pool.query(query, [id]);
  }

  // Копирование колоды для пользователя
  static async copyForUser(deckId, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Создаем новую колоду как копию
      const deckQuery = `
        INSERT INTO decks (title, description, is_public, user_id, copied_from_deck_id)
        SELECT title, description, false, $1, $2
        FROM decks WHERE id = $2
        RETURNING *
      `;
      const deckResult = await client.query(deckQuery, [userId, deckId]);
      const newDeck = deckResult.rows[0];
      
      // Копируем карточки
      const cardsQuery = `
        INSERT INTO cards (deck_id, question, answer, question_type, answer_type)
        SELECT $1, question, answer, question_type, answer_type
        FROM cards WHERE deck_id = $2
      `;
      await client.query(cardsQuery, [newDeck.id, deckId]);
      
      await client.query('COMMIT');
      return newDeck;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Deck;