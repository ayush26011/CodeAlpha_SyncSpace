import api from './api';

export const createDirectConversation = (recipientId) => {
  return api.post('/conversations/direct', { recipientId });
};

export const createGroupConversation = (name, participants, avatar) => {
  return api.post('/conversations/group', { name, participants, avatar });
};

export const getConversations = () => {
  return api.get('/conversations');
};

export const getConversationById = (id) => {
  return api.get(`/conversations/${id}`);
};

export const updateConversation = (id, conversationData) => {
  return api.put(`/conversations/${id}`, conversationData);
};

export const addParticipants = (id, userIds) => {
  return api.post(`/conversations/${id}/participants`, { userIds });
};

export const removeParticipant = (id, userId) => {
  return api.delete(`/conversations/${id}/participants/${userId}`);
};
