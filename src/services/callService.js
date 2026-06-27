import api from './api';

export const getCallLogs = () => {
  return api.get('/calls/logs');
};

export const getCallLogById = (id) => {
  return api.get(`/calls/logs/${id}`);
};

export const createCallLog = (logData) => {
  return api.post('/calls/log', logData);
};
