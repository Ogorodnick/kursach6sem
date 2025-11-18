const pool = require('../config/database');

class Tag {
  // Создание тега
  static async create(tagData) {
    const { name, color = '#6B7280', user_id = null } = tagData;
    
    const query = `
      INSERT INTO tags (name, color, user_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (name, user_id) DO UPDATE SET color = $2
      RETURNING *
    `;
    
    const values = [name, color, user_id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // Получение тегов пользователя (и глобальных)
  static async findByUser(userId) {
    const query = `
      SELECT * FROM tags 
      WHERE user_id = $1 OR user_id IS NULL
      ORDER BY user_id NULLS FIRST, name
    `;
    
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  // Поиск тегов по имени
  static async searchByName(name, userId) {
    const query = `
      SELECT * FROM tags 
      WHERE name ILIKE $1 AND (user_id = $2 OR user_id IS NULL)
      ORDER BY user_id NULLS FIRST, name
      LIMIT 10
    `;
    
    const { rows } = await pool.query(query, [`%${name}%`, userId]);
    return rows;
  }
}

module.exports = Tag;