// src/components/Login.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [copyingDeck, setCopyingDeck] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Получаем ID колоды для копирования из location.state
  const copyDeckId = location.state?.copyDeckId;
  const from = location.state?.from || '/';

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
  }, [location]);

  const copyDeckAfterLogin = async (deckId) => {
    try {
      setCopyingDeck(true);
      const response = await axios.post(`http://localhost:5000/api/decks/${deckId}/copy`);
      
      // Показываем сообщение об успешном копировании
      setSuccessMessage(prev => 
        prev ? `${prev} Колода успешно скопирована в вашу коллекцию!` 
             : 'Колода успешно скопирована в вашу коллекцию!'
      );
      
      return true;
    } catch (error) {
      console.error('Ошибка при копировании колоды:', error);
      setError(prev => 
        prev ? `${prev} Ошибка при копировании колоды.` 
             : 'Ошибка при копировании колоды.'
      );
      return false;
    } finally {
      setCopyingDeck(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    console.log('Попытка входа с:', { email, password });

    const result = await login(email, password);
    
    console.log('Результат входа:', result);
    
    if (result.success) {
      console.log('Вход успешен');
      
      // Если есть колода для копирования, копируем ее
      if (copyDeckId) {
        console.log('Копирование колоды после входа:', copyDeckId);
        const copySuccess = await copyDeckAfterLogin(copyDeckId);
        
        if (copySuccess) {
          // После успешного копирования перенаправляем на главную
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          // Если копирование не удалось, все равно перенаправляем
          setTimeout(() => {
            navigate(from);
          }, 2000);
        }
      } else {
        // Обычное перенаправление после входа
        navigate(from);
      }
    } else {
      setError(result.message);
      console.log('Ошибка входа:', result.message);
    }
    
    setLoading(false);
  };

  // Тестовые данные для отладки
  const fillTestData = () => {
    setEmail('test@example.com');
    setPassword('password123');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Вход в систему</h2>
        
        {/* Показываем информацию о копировании колоды */}
        {copyDeckId && (
          <div className="info-message" style={{
            background: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '6px',
            padding: '1rem',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            <strong>После входа колода будет автоматически добавлена в вашу коллекцию</strong>
          </div>
        )}
      
        
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading || copyingDeck}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
              disabled={loading || copyingDeck}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading || copyingDeck}
          >
            {loading ? 'Вход...' : copyingDeck ? 'Копирование колоды...' : 'Войти'}
          </button>
        </form>

        <div className="auth-link">
          Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;