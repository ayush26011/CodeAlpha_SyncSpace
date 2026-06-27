import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import * as settingsService from '../services/settingsService';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    settingsService.getSettings()
      .then(data => {
        setSettings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching settings:", err);
        setLoading(false);
      });
  }, [user]);

  const updatePrivacy = async (privacyData) => {
    try {
      const data = await settingsService.updatePrivacy(privacyData);
      setSettings(data);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const updateNotifications = async (notificationsData) => {
    try {
      const data = await settingsService.updateNotifications(notificationsData);
      setSettings(data);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const updateAppearance = async (appearanceData) => {
    try {
      const data = await settingsService.updateAppearance(appearanceData);
      setSettings(data);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const updateSecurity = async (securityData) => {
    try {
      const data = await settingsService.updateSecurity(securityData);
      setSettings(data);
      return data;
    } catch (err) {
      throw err;
    }
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      updatePrivacy,
      updateNotifications,
      updateAppearance,
      updateSecurity
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
export default SettingsContext;
