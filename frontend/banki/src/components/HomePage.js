// src/components/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const HomePage = () => {
  const { user } = useAuth();

  if (user) {
    return null; // или редирект на dashboard
  }

  return (
    <div className="homepage">
      <div className="hero-section">
        <div className="container">
          <h1>Добро пожаловать в AnkiClone</h1>
          <p>Эффективное запоминание с помощью интервальных повторений</p>
          <div className="cta-buttons">
            <Link to="/login" className="btn btn-primary">
              Войти
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;