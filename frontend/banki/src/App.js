// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import Navbar from './components/common/Navbar';

// Страницы
import Login from './pages/Login';
import Register from './pages/Register';
import Decks from './pages/Decks';
import Review from './pages/Review';
import PublicDecks from './pages/PublicDecks';
import Dashboard from './pages/Dashboard';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/decks" element={
                <PrivateRoute>
                  <Decks />
                </PrivateRoute>
              } />
              <Route path="/review" element={
                <PrivateRoute>
                  <Review />
                </PrivateRoute>
              } />
              <Route path="/public" element={
                <PrivateRoute>
                  <PublicDecks />
                </PrivateRoute>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;