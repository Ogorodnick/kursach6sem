// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Настроим базовый URL для axios
axios.defaults.baseURL = 'http://localhost:5000';

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Получаем полные данные пользователя при перезагрузке
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      console.log('Данные пользователя:', response.data);
      setUser({
        token: localStorage.getItem('token'),
        ...response.data.user
      });
    } catch (error) {
      console.error('Ошибка получения данных пользователя:', error);
      // Если не удалось получить данные, делаем логаут
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Отправка запроса на вход:', { email, password });
      
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      
      console.log('Ответ от сервера:', response.data);
      
      const { token, user: userData } = response.data;
      
      if (!token) {
        throw new Error('Токен не получен от сервера');
      }
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Сохраняем все данные пользователя, включая username
      setUser({
        token,
        ...userData
      });
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка входа:', error);
      let errorMessage = 'Ошибка входа';
      
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Ошибка ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Сервер не отвечает. Проверьте подключение.';
      } else {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Отправка запроса на регистрацию:', userData);
      
      const response = await axios.post('/api/auth/register', userData);
      console.log('Ответ от сервера при регистрации:', response.data);
      
      // После успешной регистрации автоматически логиним пользователя
      if (response.data.token) {
        const { token, user: newUserData } = response.data;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser({
          token,
          ...newUserData
        });
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      let errorMessage = 'Ошибка регистрации';
      
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Ошибка ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Сервер не отвечает. Проверьте подключение.';
      }
      
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};