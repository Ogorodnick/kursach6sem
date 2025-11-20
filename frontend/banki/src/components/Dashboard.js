// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ConfirmModal from './ConfirmModal';
import Notification from './Notification';
import './Dashboard.css';

const Dashboard = () => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDeck, setNewDeck] = useState({ 
    title: '', 
    description: '',
    is_public: false 
  });
  const [error, setError] = useState('');
  const [deletingDeckId, setDeletingDeckId] = useState(null);
  
  // Новые состояния для уведомлений и модального окна
  const [notification, setNotification] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    deckId: null,
    deckTitle: ''
  });

  useEffect(() => {
    fetchDecks();
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const openConfirmModal = (deckId, deckTitle) => {
    setConfirmModal({
      isOpen: true,
      deckId,
      deckTitle
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      deckId: null,
      deckTitle: ''
    });
  };

  const fetchDecks = async () => {
    try {
      console.log('Запрос колод пользователя...');
      const response = await axios.get('http://localhost:5000/api/decks/my');
      console.log('Полученные данные:', response.data);
      
      let decksData = response.data;
      
      if (decksData && decksData.decks && Array.isArray(decksData.decks)) {
        decksData = decksData.decks;
      }
      else if (Array.isArray(decksData)) {
        // Оставляем как есть
      }
      else {
        console.warn('Данные не являются массивом, преобразуем в массив');
        decksData = [];
      }
      
      console.log('Обработанные колоды:', decksData);
      
      // Для каждой колоды получаем количество карточек
      const decksWithCardCount = await Promise.all(
        decksData.map(async (deck) => {
          try {
            const cardsResponse = await axios.get(`http://localhost:5000/api/cards/deck/${deck.id}`);
            const cardsData = cardsResponse.data;
            let cardCount = 0;
            
            if (cardsData && cardsData.cards && Array.isArray(cardsData.cards)) {
              cardCount = cardsData.cards.length;
            } else if (Array.isArray(cardsData)) {
              cardCount = cardsData.length;
            }
            
            return {
              ...deck,
              cardCount
            };
          } catch (error) {
            console.error(`Ошибка при загрузке карточек для колоды ${deck.id}:`, error);
            return {
              ...deck,
              cardCount: 0
            };
          }
        })
      );
      
      setDecks(decksWithCardCount);
      setError('');
    } catch (error) {
      console.error('Ошибка при загрузке колод:', error);
      setError('Ошибка при загрузке колод: ' + (error.response?.data?.message || error.message));
      setDecks([]);
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
        is_public: newDeck.is_public
      });
      
      // Сразу добавляем новую колоду с временным cardCount
      const newDeckWithCount = {
        ...response.data,
        cardCount: 0
      };
      
      setDecks(prevDecks => [newDeckWithCount, ...prevDecks]);
      setNewDeck({ title: '', description: '', is_public: false });
      setShowCreateForm(false);
      setError('');
      
      // Показываем уведомление об успешном создании
      const statusText = newDeck.is_public ? 'публичная' : 'приватная';
      showNotification(`Колода успешно создана (${statusText})!`, 'success');
      
      // Обновляем список чтобы получить актуальные данные
      setTimeout(() => {
        fetchDecks();
      }, 500);
    } catch (error) {
      console.error('Ошибка при создании колоды:', error);
      setError('Ошибка при создании колоды: ' + (error.response?.data?.message || error.message));
      showNotification('Ошибка при создании колоды', 'error');
    }
  };

  const handleDeleteDeck = async () => {
    const { deckId, deckTitle } = confirmModal;
    
    if (!deckId) return;

    setDeletingDeckId(deckId);
    
    try {
      await axios.delete(`http://localhost:5000/api/decks/${deckId}`);
      
      // Сразу удаляем колоду из списка
      setDecks(prevDecks => prevDecks.filter(deck => deck.id !== deckId));
      setError('');
      
      // Показываем уведомление об успешном удалении
      showNotification(`Колода "${deckTitle}" успешно удалена`, 'success');
      
    } catch (error) {
      console.error('Ошибка при удалении колоды:', error);
      const errorMessage = 'Ошибка при удалении колоды: ' + (error.response?.data?.message || error.message);
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setDeletingDeckId(null);
      closeConfirmModal();
    }
  };

  const deleteDeck = (deckId, deckTitle) => {
    openConfirmModal(deckId, deckTitle);
  };

  const toggleDeckVisibility = async (deckId, currentStatus, deckTitle) => {
    try {
      const newStatus = !currentStatus;
      await axios.patch(`http://localhost:5000/api/decks/${deckId}`, {
        is_public: newStatus
      });
      
      // Обновляем статус колоды в состоянии
      setDecks(prevDecks => 
        prevDecks.map(deck => 
          deck.id === deckId 
            ? { ...deck, is_public: newStatus }
            : deck
        )
      );
      
      const statusText = newStatus ? 'публичной' : 'приватной';
      showNotification(`Колода "${deckTitle}" теперь ${statusText}`, 'success');
      
    } catch (error) {
      console.error('Ошибка при изменении видимости колоды:', error);
      const errorMessage = 'Ошибка при изменении видимости колоды: ' + (error.response?.data?.message || error.message);
      showNotification(errorMessage, 'error');
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
        <div className="deck-header">
          <h3>{deck.title || 'Без названия'}</h3>
          <div className="deck-visibility">
            <span className={`visibility-badge ${deck.is_public ? 'public' : 'private'}`}>
              {deck.is_public ? '🌐 Публичная' : '🔒 Приватная'}
            </span>
          </div>
        </div>
        
        {deck.description && <p className="deck-description">{deck.description}</p>}
        
        <div className="deck-stats">
          <span className="cards-count">
            📊 {deck.cardCount || 0} карточек
          </span>
          <span className="deck-date">
            📅 {new Date(deck.created_at || deck.createdAt || Date.now()).toLocaleDateString('ru-RU')}
          </span>
        </div>
        
        <div className="deck-actions">
          <Link to={`/deck/${deck.id}`} className="btn-secondary">
            📝 Открыть
          </Link>
          <Link to={`/study/${deck.id}`} className="btn-primary">
            🎯 Учить
          </Link>
          <button 
            className={`btn-toggle ${deck.is_public ? 'btn-public' : 'btn-private'}`}
            onClick={() => toggleDeckVisibility(deck.id, deck.is_public, deck.title)}
            title={deck.is_public ? 'Сделать приватной' : 'Сделать публичной'}
          >
            {deck.is_public ? '🔒' : '🌐'}
          </button>
          {deck.is_public && (
            <button 
              className="btn-share"
              onClick={() => {
                const shareUrl = `${window.location.origin}/shared/${deck.id}`;
                navigator.clipboard.writeText(shareUrl);
                showNotification('Ссылка на колоду скопирована в буфер обмена!', 'success');
              }}
              title="Скопировать ссылку для общего доступа"
            >
              🔗
            </button>
          )}
          <button 
            className="btn-delete"
            onClick={() => deleteDeck(deck.id, deck.title)}
            disabled={deletingDeckId === deck.id}
            title="Удалить колоду"
          >
            {deletingDeckId === deck.id ? '⌛' : '🗑️'}
          </button>
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

      {/* Модальное окно подтверждения удаления */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={handleDeleteDeck}
        title="Подтверждение удаления"
        message={`Вы уверены, что хотите удалить колоду "${confirmModal.deckTitle}"? Все карточки в ней также будут удалены. Это действие нельзя отменить.`}
      />

      {/* Всплывающие уведомления */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Создать новую колоду</h3>
            <form onSubmit={createDeck}>
              <div className="form-group">
                <label>Название колоды:*</label>
                <input
                  type="text"
                  value={newDeck.title}
                  onChange={(e) => setNewDeck({...newDeck, title: e.target.value})}
                  placeholder="Введите название колоды"
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
              <div className="form-group">
                <label className="privacy-toggle">
                  <input
                    type="checkbox"
                    checked={newDeck.is_public}
                    onChange={(e) => setNewDeck({...newDeck, is_public: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">
                    {newDeck.is_public ? '🌐 Публичная колода' : '🔒 Приватная колода'}
                  </span>
                </label>
                <p className="privacy-help">
                  {newDeck.is_public 
                    ? 'Публичные колоды видны другим пользователям и могут быть использованы для обучения'
                    : 'Приватные колоды видны только вам'
                  }
                </p>
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