export const formatDocumentUrl = (url?: string): string => {
  if (!url) return '';
  let trimmed = String(url).trim();
  if (!trimmed) return '';

  // Handle Google Drive / Docs links
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || 
                  trimmed.match(/id=([a-zA-Z0-9_-]+)/) ||
                  trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/view?usp=sharing`;
    }
  }

  // Handle Dropbox links
  if (trimmed.includes('dropbox.com')) {
    return trimmed.replace('dl=0', 'raw=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }

  return trimmed;
};

export const handleDocumentFileUpload = (
  file: File,
  onSuccess: (base64Url: string) => void,
  onError?: (msg: string) => void
) => {
  if (!file) return;

  // Firestore single document limit is 1MB. Keep base64 proposal under ~550KB to leave room for other fields.
  if (file.size > 550 * 1024) {
    if (onError) {
      onError('Ukuran file proposal terlalu besar untuk disimpan langsung (maksimal ~500KB).\n\nSilakan masukkan Link / URL Google Drive atau Dropbox ke kolom input URL Proposal.');
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
    if (onError) onError('Gagal membaca file proposal.');
  };
  reader.readAsDataURL(file);
};
