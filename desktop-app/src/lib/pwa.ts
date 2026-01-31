// PWA utilities and Service Worker registration

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Check if PWA features are available
export const isPWASupported = (): boolean => {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
};

// Check if app is installed as PWA
export const isInstalledPWA = (): boolean => {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://")
  );
};

// Register Service Worker
export const registerServiceWorker =
  async (): Promise<ServiceWorkerRegistration | null> => {
    if (!isPWASupported()) {
      console.log("[PWA] Service Worker not supported");
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log("[PWA] Service Worker registered:", registration.scope);

      // Handle updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New content available
              console.log("[PWA] New content available, refresh to update");
              dispatchEvent(new CustomEvent("pwa-update-available"));
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error("[PWA] Service Worker registration failed:", error);
      return null;
    }
  };

// Request notification permission
export const requestNotificationPermission =
  async (): Promise<NotificationPermission> => {
    if (!("Notification" in window)) {
      console.log("[PWA] Notifications not supported");
      return "denied";
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  };

// Get push subscription
export const getPushSubscription = async (
  registration: ServiceWorkerRegistration,
  vapidPublicKey?: string,
): Promise<PushSubscription | null> => {
  try {
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription && vapidPublicKey) {
      // Convert VAPID key to Uint8Array
      const urlBase64ToUint8Array = (base64String: string): ArrayBuffer => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
          .replace(/-/g, "+")
          .replace(/_/g, "/");
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray.buffer as ArrayBuffer;
      };

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log("[PWA] Push subscription created");
    }

    return subscription;
  } catch (error) {
    console.error("[PWA] Failed to get push subscription:", error);
    return null;
  }
};

// Show local notification (for testing)
export const showLocalNotification = async (
  title: string,
  options?: Omit<NotificationOptions, "vibrate"> & { vibrate?: number[] },
): Promise<void> => {
  const permission = await requestNotificationPermission();

  if (permission !== "granted") {
    console.log("[PWA] Notification permission denied");
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  // Build notification options without vibrate (not supported in all browsers)
  const { vibrate, ...restOptions } = options || {};
  const notificationOptions: NotificationOptions = {
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    tag: "cryptobro-notification",
    ...restOptions,
  };

  await registration.showNotification(title, notificationOptions);
};

// Extended notification options for service worker
interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number[];
  actions?: Array<{ action: string; title: string }>;
}

// Show signal notification
export const showSignalNotification = async (signal: {
  symbol: string;
  type: "BUY" | "SELL";
  price: number;
  confidence: number;
}): Promise<void> => {
  const emoji = signal.type === "BUY" ? "🟢" : "🔴";
  const action = signal.type === "BUY" ? "Compra" : "Venta";

  await showLocalNotification(`${emoji} Señal de ${action}: ${signal.symbol}`, {
    body: `Precio: $${signal.price.toLocaleString()} | Confianza: ${signal.confidence}%`,
    data: {
      url: "/signals",
      signal,
    },
  } as ExtendedNotificationOptions);
};

// Check for app updates
export const checkForUpdates = async (): Promise<boolean> => {
  if (!isPWASupported()) return false;

  const registration = await navigator.serviceWorker.ready;

  try {
    await registration.update();
    return true;
  } catch (error) {
    console.error("[PWA] Update check failed:", error);
    return false;
  }
};

// Clear all caches (for troubleshooting)
export const clearAllCaches = async (): Promise<void> => {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log("[PWA] All caches cleared");
};

// Get install prompt event (for custom install button)
let deferredPrompt: Event | null = null;

export const initInstallPrompt = (): void => {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    dispatchEvent(new CustomEvent("pwa-install-available"));
  });
};

export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) return false;

  const promptEvent = deferredPrompt as any;
  promptEvent.prompt();

  const { outcome } = await promptEvent.userChoice;
  deferredPrompt = null;

  return outcome === "accepted";
};

export const isInstallPromptAvailable = (): boolean => {
  return deferredPrompt !== null;
};
