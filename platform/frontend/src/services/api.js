import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
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

// MOCK DATA LAYER
export const authAPI = {
  login: async (username, password) => {
    // Mock login
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username === 'admin' && password === 'admin') {
          resolve({ token: 'mock-jwt-token-12345', user: { username: 'admin' } });
        } else {
          reject(new Error('Invalid credentials. Use admin/admin'));
        }
      }, 800);
    });
  }
};

export const challengesAPI = {
  getChallenges: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: '1', title: 'SQL Injection', description: 'Find the hidden flag using SQL Injection techniques.', points: 100, status: 'available' },
          { id: '2', title: 'Task 2', description: 'Solve the second security challenge.', points: 150, status: 'locked' },
          { id: '3', title: 'Task 3', description: 'Solve the third security challenge.', points: 200, status: 'locked' }
        ]);
      }, 500);
    });
  },
  submitFlag: async (challengeId, flag) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (flag === 'flag{hacker}') {
          resolve({ success: true, message: 'Flag Found Successfully', pointsEarned: 100 });
        } else {
          reject(new Error('Invalid flag'));
        }
      }, 600);
    });
  }
};

export const leaderboardAPI = {
  getLeaderboard: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { rank: 1, username: 'admin', points: 300 },
          { rank: 2, username: 'player1', points: 200 },
          { rank: 3, username: 'player2', points: 100 },
        ]);
      }, 500);
    });
  }
};

export default api;
