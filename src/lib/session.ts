/**
 * Session Management — FIXED
 *
 * KEY CHANGES:
 * 1. SessionMonitor NO LONGER calls /api/auth/me — that was redundant
 *    with the token refresh service and caused rate limit exhaustion
 * 2. Activity tracking is local-only (localStorage timestamps)
 * 3. SessionSync is unchanged (already working correctly)
 */

const STORAGE_KEYS = {
  LAST_ACTIVITY: 'fitout_last_activity',
} as const;

/**
 * Update last activity timestamp
 */
export const updateLastActivity = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
  }
};

/**
 * Get last activity timestamp
 */
export const getLastActivity = (): number | null => {
  if (typeof window === 'undefined') return null;
  const timestamp = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
  return timestamp ? parseInt(timestamp) : null;
};

/**
 * Check if user has been active recently
 */
export const isSessionActive = (): boolean => {
  const lastActivity = getLastActivity();
  if (!lastActivity) return false;
  const THIRTY_MINUTES = 30 * 60 * 1000;
  return Date.now() - lastActivity < THIRTY_MINUTES;
};

/**
 * Activity tracker — LOCAL ONLY, no API calls
 *
 * This only tracks user activity timestamps in localStorage.
 * Token refresh is handled exclusively by tokenRefreshService.
 * Session validation is handled exclusively by the axios interceptor.
 */
export class SessionMonitor {
  private cleanupFns: Array<() => void> = [];
  private hasStarted = false;

  start() {
    if (this.hasStarted) return;
    this.hasStarted = true;

    updateLastActivity();
    this.setupActivityTracking();
    console.log('Activity tracker started');
  }

  stop() {
    this.cleanupFns.forEach(fn => fn());
    this.cleanupFns = [];
    this.hasStarted = false;
    console.log('Activity tracker stopped');
  }

  isRunning(): boolean {
    return this.hasStarted;
  }

  private setupActivityTracking() {
    if (typeof window === 'undefined') return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    let lastUpdate = 0;
    const THROTTLE_MS = 60000; // 1 minute throttle

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > THROTTLE_MS) {
        updateLastActivity();
        lastUpdate = now;
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
      this.cleanupFns.push(() =>
        window.removeEventListener(event, handleActivity)
      );
    });
  }
}

/**
 * Cross-tab session sync via BroadcastChannel
 */
export class SessionSync {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: string, data?: any) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('fitout_session');

      this.channel.onmessage = (event) => {
        const { type, data } = event.data;
        this.notifyListeners(type, data);
      };
    }
  }

  broadcastLogout() {
    this.channel?.postMessage({ type: 'logout' });
  }

  broadcastLogin(user: any) {
    this.channel?.postMessage({ type: 'login', data: user });
  }

  broadcastRefresh() {
    this.channel?.postMessage({ type: 'refresh' });
  }

  addListener(callback: (event: string, data?: any) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(event: string, data?: any) {
    this.listeners.forEach((callback) => callback(event, data));
  }

  close() {
    this.channel?.close();
  }
}

// Singleton instances
export const sessionMonitor = new SessionMonitor();
export const sessionSync = new SessionSync();