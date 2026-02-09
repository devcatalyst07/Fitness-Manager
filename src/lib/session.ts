import { apiClient } from './axios';

/**
 * Session check interval (1 minute)
 */
const SESSION_CHECK_INTERVAL = parseInt(
  process.env.NEXT_PUBLIC_SESSION_CHECK_INTERVAL || '60000'
);

/**
 * Session storage keys
 */
const STORAGE_KEYS = {
  LAST_ACTIVITY: 'fitout_last_activity',
  SESSION_ID: 'fitout_session_id',
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
 * Check if session is active across tabs
 */
export const isSessionActive = (): boolean => {
  const lastActivity = getLastActivity();
  
  if (!lastActivity) return false;
  
  // Consider session active if last activity was within 30 minutes
  const THIRTY_MINUTES = 30 * 60 * 1000;
  return Date.now() - lastActivity < THIRTY_MINUTES;
};

/**
 * Session monitor class
 */
export class SessionMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: Set<() => void> = new Set();
  
  /**
   * Start monitoring session
   */
  start() {
    if (this.intervalId) return;
    
    console.log('🔒 Session monitor started');
    
    // Check session immediately
    this.checkSession();
    
    // Check session periodically
    this.intervalId = setInterval(() => {
      this.checkSession();
    }, SESSION_CHECK_INTERVAL);
    
    // Update activity on user interaction
    this.setupActivityTracking();
  }
  
  /**
   * Stop monitoring session
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🔒 Session monitor stopped');
    }
  }
  
  /**
   * Check session validity
   */
  private async checkSession() {
    try {
      // Call /api/auth/me to verify session
      await apiClient.get('/api/auth/me');
      
      // Session valid - update last activity
      updateLastActivity();
    } catch (error: any) {
      console.error('Session check failed:', error);
      
      // Emit session expired event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('session:expired'));
      }
    }
  }
  
  /**
   * Setup activity tracking
   */
  private setupActivityTracking() {
    if (typeof window === 'undefined') return;
    
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      updateLastActivity();
      this.notifyListeners();
    };
    
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
  }
  
  /**
   * Add listener for activity updates
   */
  addListener(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  /**
   * Notify all listeners
   */
  private notifyListeners() {
    this.listeners.forEach((callback) => callback());
  }
}

/**
 * Sync session across tabs using BroadcastChannel
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
  
  /**
   * Broadcast logout to all tabs
   */
  broadcastLogout() {
    this.channel?.postMessage({ type: 'logout' });
  }
  
  /**
   * Broadcast login to all tabs
   */
  broadcastLogin(user: any) {
    this.channel?.postMessage({ type: 'login', data: user });
  }
  
  /**
   * Broadcast session refresh
   */
  broadcastRefresh() {
    this.channel?.postMessage({ type: 'refresh' });
  }
  
  /**
   * Add listener for session events
   */
  addListener(callback: (event: string, data?: any) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  /**
   * Notify all listeners
   */
  private notifyListeners(event: string, data?: any) {
    this.listeners.forEach((callback) => callback(event, data));
  }
  
  /**
   * Close channel
   */
  close() {
    this.channel?.close();
  }
}

/**
 * Global session monitor and sync instances
 */
export const sessionMonitor = new SessionMonitor();
export const sessionSync = new SessionSync();