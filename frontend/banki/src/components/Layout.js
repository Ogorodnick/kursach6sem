// src/components/Layout.js
import React from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
          {/* Левая часть - навигация */}
          <div className="header-left">
            <Link to="/" className="nav-link">
              🗂️ Мои колоды
            </Link>
            <Link to="/discover" className="nav-link">
              🔍 Найти колоду
            </Link>
          </div>

          {/* Центральная часть - логотип/название */}
          <div className="header-center">
            <Link to="/" className="logo">
              AnkiClone
            </Link>
          </div>

          {/* Правая часть - пользователь и выход */}
          <div className="header-right">
            {user && (
              <>
                <span className="user-email">
                  {user.username || user.email || 'Пользователь'}
                </span>
                <button onClick={handleLogout} className="logout-btn">
                  🚪 Выйти
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      
      <main className="main">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;