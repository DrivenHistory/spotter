const PREFIX = "spotter_cache_";

export function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch { /* storage full or unavailable */ }
}

export function cacheClear(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch { /* ignore */ }
}
