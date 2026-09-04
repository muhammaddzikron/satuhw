import { jsPDF } from 'jspdf';
import { safeHtml2Canvas, safeCanvasToDataURL, formatTempatTanggalLahir } from '../lib/utils';
import { LOCAL_KTA_FRONT_BASE64, LOCAL_KTA_BACK_BASE64, getSafeKtaFront, getSafeKtaBack } from '../assets/ktaTemplates';

export interface KtaPrintOptions {
  application: any;
  settings?: any;
  frontElement?: HTMLElement | null;
  backElement?: HTMLElement | null;
}

/**
 * Open native system Print dialog specifically formatted for A4 page "Save as PDF" / "Simpan sebagai PDF".
 * This gives 100% vector text clarity, perfect 1:1 scale (85.60 mm x 53.98 mm), and zero chance of canvas/mobile download failure.
 */
export async function printKtaAsPdf(options: KtaPrintOptions): Promise<void> {
  const { application: app, settings: rawSettings } = options;
  if (!app) throw new Error('Data anggota tidak ditemukan');

  const settings = rawSettings || {};
  const frontBg = getSafeKtaFront(settings.ktaTemplateFront || settings.ktaFrontBg);
  const backBg = getSafeKtaBack(settings.ktaTemplateBack || settings.ktaBackBg);

  const nama = app.nama || app.namaLengkap || 'Anggota';
  const nbm = app.nbm || app.nomorBaku || app.nomorKta || '-';
  const tempatTanggalLahir = formatTempatTanggalLahir(app.tempatLahir, app.tanggalLahir);
  const alamat = app.alamat || '-';
  const qabilah = app.qabilah || '-';
  const kwarda = app.kwarda || app.asalKwarda || 'Jawa Tengah';
  const tingkatan = app.tingkatan || app.golongan || 'Anggota Pandu';
  const statusKeanggotaan = app.statusKeanggotaan || 'Aktif';
  const masaBerlaku = app.masaBerlaku || 'Seumur Hidup';
  const photoUrl = app.photo || app.foto || '';

  const ketuaNama = settings.ktaKetuaNama || 'TAUFIQ';
  const ketuaNbm = settings.ktaKetuaNbm || 'NBM 1015096';
  const sekretarisNama = settings.ktaSekretarisNama || 'MUHAMMAD DZIKRON';
  const sekretarisNbm = settings.ktaSekretarisNbm || 'NBM 1029863';

  // Use base64 or direct paths for reliable instant print rendering
  const effectiveFrontBg = frontBg.startsWith('http') ? frontBg : LOCAL_KTA_FRONT_BASE64;
  const effectiveBackBg = backBg.startsWith('http') ? backBg : LOCAL_KTA_BACK_BASE64;

  const printHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>KTA HW - ${nama}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    *, *:before, *:after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 15mm 15mm;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #ffffff;
      color: #1e293b;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      min-height: 297mm;
      width: 210mm;
      box-sizing: border-box;
    }
    .header {
      text-align: center;
      margin-bottom: 5mm;
      width: 100%;
    }
    .title {
      font-size: 15pt;
      font-weight: 900;
      color: #0f766e;
      margin: 0 0 2mm 0;
      letter-spacing: 0.5px;
    }
    .subtitle {
      font-size: 9pt;
      color: #64748b;
      margin: 0 0 1.5mm 0;
      font-weight: 600;
    }
    .desc {
      font-size: 8pt;
      color: #94a3b8;
      margin: 0;
    }
    .divider {
      width: 100%;
      height: 1px;
      background: #e2e8f0;
      margin: 4mm 0 6mm 0;
    }
    .cards-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12mm;
      width: 100%;
    }
    .card-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .card-label {
      font-size: 8.5pt;
      font-weight: 800;
      color: #475569;
      margin-bottom: 2.5mm;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kta-card {
      width: 85.60mm;
      height: 53.98mm;
      position: relative;
      border-radius: 3.18mm;
      overflow: hidden;
      box-shadow: 0 0 0 0.5px #cbd5e1;
      background-color: #ffffff;
    }
    .card-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 1;
    }
    .card-content {
      position: relative;
      z-index: 2;
      width: 100%;
      height: 100%;
      padding: 3.5mm 4mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .front-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .front-body {
      display: flex;
      gap: 3mm;
      align-items: center;
      margin-top: 14mm;
    }
    .member-photo-box {
      width: 18mm;
      height: 24mm;
      border-radius: 2mm;
      border: 1.5px solid #ffffff;
      overflow: hidden;
      background-color: #f1f5f9;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      flex-shrink: 0;
    }
    .member-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .member-details {
      flex: 1;
      min-width: 0;
    }
    .member-name {
      font-size: 8pt;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.15;
      margin-bottom: 1.5mm;
      text-transform: uppercase;
    }
    .data-row {
      display: flex;
      font-size: 5.5pt;
      line-height: 1.25;
      margin-bottom: 0.8mm;
      color: #334155;
    }
    .data-label {
      width: 19mm;
      font-weight: 700;
      color: #475569;
      flex-shrink: 0;
    }
    .data-colon {
      margin-right: 1.5mm;
    }
    .data-val {
      font-weight: 600;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card-back-view {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .guidelines-box {
      margin-top: 12mm;
      width: 170mm;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 3mm;
      padding: 3.5mm 5mm;
    }
    .guidelines-title {
      font-size: 8pt;
      font-weight: 800;
      color: #0f766e;
      margin-bottom: 1.5mm;
    }
    .guidelines-list {
      margin: 0;
      padding-left: 4mm;
      font-size: 7pt;
      color: #475569;
      line-height: 1.45;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">KARTU TANDA ANGGOTA DIGITAL</div>
    <div class="subtitle">Gerakan Kepanduan Hizbul Wathan Jawa Tengah</div>
    <div class="desc">Standar Kartu Identitas ID-1 (85.60 mm × 53.98 mm) — Skala 1:1 (Actual Size)</div>
  </div>

  <div class="divider"></div>

  <div class="cards-container">
    <!-- FRONT CARD -->
    <div class="card-wrapper">
      <div class="card-label">TAMPILAN DEPAN (FRONT)</div>
      <div class="kta-card">
        <img src="${effectiveFrontBg}" class="card-bg" alt="" />
        <div class="card-content">
          <div class="front-body">
            <div class="member-photo-box">
              ${photoUrl ? `<img src="${photoUrl}" class="member-photo" alt="${nama}" />` : `<div style="width:100%;height:100%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:6pt;color:#94a3b8;font-weight:bold;">FOTO</div>`}
            </div>
            <div class="member-details">
              <div class="member-name">${nama}</div>
              <div class="data-row">
                <span class="data-label">Nomor KTA</span>
                <span class="data-colon">:</span>
                <span class="data-val" style="font-weight:800;color:#0f766e;">${nbm}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Tempat/Tgl Lahir</span>
                <span class="data-colon">:</span>
                <span class="data-val">${tempatTanggalLahir}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Kwarda / Daerah</span>
                <span class="data-colon">:</span>
                <span class="data-val">${kwarda}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Qabilah / Pangkalan</span>
                <span class="data-colon">:</span>
                <span class="data-val">${qabilah}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Tingkatan / Status</span>
                <span class="data-colon">:</span>
                <span class="data-val">${tingkatan} • ${statusKeanggotaan}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- BACK CARD -->
    <div class="card-wrapper">
      <div class="card-label">TAMPILAN BELAKANG (BACK)</div>
      <div class="kta-card">
        <img src="${effectiveBackBg}" class="card-bg" alt="" />
      </div>
    </div>
  </div>

  <div class="guidelines-box">
    <div class="guidelines-title">PANDUAN CETAK & VERIFIKASI (SKALA 1:1):</div>
    <ol class="guidelines-list">
      <li>Pilih opsi tujuan <strong>"Save as PDF" / "Simpan sebagai PDF"</strong> atau pilih printer fisik dengan skala <strong>100% / Actual Size</strong>.</li>
      <li>Gunakan kertas A4 (Art Paper 230-300 gsm / Blank Card PVC ID-1).</li>
      <li>Ukuran cetak otomatis presisi sesuai standar kartu nasional ID-1 (85.60 mm × 53.98 mm).</li>
      <li>Gunting atau potong mengikuti garis tepi tipis kartu depan dan belakang, lalu rekatkan atau lakukan press laminating.</li>
      <li>Dokumen ini merupakan Kartu Tanda Anggota resmi Gerakan Kepanduan Hizbul Wathan Wilayah Jawa Tengah.</li>
    </ol>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 400);
    };
  </script>
</body>
</html>
  `;

  // Create an isolated printable iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('title', 'KTA Print Frame');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error('Gagal memuat frame pencetakan browser');
  }

  doc.open();
  doc.write(printHtml);
  doc.close();

  // Remove iframe after print dialog completes
  setTimeout(() => {
    try {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    } catch (e) {}
  }, 60000);
}

/**
 * Direct file download helper with Blob URL and iframe fallback so it never crashes or gets blocked.
 */
export async function downloadKtaPdfBlob(options: KtaPrintOptions): Promise<void> {
  const { application: app, frontElement, backElement } = options;
  if (!app) throw new Error('Data anggota tidak ditemukan');

  const frontEl = frontElement || (document.getElementById('kta-front-card-view') || 
                  document.getElementById('kta-front-capture') || 
                  document.querySelector('.kta-card-printable')) as HTMLElement | null;

  const backEl = backElement || (document.getElementById('kta-back-card-view') || 
                 document.getElementById('kta-back-capture') || 
                 document.querySelectorAll('.kta-card-printable')[1]) as HTMLElement | null;

  if (!frontEl || !backEl) {
    // If DOM elements are not currently mounted, fallback directly to system print to PDF
    return printKtaAsPdf(options);
  }

  // Pre-wait images
  const waitForImages = async (el: HTMLElement) => {
    const images = Array.from(el.querySelectorAll('img'));
    await Promise.all(
      images.map(img => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 800);
        });
      })
    );
  };

  await Promise.all([waitForImages(frontEl), waitForImages(backEl)]);

  const frontCanvas = await safeHtml2Canvas(frontEl, {
    scale: 2.5,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null
  });

  const backCanvas = await safeHtml2Canvas(backEl, {
    scale: 2.5,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null
  });

  const frontImgData = safeCanvasToDataURL(frontCanvas);
  const backImgData = safeCanvasToDataURL(backCanvas);

  if (!frontImgData || !backImgData) {
    throw new Error('Gagal merender gambar kartu KTA');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Title and Headers (A4 Portrait = 210mm x 297mm)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.setTextColor(15, 118, 110);
  pdf.text('KARTU TANDA ANGGOTA DIGITAL', 105, 22, { align: 'center' });
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Gerakan Kepanduan Hizbul Wathan Jawa Tengah', 105, 28, { align: 'center' });
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Standar Kartu Identitas ID-1 (85.60 mm × 53.98 mm) — Skala 1:1 (Actual Size)', 105, 32, { align: 'center' });

  // Divider line
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.4);
  pdf.line(20, 36, 190, 36);

  // Standard ID-1 card dimensions (85.60 mm x 53.98 mm)
  const cardWidth = 85.60; 
  const cardHeight = 53.98;
  const xPos = (210 - cardWidth) / 2;
  
  // FRONT CARD
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('TAMPILAN DEPAN (FRONT)', 105, 43, { align: 'center' });
  pdf.addImage(frontImgData, 'PNG', xPos, 46, cardWidth, cardHeight);
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.2);
  pdf.rect(xPos, 46, cardWidth, cardHeight);

  // BACK CARD
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('TAMPILAN BELAKANG (BACK)', 105, 111, { align: 'center' });
  pdf.addImage(backImgData, 'PNG', xPos, 114, cardWidth, cardHeight);
  pdf.rect(xPos, 114, cardWidth, cardHeight);

  // Footer Print Guidelines
  pdf.setDrawColor(226, 232, 240);
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(20, 180, 170, 48, 3, 3, 'FD');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 118, 110);
  pdf.text('PANDUAN CETAK & VERIFIKASI (SKALA 1:1):', 25, 187);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('1. Cetak dokumen ini pada kertas A4 (Art Paper 230-300 gsm / PVC Card) dengan opsi "100% / Actual Size".', 25, 193);
  pdf.text('2. Ukuran hasil cetak sesuai standar kartu identitas nasional ID-1 (85.60 mm × 53.98 mm).', 25, 199);
  pdf.text('3. Potong mengikuti garis tepi tipis kartu depan dan belakang, lalu rekatkan atau lakukan press laminating.', 25, 205);
  pdf.text('4. QR Code di bagian belakang kartu berfungsi untuk verifikasi status keanggotaan resmi secara real-time.', 25, 211);
  pdf.text('5. Kartu ini merupakan dokumen resmi yang diterbitkan oleh Pimpinan Wilayah Hizbul Wathan Jawa Tengah.', 25, 217);

  const cleanFileName = (app.nama || app.namaLengkap || 'Anggota').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `KTA_HW_${cleanFileName}.pdf`;

  // Safe blob download
  try {
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
  } catch (err) {
    // Fallback standard save
    pdf.save(fileName);
  }
}
