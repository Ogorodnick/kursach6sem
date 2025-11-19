// src/components/DeckDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './DeckDetail.css';

const DeckDetail = () => {
  const { deckId } = useParams();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
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
      setError('');
    } catch (error) {
      setError('Ошибка при загрузке данных: ' + (error.response?.data?.message || error.message));
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    fetchDeckAndCards();
  }, [fetchDeckAndCards]);

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
      setCards(prevCards => {
        const newCardsArray = Array.isArray(prevCards) ? [...prevCards] : [];
        return [...newCardsArray, response.data];
      });
      
      // Сбрасываем форму
      setNewCard({ 
        question: '', 
        answer: '',
        question_type: 'text',
        answer_type: 'text'
      });
      setShowCardForm(false);
      setError('');
      
      // Обновляем данные для синхронизации
      setTimeout(() => {
        fetchDeckAndCards();
      }, 100);
      
    } catch (error) {
      setError('Ошибка при создании карточки: ' + (error.response?.data?.message || error.message));
    } finally {
      setCreatingCard(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Удалить эту карточку?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/cards/${cardId}`);
      setCards(prevCards => prevCards.filter(card => card.id !== cardId));
      setError('');
    } catch (error) {
      setError('Ошибка при удалении карточки: ' + (error.response?.data?.message || error.message));
    }
  };

  const renderCards = () => {
    if (!Array.isArray(cards)) {
      return (
        <div className="empty-state">
          <h3>Ошибка формата данных</h3>
          <p>Полученные данные не являются массивом карточек</p>
        </div>
      );
    }

    if (cards.length === 0) {
      return (
        <div className="empty-state">
          <h3>В этой колоде пока нет карточек</h3>
          <p>Добавьте первую карточку чтобы начать учиться!</p>
        </div>
      );
    }

    return cards.map(card => (
      <div key={card.id} className="card-item">
        <div className="card-content">
          <div className="card-side">
            <strong>Вопрос:</strong>
            <p>{card.question || 'Без вопроса'}</p>
          </div>
          <div className="card-side">
            <strong>Ответ:</strong>
            <p>{card.answer || 'Без ответа'}</p>
          </div>
        </div>
        <div className="card-actions">
          <button 
            className="btn-danger"
            onClick={() => handleDeleteCard(card.id)}
          >
            Удалить
          </button>
        </div>
      </div>
    ));
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
          {cards.length} карточек
        </p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
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