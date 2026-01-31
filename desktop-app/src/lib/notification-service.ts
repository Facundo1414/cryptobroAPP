import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/api/notification";

export class NotificationService {
  private static isEnabled = true;
  private static soundEnabled = true;

  static async init() {
    if (typeof window === "undefined" || !(window as any).__TAURI__) {
      console.log("Tauri not available, using browser notifications");
      return;
    }

    let permissionGranted = await isPermissionGranted();

    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }

    return permissionGranted;
  }

  static setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  static setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  static async send(title: string, body: string, icon?: string) {
    if (!this.isEnabled) return;

    try {
      // Play sound if enabled
      if (this.soundEnabled) {
        this.playNotificationSound();
      }

      // Check if Tauri is available
      if (typeof window !== "undefined" && (window as any).__TAURI__) {
        await sendNotification({ title, body, icon });
      } else {
        // Fallback to browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body, icon });
        }
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  static async sendSignal(signal: {
    type: string;
    symbol: string;
    confidence: number;
    reason?: string;
  }) {
    const confidencePercent = (signal.confidence * 100).toFixed(0);
    const title = `${signal.type === "BUY" ? "🟢" : "🔴"} ${signal.type} Signal: ${signal.symbol}`;
    const body = signal.reason
      ? `${signal.reason} (${confidencePercent}% confidence)`
      : `${signal.type} signal detected with ${confidencePercent}% confidence`;
    await this.send(title, body, signal.type === "BUY" ? "📈" : "📉");
  }

  static async sendAlert(alert: {
    symbol: string;
    message?: string;
    condition?: string;
    targetPrice?: number;
    currentPrice?: number;
  }) {
    const title = `⚠️ Alert: ${alert.symbol}`;
    const body =
      alert.message ||
      (alert.condition && alert.targetPrice && alert.currentPrice
        ? `${alert.symbol} is now ${alert.condition === "ABOVE" ? "above" : "below"} $${alert.targetPrice}. Current price: $${alert.currentPrice}`
        : `Alert triggered for ${alert.symbol}`);
    await this.send(title, body, "🔔");
  }

  static async sendNews(news: { title: string; sentiment?: string }) {
    const emoji =
      news.sentiment === "positive"
        ? "📈"
        : news.sentiment === "negative"
          ? "📉"
          : "📰";
    await this.send(`${emoji} Crypto News`, news.title);
  }

  static async sendBacktestComplete(result: {
    strategyName: string;
    return: number;
  }) {
    const title = "Backtest Completed";
    const body = `${result.strategyName}: ${result.return >= 0 ? "+" : ""}${result.return.toFixed(2)}% return`;
    await this.send(title, body, "📊");
  }

  private static playNotificationSound() {
    try {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.3;
      audio.play().catch((err) => console.log("Could not play sound:", err));
    } catch (error) {
      // Silently fail if sound cannot be played
    }
  }
}

// Auto-initialize
if (typeof window !== "undefined") {
  NotificationService.init();
}
