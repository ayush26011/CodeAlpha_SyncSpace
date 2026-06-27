import api from './api';

export const uploadVoiceNote = (conversationId, file, duration, waveformData = []) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('duration', duration);
  formData.append('waveformData', JSON.stringify(waveformData));

  return api.post(`/voice-notes/${conversationId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
