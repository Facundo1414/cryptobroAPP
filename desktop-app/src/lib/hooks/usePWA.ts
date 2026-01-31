"use client";

import { useEffect, useState, useCallback } from "react";
import {
  isPWASupported,
  isInstalledPWA,
  registerServiceWorker,
  requestNotificationPermission,
  showLocalNotification,
  showSignalNotification,
  checkForUpdates,
  initInstallPrompt,
  showInstallPrompt,
  isInstallPromptAvailable,
} from "@/lib/pwa";

export interface PWAState {
  isSupported: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  notificationPermission: NotificationPermission | "unsupported";
  updateAvailable: boolean;
  installPromptAvailable: boolean;
  swRegistration: ServiceWorkerRegistration | null;
}

export interface PWAActions {
  requestNotifications: () => Promise<boolean>;
  showNotification: (title: string, body?: string) => Promise<void>;
  showSignalAlert: (
    signal: Parameters<typeof showSignalNotification>[0],
  ) => Promise<void>;
  checkForUpdates: () => Promise<boolean>;
  promptInstall: () => Promise<boolean>;
  refreshApp: () => void;
}

export function usePWA(): PWAState & PWAActions {
  const [state, setState] = useState<PWAState>({
    isSupported: false,
    isInstalled: false,
    isOnline: true,
    notificationPermission: "unsupported",
    updateAvailable: false,
    installPromptAvailable: false,
    swRegistration: null,
  });

  // Initialize PWA
  useEffect(() => {
    const init = async () => {
      const supported = isPWASupported();
      const installed = isInstalledPWA();
      const online = navigator.onLine;
      const permission =
        "Notification" in window ? Notification.permission : "unsupported";

      setState((prev) => ({
        ...prev,
        isSupported: supported,
        isInstalled: installed,
        isOnline: online,
        notificationPermission: permission,
      }));

      if (supported) {
        // Register service worker
        const registration = await registerServiceWorker();
        setState((prev) => ({
          ...prev,
          swRegistration: registration,
        }));

        // Initialize install prompt handler
        initInstallPrompt();
      }
    };

    init();
  }, []);

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () =>
      setState((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () =>
      setState((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Listen for PWA events
  useEffect(() => {
    const handleUpdateAvailable = () => {
      setState((prev) => ({ ...prev, updateAvailable: true }));
    };

    const handleInstallAvailable = () => {
      setState((prev) => ({ ...prev, installPromptAvailable: true }));
    };

    window.addEventListener("pwa-update-available", handleUpdateAvailable);
    window.addEventListener("pwa-install-available", handleInstallAvailable);

    // Check initial install prompt state
    setState((prev) => ({
      ...prev,
      installPromptAvailable: isInstallPromptAvailable(),
    }));

    return () => {
      window.removeEventListener("pwa-update-available", handleUpdateAvailable);
      window.removeEventListener(
        "pwa-install-available",
        handleInstallAvailable,
      );
    };
  }, []);

  // Request notifications
  const requestNotifications = useCallback(async (): Promise<boolean> => {
    const permission = await requestNotificationPermission();
    setState((prev) => ({ ...prev, notificationPermission: permission }));
    return permission === "granted";
  }, []);

  // Show notification
  const showNotification = useCallback(
    async (title: string, body?: string): Promise<void> => {
      await showLocalNotification(title, { body });
    },
    [],
  );

  // Show signal alert
  const showSignalAlert = useCallback(
    async (
      signal: Parameters<typeof showSignalNotification>[0],
    ): Promise<void> => {
      await showSignalNotification(signal);
    },
    [],
  );

  // Check for updates
  const handleCheckForUpdates = useCallback(async (): Promise<boolean> => {
    return await checkForUpdates();
  }, []);

  // Prompt install
  const promptInstall = useCallback(async (): Promise<boolean> => {
    const accepted = await showInstallPrompt();
    if (accepted) {
      setState((prev) => ({
        ...prev,
        installPromptAvailable: false,
        isInstalled: true,
      }));
    }
    return accepted;
  }, []);

  // Refresh app (after update)
  const refreshApp = useCallback((): void => {
    window.location.reload();
  }, []);

  return {
    ...state,
    requestNotifications,
    showNotification,
    showSignalAlert,
    checkForUpdates: handleCheckForUpdates,
    promptInstall,
    refreshApp,
  };
}
