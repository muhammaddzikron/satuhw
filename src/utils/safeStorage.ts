/**
 * Safe LocalStorage Utility with automatic quota protection and base64 pruning
 */

// Helper to sanitize heavy base64 strings when saving to limited browser localStorage
export function pruneHeavyDataForStorage(data: any): any {
  if (!data) return data;

  if (Array.isArray(data)) {
    // Keep at most 200 items in local cache
    return data.slice(0, 200).map(item => pruneHeavyDataForStorage(item));
  }

  if (typeof data === 'object') {
    const copy: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === 'string') {
        // If string is a large base64 data URL (> 4KB), strip it in local cache to protect quota
        if (v.startsWith('data:image/') || (v.length > 4096 && (k.toLowerCase().includes('photo') || k.toLowerCase().includes('foto') || k.toLowerCase().includes('bukti') || k.toLowerCase().includes('lampiran') || k.toLowerCase().includes('ktp')))) {
          // Keep a short placeholder or thumbnail marker so UI knows a photo exists
          copy[k] = v.length > 200 ? v.substring(0, 80) + '...[truncated-local-cache]' : v;
        } else {
          copy[k] = v;
        }
      } else if (typeof v === 'object' && v !== null) {
        copy[k] = pruneHeavyDataForStorage(v);
      } else {
        copy[k] = v;
      }
    }
    return copy;
  }

  return data;
}

export function safeStorageSet(key: string, value: any): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  const rawString = typeof value === 'string' ? value : JSON.stringify(value);

  try {
    localStorage.setItem(key, rawString);
    return true;
  } catch (err: any) {
    // Check if quota exceeded
    console.warn(`[SafeStorage] localStorage.setItem for key "${key}" failed, pruning payload to protect quota...`);

    try {
      // 1. Try pruning large base64/objects
      const pruned = pruneHeavyDataForStorage(typeof value === 'string' ? JSON.parse(value) : value);
      localStorage.setItem(key, JSON.stringify(pruned));
      return true;
    } catch (err2: any) {
      // 2. If still failing, clean up non-critical caches
      try {
        const nonCriticalKeys = [
          'contents',
          'hw_activities',
          'activity_applications',
          'hw_deleted_activities',
          'hw_deleted_activity_titles',
          'deleted_activity_app_ids'
        ];
        for (const k of nonCriticalKeys) {
          if (k !== key) {
            localStorage.removeItem(k);
          }
        }
        // Try saving pruned version once more
        const pruned = pruneHeavyDataForStorage(typeof value === 'string' ? JSON.parse(value) : value);
        localStorage.setItem(key, JSON.stringify(pruned));
        return true;
      } catch (err3) {
        console.warn(`[SafeStorage] Could not persist key "${key}" even after cleaning. Storage quota full.`);
        return false;
      }
    }
  }
}

export function safeStorageGet<T = any>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (e) {
    return defaultValue;
  }
}

export function safeStorageRemove(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}
