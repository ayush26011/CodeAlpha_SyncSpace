import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5002';
let socket = null;

export const connectSocket = (token) => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    auth: {
      token
    },
    transports: ['websocket', 'polling']
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
