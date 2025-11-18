// src/services/reviewService.js
import api from './api';

export const reviewService = {
  async getDueCards(deckId = null) {
    const response = await api.get('/reviews/due-cards', {
      params: { deckId }
    });
    return response.data;
  },

  async saveReview(reviewData) {
    const response = await api.post('/reviews/save', reviewData);
    return response.data;
  },

  async initializeProgress(cardId, deckId) {
    const response = await api.post('/reviews/init-progress', {
      cardId,
      deckId
    });
    return response.data;
  },

  async getDeckStats(deckId) {
    const response = await api.get(`/reviews/deck-stats/${deckId}`);
    return response.data;
  },

  async getUserStats() {
    const response = await api.get('/reviews/user-stats');
    return response.data;
  }
};