import { useState, useEffect } from 'react';

export const useDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [appVersion, setAppVersion] = useState('');
  const [appName, setAppName] = useState('');

  useEffect(() => {
    const checkDesktop = async () => {
      if (window.electronAPI) {
        setIsDesktop(true);
        
        try {
          const version = await window.electronAPI.getAppVersion();
          const name = await window.electronAPI.getAppName();
          setAppVersion(version);
          setAppName(name);
        } catch (error) {
          console.error('Error getting app info:', error);
        }
      }
    };

    checkDesktop();
  }, []);

  const showOpenDialog = async (options = {}) => {
    if (!isDesktop) return null;
    
    try {
      return await window.electronAPI.showOpenDialog(options);
    } catch (error) {
      console.error('Error showing open dialog:', error);
      return null;
    }
  };

  const showSaveDialog = async (options = {}) => {
    if (!isDesktop) return null;
    
    try {
      return await window.electronAPI.showSaveDialog(options);
    } catch (error) {
      console.error('Error showing save dialog:', error);
      return null;
    }
  };

  const checkForUpdates = async () => {
    if (!isDesktop) return;
    
    try {
      await window.electronAPI.checkForUpdates();
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const minimizeWindow = async () => {
    if (!isDesktop) return;
    
    try {
      await window.electronAPI.minimize();
    } catch (error) {
      console.error('Error minimizing window:', error);
    }
  };

  const maximizeWindow = async () => {
    if (!isDesktop) return;
    
    try {
      await window.electronAPI.maximize();
    } catch (error) {
      console.error('Error maximizing window:', error);
    }
  };

  const closeWindow = async () => {
    if (!isDesktop) return;
    
    try {
      await window.electronAPI.close();
    } catch (error) {
      console.error('Error closing window:', error);
    }
  };

  return {
    isDesktop,
    appVersion,
    appName,
    showOpenDialog,
    showSaveDialog,
    checkForUpdates,
    minimizeWindow,
    maximizeWindow,
    closeWindow
  };
}; 