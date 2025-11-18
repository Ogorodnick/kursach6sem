const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { 
    expiresIn: process.env.JWT_EXPIRES_IN 
  });
};

const authController = {
  // Регистрация
  async register(req, res) {
    try {
      const { email, username, password } = req.body;

      // Проверяем, существует ли пользователь
      const userExists = await User.exists(email, username);
      if (userExists) {
        return res.status(400).json({ error: 'User with this email or username already exists' });
      }

      // Создаем пользователя
      const user = await User.create({ email, username, password });

      // Генерируем токен
      const token = generateToken(user.id);

      // Обновляем время последнего входа
      await User.updateLastLogin(user.id);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        },
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Anal server error' });
    }
  },

  // Вход
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Ищем пользователя
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Проверяем пароль
      const isPasswordValid = await User.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Генерируем токен
      const token = generateToken(user.id);

      // Обновляем время последнего входа
      await User.updateLastLogin(user.id);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Получение текущего пользователя
  async getMe(req, res) {
    try {
      res.json({
        user: {
          id: req.user.id,
          email: req.user.email,
          username: req.user.username,
          created_at: req.user.created_at
        }
      });
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = authController;