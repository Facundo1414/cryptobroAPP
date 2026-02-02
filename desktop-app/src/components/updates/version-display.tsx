'use client';

import { useState, useEffect } from 'react';
import { Download, RefreshCw, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface VersionInfo {
  current: string;
  checking: boolean;
  updateAvailable: boolean;
  newVersion?: string;
  downloading: boolean;
  downloadProgress: number;
  error?: string;
}

export function VersionDisplay() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo>({
    current: '...',
    checking: false,
    updateAvailable: false,
    downloading: false,
    downloadProgress: 0,
  });

  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

  useEffect(() => {
    loadVersion();
    setupListeners();
  }, []);

  const loadVersion = async () => {
    if (isElectron) {
      try {
        const version = await (window as any).electronAPI.getAppVersion();
        setVersionInfo(prev => ({ ...prev, current: version }));
      } catch (error) {
        console.error('Error getting version:', error);
        setVersionInfo(prev => ({ ...prev, current: 'Error' }));
      }
    } else {
      // Web version - read from package.json or hardcoded
      setVersionInfo(prev => ({ ...prev, current: '1.1.0 (Web)' }));
    }
  };

  const setupListeners = () => {
    if (!isElectron) return;

    const api = (window as any).electronAPI;

    api.onUpdateStatus?.((message: string) => {
      console.log('Update status:', message);
    });

    api.onUpdateProgress?.((percent: number) => {
      setVersionInfo(prev => ({
        ...prev,
        downloading: true,
        downloadProgress: percent,
      }));
    });
  };

  const checkForUpdates = async () => {
    if (!isElectron) {
      setVersionInfo(prev => ({
        ...prev,
        error: 'Las actualizaciones automáticas solo están disponibles en la versión de escritorio.',
      }));
      return;
    }

    setVersionInfo(prev => ({ ...prev, checking: true, error: undefined }));

    try {
      const result = await (window as any).electronAPI.checkForUpdates();
      
      if (result.success) {
        if (result.version && result.version !== versionInfo.current) {
          setVersionInfo(prev => ({
            ...prev,
            checking: false,
            updateAvailable: true,
            newVersion: result.version,
          }));
        } else {
          setVersionInfo(prev => ({
            ...prev,
            checking: false,
            updateAvailable: false,
          }));
        }
      } else {
        setVersionInfo(prev => ({
          ...prev,
          checking: false,
          error: result.error || 'Error al buscar actualizaciones',
        }));
      }
    } catch (error: any) {
      setVersionInfo(prev => ({
        ...prev,
        checking: false,
        error: error.message || 'Error al buscar actualizaciones',
      }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Version */}
      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Info className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-white">Versión Actual</p>
            <p className="text-sm text-gray-400">CryptoBro v{versionInfo.current}</p>
          </div>
        </div>
      </div>

      {/* Update Status */}
      {versionInfo.updateAvailable && (
        <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-green-400" />
            <div className="flex-1">
              <p className="font-medium text-green-400">¡Nueva versión disponible!</p>
              <p className="text-sm text-green-400/70">
                Versión {versionInfo.newVersion} está lista para descargar
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Download Progress */}
      {versionInfo.downloading && (
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
            <p className="text-blue-400">Descargando actualización...</p>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${versionInfo.downloadProgress}%` }}
            />
          </div>
          <p className="text-sm text-blue-400/70 mt-1 text-right">
            {versionInfo.downloadProgress.toFixed(0)}%
          </p>
        </div>
      )}

      {/* Error */}
      {versionInfo.error && (
        <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 text-sm">{versionInfo.error}</p>
          </div>
        </div>
      )}

      {/* Check for Updates Button */}
      <button
        onClick={checkForUpdates}
        disabled={versionInfo.checking || versionInfo.downloading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 
                   bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 
                   text-white rounded-lg font-medium transition-colors"
      >
        {versionInfo.checking ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Buscando actualizaciones...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            Buscar Actualizaciones
          </>
        )}
      </button>

      {/* Info text */}
      <p className="text-xs text-gray-500 text-center">
        {isElectron 
          ? 'Las actualizaciones se descargan automáticamente de GitHub Releases.'
          : 'Estás usando la versión web. Descarga la app de escritorio para actualizaciones automáticas.'}
      </p>
    </div>
  );
}
