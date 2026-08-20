/**
 * Extract Google Drive file ID from various Google Drive URL formats
 */
export const extractGoogleDriveFileId = (url?: string | null): string | null => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Format 1: https://drive.google.com/file/d/FILE_ID/view...
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  // Format 2: https://drive.google.com/d/FILE_ID... or https://docs.google.com/d/FILE_ID...
  const matchD = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/i);
  if (matchD && matchD[1]) return matchD[1];

  // Format 3: https://drive.google.com/open?id=FILE_ID or ?id=FILE_ID or &id=FILE_ID
  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1];

  // Format 4: https://drive.google.com/uc?id=FILE_ID
  const matchUc = trimmed.match(/\/uc\?(?:[^&]+&)*id=([a-zA-Z0-9_-]+)/i);
  if (matchUc && matchUc[1]) return matchUc[1];

  // Format 5: raw ID if given directly (Google Drive IDs are typically 25-45 alphanumeric chars with - and _)
  if (!trimmed.includes('/') && !trimmed.includes(' ') && trimmed.length >= 20 && trimmed.length <= 50) {
    return trimmed;
  }

  return null;
};

/**
 * Checks if a given URL is a Google Drive URL or File ID
 */
export const isGoogleDriveUrl = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com') ||
    trimmed.includes('drive.usercontent.google.com') ||
    !!extractGoogleDriveFileId(trimmed)
  );
};

/**
 * Returns alternative candidate stream URLs for a Google Drive audio file in priority order
 */
export const getGoogleDriveAudioCandidates = (fileIdOrUrl: string): string[] => {
  const fileId = extractGoogleDriveFileId(fileIdOrUrl);
  if (!fileId) return [fileIdOrUrl];

  return [
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    `https://docs.google.com/uc?export=download&id=${fileId}`,
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`,
    `https://lh3.googleusercontent.com/d/${fileId}`
  ];
};

/**
 * Returns user-viewable web URL for Google Drive file
 */
export const getGoogleDriveWebUrl = (fileIdOrUrl: string): string => {
  const fileId = extractGoogleDriveFileId(fileIdOrUrl);
  if (!fileId) return fileIdOrUrl;
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
};

/**
 * Format any audio URL (Google Drive, Dropbox, direct MP3, base64) into a streamable direct audio URL
 */
export const formatAudioUrl = (url?: string, version?: string | number): string => {
  if (!url) return '';
  let trimmed = String(url).trim();
  if (!trimmed) return '';

  // Fix Pixabay CDN URLs or broken GitHub raw sample URLs that give 403 or 404
  if (trimmed.includes('pixabay.com') || trimmed.includes('rafaelreis-hotmart')) {
    return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  }

  // Handle Google Drive links
  if (isGoogleDriveUrl(trimmed)) {
    const fileId = extractGoogleDriveFileId(trimmed);
    if (fileId) {
      return `https://docs.google.com/uc?export=download&id=${fileId}`;
    }
  }

  // Handle Dropbox links
  if (trimmed.includes('dropbox.com')) {
    trimmed = trimmed.replace('dl=0', 'raw=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }

  // Handle data URLs or base64 strings
  if (trimmed.startsWith('data:')) {
    if (trimmed.startsWith('data:application/octet-stream;base64,')) {
      return trimmed.replace('data:application/octet-stream;base64,', 'data:audio/mp3;base64,');
    }
    return trimmed;
  }

  // If raw base64 string without data: prefix
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('blob:') && trimmed.length > 50) {
    return `data:audio/mp3;base64,${trimmed}`;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const cacheVersion = version 
      ? String(version) 
      : String(Math.floor(Date.now() / 300000)); // 5-minute rolling timestamp cache buster
    const sep = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${sep}_v=${cacheVersion}`;
  }

  return trimmed;
};

/**
 * Generates direct download URL for audio files
 */
export const getAudioDownloadUrl = (url?: string, title?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  
  if (isGoogleDriveUrl(trimmed)) {
    const fileId = extractGoogleDriveFileId(trimmed);
    if (fileId) {
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }
  
  return formatAudioUrl(trimmed);
};

export const handleAudioFileUpload = (
  file: File,
  onSuccess: (base64Url: string) => void,
  onError?: (msg: string) => void
) => {
  if (!file) return;
  
  const isAudio = file.type.startsWith('audio/') || 
                  /\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(file.name);

  if (!isAudio) {
    if (onError) onError('Harap pilih file audio (MP3, WAV, M4A, OGG) yang valid.');
    return;
  }

  // Allow up to 6MB for local audio file uploads
  if (file.size > 6 * 1024 * 1024) {
    if (onError) {
      onError('Ukuran file audio terlalu besar (maksimal 6MB).\n\nDisarankan memasukkan Link / URL MP3 online dari Google Drive.');
    }
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result as string;
    if (result) {
      let finalDataUrl = result;
      if (result.startsWith('data:application/octet-stream;base64,')) {
        finalDataUrl = result.replace('data:application/octet-stream;base64,', 'data:audio/mp3;base64,');
      }

      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          const cacheKey = `hw_audio_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
          localStorage.setItem(cacheKey, finalDataUrl);
        }
      } catch (err) {
        console.warn('Could not store audio in localStorage cache:', err);
      }

      onSuccess(finalDataUrl);
    }
  };
  reader.onerror = () => {
    if (onError) onError('Gagal membaca file audio.');
  };
  reader.readAsDataURL(file);
};


