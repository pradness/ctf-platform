import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// REAL API CALLS
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  signup: async (username, password) => {
    const response = await api.post('/auth/signup', { username, password });
    return response.data;
  }
};

export const challengesAPI = {
  getChallenges: async () => {
    const response = await api.get('/challenges');
    return response.data;
  },
  submitFlag: async (challengeId, flag) => {
    const response = await api.post('/submit', { challengeId, flag });
    return response.data;
  }
};

export const leaderboardAPI = {
  getLeaderboard: async () => {
    const response = await api.get('/leaderboard');
    return response.data;
  }
};

export default api;
