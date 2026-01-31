const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');
const { autoUpdater } = require('electron-updater');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let backendProcess;
let frontendServer;
const FRONTEND_PORT = 4001;

// Ruta al backend - usar siempre ruta relativa desde __dirname cuando no está empaquetado
const BACKEND_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'backend')
  : path.join(__dirname, '../../backend');

// Ruta al frontend exportado
const FRONTEND_PATH = path.join(__dirname, '../out');

/**
 * Iniciar servidor local para servir el frontend estático
 * Esto soluciona el problema de rutas /_next/ en Electron
 */
function startFrontendServer() {
  return new Promise((resolve, reject) => {
    try {
      const express = require('express');
      const { createProxyMiddleware } = require('http-proxy-middleware');
      const frontendApp = express();
      
      // Proxy para las peticiones de API al backend
      frontendApp.use('/api', createProxyMiddleware({
        target: 'http://localhost:3000',
        changeOrigin: true,
        logLevel: 'warn',
        onError: (err, req, res) => {
          console.error('Proxy error:', err.message);
          res.status(502).json({ error: 'Backend not available' });
        }
      }));
      
      // Servir archivos estáticos
      frontendApp.use(express.static(FRONTEND_PATH));
      
      // SPA fallback - servir index.html para todas las rutas que no son archivos
      frontendApp.use((req, res, next) => {
        const filePath = path.join(FRONTEND_PATH, req.path);
        const htmlPath = path.join(FRONTEND_PATH, req.path, 'index.html');
        
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          res.sendFile(filePath);
        } else if (fs.existsSync(htmlPath)) {
          res.sendFile(htmlPath);
        } else {
          res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
        }
      });
      
      frontendServer = frontendApp.listen(FRONTEND_PORT, 'localhost', () => {
        console.log(`🌐 Frontend server running at http://localhost:${FRONTEND_PORT}`);
        resolve();
      });
      
      frontendServer.on('error', (err) => {
        console.error('Frontend server error:', err);
        reject(err);
      });
    } catch (err) {
      console.error('Failed to start frontend server:', err);
      reject(err);
    }
  });
}

/**
 * Iniciar el backend NestJS como proceso hijo
 */
function startBackend() {
  console.log('🚀 Starting backend server...');
  
  // El script está en dist/main.js cuando no está empaquetado
  const backendScript = app.isPackaged
    ? path.join(BACKEND_PATH, 'main.js')
    : path.join(BACKEND_PATH, 'dist', 'main.js');
  
  console.log(`📁 Backend path: ${backendScript}`);
  console.log(`📦 App is packaged: ${app.isPackaged}`);

  backendProcess = spawn('node', [backendScript], {
    cwd: BACKEND_PATH,
    env: {
      ...process.env,
      NODE_ENV: isDev ? 'development' : 'production',
      PORT: '3000',
    },
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`[Backend] ${data.toString()}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[Backend Error] ${data.toString()}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

/**
 * Detener el backend al cerrar la app
 */
function stopBackend() {
  if (backendProcess) {
    console.log('🛑 Stopping backend server...');
    backendProcess.kill();
    backendProcess = null;
  }
}

/**
 * Crear la ventana principal de Electron
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, '../public/icons/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Necesario para cargar archivos locales con CSS
    },
    backgroundColor: '#0a0f1a',
    show: false,
    titleBarStyle: 'default',
    frame: true,
  });

  // Esperar a que el backend esté listo antes de cargar el frontend
  const loadApp = () => {
    if (isDev) {
      mainWindow.loadURL('http://localhost:4000');
      mainWindow.webContents.openDevTools();
    } else {
      // En producción, usar servidor local para el frontend
      mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);
    }
    
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });
  };

  // Dar tiempo al backend para iniciar
  setTimeout(loadApp, 2000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Inicialización de Electron
 */
app.whenReady().then(async () => {
  // En producción, iniciar el servidor local para el frontend
  if (!isDev) {
    await startFrontendServer();
  }
  
  // Iniciar backend primero
  startBackend();
  
  // Luego crear la ventana
  createWindow();

  // Configurar auto-updater (solo en producción)
  if (!isDev) {
    setupAutoUpdater();
    // Verificar actualizaciones al iniciar
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(console.error);
    }, 5000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Cerrar la app cuando todas las ventanas se cierren (excepto en macOS)
 */
app.on('window-all-closed', () => {
  stopBackend();
  // Cerrar servidor frontend
  if (frontendServer) {
    frontendServer.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Limpieza al salir
 */
app.on('before-quit', () => {
  stopBackend();
  if (frontendServer) {
    frontendServer.close();
  }
});

/**
 * IPC Handlers (comunicación con el renderer)
 */
ipcMain.handle('get-backend-status', async () => {
  return {
    running: backendProcess !== null,
    url: 'http://localhost:3000',
  };
});

ipcMain.handle('restart-backend', async () => {
  stopBackend();
  startBackend();
  return { success: true };
});

/**
 * Auto-Updater Configuration
 */
function setupAutoUpdater() {
  // Configurar logging
  autoUpdater.logger = require('electron-log');
  autoUpdater.logger.transports.file.level = 'info';

  // Repositorio público - no necesita token
  // Las actualizaciones se descargan directamente de GitHub Releases

  // No auto-descargar, esperar confirmación del usuario
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Eventos del auto-updater
  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Buscando actualizaciones...');
  });

  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Actualización Disponible',
      message: `Nueva versión ${info.version} disponible`,
      detail: '¿Deseas descargar e instalar la actualización ahora?',
      buttons: ['Actualizar Ahora', 'Más Tarde'],
      defaultId: 0,
      cancelId: 1,
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  autoUpdater.on('update-not-available', () => {
    sendStatusToWindow('Aplicación actualizada');
  });

  autoUpdater.on('error', (err) => {
    sendStatusToWindow('Error en actualización: ' + err.message);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let message = `Descargando: ${Math.round(progressObj.percent)}%`;
    sendStatusToWindow(message);
    
    // Enviar progreso a la ventana
    if (mainWindow) {
      mainWindow.webContents.send('update-progress', progressObj.percent);
    }
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Actualización Lista',
      message: 'La actualización se ha descargado',
      detail: 'La aplicación se reiniciará para instalar la actualización.',
      buttons: ['Reiniciar Ahora', 'Más Tarde'],
      defaultId: 0,
      cancelId: 1,
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
}

function sendStatusToWindow(text) {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', text);
  }
  console.log('[AutoUpdater]', text);
}

// IPC para verificar actualizaciones manualmente
ipcMain.handle('check-for-updates', async () => {
  if (!isDev) {
    try {
      const result = await autoUpdater.checkForUpdates();
      return { success: true, version: result?.updateInfo?.version };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Updates disabled in development' };
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('quit-and-install', () => {
  autoUpdater.quitAndInstall();
});
