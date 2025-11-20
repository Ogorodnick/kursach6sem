// src/components/SharedDeckView.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Notification from './Notification';
import { useAuth } from '../context/AuthContext';
import './SharedDeckView.css';

const SharedDeckView = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);
  const [copyingDeck, setCopyingDeck] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const fetchDeck = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`http://localhost:5000/api/decks/${deckId}`);
      const deckData = response.data.deck || response.data;
      
      if (!deckData) {
        throw new Error('Колода не найдена');
      }

      // Проверяем, что колода публичная
      if (!deckData.is_public) {
        throw new Error('Эта колода является приватной');
      }

      setDeck(deckData);
      
      // Получаем карточки
      const cardsData = deckData.cards || [];
      setCards(cardsData);
      setError('');
      
    } catch (error) {
      console.error('Ошибка при загрузке колоды:', error);
      const errorMessage = error.response?.data?.error || error.message;
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    fetchDeck();
  }, [fetchDeck]);

  const handleCopyDeck = async () => {
    // Если пользователь не авторизован, перенаправляем на логин с сохранением ID колоды
    if (!user) {
      showNotification('Для копирования колоды необходимо войти в систему', 'warning');
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            from: `/shared/${deckId}`,
            copyDeckId: deckId // Сохраняем ID колоды для копирования
          } 
        });
      }, 1500);
      return;
    }

    setCopyingDeck(true);
    
    try {
      const response = await axios.post(`http://localhost:5000/api/decks/${deckId}/copy`);
      
      showNotification(`Колода "${deck.title}" успешно скопирована в вашу коллекцию!`, 'success');
      
      // Перенаправляем в мои колоды через 2 секунды
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error('Ошибка при копировании колоды:', error);
      const errorMessage = 'Ошибка при копировании колоды: ' + (error.response?.data?.message || error.message);
      showNotification(errorMessage, 'error');
    } finally {
      setCopyingDeck(false);
    }
  };

  const handleDiscoverClick = () => {
    // Если пользователь не авторизован, перенаправляем на логин с возвратом к поиску
    if (!user) {
      showNotification('Для просмотра всех колод необходимо войти в систему', 'info');
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            from: '/discover' // После входа перенаправит на страницу поиска
          } 
        });
      }, 1500);
      return;
    }
    
    // Если авторизован - сразу на страницу поиска
    navigate('/discover');
  };

  const nextCard = () => {
    setShowAnswer(false);
    setCurrentCardIndex((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    setShowAnswer(false);
    setCurrentCardIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  // Функция для отображения кнопки копирования с учетом авторизации
  const renderCopyButton = (className = 'btn-copy') => {
    if (!user) {
      return (
        <button 
          className={className}
          onClick={handleCopyDeck}
          title="Войдите в систему чтобы скопировать колоду"
        >
          🔐 Войти и скопировать
        </button>
      );
    }

    return (
      <button 
        className={className}
        onClick={handleCopyDeck}
        disabled={copyingDeck}
      >
        {copyingDeck ? '📥 Копирование...' : '📥 Копировать в мои колоды'}
      </button>
    );
  };

  // Функция для отображения кнопки "Другие колоды"
  const renderDiscoverButton = () => {
    if (!user) {
      return (
        <button 
          className="btn-secondary"
          onClick={handleDiscoverClick}
          title="Войдите в систему чтобы найти другие колоды"
        >
          🔐 Войти и найти колоды
        </button>
      );
    }

    return (
      <Link to="/discover" className="btn-secondary">
        🔍 Другие колоды
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="shared-deck-view">
        <div className="loading">Загрузка колоды...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-deck-view">
        <div className="error-state">
          <h2>Ошибка</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button className="btn-primary" onClick={handleDiscoverClick}>
              🔍 Найти другие колоды
            </button>
            {user && (
              <Link to="/" className="btn-secondary">
                🗂️ К моим колодам
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="shared-deck-view">
        <div className="error-state">
          <h2>Колода не найдена</h2>
          <p>Возможно, ссылка устарела или колода была удалена</p>
          <button className="btn-primary" onClick={handleDiscoverClick}>
            🔍 Найти другие колоды
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentCardIndex];

  return (
    <div className="shared-deck-view">
      <div className="shared-deck-header">
        <div className="breadcrumb">
          {user ? (
            <Link to="/discover">🔍 Найти колоду</Link>
          ) : (
            <span>🔍 Публичная колода</span>
          )} / <span>{deck.title}</span>
        </div>
        
        <div className="deck-actions">
          {renderCopyButton()}
          {renderDiscoverButton()}
        </div>
      </div>

      <div className="deck-info">
        <h1>{deck.title}</h1>
        {deck.description && (
          <p className="deck-description">{deck.description}</p>
        )}
        <div className="deck-meta">
          <span className="author">
            👤 Автор: {deck.author_username || 'Аноним'}
          </span>
          <span className="cards-count">
            📊 Карточек: {cards.length}
          </span>
          <span className="deck-date">
            📅 Создана: {new Date(deck.created_at).toLocaleDateString('ru-RU')}
          </span>
        </div>
      </div>

      {/* Всплывающие уведомления */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      {cards.length > 0 ? (
        <div className="cards-preview">
          <h2>Предпросмотр карточек ({currentCardIndex + 1}/{cards.length})</h2>
          
          <div className="card-preview">
            <div className="card-side question-side">
              <h3>Вопрос</h3>
              <p>{currentCard?.question || 'Без вопроса'}</p>
            </div>
            
            {showAnswer ? (
              <div className="card-side answer-side">
                <h3>Ответ</h3>
                <p>{currentCard?.answer || 'Без ответа'}</p>
              </div>
            ) : (
              <button className="btn-show-answer" onClick={toggleAnswer}>
                👁️ Показать ответ
              </button>
            )}
          </div>

          <div className="card-navigation">
            <button 
              className="btn-nav prev"
              onClick={prevCard}
              disabled={cards.length <= 1}
            >
              ◀️ Предыдущая
            </button>
            
            <span className="card-counter">
              {currentCardIndex + 1} / {cards.length}
            </span>
            
            <button 
              className="btn-nav next"
              onClick={nextCard}
              disabled={cards.length <= 1}
            >
              Следующая ▶️
            </button>
          </div>

          <div className="preview-actions">
            {renderCopyButton('btn-copy-large')}
          </div>
        </div>
      ) : (
        <div className="empty-cards">
          <h3>В этой колоде пока нет карточек</h3>
          <p>Автор еще не добавил карточки для изучения</p>
        </div>
      )}
    </div>
  );
};

export default SharedDeckView;