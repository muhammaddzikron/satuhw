export const formatAudioUrl = (url?: string): string => {
  if (!url) return '';
  let trimmed = String(url).trim();
  if (!trimmed) return '';

  // Fix Pixabay CDN URLs or broken GitHub raw sample URLs that give 403 or 404
  if (trimmed.includes('pixabay.com') || trimmed.includes('rafaelreis-hotmart')) {
    return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  }

  // Handle Google Drive links
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || 
                  trimmed.match(/id=([a-zA-Z0-9_-]+)/) ||
                  trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }

  // Handle Dropbox links
  if (trimmed.includes('dropbox.com')) {
    return trimmed.replace('dl=0', 'raw=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
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

  return trimmed;
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

