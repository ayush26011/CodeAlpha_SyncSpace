import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import { disconnectSocket } from '../services/socketService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('syncspace_token');
    if (token) {
      authService.getMe()
        .then(userData => {
          setUser(userData);
          localStorage.setItem('syncspace_user', JSON.stringify(userData));
          setLoading(false);
        })
        .catch(err => {
          console.error("Token verification failed:", err);
          if (err.status === 401 || err.status === 403) {
            logout();
          } else {
            const cachedUser = localStorage.getItem('syncspace_user');
            if (cachedUser) {
              try {
                setUser(JSON.parse(cachedUser));
              } catch (e) {
                console.error("Failed to parse cached user:", e);
              }
            }
          }
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('syncspace_token', data.token);
      localStorage.setItem('syncspace_user', JSON.stringify(data.user));
      setUser(data.user);
      setLoading(false);
      return data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 7);
      const data = await authService.register(name, username, email, password);
      localStorage.setItem('syncspace_token', data.token);
      localStorage.setItem('syncspace_user', JSON.stringify(data.user));
      setUser(data.user);
      setLoading(false);
      return data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn("Logout error:", e);
    }
    localStorage.removeItem('syncspace_token');
    localStorage.removeItem('syncspace_user');
    setUser(null);
    disconnectSocket();
  };

  const updateProfileDetails = async (name, bio, statusMessage) => {
    try {
      const updatedUser = await userService.updateProfile({ name, bio, statusMessage });
      setUser(prev => ({ ...prev, ...updatedUser }));
      localStorage.setItem('syncspace_user', JSON.stringify({ ...user, ...updatedUser }));
      return updatedUser;
    } catch (err) {
      throw err;
    }
  };

  const updateAvatarImage = async (avatarFile) => {
    try {
      const updatedUser = await userService.uploadAvatar(avatarFile);
      setUser(prev => ({ ...prev, avatar: updatedUser.avatar }));
      localStorage.setItem('syncspace_user', JSON.stringify({ ...user, avatar: updatedUser.avatar }));
      return updatedUser;
    } catch (err) {
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfileDetails, updateAvatarImage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
