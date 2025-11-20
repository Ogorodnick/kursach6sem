// src/components/DiscoverDecks.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Notification from './Notification';
import './DiscoverDecks.css';

const DiscoverDecks = () => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [copyingDeckId, setCopyingDeckId] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const fetchPublicDecks = useCallback(async (page = 1, search = '') => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: 20
      };

      // Добавляем параметр поиска только если он не пустой
      if (search.trim()) {
        params.search = search.trim();
      }

      console.log('Запрос публичных колод с параметрами:', params);

      const response = await axios.get('http://localhost:5000/api/decks/public', { params });
      
      let decksData = response.data.decks || response.data;
      
      if (!Array.isArray(decksData)) {
        decksData = [];
      }

      console.log('Получены колоды:', decksData.length, 'поиск:', search);

      // Если это первая страница или изменился поисковый запрос, заменяем данные
      if (page === 1 || search !== searchTerm) {
        setDecks(decksData);
      } else {
        setDecks(prev => [...prev, ...decksData]);
      }

      // Проверяем, есть ли еще данные
      setHasMore(decksData.length === 20);
      setError('');
    } catch (error) {
      console.error('Ошибка при загрузке публичных колод:', error);
      setError('Ошибка при загрузке колод: ' + (error.response?.data?.message || error.message));
      setDecks([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Используем debounce для поиска чтобы избежать множественных запросов
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      setDecks([]);
      fetchPublicDecks(1, searchTerm);
    }, 500); // Задержка 500ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchPublicDecks]);

  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const loadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchPublicDecks(nextPage, searchTerm);
  };

  const copyDeck = async (deckId, deckTitle) => {
    setCopyingDeckId(deckId);
    
    try {
      const response = await axios.post(`http://localhost:5000/api/decks/${deckId}/copy`);
      
      showNotification(`Колода "${deckTitle}" успешно скопирована в вашу коллекцию!`, 'success');
      
      // Можно обновить список, чтобы показать, что колода теперь у пользователя
      setTimeout(() => {
        fetchPublicDecks(currentPage, searchTerm);
      }, 1000);
      
    } catch (error) {
      console.error('Ошибка при копировании колоды:', error);
      const errorMessage = 'Ошибка при копировании колоды: ' + (error.response?.data?.message || error.message);
      showNotification(errorMessage, 'error');
    } finally {
      setCopyingDeckId(null);
    }
  };

  const renderDecks = () => {
    if (!Array.isArray(decks)) {
      return (
        <div className="empty-state">
          <h3>Ошибка формата данных</h3>
          <p>Полученные данные не являются массивом колод</p>
        </div>
      );
    }

    if (decks.length === 0 && !loading) {
      return (
        <div className="empty-state">
          <h3>Публичные колоды не найдены</h3>
          <p>
            {searchTerm 
              ? `По запросу "${searchTerm}" ничего не найдено`
              : 'Пока нет публичных колод или они еще не загружены'
            }
          </p>
          {searchTerm && (
            <button 
              className="btn-secondary"
              onClick={clearSearch}
              style={{ marginTop: '1rem' }}
            >
              Показать все колоды
            </button>
          )}
        </div>
      );
    }

    return decks.map(deck => (
      <div key={deck.id} className="discover-deck-card">
        <div className="deck-header">
          <h3>{deck.title || 'Без названия'}</h3>
          <div className="deck-meta">
            <span className="author">
              👤 {deck.author_username || 'Аноним'}
            </span>
            {deck.user_count > 0 && (
              <span className="popularity">
                👍 {deck.user_count} пользователей
              </span>
            )}
          </div>
        </div>
        
        {deck.description && (
          <p className="deck-description">{deck.description}</p>
        )}
        
        <div className="deck-stats">
          <span className="cards-count">
            📊 {deck.card_count || 0} карточек
          </span>
          <span className="deck-date">
            📅 {new Date(deck.created_at).toLocaleDateString('ru-RU')}
          </span>
        </div>
        
        <div className="deck-actions">
          <button 
            className="btn-copy"
            onClick={() => copyDeck(deck.id, deck.title)}
            disabled={copyingDeckId === deck.id}
            title="Скопировать колоду в свою коллекцию"
          >
            {copyingDeckId === deck.id ? '⌛ Копирование...' : '📥 Копировать'}
          </button>
          <Link 
            to={`/shared/${deck.id}`} 
            className="btn-secondary"
            title="Просмотреть колоду"
          >
            👀 Посмотреть
          </Link>
        </div>
      </div>
    ));
  };

  return (
    <div className="discover-decks">
      <div className="discover-header">
        <div className="breadcrumb">
          <Link to="/">Мои колоды</Link> / <span>Найти колоду</span>
        </div>
        
        <h1>Публичные колоды</h1>
        <p className="discover-subtitle">
          Изучайте колоды, созданные другими пользователями, и добавляйте их в свою коллекцию
        </p>
      </div>

      {/* Панель поиска */}
      <div className="search-panel">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Поиск колод по названию или описанию..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
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
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Всплывающие уведомления */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      <div className="decks-grid">
        {renderDecks()}
      </div>

      {loading && (
        <div className="loading-more">
          <div className="loading-spinner"></div>
          Загрузка колод...
        </div>
      )}

      {hasMore && !loading && decks.length > 0 && (
        <div className="load-more-container">
          <button 
            className="btn-load-more"
            onClick={loadMore}
          >
            Загрузить еще
          </button>
        </div>
      )}

      {!hasMore && decks.length > 0 && (
        <div className="end-of-results">
          <p>Все колоды загружены</p>
        </div>
      )}
    </div>
  );
};

export default DiscoverDecks;