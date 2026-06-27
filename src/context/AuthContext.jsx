import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import { disconnectSocket } from '../services/socketService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('syncspace_token');
    console.log("[Auth] Booting... Token exists in localStorage?", !!token);
    
    if (token) {
      console.log("[Auth] GET /api/auth/me started");
      authService.getMe()
        .then(userData => {
          setUser(userData);
          localStorage.setItem('syncspace_user', JSON.stringify(userData));
          setAuthError(null);
        })
        .catch(err => {
          console.error("[Auth] GET /api/auth/me failed. Status:", err.status, "Message:", err.message);
          if (err.status === 401 || err.status === 403) {
            console.log("[Auth] Invalid/expired token → clearing session.");
            localStorage.removeItem('syncspace_token');
            localStorage.removeItem('syncspace_user');
            setUser(null);
          } else {
            // Network error / timeout — keep token, restore cached user, show soft error
            console.log("[Auth] Network/timeout error → preserving token, loading cached user.");
            setAuthError(err.message || "Could not connect to server");
            const cachedUser = localStorage.getItem('syncspace_user');
            if (cachedUser) {
              try { setUser(JSON.parse(cachedUser)); } catch (e) {}
            }
          }
        })
        .finally(() => {
          console.log("[Auth] authLoading → false");
          setLoading(false);
        });
    } else {
      console.log("[Auth] No token → authLoading false");
      setLoading(false);
    }
  }, []);

  const retryAuth = async () => {
    setLoading(true);
    setAuthError(null);
    const token = localStorage.getItem('syncspace_token');
    if (token) {
      try {
        const userData = await authService.getMe();
        setUser(userData);
        localStorage.setItem('syncspace_user', JSON.stringify(userData));
        setAuthError(null);
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem('syncspace_token');
          localStorage.removeItem('syncspace_user');
          setUser(null);
        } else {
          setAuthError(err.message || "Connection error");
        }
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  // ─── LOGIN ──────────────────────────────────────────────────────────────────
  // IMPORTANT: login() does NOT set authLoading (loading).
  // authLoading is ONLY used for the initial app-boot session restore.
  // The button spinner in AuthPage.jsx handles its own local loading state.
  const login = async (email, password) => {
    console.log("[Auth] Login submit — email:", email);
    setAuthError(null);

    const data = await authService.login(email, password);
    // api.js response interceptor already unwraps response.data, so data = { success, token, user }
    console.log("[Auth] Login response received:", JSON.stringify(data).substring(0, 120));

    const token = data?.token;
    const userData = data?.user;

    console.log("[Auth] Token:", token ? token.substring(0, 25) + '...' : '❌ MISSING');
    console.log("[Auth] User:", userData ? userData.name + ' / ' + userData._id : '❌ MISSING');

    if (!token) throw new Error("Server returned no token. Check backend.");
    if (!userData) throw new Error("Server returned no user. Check backend.");

    // Persist to localStorage
    localStorage.setItem('syncspace_token', token);
    localStorage.setItem('syncspace_user', JSON.stringify(userData));

    console.log("[Auth] localStorage — syncspace_token saved:", !!localStorage.getItem('syncspace_token'));
    console.log("[Auth] localStorage — syncspace_user saved:", !!localStorage.getItem('syncspace_user'));

    // Update React state → App.jsx will re-render and show Dashboard
    setUser(userData);
    console.log("[Auth] setUser called → Dashboard should render next frame.");

    return data;
  };

  // ─── REGISTER ───────────────────────────────────────────────────────────────
  const register = async (name, email, password) => {
    console.log("[Auth] Register submit — email:", email);
    setAuthError(null);

    const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 7);
    const data = await authService.register(name, username, email, password);
    console.log("[Auth] Register response received:", JSON.stringify(data).substring(0, 120));

    const token = data?.token;
    const userData = data?.user;

    if (!token) throw new Error("Server returned no token. Check backend.");
    if (!userData) throw new Error("Server returned no user. Check backend.");

    localStorage.setItem('syncspace_token', token);
    localStorage.setItem('syncspace_user', JSON.stringify(userData));

    setUser(userData);
    console.log("[Auth] Register → setUser called → Dashboard should render.");

    return data;
  };

  // ─── LOGOUT ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    try { await authService.logout(); } catch (e) {}
    localStorage.removeItem('syncspace_token');
    localStorage.removeItem('syncspace_user');
    setUser(null);
    setAuthError(null);
    disconnectSocket();
  };

  const updateProfileDetails = async (name, bio, statusMessage) => {
    try {
      const updatedUser = await userService.updateProfile({ name, bio, statusMessage });
      setUser(prev => ({ ...prev, ...updatedUser }));
      localStorage.setItem('syncspace_user', JSON.stringify({ ...user, ...updatedUser }));
      return updatedUser;
    } catch (err) { throw err; }
  };

  const updateAvatarImage = async (avatarFile) => {
    try {
      const updatedUser = await userService.uploadAvatar(avatarFile);
      setUser(prev => ({ ...prev, avatar: updatedUser.avatar }));
      localStorage.setItem('syncspace_user', JSON.stringify({ ...user, avatar: updatedUser.avatar }));
      return updatedUser;
    } catch (err) { throw err; }
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, retryAuth, login, register, logout, updateProfileDetails, updateAvatarImage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
