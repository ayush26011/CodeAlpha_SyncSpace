import api from './api';

export const createMeeting = (roomId, title) => {
  return api.post('/meetings', { roomId, title });
};

export const getMeetingByRoom = (roomId) => {
  return api.get(`/meetings/${roomId}`);
};

export const endMeeting = (roomId) => {
  return api.put(`/meetings/${roomId}/end`);
};
