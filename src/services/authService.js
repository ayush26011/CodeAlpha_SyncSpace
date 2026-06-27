import api from './api';

export const register = (name, username, email, password) => {
  return api.post('/auth/register', { name, username, email, password });
};

export const login = (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const getMe = () => {
  return api.get('/auth/me');
};

export const logout = () => {
  return api.post('/auth/logout');
};
