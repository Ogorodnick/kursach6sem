const { Deck, Card, UserCardProgress } = require('../models');

const deckController = {
  // Создание колоды
  async createDeck(req, res) {
    try {
      const { title, description, is_public = false, tags = [] } = req.body;
      
      const deck = await Deck.create({
        title,
        description,
        is_public,
        user_id: req.user.id
      });

      res.status(201).json({
        message: 'Deck created successfully',
        deck
      });
    } catch (error) {
      console.error('Create deck error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Получение колод пользователя
  async getUserDecks(req, res) {
    try {
      const decks = await Deck.findByUser(req.user.id);
      res.json({ decks });
    } catch (error) {
      console.error('Get user decks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Получение публичных колод
  async getPublicDecks(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      const decks = await Deck.findPublicDecks(parseInt(limit), offset);
      res.json({ decks });
    } catch (error) {
      console.error('Get public decks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Получение конкретной колоды
  async getDeck(req, res) {
    try {
      const { id } = req.params;
      const deck = await Deck.findById(id);
      
      if (!deck) {
        return res.status(404).json({ error: 'Deck not found' });
      }

      // Проверяем доступ
      if (!deck.is_public && deck.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Получаем карточки колоды
      const cards = await Card.findByDeck(id);

      res.json({
        deck: {
          ...deck,
          cards
        }
      });
    } catch (error) {
      console.error('Get deck error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Обновление колоды
  async updateDeck(req, res) {
    try {
      const { id } = req.params;
      const { title, description, is_public } = req.body;

      // Проверяем владение
      const deck = await Deck.findById(id);
      if (!deck || deck.user_id !== req.user.id) {
        return res.status(404).json({ error: 'Deck not found' });
      }

      const updatedDeck = await Deck.update(id, { title, description, is_public });
      
      res.json({
        message: 'Deck updated successfully',
        deck: updatedDeck
      });
    } catch (error) {
      console.error('Update deck error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Удаление колоды
  async deleteDeck(req, res) {
    try {
      const { id } = req.params;

      // Проверяем владение
      const deck = await Deck.findById(id);
      if (!deck || deck.user_id !== req.user.id) {
        return res.status(404).json({ error: 'Deck not found' });
      }

      await Deck.delete(id);
      
      res.json({ message: 'Deck deleted successfully' });
    } catch (error) {
      console.error('Delete deck error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Копирование колоды
  async copyDeck(req, res) {
    try {
      const { id } = req.params;

      // Проверяем, существует ли колода и публичная ли она
      const originalDeck = await Deck.findById(id);
      if (!originalDeck) {
        return res.status(404).json({ error: 'Deck not found' });
      }

      if (!originalDeck.is_public && originalDeck.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const newDeck = await Deck.copyForUser(id, req.user.id);
      
      res.status(201).json({
        message: 'Deck copied successfully',
        deck: newDeck
      });
    } catch (error) {
      console.error('Copy deck error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = deckController;