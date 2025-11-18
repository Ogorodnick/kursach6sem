// src/services/cardService.js
import api from './api';

export const cardService = {
  async createCard(cardData) {
    const response = await api.post('/cards', cardData);
    return response.data;
  },

  async getDeckCards(deckId) {
    const response = await api.get(`/cards/deck/${deckId}`);
    return response.data;
  },

  async updateCard(id, cardData) {
    const response = await api.put(`/cards/${id}`, cardData);
    return response.data;
  },

  async deleteCard(id) {
    const response = await api.delete(`/cards/${id}`);
    return response.data;
  },

  async bulkCreateCards(deckId, cards) {
    const response = await api.post('/cards/bulk', {
      deck_id: deckId,
      cards
    });
    return response.data;
  }
};