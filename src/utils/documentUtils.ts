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

  // Firestore single document limit is 1MB. Keep base64 proposal under ~650KB to leave room for other fields.
  if (file.size > 650 * 1024) {
    if (onError) {
      onError('Ukuran file proposal terlalu besar untuk disimpan langsung (maksimal ~600KB).\n\nSilakan gunakan Link / URL Google Drive atau Dropbox ke kolom input URL Proposal agar dapat diakses semua orang.');
    }
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result as string;
    if (result) {
      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          const cacheKey = `hw_proposal_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
          localStorage.setItem(cacheKey, result);
        }
      } catch (err) {
        console.warn('Could not store proposal in cache:', err);
      }
      onSuccess(result);
    }
  };
  reader.onerror = () => {
    if (onError) onError('Gagal membaca file proposal.');
  };
  reader.readAsDataURL(file);
};

export const handleDownloadDocument = (urlOrDataUrl?: string, documentName?: string) => {
  if (!urlOrDataUrl) return;
  const trimmed = urlOrDataUrl.trim();
  if (!trimmed) return;

  // If HTTP / HTTPS or Google Drive / Dropbox link, open in new tab
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const formattedUrl = formatDocumentUrl(trimmed);
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  // If Data URL or raw Base64 string
  if (trimmed.startsWith('data:') || trimmed.length > 50) {
    try {
      let mimeType = 'application/pdf';
      let base64Data = trimmed;

      if (trimmed.startsWith('data:')) {
        const parts = trimmed.split(';');
        mimeType = parts[0].replace('data:', '') || 'application/pdf';
        base64Data = trimmed.split(',')[1] || '';
      }

      // Clean whitespace/newlines from base64 string
      base64Data = base64Data.replace(/\s/g, '');

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      const blobUrl = URL.createObjectURL(blob);

      let ext = 'pdf';
      if (mimeType.includes('word') || mimeType.includes('doc')) ext = 'docx';
      else if (mimeType.includes('pdf')) ext = 'pdf';

      const cleanTitle = documentName 
        ? documentName.replace(/[^a-zA-Z0-9_-]/g, '_') 
        : 'Proposal_Kegiatan_HW_Jateng';

      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = `${cleanTitle}.${ext}`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      console.error('Download document error:', err);
      try {
        const win = window.open();
        if (win) {
          win.document.write(`<iframe src="${trimmed}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        }
      } catch (e) {
        alert('Gagal mengunduh atau membuka file proposal.');
      }
    }
  }
};
