import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use 10.0.2.2 for Android Emulators, or your IPv4 address (e.g., 192.168.1.X) for physical devices
const API_URL = 'https://pocket-trainer-six.vercel.app/api'; 

const api = axios.create({
  baseURL: API_URL,
});

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