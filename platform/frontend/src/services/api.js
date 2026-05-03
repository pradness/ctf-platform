import axios from 'axios';
import { getValidToken } from '../utils/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://44.200.224.45:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getValidToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// REAL AUTH API
export const authAPI = {
  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },
  signup: async (username, password) => {
    const res = await api.post('/auth/signup', { username, password });
    return res.data;
  }
};

export const challengesAPI = {
  getChallenges: async () => {
    const res = await api.get('/challenges');
    return res.data;
  },
  submitFlag: async (challengeId, flag) => {
    const res = await api.post('/submit', { challengeId, flag });
    return res.data;
  }
};

export const containerAPI = {
  start: async (challengeId) => {
    const res = await api.post('/container/start', { challengeId });
    return res.data;
  },
  stop: async (containerId) => {
    const res = await api.post('/container/stop', { containerId });
    return res.data;
  }
};

export const leaderboardAPI = {
  getLeaderboard: async () => {
    const res = await api.get('/leaderboard');
    return res.data;
  }
};

export default api;
