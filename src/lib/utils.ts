import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import html2canvas from 'html2canvas';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('navigator.clipboard failed, attempting fallback copy:', err);
  }

  // Fallback for sandboxed iframes or browsers without clipboard permissions
  try {
    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return !!successful;
    }
  } catch (fallbackErr) {
    console.warn('Fallback copy failed:', fallbackErr);
  }
  return false;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function cleanTempatLahir(tempat?: string | null): string {
  if (!tempat) return '';
  let cleaned = tempat.trim();
  // Remove "Kabupaten ", "Kab. ", "Kab " prefixes (case insensitive)
  cleaned = cleaned.replace(/^(kabupaten|kab\.|kab)\s+/i, '');
  // Clean up leading/trailing commas or spaces
  cleaned = cleaned.replace(/^[\s,]+|[\s,]+$/g, '');
  return cleaned;
}

export function formatIndonesianDate(dateString?: string | number | Date | null, includeDay: boolean = false): string {
  if (!dateString) {
    return '';
  }

  try {
    let date: Date;
    if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === 'number') {
      date = new Date(dateString);
    } else if (typeof dateString === 'string') {
      const trimmed = dateString.trim();
      if (!trimmed || trimmed === '-' || trimmed.includes('...')) {
        return '';
      }

      // If it's already in Indonesian formatted date format like "12 Agustus 1991"
      if (/^\d{1,2}\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}$/i.test(trimmed)) {
        return trimmed;
      }

      if (trimmed.includes('T')) {
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
          try {
            const options: Intl.DateTimeFormatOptions = {
              timeZone: 'Asia/Jakarta',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            };
            if (includeDay) {
              options.weekday = 'long';
            }
            return new Intl.DateTimeFormat('id-ID', options).format(parsed);
          } catch {
            date = parsed;
          }
        } else {
          return trimmed;
        }
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const parts = trimmed.split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        date = new Date(y, m, d);
      } else {
        date = new Date(trimmed);
      }
    } else {
      return '';
    }

    if (isNaN(date.getTime())) {
      return typeof dateString === 'string' ? dateString : '';
    }

    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    if (includeDay) {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const dayName = days[date.getDay()];
      return `${dayName}, ${day} ${month} ${year}`;
    }

    return `${day} ${month} ${year}`;
  } catch {
    return typeof dateString === 'string' ? dateString : '';
  }
}

export function formatTempatTanggalLahir(tempat?: string | null, tanggal?: string | null): string {
  if (!tempat && !tanggal) return '-';

  // Handle case where combined string is passed as `tempat` e.g. "Kabupaten Klaten, 1991-08-11T17:00:00.000Z"
  if (tempat && !tanggal && tempat.includes(',')) {
    const commaIndex = tempat.indexOf(',');
    const extractedTempat = tempat.substring(0, commaIndex).trim();
    const extractedTanggal = tempat.substring(commaIndex + 1).trim();
    return formatTempatTanggalLahir(extractedTempat, extractedTanggal);
  }

  const cleanPlace = cleanTempatLahir(tempat);
  const formattedDate = tanggal ? formatIndonesianDate(tanggal) : '';

  if (cleanPlace && formattedDate) {
    return `${cleanPlace}, ${formattedDate}`;
  }
  if (cleanPlace) return cleanPlace;
  if (formattedDate) return formattedDate;
  return '-';
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
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Do not treat Google Sheets / Docs / Slides URLs as image URLs
  if (trimmed.includes('spreadsheets/d/') || trimmed.includes('document/d/') || trimmed.includes('presentation/d/')) {
    return '';
  }

  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    const match = trimmed.match(/\/file\/d\/(.+?)(\/|$|\?|#)/) ||
                  trimmed.match(/\/d\/(.+?)(\/|$|\?|#)/) || 
                  trimmed.match(/[?&]id=(.+?)(&|$|#)/);
    if (match && match[1]) {
      // Use lh3.googleusercontent.com format for native Google CORS support and direct image loading
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }
  return trimmed;
}

export function isUnsplashDefaultImage(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (
    trimmed.includes('unsplash.com/photo-1510312305653') ||
    trimmed.includes('unsplash.com/photo-1562774053') ||
    trimmed.includes('unsplash.com/photo-1511578314322')
  ) {
    return true;
  }
  return false;
}

export function pickValidImageUrl(
  urlA?: string | null,
  urlB?: string | null,
  fallback = 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800'
): string {
  if (!isUnsplashDefaultImage(urlA)) return urlA!.trim();
  if (!isUnsplashDefaultImage(urlB)) return urlB!.trim();
  if (urlA && urlA.trim()) return urlA.trim();
  if (urlB && urlB.trim()) return urlB.trim();
  return fallback;
}

export function getCorsSafeUrl(url: string | null | undefined, version?: string | number): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('blob:')) return trimmed;

  // Resolve Google Drive links first
  let resolvedUrl = getDriveDirectLink(trimmed);

  // Derive cache-buster version if not explicitly provided
  const cacheVersion = version 
    ? String(version) 
    : String(Math.floor(Date.now() / 300000)); // 5-minute rolling timestamp cache buster

  // Local / relative assets
  if (resolvedUrl.startsWith('/') || resolvedUrl.startsWith('http://localhost') || resolvedUrl.startsWith('https://localhost')) {
    const sep = resolvedUrl.includes('?') ? '&' : '?';
    return `${resolvedUrl}${sep}_v=${cacheVersion}`;
  }

  // Proxy ALL external HTTP/HTTPS URLs (including googleusercontent / drive / wikimedia / etc) via images.weserv.nl for CORS headers
  if (resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://')) {
    if (resolvedUrl.includes('images.weserv.nl')) {
      return resolvedUrl;
    }
    const cleanUrl = resolvedUrl.replace(/^https?:\/\//, '');
    return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&_v=${cacheVersion}`;
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

export async function imageUrlToBase64(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:image/')) return url;

  const cacheVersion = String(Math.floor(Date.now() / 300000));

  // 1. Try fetch with getCorsSafeUrl (images.weserv.nl)
  try {
    const corsUrl = getCorsSafeUrl(url, cacheVersion);
    const response = await fetch(corsUrl, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const b64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
            resolve(reader.result);
          } else {
            resolve('');
          }
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
      if (b64) return b64;
    }
  } catch (e) {
    // Ignore fetch error
  }

  // 2. Try corsproxy.io as fallback CORS proxy
  try {
    const directUrl = getDriveDirectLink(url);
    const altCorsUrl = `https://corsproxy.io/?${encodeURIComponent(directUrl)}`;
    const response = await fetch(altCorsUrl, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const b64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
            resolve(reader.result);
          } else {
            resolve('');
          }
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
      if (b64) return b64;
    }
  } catch (e) {
    // Ignore fallback
  }

  // 3. Try HTMLImageElement with crossOrigin = 'anonymous' onto canvas
  try {
    const b64 = await new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 350;
          canvas.height = img.naturalHeight || img.height || 220;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            if (dataUrl.startsWith('data:image/')) {
              resolve(dataUrl);
              return;
            }
          }
        } catch (err) {
          // Tainted
        }
        resolve('');
      };
      img.onerror = () => resolve('');
      img.src = getCorsSafeUrl(url, cacheVersion);
    });
    if (b64) return b64;
  } catch (e) {
    // Ignore
  }

  return url;
}

