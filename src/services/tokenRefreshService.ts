import { refreshTokens, isRefreshInProgress } from '@/lib/axios';

/**
 * Token Refresh Service — FIXED
 *
 * KEY PRINCIPLES:
 * 1. Only started AFTER a successful login or session check
 * 2. No immediate refresh on start — the session was just validated
 * 3. Uses shared refreshTokens() from axios.ts — single code path
 * 4. If refresh fails with 401, stops permanently (session is dead)
 */
class TokenRefreshService {
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;

  // Refresh every 25 minutes (5 min before 30-min token expires)
  private readonly REFRESH_INTERVAL_MS = 25 * 60 * 1000;

  /**
   * Start periodic token refresh
   * Called only after confirming we have a valid session
   */
  start() {
    // Idempotent — clear any existing timer first
    this.stop();

    console.log('Token refresh service started');

    // NO immediate refresh — we were just authenticated
    // First refresh happens after the interval
    this.refreshTimer = setInterval(() => {
      this.doRefresh();
    }, this.REFRESH_INTERVAL_MS);
  }

  /**
   * Stop periodic token refresh
   */
  stop() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('Token refresh service stopped');
    }
    this.retryCount = 0;
  }

  /**
   * Check if service is running
   */
  isRunning(): boolean {
    return this.refreshTimer !== null;
  }

  /**
   * Perform a refresh — delegates to shared axios refresh
   */
  async doRefresh(): Promise<void> {
    // Skip if already refreshing from somewhere else
    if (isRefreshInProgress()) {
      return;
    }

    try {
      await refreshTokens();
      this.retryCount = 0;
    } catch (error: any) {
      const status = error?.response?.status;

      // 401 = refresh token is dead — stop permanently
      if (status === 401) {
        console.log('Refresh token expired, stopping service');
        this.stop();
        // session:expired event already emitted by axios interceptor
        return;
      }

      // Network/server error — retry with backoff
      this.retryCount++;
      if (this.retryCount <= this.MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
        console.log(`Refresh retry ${this.retryCount}/${this.MAX_RETRIES} in ${delay / 1000}s`);
        setTimeout(() => this.doRefresh(), delay);
      } else {
        console.error('Max refresh retries exceeded, stopping');
        this.stop();
      }
    }
  }

  /**
   * Manual refresh (e.g., on tab re-focus)
   */
  async refreshNow(): Promise<void> {
    this.retryCount = 0;
    return this.doRefresh();
  }
}

// Singleton
export const tokenRefreshService = new TokenRefreshService();