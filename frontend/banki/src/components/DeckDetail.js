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


const fetchDeckAndCards = useCallback(async () => {
  try {
    console.log('Загрузка данных колоды...');
    const [deckResponse, cardsResponse] = await Promise.all([
      axios.get(`http://localhost:5000/api/decks/${deckId}`),
      axios.get(`http://localhost:5000/api/cards/deck/${deckId}`)
    ]);
    
    console.log('Данные колоды:', deckResponse.data);
    console.log('Данные карточек:', cardsResponse.data);
    
    setDeck(deckResponse.data);
    
    // Исправляем обработку карточек - данные приходят в поле cards
    let cardsData = cardsResponse.data;
    
    // Если это объект с полем cards (как в вашем случае)
    if (cardsData && cardsData.cards && Array.isArray(cardsData.cards)) {
      cardsData = cardsData.cards;
    }
    // Если это просто массив (резервный вариант)
    else if (Array.isArray(cardsData)) {
      // Оставляем как есть
    }
    // Если это не массив, создаем пустой массив
    else {
      console.warn('Данные карточек не являются массивом, преобразуем в массив');
      cardsData = [];
    }
    
    console.log('Обработанные карточки:', cardsData);
    setCards(cardsData);
    setError('');
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
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

    try {
      const response = await axios.post('http://localhost:5000/api/cards', {
        deck_id: parseInt(deckId),
        question: newCard.question,
        answer: newCard.answer,
        question_type: newCard.question_type,
        answer_type: newCard.answer_type
      });
      
      // Добавляем новую карточку в начало списка
      setCards(prevCards => {
        const newCards = Array.isArray(prevCards) ? [...prevCards] : [];
        return [response.data, ...newCards];
      });
      
      setNewCard({ 
        question: '', 
        answer: '',
        question_type: 'text',
        answer_type: 'text'
      });
      setShowCardForm(false);
      setError('');
    } catch (error) {
      console.error('Ошибка при создании карточки:', error);
      setError('Ошибка при создании карточки: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Удалить эту карточку?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/cards/${cardId}`);
      setCards(prevCards => prevCards.filter(card => card.id !== cardId));
      setError('');
    } catch (error) {
      console.error('Ошибка при удалении карточки:', error);
      setError('Ошибка при удалении карточки: ' + (error.response?.data?.message || error.message));
    }
  };

  // Безопасный рендеринг карточек
  const renderCards = () => {
    if (!Array.isArray(cards)) {
      console.error('cards не является массивом:', cards);
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
    return <div className="loading">Загрузка...</div>;
  }

  if (!deck) {
    return (
      <div className="error">
        <h3>Колода не найдена</h3>
        <Link to="/">Вернуться к моим колодам</Link>
      </div>
    );
  }

  return (
    <div className="deck-detail">
      <div className="deck-header">
        <div className="breadcrumb">
          <Link to="/">Мои колоды</Link> / <span>{deck.title || 'Без названия'}</span>
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
        <h1>{deck.title || 'Без названия'}</h1>
        {deck.description && <p className="deck-description">{deck.description}</p>}
        <p className="cards-count">
          {Array.isArray(cards) ? cards.length : 0} карточек
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
            <h3>Добавить карточку</h3>
            <form onSubmit={handleCreateCard}>
              <div className="form-group">
                <label>Вопрос:</label>
                <textarea
                  value={newCard.question}
                  onChange={(e) => setNewCard({...newCard, question: e.target.value})}
                  placeholder="Вопрос или термин"
                  rows="3"
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label>Ответ:</label>
                <textarea
                  value={newCard.answer}
                  onChange={(e) => setNewCard({...newCard, answer: e.target.value})}
                  placeholder="Ответ или определение"
                  rows="3"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Добавить
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowCardForm(false)}
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