const { Card, Deck } = require('../models');

const cardController = {
  // Создание карточки
  async createCard(req, res) {
    try {
      const { deck_id, question, answer, question_type = 'text', answer_type = 'text' } = req.body;

      // Проверяем владение колодой
      const deck = await Deck.findById(deck_id);
      if (!deck || deck.user_id !== req.user.id) {
        return res.status(404).json({ error: 'Deck not found' });
      }

      const card = await Card.create({
        deck_id,
        question,
        answer,
        question_type,
        answer_type
      });

      res.status(201).json({
        message: 'Card created successfully',
        card
      });
    } catch (error) {
      console.error('Create card error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Получение карточек колоды
  async getDeckCards(req, res) {
    try {
      const { deckId } = req.params;

      // Проверяем доступ к колоде
      const deck = await Deck.findById(deckId);
      if (!deck) {
        return res.status(404).json({ error: 'Deck not found' });
      }

      if (!deck.is_public && deck.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const cards = await Card.findByDeck(deckId);
      res.json({ cards });
    } catch (error) {
      console.error('Get deck cards error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Обновление карточки
  async updateCard(req, res) {
    try {
      const { id } = req.params;
      const { question, answer, question_type, answer_type } = req.body;

      // Находим карточку и проверяем владение
      const card = await Card.findById(id);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      const deck = await Deck.findById(card.deck_id);
      if (!deck || deck.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedCard = await Card.update(id, {
        question,
        answer,
        question_type,
        answer_type
      });

      res.json({
        message: 'Card updated successfully',
        card: updatedCard
      });
    } catch (error) {
      console.error('Update card error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Удаление карточки
  async deleteCard(req, res) {
    try {
      const { id } = req.params;

      // Находим карточку и проверяем владение
      const card = await Card.findById(id);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      const deck = await Deck.findById(card.deck_id);
      if (!deck || deck.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await Card.delete(id);

      res.json({ message: 'Card deleted successfully' });
    } catch (error) {
      console.error('Delete card error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Массовое создание карточек
  async bulkCreateCards(req, res) {
    try {
      const { deck_id, cards } = req.body;

      // Проверяем владение колодой
      const deck = await Deck.findById(deck_id);
      if (!deck || deck.user_id !== req.user.id) {
        return res.status(404).json({ error: 'Deck not found' });
      }

      await Card.bulkCreate(deck_id, cards);

      res.status(201).json({
        message: 'Cards created successfully',
        count: cards.length
      });
    } catch (error) {
      console.error('Bulk create cards error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = cardController;