// src/components/StudySession.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './StudySession.css';

const StudySession = () => {
  const { deckId } = useParams();
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [error, setError] = useState('');

  const fetchCards = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/cards/deck/${deckId}`);
      console.log('Данные карточек для изучения:', response.data);
      
      let cardsData = response.data;
      
      // Обрабатываем разные форматы ответа
      if (cardsData && cardsData.cards && Array.isArray(cardsData.cards)) {
        cardsData = cardsData.cards;
      }
      else if (Array.isArray(cardsData)) {
        // Оставляем как есть
      }
      else {
        console.warn('Данные карточек не являются массивом');
        cardsData = [];
      }
      
      console.log('Обработанные карточки для изучения:', cardsData);
      
      if (cardsData.length === 0) {
        setError('В этой колоде нет карточек для изучения');
      }
      
      // Перемешиваем карточки для изучения
      const shuffledCards = cardsData.sort(() => Math.random() - 0.5);
      setCards(shuffledCards);
    } catch (error) {
      console.error('Ошибка при загрузке карточек:', error);
      setError('Ошибка при загрузке карточек: ' + (error.response?.data?.message || error.message));
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleRateCard = async (difficulty) => {
    // Здесь можно добавить логику для алгоритма повторений (как в Anki)
    console.log(`Оценка карточки: ${difficulty}`);
    
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      setSessionFinished(true);
    }
  };

  const restartSession = () => {
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setSessionFinished(false);
    setError('');
    // Перемешиваем карточки заново
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
  };

  if (loading) {
    return (
      <div className="study-session">
        <div className="study-header">
          <Link to={`/deck/${deckId}`} className="back-link">← Назад к колоде</Link>
        </div>
        <div className="loading">Загрузка карточек...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="study-session">
        <div className="study-header">
          <Link to={`/deck/${deckId}`} className="back-link">← Назад к колоде</Link>
        </div>
        <div className="error-state">
          <h3>{error}</h3>
          <Link to={`/deck/${deckId}`} className="btn-primary">
            Добавить карточки
          </Link>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="study-session">
        <div className="study-header">
          <Link to={`/deck/${deckId}`} className="back-link">← Назад к колоде</Link>
        </div>
        <div className="empty-state">
          <h3>В этой колоде нет карточек для изучения</h3>
          <p>Добавьте карточки в колоду чтобы начать учиться</p>
          <Link to={`/deck/${deckId}`} className="btn-primary">
            Добавить карточки
          </Link>
        </div>
      </div>
    );
  }

  if (sessionFinished) {
    return (
      <div className="study-session">
        <div className="study-header">
          <Link to={`/deck/${deckId}`} className="back-link">← Назад к колоде</Link>
        </div>
        <div className="session-finished">
          <h2>🎉 Сессия завершена!</h2>
          <p>Вы повторили все {cards.length} карточек</p>
          <div className="session-actions">
            <button onClick={restartSession} className="btn-primary">
              Повторить еще раз
            </button>
            <Link to={`/deck/${deckId}`} className="btn-secondary">
              Вернуться к колоде
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / cards.length) * 100;

  console.log('Текущая карточка:', currentCard); // Для отладки

    return (
    <div className="study-session">
        <div className="study-header">
        <Link to={`/deck/${deckId}`} className="back-link">← Назад к колоде</Link>
        <div className="progress">
            Карточка {currentCardIndex + 1} из {cards.length}
        </div>
        </div>

        <div className="progress-bar">
        <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
        ></div>
        </div>

        <div className="card-container">
        <div className={`study-card ${showAnswer ? 'show-answer' : ''}`}>
            {!showAnswer ? (
            // Передняя сторона карточки (вопрос)
            <div className="card-front">
                <div className="card-content">
                <div className="question-section">
                    <h2>{currentCard.question || 'Вопрос не указан'}</h2>
                </div>
                <div className="button-section">
                    <button onClick={handleShowAnswer} className="btn-primary show-answer-btn">
                    Показать ответ
                    </button>
                </div>
                </div>
            </div>
            ) : (
            // Задняя сторона карточки (ответ + кнопки оценки)
            <div className="card-back">
                <div className="card-content">
                <div className="question-section">
                    <h2>{currentCard.question || 'Вопрос не указан'}</h2>
                </div>
                <div className="answer-section">
                    <h3>Ответ:</h3>
                    <p className="answer-text">{currentCard.answer || 'Ответ не указан'}</p>
                </div>
                <div className="button-section">
                    <div className="difficulty-buttons">
                    <p>Насколько хорошо вы помните?</p>
                    <div className="buttons-grid">
                        <button 
                        onClick={() => handleRateCard('again')}
                        className="btn-difficulty again"
                        >
                        ❌ Снова
                        </button>
                        <button 
                        onClick={() => handleRateCard('hard')}
                        className="btn-difficulty hard"
                        >
                        🟡 Трудно
                        </button>
                        <button 
                        onClick={() => handleRateCard('good')}
                        className="btn-difficulty good"
                        >
                        🟢 Хорошо
                        </button>
                        <button 
                        onClick={() => handleRateCard('easy')}
                        className="btn-difficulty easy"
                        >
                        🔵 Легко
                        </button>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            )}
        </div>
        </div>
    </div>
    );
};

export default StudySession;