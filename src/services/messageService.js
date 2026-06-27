import api from './api';

export const getMessages = (conversationId) => {
  return api.get(`/messages/${conversationId}`);
};

export const createMessage = (conversationId, messageData) => {
  return api.post(`/messages/${conversationId}`, messageData);
};

export const deleteMessage = (messageId) => {
  return api.delete(`/messages/${messageId}`);
};

export const markAsSeen = (messageId) => {
  return api.put(`/messages/${messageId}/seen`);
};

export const addReaction = (messageId, emoji) => {
  return api.post(`/messages/${messageId}/reaction`, { emoji });
};

export const removeReaction = (messageId) => {
  return api.delete(`/messages/${messageId}/reaction`);
};

export const toggleStarMessage = (messageId) => {
  return api.put(`/messages/${messageId}/star`);
};

export const forwardMessage = (messageId, targetConversationIds) => {
  return api.post(`/messages/${messageId}/forward`, { targetConversationIds });
};

export const searchMessages = (conversationId, q) => {
  return api.get(`/messages/${conversationId}/search?q=${encodeURIComponent(q)}`);
};
