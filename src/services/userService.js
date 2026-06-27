import api from './api';

export const getProfile = () => {
  return api.get('/users/me');
};

export const updateProfile = (profileData) => {
  return api.put('/users/profile', profileData);
};

export const uploadAvatar = (avatarFile) => {
  const formData = new FormData();
  formData.append('avatar', avatarFile);
  return api.put('/users/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const searchUsers = (query) => {
  return api.get(`/users/search?query=${encodeURIComponent(query)}`);
};

export const getUserById = (id) => {
  return api.get(`/users/${id}`);
};

export const updateStatus = (statusData) => {
  return api.put('/users/status', statusData);
};
