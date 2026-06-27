import api from './api';

export const getSettings = () => {
  return api.get('/settings');
};

export const updatePrivacy = (privacy) => {
  return api.put('/settings/privacy', { privacy });
};

export const updateNotifications = (notifications) => {
  return api.put('/settings/notifications', { notifications });
};

export const updateAppearance = (appearance) => {
  return api.put('/settings/appearance', { appearance });
};

export const updateSecurity = (security) => {
  return api.put('/settings/security', { security });
};
