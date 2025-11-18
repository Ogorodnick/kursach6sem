const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Создание нового пользователя
  static async create(userData) {
    const { email, username, password } = userData;
    const passwordHash = await bcrypt.hash(password, 12);
    
    const query = `
      INSERT INTO users (email, username, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, email, username, created_at
    `;
    
    const values = [email, username, passwordHash];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // Поиск по email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await pool.query(query, [email]);
    return rows[0];
  }

  // Поиск по ID
  static async findById(id) {
    const query = `
      SELECT id, email, username, created_at, last_login 
      FROM users WHERE id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  // Проверка пароля
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Обновление времени последнего входа
  static async updateLastLogin(userId) {
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1';
    await pool.query(query, [userId]);
  }

  // Проверка существования пользователя
  static async exists(email, username) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM users WHERE email = $1 OR username = $2
      )
    `;
    const { rows } = await pool.query(query, [email, username]);
    return rows[0].exists;
  }
}

module.exports = User;