import axios from 'axios';
import { getSecureToken } from '../services/tokenService';

// Live Vercel backend URL
const API_BASE_URL = 'https://pocket-trainer-rouge.vercel.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout for cloud model generation
});

// Automatically inject JWT token from hardware-backed secure storage
api.interceptors.request.use(
  async (config) => {
    const token = await getSecureToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;