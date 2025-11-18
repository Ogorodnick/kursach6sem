const pool = require('../config/database');

class DeckTag {
  // Добавление тега к колоде
  static async addTagToDeck(deckId, tagId) {
    const query = `
      INSERT INTO deck_tags (deck_id, tag_id)
      VALUES ($1, $2)
      ON CONFLICT (deck_id, tag_id) DO NOTHING
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [deckId, tagId]);
    return rows[0];
  }

  // Удаление тега из колоды
  static async removeTagFromDeck(deckId, tagId) {
    const query = 'DELETE FROM deck_tags WHERE deck_id = $1 AND tag_id = $2';
    await pool.query(query, [deckId, tagId]);
  }

  // Получение тегов колоды
  static async getDeckTags(deckId) {
    const query = `
      SELECT t.* FROM deck_tags dt
      JOIN tags t ON dt.tag_id = t.id
      WHERE dt.deck_id = $1
      ORDER BY t.name
    `;
    
    const { rows } = await pool.query(query, [deckId]);
    return rows;
  }

  // Получение колод по тегу
  static async getDecksByTag(tagId, userId = null) {
    let query = `
      SELECT d.*, u.username as author_username
      FROM deck_tags dt
      JOIN decks d ON dt.deck_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE dt.tag_id = $1 AND d.is_public = true
    `;
    
    const values = [tagId];
    
    if (userId) {
      query += ' OR d.user_id = $2';
      values.push(userId);
    }
    
    query += ' ORDER BY d.created_at DESC';
    
    const { rows } = await pool.query(query, values);
    return rows;
  }
}

module.exports = DeckTag;