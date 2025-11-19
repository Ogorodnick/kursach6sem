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
        <div className="container">
          <Link to="/" className="logo">
            🗂️ AnkiClone
          </Link>
          <nav className="nav">
            {user && (
              <>
                <Link to="/" className="nav-link">Мои колоды</Link>
                <button onClick={handleLogout} className="logout-btn">
                  Выйти
                </button>
              </>
            )}
          </nav>
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