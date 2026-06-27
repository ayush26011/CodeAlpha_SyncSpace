import api from './api';

export const uploadFile = (conversationId, file) => {
  const formData = new FormData();
  formData.append('conversationId', conversationId);
  formData.append('file', file);

  return api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