export async function prepareImagesInElement(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      const src = img.src || img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        try {
          const b64 = await imageUrlToBase64(src);
          if (b64 && b64.startsWith('data:image/')) {
            img.src = b64;
            img.removeAttribute('crossorigin');
          }
        } catch (e) {
          console.warn('Image base64 conversion warning:', e);
        }
      }
    })
  );
}

export async function safeHtml2Canvas(element: HTMLElement, options: any = {}): Promise<HTMLCanvasElement> {
  const userOnClone = options.onclone;

  // Pre-convert images inside element to Base64 to bypass CORS issues during canvas draw
  try {
    await prepareImagesInElement(element);
  } catch (e) {
    console.warn('Pre-conversion warning:', e);
  }

  const canvas = await html2canvas(element, {
    scale: 3, // High DPI rendering
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
    ...options,
    onclone: (clonedDoc, clonedEl) => {
      // 1. Reset positioning and visibility on cloned target & ALL ancestor chain
      if (clonedEl) {
        clonedEl.style.position = 'static';
        clonedEl.style.transform = 'none';
        clonedEl.style.opacity = '1';
        clonedEl.style.visibility = 'visible';
        clonedEl.style.left = '0';
        clonedEl.style.top = '0';

        let curr: HTMLElement | null = clonedEl.parentElement;
        while (curr && curr !== clonedDoc.body) {
          curr.style.opacity = '1';
          curr.style.visibility = 'visible';
          curr.style.pointerEvents = 'auto';
          curr.style.position = 'static';
          curr.style.left = '0';
          curr.style.top = '0';
          curr.style.transform = 'none';
          curr = curr.parentElement;
        }

        // Ensure all images in cloned document are crossOrigin anonymous or clean
        const clonedImgs = Array.from(clonedEl.querySelectorAll('img'));
        for (const cImg of clonedImgs) {
          if (cImg.src && cImg.src.startsWith('data:')) {
            cImg.removeAttribute('crossorigin');
          } else {
            cImg.setAttribute('crossorigin', 'anonymous');
          }
        }
      }

      // 2. Clean style tags in cloned document for OKLCH
      const styleElements = Array.from(clonedDoc.querySelectorAll('style'));
      for (const style of styleElements) {
        if (style.textContent) {
          const lower = style.textContent.toLowerCase();
          if (lower.includes('oklch(') || lower.includes('oklab(')) {
            style.textContent = replaceOklchWithFallback(style.textContent);
          }
        }
      }

      // 3. Clean inline style attributes in cloned elements
      const allElements = [clonedEl, ...Array.from(clonedDoc.querySelectorAll('*'))] as HTMLElement[];
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

      // 4. Call user's custom onclone if provided
      if (typeof userOnClone === 'function') {
        userOnClone(clonedDoc, clonedEl);
      }
    }
  });

  return canvas;
}

export function safeCanvasToDataURL(canvas: HTMLCanvasElement): string {
  try {
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Tainted canvas detected during export, attempting clean reconstruction:', err);
    const cleanCanvas = document.createElement('canvas');
    cleanCanvas.width = canvas.width || 1050;
    cleanCanvas.height = canvas.height || 660;
    const ctx = cleanCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cleanCanvas.width, cleanCanvas.height);
      try {
        ctx.drawImage(canvas, 0, 0);
        return cleanCanvas.toDataURL('image/png');
      } catch (e) {
        // Tainted draw fails
      }
    }
    return cleanCanvas.toDataURL('image/png');
  }
}


