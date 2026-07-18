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
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
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
  
  // Proxy all external http/https URLs to avoid CORS blocks with html2canvas and prevent tainted canvas
  if (resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://')) {
    return `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(resolvedUrl)}`;
  }
  
  return resolvedUrl;
}

export function replaceOklchWithFallback(cssText: string): string {
  let result = '';
  let i = 0;
  while (i < cssText.length) {
    if (cssText.substring(i, i + 6).toLowerCase() === 'oklch(') {
      // Find matching closing parenthesis
      let parenCount = 1;
      let j = i + 6;
      while (j < cssText.length && parenCount > 0) {
        if (cssText[j] === '(') parenCount++;
        else if (cssText[j] === ')') parenCount--;
        j++;
      }
      // Replace with safe rgb fallback
      result += 'rgb(16, 185, 129)';
      i = j;
    } else {
      result += cssText[i];
      i++;
    }
  }
  return result;
}

export async function safeHtml2Canvas(element: HTMLElement, options: any = {}): Promise<HTMLCanvasElement> {
  const stylesBackup: { element: HTMLStyleElement | HTMLLinkElement; textContent?: string; originalDisabled?: boolean }[] = [];
  const tempStyles: HTMLStyleElement[] = [];

  try {
    // 1. Process all stylesheets
    const styleElements = Array.from(document.querySelectorAll('style'));
    const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];

    // Backup and modify inline style tags
    for (const style of styleElements) {
      const originalText = style.textContent || '';
      if (originalText.toLowerCase().includes('oklch(')) {
        stylesBackup.push({ element: style, textContent: originalText });
        style.textContent = replaceOklchWithFallback(originalText);
      }
    }

    // Backup and temporarily replace external link stylesheets
    for (const link of linkElements) {
      if (link.href) {
        // Skip common third-party resources like Google Fonts, FontAwesome, etc. to avoid CORS/timeout blocks
        if (
          link.href.includes('fonts.googleapis.com') ||
          link.href.includes('fonts.gstatic.com') ||
          link.href.includes('cdnjs.cloudflare.com') ||
          link.href.includes('jsdelivr.net') ||
          link.href.includes('unpkg.com')
        ) {
          continue;
        }

        // Only fetch if it's on the same origin or is a relative URL to avoid CORS errors and speed up loading
        const isSameOrigin = link.href.startsWith(window.location.origin) || link.href.startsWith('/') || (!link.href.startsWith('http://') && !link.href.startsWith('https://'));
        if (!isSameOrigin) {
          continue;
        }

        try {
          const response = await fetch(link.href);
          if (response.ok) {
            const cssText = await response.text();
            if (cssText.toLowerCase().includes('oklch(')) {
              // Backup original link state
              stylesBackup.push({ element: link, originalDisabled: link.disabled });
              // Disable the link stylesheet
              link.disabled = true;

              // Inject as modified style tag
              const tempStyle = document.createElement('style');
              tempStyle.textContent = replaceOklchWithFallback(cssText);
              document.head.appendChild(tempStyle);
              tempStyles.push(tempStyle);
            }
          }
        } catch (e) {
          console.warn("Could not fetch external stylesheet for oklch replacement:", link.href, e);
        }
      }
    }

    // Temporarily replace inline oklch styles on elements
    const inlineStyleBackup: { element: HTMLElement; originalStyle: string }[] = [];
    const allElements = [element, ...Array.from(element.querySelectorAll('*'))] as HTMLElement[];
    for (const el of allElements) {
      if (el.style && el.getAttribute('style')?.toLowerCase().includes('oklch(')) {
        const originalStyle = el.getAttribute('style') || '';
        inlineStyleBackup.push({ element: el, originalStyle });
        el.setAttribute('style', replaceOklchWithFallback(originalStyle));
      }
    }

    // 2. Call the original html2canvas with the prepared document
    const canvas = await html2canvas(element, options);

    // Restore inline styles
    for (const backup of inlineStyleBackup) {
      backup.element.setAttribute('style', backup.originalStyle);
    }

    return canvas;
  } finally {
    // 3. Restore all original styles
    for (const backup of stylesBackup) {
      if (backup.textContent !== undefined) {
        backup.element.textContent = backup.textContent;
      }
      if (backup.originalDisabled !== undefined) {
        (backup.element as HTMLLinkElement).disabled = backup.originalDisabled;
      }
    }
    // Remove temporary style tags
    for (const tempStyle of tempStyles) {
      tempStyle.remove();
    }
  }
}
