import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StudySession.css';

const StudySession = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [savingProgress, setSavingProgress] = useState(false);

  const fetchDueCards = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/reviews/due-cards`, {
        params: { deckId },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const cardsData = response.data.cards || [];
      
      if (cardsData.length === 0) {
        setError('🎉 На сегодня нет карточек для повторения!');
      }
      
      const shuffledCards = [...cardsData].sort(() => Math.random() - 0.5);
      setCards(shuffledCards);
      
    } catch (error) {
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
    setStartTime(Date.now());
  };

  const getQualityFromDifficulty = (difficulty) => {
    const qualityMap = {
      'again': 0,
      'hard': 1,
      'good': 3,
      'easy': 4
    };
    return qualityMap[difficulty] || 3;
  };

  const handleRateCard = async (difficulty) => {
    if (!cards[currentCardIndex]) return;
    
    setSavingProgress(true);
    
    try {
      const currentCard = cards[currentCardIndex];
      const reviewDuration = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
      const quality = getQualityFromDifficulty(difficulty);

      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/reviews/save', {
        cardId: currentCard.card_id || currentCard.id,
        quality: quality,
        reviewDuration: reviewDuration,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setShowAnswer(false);
        setStartTime(null);
      } else {
        setSessionFinished(true);
      }
      
    } catch (error) {
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
    fetchDueCards();
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

  if (error && cards.length === 0) {
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
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="card-container">
        <div className={`study-card ${showAnswer ? 'show-answer' : ''}`}>
          {!showAnswer ? (
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
                    {savingProgress ? 'Загрузка...' : 'Показать ответ'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
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
                      <button onClick={() => handleRateCard('again')} className="btn-difficulty again" disabled={savingProgress}>
                        {savingProgress ? '⌛' : '❌'} Снова
                      </button>
                      <button onClick={() => handleRateCard('hard')} className="btn-difficulty hard" disabled={savingProgress}>
                        {savingProgress ? '⌛' : '🟡'} Трудно
                      </button>
                      <button onClick={() => handleRateCard('good')} className="btn-difficulty good" disabled={savingProgress}>
                        {savingProgress ? '⌛' : '🟢'} Хорошо
                      </button>
                      <button onClick={() => handleRateCard('easy')} className="btn-difficulty easy" disabled={savingProgress}>
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