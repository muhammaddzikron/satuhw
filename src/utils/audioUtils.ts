export const formatAudioUrl = (url?: string): string => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';

  // Handle Google Drive links
  if (trimmed.includes('drive.google.com')) {
    const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://docs.google.com/uc?export=open&id=${match[1]}`;
    }
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
                  file.name.endsWith('.mp3') || 
                  file.name.endsWith('.wav') || 
                  file.name.endsWith('.m4a') || 
                  file.name.endsWith('.ogg');

  if (!isAudio) {
    if (onError) onError('Harap pilih file audio (MP3, WAV, M4A, OGG) yang valid.');
    return;
  }

  // Max 10MB to fit cleanly in Firestore documents & localStorage
  if (file.size > 10 * 1024 * 1024) {
    if (onError) onError('Ukuran file audio terlalu besar (maksimal 10MB).');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result as string;
    if (result) {
      onSuccess(result);
    }
  };
  reader.onerror = () => {
    if (onError) onError('Gagal membaca file audio.');
  };
  reader.readAsDataURL(file);
};
