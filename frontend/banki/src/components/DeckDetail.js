// src/components/DeckDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ConfirmModal from './ConfirmModal';
import Notification from './Notification';
import './DeckDetail.css';

const DeckDetail = () => {
  const { deckId } = useParams();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCardForm, setShowCardForm] = useState(false);
  const [newCard, setNewCard] = useState({ 
    question: '', 
    answer: '',
    question_type: 'text',
    answer_type: 'text'
  });
  const [error, setError] = useState('');
  const [creatingCard, setCreatingCard] = useState(false);
  
  // Новые состояния для уведомлений и модального окна
  const [notification, setNotification] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    cardId: null,
    cardQuestion: '',
    deckTitle: ''
  });
  const [deletingCardId, setDeletingCardId] = useState(null);
  const [animatingCardId, setAnimatingCardId] = useState(null);
  
  // Состояния для поиска
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const fetchDeckAndCards = useCallback(async () => {
    try {
      const [deckResponse, cardsResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/decks/${deckId}`),
        axios.get(`http://localhost:5000/api/cards/deck/${deckId}`)
      ]);
      
      // Обработка данных колоды
      const deckData = deckResponse.data;
      let deckTitle = 'Без названия';
      
      // Поиск названия в разных возможных полях
      const possibleTitleFields = ['title', 'name', 'deckTitle', 'deckName'];
      for (const field of possibleTitleFields) {
        if (deckData[field]) {
          deckTitle = deckData[field];
          break;
        }
      }
      
      // Поиск во вложенных объектах
      if (deckTitle === 'Без названия') {
        if (deckData.deck && deckData.deck.title) {
          deckTitle = deckData.deck.title;
        } else if (deckData.data && deckData.data.title) {
          deckTitle = deckData.data.title;
        }
      }
      
      setDeck({
        id: deckId,
        title: deckTitle,
        description: deckData.description || deckData.desc || ''
      });
      
      // Обработка карточек
      let cardsData = cardsResponse.data;
      
      if (cardsData && cardsData.cards && Array.isArray(cardsData.cards)) {
        cardsData = cardsData.cards;
      }
      else if (Array.isArray(cardsData)) {
        // Оставляем как есть
      }
      else if (cardsData && cardsData.data && Array.isArray(cardsData.data)) {
        cardsData = cardsData.data;
      }
      else {
        cardsData = [];
      }
      
      setCards(cardsData);
      setFilteredCards(cardsData); // Изначально показываем все карточки
      setError('');
    } catch (error) {
      setError('Ошибка при загрузке данных: ' + (error.response?.data?.message || error.message));
      setCards([]);
      setFilteredCards([]);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    fetchDeckAndCards();
  }, [fetchDeckAndCards]);

  // Функция поиска карточек
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setIsSearching(!!term.trim());
    
    if (!term.trim()) {
      setFilteredCards(cards);
      return;
    }
    
    const searchTermLower = term.toLowerCase().trim();
    const filtered = cards.filter(card => 
      card.question?.toLowerCase().includes(searchTermLower) ||
      card.answer?.toLowerCase().includes(searchTermLower)
    );
    
    setFilteredCards(filtered);
  }, [cards]);

  // Обновляем отфильтрованные карточки при изменении исходных карточек
  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch(searchTerm);
    } else {
      setFilteredCards(cards);
    }
  }, [cards, searchTerm, handleSearch]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const openConfirmModal = (cardId, cardQuestion) => {
    setConfirmModal({
      isOpen: true,
      cardId,
      cardQuestion,
      deckTitle: deck?.title || 'колоды'
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      cardId: null,
      cardQuestion: '',
      deckTitle: ''
    });
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    if (!newCard.question.trim() || !newCard.answer.trim()) return;

    setCreatingCard(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/cards', {
        deck_id: parseInt(deckId),
        question: newCard.question,
        answer: newCard.answer,
        question_type: newCard.question_type,
        answer_type: newCard.answer_type
      });
      
      // Сразу добавляем новую карточку в состояние
      const newCardData = response.data;
      setCards(prevCards => {
        const newCardsArray = Array.isArray(prevCards) ? [...prevCards] : [];
        return [...newCardsArray, newCardData];
      });
      
      // Если есть поисковый запрос, проверяем подходит ли новая карточка
      if (searchTerm.trim()) {
        const searchTermLower = searchTerm.toLowerCase().trim();
        if (newCardData.question?.toLowerCase().includes(searchTermLower) ||
            newCardData.answer?.toLowerCase().includes(searchTermLower)) {
          setFilteredCards(prev => [...prev, newCardData]);
        }
      }
      
      // Сбрасываем форму
      setNewCard({ 
        question: '', 
        answer: '',
        question_type: 'text',
        answer_type: 'text'
      });
      setShowCardForm(false);
      setError('');
      
      // Показываем уведомление об успешном создании
      showNotification('Карточка успешно создана!', 'success');
      
      // Обновляем данные для синхронизации
      setTimeout(() => {
        fetchDeckAndCards();
      }, 100);
      
    } catch (error) {
      const errorMessage = 'Ошибка при создании карточки: ' + (error.response?.data?.message || error.message);
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setCreatingCard(false);
    }
  };

  const handleDeleteCard = async () => {
    const { cardId } = confirmModal;
    
    if (!cardId) return;

    setDeletingCardId(cardId);
    setAnimatingCardId(cardId);

    try {
      // Ждем немного для анимации
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await axios.delete(`http://localhost:5000/api/cards/${cardId}`);
      
      // Удаляем карточку из состояния после анимации
      setCards(prevCards => prevCards.filter(card => card.id !== cardId));
      setFilteredCards(prevCards => prevCards.filter(card => card.id !== cardId));
      setError('');
      
      // Показываем уведомление об успешном удалении
      showNotification('Карточка успешно удалена', 'success');
      
    } catch (error) {
      const errorMessage = 'Ошибка при удалении карточки: ' + (error.response?.data?.message || error.message);
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setDeletingCardId(null);
      setAnimatingCardId(null);
      closeConfirmModal();
    }
  };

  const deleteCard = (cardId, cardQuestion) => {
    openConfirmModal(cardId, cardQuestion);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    setFilteredCards(cards);
  };

  const renderCards = () => {
    if (!Array.isArray(filteredCards)) {
      return (
        <div className="empty-state">
          <h3>Ошибка формата данных</h3>
          <p>Полученные данные не являются массивом карточек</p>
        </div>
      );
    }

    if (filteredCards.length === 0) {
      if (isSearching) {
        return (
          <div className="empty-state">
            <h3>Карточки не найдены</h3>
            <p>По запросу "{searchTerm}" ничего не найдено</p>
            <button 
              className="btn-secondary"
              onClick={clearSearch}
              style={{ marginTop: '1rem' }}
            >
              Показать все карточки
            </button>
          </div>
        );
      }
      
      return (
        <div className="empty-state">
          <h3>В этой колоде пока нет карточек</h3>
          <p>Добавьте первую карточку чтобы начать учиться!</p>
        </div>
      );
    }

    return filteredCards.map(card => {
      const isDeleting = deletingCardId === card.id;
      const isAnimating = animatingCardId === card.id;
      
      return (
        <div 
          key={card.id} 
          className={`card-item ${isDeleting ? 'deleting' : ''} ${isAnimating ? 'slide-out' : ''}`}
        >
          <div className="card-content">
            <div className="card-side">
              <strong>Вопрос:</strong>
              <p>
                {searchTerm ? highlightText(card.question || 'Без вопроса', searchTerm) : card.question || 'Без вопроса'}
              </p>
            </div>
            <div className="card-side">
              <strong>Ответ:</strong>
              <p>
                {searchTerm ? highlightText(card.answer || 'Без ответа', searchTerm) : card.answer || 'Без ответа'}
              </p>
            </div>
          </div>
          <div className="card-actions">
            <button 
              className="btn-danger"
              onClick={() => deleteCard(card.id, card.question)}
              disabled={isDeleting}
            >
              {isDeleting ? '⌛ Удаление...' : '🗑️ Удалить'}
            </button>
          </div>
        </div>
      );
    });
  };

  // Функция для подсветки найденного текста
  const highlightText = (text, searchTerm) => {
    if (!text || !searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="search-highlight">{part}</mark> : 
        part
    );
  };

  if (loading) {
    return (
      <div className="deck-detail">
        <div className="loading">Загрузка колоды...</div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="deck-detail">
        <div className="error">
          <h3>Колода не найдена</h3>
          <Link to="/">Вернуться к моим колодам</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="deck-detail">
      <div className="deck-header">
        <div className="breadcrumb">
          <Link to="/">Мои колоды</Link> / <span>{deck.title}</span>
        </div>
        
        <div className="deck-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowCardForm(true)}
          >
            + Добавить карточку
          </button>
          <Link to={`/study/${deckId}`} className="btn-primary">
            🎯 Учить
          </Link>
        </div>
      </div>

      <div className="deck-info">
        <h1>{deck.title}</h1>
        {deck.description && <p className="deck-description">{deck.description}</p>}
        <p className="cards-count">
          📊 {cards.length} карточек
          {isSearching && (
            <span className="search-results-count">
              {' '}(найдено: {filteredCards.length})
            </span>
          )}
        </p>
      </div>

      {/* Панель поиска */}
      <div className="search-panel">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Поиск карточек по вопросу или ответу..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="search-clear-btn"
                onClick={clearSearch}
                title="Очистить поиск"
              >
                ✕
              </button>
            )}
          </div>
          {isSearching && (
            <button 
              className="btn-secondary"
              onClick={clearSearch}
            >
              Сбросить
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Модальное окно подтверждения удаления карточки */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={handleDeleteCard}
        title="Подтверждение удаления карточки"
        message={`Вы уверены, что хотите удалить карточку с вопросом "${confirmModal.cardQuestion}" из колоды "${confirmModal.deckTitle}"? Это действие нельзя отменить.`}
      />

      {/* Всплывающие уведомления */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      {showCardForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Добавить карточку в "{deck.title}"</h3>
            <form onSubmit={handleCreateCard}>
              <div className="form-group">
                <label>Вопрос:*</label>
                <textarea
                  value={newCard.question}
                  onChange={(e) => setNewCard({...newCard, question: e.target.value})}
                  placeholder="Введите вопрос или термин"
                  rows="3"
                  autoFocus
                  required
                  disabled={creatingCard}
                />
              </div>
              <div className="form-group">
                <label>Ответ:*</label>
                <textarea
                  value={newCard.answer}
                  onChange={(e) => setNewCard({...newCard, answer: e.target.value})}
                  placeholder="Введите ответ или определение"
                  rows="3"
                  required
                  disabled={creatingCard}
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={creatingCard}
                >
                  {creatingCard ? 'Добавление...' : 'Добавить карточку'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowCardForm(false)}
                  disabled={creatingCard}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="cards-list">
        {renderCards()}
      </div>
    </div>
  );
};

export default DeckDetail;