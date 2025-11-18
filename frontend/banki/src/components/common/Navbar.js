// src/components/common/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">AnkiClone</Link>
      </div>
      
      <div className="navbar-menu">
        {user ? (
          <>
            <Link to="/decks">Мои колоды</Link>
            <Link to="/review">Повторение</Link>
            <Link to="/public">Публичные колоды</Link>
            <span>Привет, {user.username}!</span>
            <button onClick={handleLogout}>Выйти</button>
          </>
        ) : (
          <>
            <Link to="/login">Войти</Link>
            <Link to="/register">Регистрация</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;