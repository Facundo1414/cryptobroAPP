const { contextBridge, ipcRenderer } = require('electron');

/**
 * Exponer APIs seguras al renderer process
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Backend status
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
  restartBackend: () => ipcRenderer.invoke('restart-backend'),
  
  // Auto-updater
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
  
  // Update events
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (_, message) => callback(message));
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-progress', (_, percent) => callback(percent));
  },
  
  // Información de la app
  platform: process.platform,
  isElectron: true,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});

console.log('⚡ Electron preload script loaded');
