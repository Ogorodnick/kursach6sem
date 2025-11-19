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
  const [startTime, setStartTime] = useState(null);
  const [savingProgress, setSavingProgress] = useState(false);

  // Получаем карточки для повторения (только те, что готовы к изучению)
  const fetchDueCards = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/reviews/due-cards`, {
        params: { deckId }
      });
      
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
      
      console.log('Карточки для повторения:', cardsData);
      
      if (cardsData.length === 0) {
        setError('На сегодня нет карточек для повторения');
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
    fetchDueCards();
  }, [fetchDueCards]);

  const handleShowAnswer = () => {
    setShowAnswer(true);
    setStartTime(Date.now()); // Засекаем время просмотра ответа
  };

  // Функция для преобразования текстовой оценки в числовую (для SM2 алгоритма)
  const getQualityFromDifficulty = (difficulty) => {
    switch (difficulty) {
      case 'again': return 0;  // Снова (полный провал)
      case 'hard': return 1;   // Трудно
      case 'good': return 3;   // Хорошо (стандартное значение в SM2)
      case 'easy': return 4;   // Легко
      default: return 3;
    }
  };

  const handleRateCard = async (difficulty) => {
    if (!cards[currentCardIndex]) return;
    
    setSavingProgress(true);
    
    try {
      const currentCard = cards[currentCardIndex];
      const reviewDuration = startTime ? Math.round((Date.now() - startTime) / 1000) : 0; // время в секундах
      const quality = getQualityFromDifficulty(difficulty);

      // Отправляем результат повторения на сервер
      const response = await axios.post('http://localhost:5000/api/reviews/save', {
        cardId: currentCard.id,
        quality: quality,
        reviewDuration: reviewDuration,
        // progressId будет найден на сервере через UserCardProgress.findByUserAndCard
      });

      console.log('Прогресс сохранен:', response.data);

      // Удаляем текущую карточку из списка (она обработана)
      const remainingCards = cards.filter((_, index) => index !== currentCardIndex);
      setCards(remainingCards);
      
      // Сбрасываем состояние
      setShowAnswer(false);
      setStartTime(null);
      
      // Если карточки закончились - завершаем сессию
      if (remainingCards.length === 0) {
        setSessionFinished(true);
      } else {
        // Переходим к следующей карточке (остаемся на том же индексе, т.к. массив уменьшился)
        if (currentCardIndex >= remainingCards.length) {
          setCurrentCardIndex(remainingCards.length - 1);
        }
      }
      
    } catch (error) {
      console.error('Ошибка при сохранении прогресса:', error);
      setError('Ошибка при сохранении прогресса: ' + (error.response?.data?.message || error.message));
    } finally {
      setSavingProgress(false);
    }
  };

  const restartSession = () => {
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setSessionFinished(false);
    setError('');
    setStartTime(null);
    setLoading(true);
    fetchDueCards(); // Загружаем карточки заново
  };

  if (loading) {
    return (
      <div className="study-session">
        <div className="study-header">
          <Link to={`/deck/${deckId}`} className="back-link">← Назад к колоде</Link>
        </div>
        <div className="loading">Загрузка карточек для повторения...</div>
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
          <div className="session-actions">
            <button onClick={restartSession} className="btn-primary">
              Попробовать снова
            </button>
            <Link to={`/deck/${deckId}`} className="btn-secondary">
              Вернуться к колоде
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cards.length === 0 && !sessionFinished) {
    return (
      <div className="study-session">
        <div className="study-header">
          <Link to={`/deck/${deckId}`} className="back-link">← Назад к колоде</Link>
        </div>
        <div className="empty-state">
          <h3>🎉 На сегодня все!</h3>
          <p>Все карточки повторены. Возвращайтесь завтра для следующей сессии.</p>
          <div className="session-actions">
            <button onClick={restartSession} className="btn-primary">
              Проверить снова
            </button>
            <Link to={`/deck/${deckId}`} className="btn-secondary">
              Вернуться к колоде
            </Link>
          </div>
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
          <p>Все карточки на сегодня повторены</p>
          <div className="session-actions">
            <button onClick={restartSession} className="btn-primary">
              Проверить снова
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
                  <button 
                    onClick={handleShowAnswer} 
                    className="btn-primary show-answer-btn"
                    disabled={savingProgress}
                  >
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
                        disabled={savingProgress}
                      >
                        {savingProgress ? '⌛' : '❌'} Снова
                      </button>
                      <button 
                        onClick={() => handleRateCard('hard')}
                        className="btn-difficulty hard"
                        disabled={savingProgress}
                      >
                        {savingProgress ? '⌛' : '🟡'} Трудно
                      </button>
                      <button 
                        onClick={() => handleRateCard('good')}
                        className="btn-difficulty good"
                        disabled={savingProgress}
                      >
                        {savingProgress ? '⌛' : '🟢'} Хорошо
                      </button>
                      <button 
                        onClick={() => handleRateCard('easy')}
                        className="btn-difficulty easy"
                        disabled={savingProgress}
                      >
                        {savingProgress ? '⌛' : '🔵'} Легко
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