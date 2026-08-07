import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import html2canvas from 'html2canvas';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function formatIndonesianDate(dateString?: string | number | Date | null, includeDay: boolean = false): string {
  if (!dateString) {
    const now = new Date();
    return formatIndonesianDate(now, includeDay);
  }

  try {
    let date: Date;
    if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === 'number') {
      date = new Date(dateString);
    } else if (typeof dateString === 'string') {
      const trimmed = dateString.trim();
      if (!trimmed || trimmed.includes('...')) {
        date = new Date();
      } else {
        date = new Date(trimmed);
        if (isNaN(date.getTime()) && trimmed.includes('-')) {
          const parts = trimmed.split('T')[0].split('-');
          if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            date = new Date(y, m, d);
          }
        }
      }
    } else {
      date = new Date();
    }

    if (isNaN(date.getTime())) {
      date = new Date();
    }

    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    if (includeDay) {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const dayName = days[date.getDay()];
      return `${dayName}, ${day} ${month} ${year}`;
    }

    return `${day} ${month} ${year}`;
  } catch {
    const now = new Date();
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

export function safeJsonParse<T>(val: any, fallback: T): T {
  if (val === undefined || val === null) {
    return fallback;
  }
  if (typeof val === 'object') {
    return val as unknown as T;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return fallback;
    try {
      return JSON.parse(trimmed) as T;
    } catch (e) {
      try {
        const withDoubleQuotes = trimmed.replace(/'/g, '"');
        return JSON.parse(withDoubleQuotes) as T;
      } catch (e2) {
        try {
          const fixedKeys = trimmed.replace(/([{,]\s*)([a-zA-Z0-9_\s\-]+?)\s*:/g, '$1"$2":');
          return JSON.parse(fixedKeys) as T;
        } catch (e3) {
          console.warn('safeJsonParse failed:', trimmed, e3);
        }
      }
    }
  }
  return fallback;
}

export function getDriveDirectLink(url: string | null | undefined): string {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/(.+?)(\/|$|\?|#)/) || url.match(/[?&]id=(.+?)(&|$|#)/);
    if (match && match[1]) {
      // Use lh3.googleusercontent.com format for native Google CORS support!
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }
  return url;
}

export function getCorsSafeUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  if (url.startsWith('/') || url.startsWith('blob:') || url.startsWith('http://localhost') || url.startsWith('https://localhost')) return url;
  
  // Resolve Google Drive links first
  const resolvedUrl = getDriveDirectLink(url);
  
  if (resolvedUrl.includes('googleusercontent.com')) {
    // Already supports CORS perfectly, no proxy needed!
    return resolvedUrl;
  }
  
  // Proxy other external URLs via images.weserv.nl (high speed, CORS enabled)
  if (resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://')) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(resolvedUrl)}`;
  }
  
  return resolvedUrl;
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;
  h = h / 360;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function oklchToRgbFallback(match: string): string {
  const inner = match.substring(match.indexOf('(') + 1, match.length - 1).trim();
  const parts = inner.split(/[\s,/]+/).filter(Boolean);
  if (parts.length >= 3) {
    let l = parseFloat(parts[0]);
    if (parts[0].includes('%')) l = l / 100;
    
    let c = parseFloat(parts[1]);
    if (parts[1].includes('%')) c = c / 100;
    
    let h = parseFloat(parts[2]);
    if (parts[2].includes('%')) h = (parseFloat(parts[2]) / 100) * 360;
    
    if (isNaN(l)) l = 0.5;
    if (isNaN(c)) c = 0.1;
    if (isNaN(h)) h = 0;
    
    if (l > 0.93) return 'rgb(255, 255, 255)';
    if (l < 0.05) return 'rgb(10, 10, 10)';
    
    const s = Math.min(1, c * 3);
    const r = hslToRgb(h, s, l);
    
    if (parts.length >= 4) {
      let a = parseFloat(parts[3]);
      if (parts[3].includes('%')) a = a / 100;
      if (!isNaN(a)) {
        return `rgba(${r[0]}, ${r[1]}, ${r[2]}, ${a})`;
      }
    }
    return `rgb(${r[0]}, ${r[1]}, ${r[2]})`;
  }
  return 'rgb(16, 185, 129)';
}

export function oklabToRgbFallback(match: string): string {
  const inner = match.substring(match.indexOf('(') + 1, match.length - 1).trim();
  const parts = inner.split(/[\s,/]+/).filter(Boolean);
  if (parts.length >= 3) {
    let l = parseFloat(parts[0]);
    if (parts[0].includes('%')) l = l / 100;
    
    let a = parseFloat(parts[1]);
    let b = parseFloat(parts[2]);
    if (isNaN(l)) l = 0.5;
    if (isNaN(a)) a = 0;
    if (isNaN(b)) b = 0;
    
    // convert oklab to oklch
    const c = Math.sqrt(a * a + b * b);
    let h = Math.atan2(b, a) * (180 / Math.PI);
    if (h < 0) h += 360;
    
    if (l > 0.93) return 'rgb(255, 255, 255)';
    if (l < 0.05) return 'rgb(10, 10, 10)';
    
    const s = Math.min(1, c * 3);
    const r = hslToRgb(h, s, l);
    
    if (parts.length >= 4) {
      let alpha = parseFloat(parts[3]);
      if (parts[3].includes('%')) alpha = alpha / 100;
      if (!isNaN(alpha)) {
        return `rgba(${r[0]}, ${r[1]}, ${r[2]}, ${alpha})`;
      }
    }
    return `rgb(${r[0]}, ${r[1]}, ${r[2]})`;
  }
  return 'rgb(16, 185, 129)';
}

export function replaceOklchWithFallback(cssText: string): string {
  let result = '';
  let i = 0;
  while (i < cssText.length) {
    const next6 = cssText.substring(i, i + 6).toLowerCase();
    if (next6 === 'oklch(' || next6 === 'oklab(') {
      // Find matching closing parenthesis
      let parenCount = 1;
      let j = i + 6;
      while (j < cssText.length && parenCount > 0) {
        if (cssText[j] === '(') parenCount++;
        else if (cssText[j] === ')') parenCount--;
        j++;
      }
      const fullMatch = cssText.substring(i, j);
      if (next6 === 'oklch(') {
        result += oklchToRgbFallback(fullMatch);
      } else {
        result += oklabToRgbFallback(fullMatch);
      }
      i = j;
    } else {
      result += cssText[i];
      i++;
    }
  }
  return result;
}

export async function safeHtml2Canvas(element: HTMLElement, options: any = {}): Promise<HTMLCanvasElement> {
  const userOnClone = options.onclone;

  const canvas = await html2canvas(element, {
    ...options,
    onclone: (clonedDoc, clonedEl) => {
      // 1. Clean style tags in cloned document
      const styleElements = Array.from(clonedDoc.querySelectorAll('style'));
      for (const style of styleElements) {
        if (style.textContent) {
          const lower = style.textContent.toLowerCase();
          if (lower.includes('oklch(') || lower.includes('oklab(')) {
            style.textContent = replaceOklchWithFallback(style.textContent);
          }
        }
      }

      // 2. Clean inline style attributes in cloned elements
      const allElements = [clonedEl, ...Array.from(clonedEl.querySelectorAll('*'))] as HTMLElement[];
      for (const el of allElements) {
        if (el && el.getAttribute) {
          const styleAttr = el.getAttribute('style');
          if (styleAttr) {
            const lowerAttr = styleAttr.toLowerCase();
            if (lowerAttr.includes('oklch(') || lowerAttr.includes('oklab(')) {
              el.setAttribute('style', replaceOklchWithFallback(styleAttr));
            }
          }
        }
      }

      // 3. Call user's custom onclone if provided
      if (typeof userOnClone === 'function') {
        userOnClone(clonedDoc, clonedEl);
      }
    }
  });

  return canvas;
}

