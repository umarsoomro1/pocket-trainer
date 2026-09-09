import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { getSecureToken, setSecureToken, removeSecureToken } from '../services/tokenService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkToken = async () => {
    try {
      const token = await getSecureToken();
      setUserToken(token);
    } catch (e) {
      console.error('Token verification failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkToken();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data?.token) {
      await setSecureToken(response.data.token);
      setUserToken(response.data.token);
    }
    return response.data;
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data?.token) {
      await setSecureToken(response.data.token);
      setUserToken(response.data.token);
    }
    return response.data;
  };

  const logout = async () => {
    await removeSecureToken();
    setUserToken(null);
  };

  return (
    <AuthContext.Provider value={{ login, register, logout, userToken, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};