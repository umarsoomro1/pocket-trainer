import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Live Vercel backend URL
const API_BASE_URL = 'https://pocket-trainer-rouge.vercel.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout for cloud model generation
});

// Automatically inject JWT token from AsyncStorage into request headers
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;