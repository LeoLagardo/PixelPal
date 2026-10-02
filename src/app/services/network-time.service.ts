import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

const LAST_VERIFIED_TIME_KEY = 'pixelpal_last_verified_timestamp';
const CACHED_OFFSET_KEY = 'pixelpal_time_offset_ms';

@Injectable({
  providedIn: 'root',
})
export class NetworkTimeService {
  private cachedOffsetMs: number = 0;
  private isVerifying: Promise<number> | null = null;

  constructor() {
    // Restore cached offset if available (sanity check: offset between UTC timestamps should be seconds, not hours)
    const savedOffset = localStorage.getItem(CACHED_OFFSET_KEY);
    if (savedOffset) {
      const parsed = parseInt(savedOffset, 10);
      if (!isNaN(parsed) && Math.abs(parsed) < 15 * 60 * 1000) {
        this.cachedOffsetMs = parsed;
      } else {
        localStorage.removeItem(CACHED_OFFSET_KEY);
        this.cachedOffsetMs = 0;
      }
    }
  }

  /**
   * Returns the highest verified epoch timestamp known so far (in ms).
   * Prevents system clock rollback.
   */
  public getLastVerifiedTimestamp(): number {
    const raw = localStorage.getItem(LAST_VERIFIED_TIME_KEY);
    if (raw) {
      const ts = parseInt(raw, 10);
      if (!isNaN(ts)) {
        return ts;
      }
    }
    return 0;
  }

  /**
   * Synchronous estimate of current time using local clock + last known offset,
   * clamped to at least the last verified timestamp.
   */
  public getEstimatedTime(): number {
    const estimated = Date.now() + this.cachedOffsetMs;
    const lastVerified = this.getLastVerifiedTimestamp();
    return Math.max(estimated, lastVerified);
  }

  /**
   * Queries online HTTP time servers with a 4-second timeout to get the verified network time.
   * If online verification fails (offline), falls back safely to estimated time with anti-rollback protection.
   */
  public async getVerifiedTime(): Promise<number> {
    if (this.isVerifying) {
      return this.isVerifying;
    }

    this.isVerifying = this.fetchNetworkTime();
    try {
      return await this.isVerifying;
    } finally {
      this.isVerifying = null;
    }
  }

  private async fetchNetworkTime(): Promise<number> {
    const servers = environment.proTrial?.timeServers || [
      'https://worldtimeapi.org/api/timezone/Etc/UTC',
      'https://timeapi.io/api/time/current/zone?timeZone=UTC',
    ];

    for (const url of servers) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const startTime = Date.now();
        const response = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const latency = Math.round((Date.now() - startTime) / 2);
          const data = await response.json();
          let serverTimeMs: number | null = null;

          // Format 1: worldtimeapi.org -> { unixtime: 1726484400 }
          if (typeof data.unixtime === 'number') {
            serverTimeMs = data.unixtime * 1000 + latency;
          }
          // Format 2: structured UTC date fields (timeapi.io)
          else if (typeof data.year === 'number' && typeof data.hour === 'number' && data.timeZone === 'UTC') {
            serverTimeMs = Date.UTC(
              data.year,
              (data.month || 1) - 1,
              data.day || 1,
              data.hour || 0,
              data.minute || 0,
              data.seconds || 0,
              data.milliSeconds || 0
            ) + latency;
          }
          // Format 3: datetime ISO string (worldtimeapi / timeapi)
          else if (data.dateTime || data.datetime || data.utc_datetime) {
            let dateStr = String(data.utc_datetime || data.dateTime || data.datetime).trim();
            // If no timezone offset is provided in the string, explicitly append 'Z' to parse as UTC
            if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !/T\d{2}:\d{2}:\d{2}.*-/.test(dateStr)) {
              dateStr = dateStr + 'Z';
            }
            const parsed = new Date(dateStr).getTime();
            if (!isNaN(parsed)) {
              serverTimeMs = parsed + latency;
            }
          }

          if (serverTimeMs && serverTimeMs > 0) {
            this.recordVerifiedTime(serverTimeMs);
            console.log(`[NetworkTimeService] Successfully synced network time from ${url}:`, new Date(serverTimeMs).toISOString());
            return serverTimeMs;
          }
        }
      } catch (err) {
        console.warn(`[NetworkTimeService] Failed fetching time from ${url}:`, err);
      }
    }

    // Fallback: Attempt HEAD request to extract Date header from reliable origin
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('https://cloudflare.com/cdn-cgi/trace', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);
      const dateHeader = res.headers.get('date');
      if (dateHeader) {
        const headerTime = new Date(dateHeader).getTime();
        if (!isNaN(headerTime) && headerTime > 0) {
          this.recordVerifiedTime(headerTime);
          console.log('[NetworkTimeService] Synced time from HTTP Date header:', new Date(headerTime).toISOString());
          return headerTime;
        }
      }
    } catch {
      // Ignore fallback error
    }

    // If completely offline or all servers failed: use estimated time with anti-rollback guard
    const estimated = this.getEstimatedTime();
    console.warn('[NetworkTimeService] Using estimated/cached time (offline fallback):', new Date(estimated).toISOString());
    return estimated;
  }

  private recordVerifiedTime(networkTimeMs: number): void {
    const lastVerified = this.getLastVerifiedTimestamp();
    const updatedTimestamp = Math.max(networkTimeMs, lastVerified);
    localStorage.setItem(LAST_VERIFIED_TIME_KEY, updatedTimestamp.toString());

    this.cachedOffsetMs = networkTimeMs - Date.now();
    localStorage.setItem(CACHED_OFFSET_KEY, this.cachedOffsetMs.toString());
  }
}
