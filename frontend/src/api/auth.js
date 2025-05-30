import api from './api';

export const registerUser = (userData) => api.post('/register', userData);

export const loginUser = (userData) => api.post('/login', userData);

export const getProtectedData = (token) =>
  api.get('/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
