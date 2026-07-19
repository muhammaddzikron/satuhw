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
  const stylesBackup: { element: HTMLStyleElement | HTMLLinkElement; textContent?: string; originalDisabled?: boolean }[] = [];
  const tempStyles: HTMLStyleElement[] = [];

  // Backup descriptors/methods to bypass dynamic CSS parser limitations
  const originalGetComputedStyle = window.getComputedStyle;
  const ruleProto = typeof CSSRule !== 'undefined' ? CSSRule.prototype : CSSStyleRule.prototype;
  const originalRuleCssTextDesc = Object.getOwnPropertyDescriptor(ruleProto, 'cssText');
  const styleDeclProto = CSSStyleDeclaration.prototype;
  const originalDeclCssTextDesc = Object.getOwnPropertyDescriptor(styleDeclProto, 'cssText');
  const originalGetPropertyValue = styleDeclProto.getPropertyValue;

  let ruleCssTextOverridden = false;
  let declCssTextOverridden = false;
  let getPropertyValueOverridden = false;
  let getComputedStyleOverridden = false;

  try {
    // 1. Install prototype overrides to catch dynamically added rules or browser computed styles
    if (originalRuleCssTextDesc && originalRuleCssTextDesc.configurable) {
      try {
        Object.defineProperty(ruleProto, 'cssText', {
          configurable: true,
          get() {
            const val = originalRuleCssTextDesc.get ? originalRuleCssTextDesc.get.call(this) : '';
            if (typeof val === 'string' && (val.includes('oklch(') || val.includes('oklab('))) {
              return replaceOklchWithFallback(val);
            }
            return val;
          },
          set(v) {
            if (originalRuleCssTextDesc.set) {
              originalRuleCssTextDesc.set.call(this, v);
            }
          }
        });
        ruleCssTextOverridden = true;
      } catch (err) {
        console.warn('Failed to override CSSRule.prototype.cssText:', err);
      }
    }

    if (originalDeclCssTextDesc && originalDeclCssTextDesc.configurable) {
      try {
        Object.defineProperty(styleDeclProto, 'cssText', {
          configurable: true,
          get() {
            const val = originalDeclCssTextDesc.get ? originalDeclCssTextDesc.get.call(this) : '';
            if (typeof val === 'string' && (val.includes('oklch(') || val.includes('oklab('))) {
              return replaceOklchWithFallback(val);
            }
            return val;
          },
          set(v) {
            if (originalDeclCssTextDesc.set) {
              originalDeclCssTextDesc.set.call(this, v);
            }
          }
        });
        declCssTextOverridden = true;
      } catch (err) {
        console.warn('Failed to override CSSStyleDeclaration.prototype.cssText:', err);
      }
    }

    try {
      styleDeclProto.getPropertyValue = function (property: string) {
        const val = originalGetPropertyValue.call(this, property);
        if (typeof val === 'string' && (val.includes('oklch(') || val.includes('oklab('))) {
          return replaceOklchWithFallback(val);
        }
        return val;
      };
      getPropertyValueOverridden = true;
    } catch (err) {
      console.warn('Failed to override CSSStyleDeclaration.prototype.getPropertyValue:', err);
    }

    try {
      window.getComputedStyle = function (elt, pseudoElt) {
        const style = originalGetComputedStyle(elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop, receiver) {
            if (prop === 'getPropertyValue') {
              return function (propertyName: string) {
                const val = target.getPropertyValue(propertyName);
                if (typeof val === 'string' && (val.includes('oklch(') || val.includes('oklab('))) {
                  return replaceOklchWithFallback(val);
                }
                return val;
              };
            }
            const val = Reflect.get(target, prop);
            if (typeof val === 'string' && (val.includes('oklch(') || val.includes('oklab('))) {
              return replaceOklchWithFallback(val);
            }
            if (typeof val === 'function') {
              return val.bind(target);
            }
            return val;
          }
        });
      };
      getComputedStyleOverridden = true;
    } catch (err) {
      console.warn('Failed to override window.getComputedStyle:', err);
    }

    // 2. Process all style tags
    const styleElements = Array.from(document.querySelectorAll('style'));
    const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];

    // Backup and modify inline style tags
    for (const style of styleElements) {
      const originalText = style.textContent || '';
      const lowerText = originalText.toLowerCase();
      if (lowerText.includes('oklch(') || lowerText.includes('oklab(')) {
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
            const lowerCss = cssText.toLowerCase();
            if (lowerCss.includes('oklch(') || lowerCss.includes('oklab(')) {
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
          console.warn("Could not fetch external stylesheet for oklch/oklab replacement:", link.href, e);
        }
      }
    }

    // Temporarily replace inline oklch/oklab styles on elements
    const inlineStyleBackup: { element: HTMLElement; originalStyle: string }[] = [];
    const allElements = [element, ...Array.from(element.querySelectorAll('*'))] as HTMLElement[];
    for (const el of allElements) {
      if (el.style) {
        const originalStyle = el.getAttribute('style') || '';
        const lowerStyle = originalStyle.toLowerCase();
        if (lowerStyle.includes('oklch(') || lowerStyle.includes('oklab(')) {
          inlineStyleBackup.push({ element: el, originalStyle });
          el.setAttribute('style', replaceOklchWithFallback(originalStyle));
        }
      }
    }

    // 3. Call the original html2canvas with the prepared document
    const canvas = await html2canvas(element, options);

    // Restore inline styles
    for (const backup of inlineStyleBackup) {
      backup.element.setAttribute('style', backup.originalStyle);
    }

    return canvas;
  } finally {
    // 4. Restore prototype overrides
    if (getPropertyValueOverridden) {
      styleDeclProto.getPropertyValue = originalGetPropertyValue;
    }
    if (getComputedStyleOverridden) {
      window.getComputedStyle = originalGetComputedStyle;
    }
    if (ruleCssTextOverridden && originalRuleCssTextDesc) {
      try {
        Object.defineProperty(ruleProto, 'cssText', originalRuleCssTextDesc);
      } catch (err) {
        console.warn('Failed to restore CSSRule.prototype.cssText:', err);
      }
    }
    if (declCssTextOverridden && originalDeclCssTextDesc) {
      try {
        Object.defineProperty(styleDeclProto, 'cssText', originalDeclCssTextDesc);
      } catch (err) {
        console.warn('Failed to restore CSSStyleDeclaration.prototype.cssText:', err);
      }
    }

    // 5. Restore all original styles
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
