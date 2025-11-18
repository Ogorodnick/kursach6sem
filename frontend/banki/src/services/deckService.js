// src/services/deckService.js
import api from './api';

export const deckService = {
  async createDeck(deckData) {
    const response = await api.post('/decks', deckData);
    return response.data;
  },

  async getUserDecks() {
    const response = await api.get('/decks/my');
    return response.data;
  },

  async getPublicDecks(page = 1, limit = 20) {
    const response = await api.get('/decks/public', {
      params: { page, limit }
    });
    return response.data;
  },

  async getDeck(id) {
    const response = await api.get(`/decks/${id}`);
    return response.data;
  },

  async updateDeck(id, deckData) {
    const response = await api.put(`/decks/${id}`, deckData);
    return response.data;
  },

  async deleteDeck(id) {
    const response = await api.delete(`/decks/${id}`);
    return response.data;
  },

  async copyDeck(id) {
    const response = await api.post(`/decks/${id}/copy`);
    return response.data;
  }
};