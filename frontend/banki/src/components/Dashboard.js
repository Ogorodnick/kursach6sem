// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDeck, setNewDeck] = useState({ title: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      console.log('Запрос колод пользователя...');
      const response = await axios.get('http://localhost:5000/api/decks/my');
      console.log('Полученные данные:', response.data);
      console.log('Тип данных:', typeof response.data);
      console.log('Является ли массивом?', Array.isArray(response.data));
      
      // Обрабатываем разные форматы ответа
      let decksData = response.data;
      
      // Если это объект с полем decks
      if (decksData && decksData.decks && Array.isArray(decksData.decks)) {
        decksData = decksData.decks;
      }
      // Если это объект с полем data
      else if (decksData && decksData.data && Array.isArray(decksData.data)) {
        decksData = decksData.data;
      }
      // Если это не массив, создаем пустой массив
      else if (!Array.isArray(decksData)) {
        console.warn('Данные не являются массивом, преобразуем в массив');
        decksData = [];
      }
      
      console.log('Обработанные колоды:', decksData);
      setDecks(decksData);
      setError('');
    } catch (error) {
      console.error('Ошибка при загрузке колод:', error);
      console.error('Полный ответ ошибки:', error.response);
      setError('Ошибка при загрузке колод: ' + (error.response?.data?.message || error.message));
      setDecks([]); // Устанавливаем пустой массив при ошибке
    } finally {
      setLoading(false);
    }
  };

  const createDeck = async (e) => {
    e.preventDefault();
    if (!newDeck.title.trim()) return;

    try {
      const response = await axios.post('http://localhost:5000/api/decks', {
        title: newDeck.title,
        description: newDeck.description,
        is_public: false
      });
      
      // Добавляем новую колоду в начало списка
      setDecks(prevDecks => {
        const newDecks = Array.isArray(prevDecks) ? [...prevDecks] : [];
        return [response.data, ...newDecks];
      });
      
      setNewDeck({ title: '', description: '' });
      setShowCreateForm(false);
      setError('');
    } catch (error) {
      console.error('Ошибка при создании колоды:', error);
      setError('Ошибка при создании колоды: ' + (error.response?.data?.message || error.message));
    }
  };

  // Безопасный рендеринг колод
  const renderDecks = () => {
    if (!Array.isArray(decks)) {
      console.error('decks не является массивом:', decks);
      return (
        <div className="empty-state">
          <h3>Ошибка формата данных</h3>
          <p>Полученные данные не являются массивом колод</p>
        </div>
      );
    }

    if (decks.length === 0) {
      return (
        <div className="empty-state">
          <h3>У вас пока нет колод</h3>
          <p>Создайте первую колоду чтобы начать учиться!</p>
        </div>
      );
    }

    return decks.map(deck => (
      <div key={deck.id} className="deck-card">
        <h3>{deck.title || 'Без названия'}</h3>
        {deck.description && <p className="deck-description">{deck.description}</p>}
        <p className="cards-count">{deck.cardCount || 0} карточек</p>
        <div className="deck-actions">
          <Link to={`/deck/${deck.id}`} className="btn-secondary">
            Открыть
          </Link>
          <Link to={`/study/${deck.id}`} className="btn-primary">
            Учить
          </Link>
        </div>
      </div>
    ));
  };

  if (loading) {
    return <div className="loading">Загрузка колод...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Мои колоды</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          + Создать колоду
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Создать новую колоду</h3>
            <form onSubmit={createDeck}>
              <div className="form-group">
                <label>Название колоды:</label>
                <input
                  type="text"
                  value={newDeck.title}
                  onChange={(e) => setNewDeck({...newDeck, title: e.target.value})}
                  placeholder="Название колоды"
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label>Описание (необязательно):</label>
                <textarea
                  value={newDeck.description}
                  onChange={(e) => setNewDeck({...newDeck, description: e.target.value})}
                  placeholder="Описание колоды"
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Создать
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="decks-grid">
        {renderDecks()}
      </div>
    </div>
  );
};

export default Dashboard;