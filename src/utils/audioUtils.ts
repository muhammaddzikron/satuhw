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

  // Max 600KB for direct Base64 embedding into Firestore documents (1MB document limit)
  if (file.size > 600 * 1024) {
    if (onError) {
      onError('Ukuran file audio unggahan terlalu besar untuk disimpan langsung di database (maksimal 600KB).\n\nDisarankan memasukkan Link / URL MP3 online (seperti dari Google Drive atau server audio) pada kolom link themesong.');
    }
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
