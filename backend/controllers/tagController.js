const { Tag, DeckTag, Deck } = require('../models');

const tagController = {
  // Создание тега
  async createTag(req, res) {
    try {
      const { name, color } = req.body;
      
      const tag = await Tag.create({
        name,
        color,
        user_id: req.user.id
      });

      res.status(201).json({
        message: 'Tag created successfully',
        tag
      });
    } catch (error) {
      console.error('Create tag error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Получение тегов пользователя
  async getUserTags(req, res) {
    try {
      const tags = await Tag.findByUser(req.user.id);
      res.json({ tags });
    } catch (error) {
      console.error('Get user tags error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Поиск тегов
  async searchTags(req, res) {
    try {
      const { q } = req.query;
      
      if (!q || q.length < 2) {
        return res.json({ tags: [] });
      }

      const tags = await Tag.searchByName(q, req.user.id);
      res.json({ tags });
    } catch (error) {
      console.error('Search tags error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Добавление тега к колоде
  async addTagToDeck(req, res) {
    try {
      const { deckId } = req.params;
      const { tagId } = req.body;

      // Проверяем владение колодой
      const deck = await Deck.findById(deckId);
      if (!deck || deck.user_id !== req.user.id) {
        return res.status(404).json({ error: 'Deck not found' });
      }

      const deckTag = await DeckTag.addTagToDeck(deckId, tagId);
      
      res.json({
        message: 'Tag added to deck successfully',
        deckTag
      });
    } catch (error) {
      console.error('Add tag to deck error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Удаление тега из колоды
  async removeTagFromDeck(req, res) {
    try {
      const { deckId, tagId } = req.params;

      // Проверяем владение колодой
      const deck = await Deck.findById(deckId);
      if (!deck || deck.user_id !== req.user.id) {
        return res.status(404).json({ error: 'Deck not found' });
      }

      await DeckTag.removeTagFromDeck(deckId, tagId);
      
      res.json({ message: 'Tag removed from deck successfully' });
    } catch (error) {
      console.error('Remove tag from deck error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Получение тегов колоды
  async getDeckTags(req, res) {
    try {
      const { deckId } = req.params;

      // Проверяем доступ к колоде
      const deck = await Deck.findById(deckId);
      if (!deck || (deck.user_id !== req.user.id && !deck.is_public)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const tags = await DeckTag.getDeckTags(deckId);
      res.json({ tags });
    } catch (error) {
      console.error('Get deck tags error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = tagController;