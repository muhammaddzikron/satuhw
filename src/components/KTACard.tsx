import React from 'react';
import { User as UserIcon, Globe } from 'lucide-react';
import { cn, getCorsSafeUrl, formatIndonesianDate, formatTempatTanggalLahir } from '../lib/utils';
import { KTAApplication, SystemSettings } from '../types';

export interface KTACardProps {
  application?: Partial<KTAApplication>;
  settings?: Partial<SystemSettings>;
  side: 'front' | 'back';
  id?: string;
  className?: string;
  idSuffix?: string;
  photoOverride?: string;
}

const defaultSampleApp: Partial<KTAApplication> = {
  ktaNumber: '11.02.0027',
  nama: 'CATUR TEDDY PAMUNGKAS',
  tempatLahir: 'Banyumas',
  tanggalLahir: '2012-09-17',
  asalDaerah: 'Kabupaten Banyumas',
  qabilah: 'SMP Muhammadiyah 1',
  tingkatan: 'Pandu Pengenal',
  alamat: 'Tambaksari Kidul RT 07 RW 03, Kembaran, Banyumas',
  verifiedAt: '2026-07-13'
};

function truncateText(str: string | undefined | null, maxLen: number): string {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 1) + '…';
}

export const DEFAULT_KTA_TEMPLATE_FRONT = 'https://hwjateng.com/wp-content/uploads/2026/07/depan.png';
export const DEFAULT_KTA_TEMPLATE_BACK = 'https://hwjateng.com/wp-content/uploads/2026/07/Belakang.jpg';

export const OfficialStempelKwarwil: React.FC<{ idSuffix?: string; className?: string }> = ({ idSuffix = 'card', className }) => {
  const topPathId = `stamp-top-${idSuffix}`;
  const bottomPathId = `stamp-bottom-${idSuffix}`;
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={cn("w-10 h-10 text-blue-700 font-black uppercase tracking-wider relative rotate-[-10deg]", className)}
    >
      <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="50" cy="50" r="31" fill="none" stroke="currentColor" strokeWidth="0.8" />
      
      {/* Central 12-point radiant sun */}
      <g transform="translate(50,50) scale(0.65)">
        <circle cx="0" cy="0" r="11" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.2" />
        {[...Array(12)].map((_, i) => (
          <path key={i} d="M0 -14 L3.2 -24 L0 -21 L-3.2 -24 Z" fill="currentColor" transform={`rotate(${i * 30})`} />
        ))}
        <text x="0" y="3.5" textAnchor="middle" className="text-[7.5px] font-black fill-current" letterSpacing="0">HW</text>
      </g>
      
      <path id={topPathId} d="M 14 50 A 36 36 0 1 1 86 50" fill="none" stroke="none" />
      <path id={bottomPathId} d="M 86 50 A 36 36 0 1 1 14 50" fill="none" stroke="none" />
      
      <text className="text-[5.8px] fill-current font-black" letterSpacing="1">
        <textPath href={`#${topPathId}`} startOffset="50%" textAnchor="middle">KWARTIR WILAYAH JAWA TENGAH</textPath>
      </text>
      <text className="text-[5.8px] fill-current font-black" letterSpacing="1.5">
        <textPath href={`#${bottomPathId}`} startOffset="50%" textAnchor="middle">HIZBUL WATHAN</textPath>
      </text>
    </svg>
  );
};

export const DefaultSignatureKetua: React.FC = () => (
  <svg viewBox="0 0 100 40" className="w-14 h-6 text-blue-700 opacity-90" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 25c10-2 20-15 25-15s5 20 15 5c5-5 15-10 20-5c5 5-2 15 5 15c5 0 15-10 20-15" />
    <path d="M15 18c15 0 35 12 50 12" />
  </svg>
);

export const DefaultSignatureSekretaris: React.FC = () => (
  <svg viewBox="0 0 100 40" className="w-14 h-6 text-blue-700 opacity-90" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 30c5-10 15-20 25-20s10 15 20 10c10-5 15-15 25-10" />
    <path d="M25 20c20 0 40 5 60 5" />
  </svg>
);

export const KTACard: React.FC<KTACardProps> = ({
  application,
  settings: rawSettings,
  side,
  id,
  className,
  idSuffix = 'default',
  photoOverride
}) => {
  const app = application || defaultSampleApp;
  const settings: Partial<SystemSettings> = rawSettings || {};
  
  const ktaFrontBg = settings.ktaTemplateFront || DEFAULT_KTA_TEMPLATE_FRONT;
  const ktaBackBg = settings.ktaTemplateBack || DEFAULT_KTA_TEMPLATE_BACK;

  // Format issue date properly as "Semarang, 13 Juli 2026"
  const rawKota = (settings?.ktaKotaPenerbit || 'Semarang').replace(/[\.\s…]+$/g, '').trim() || 'Semarang';
  const rawDate = app.verifiedAt || app.createdAt || app.tanggalAjuan || '2026-07-13';
  let formattedDate = formatIndonesianDate(rawDate);
  if (!formattedDate || formattedDate.trim() === '' || formattedDate.includes('...')) {
    formattedDate = '13 Juli 2026';
  }
  const issueDateText = `${rawKota}, ${formattedDate}`;

  // Photo resolution
  const photoUrl = photoOverride || app.photo || '';

  if (side === 'front') {
    return (
      <div 
        id={id}
        className={cn(
          "w-[350px] h-[220.72px] aspect-[856/540] rounded-[20px] overflow-hidden border border-gray-200/80 p-3.5 flex flex-col justify-between relative shadow-md select-none bg-white text-gray-800 kta-card-printable",
          className
        )}
        style={{ boxSizing: 'border-box' }}
      >
        {/* Background Image Template (Full Bleed) */}
        {ktaFrontBg && (
          <img 
            src={getCorsSafeUrl(ktaFrontBg)} 
            alt="Template Front" 
            className="absolute inset-0 w-full h-full object-cover z-0" 
            crossOrigin="anonymous" 
            onError={(e) => {
              const img = e.currentTarget;
              if (img.getAttribute('crossOrigin') === 'anonymous') {
                img.removeAttribute('crossOrigin');
                img.src = ktaFrontBg;
              }
            }}
          />
        )}

        {/* Vector Background Ornament as visual backup / template layers */}
        <div className="absolute top-0 right-0 w-36 h-12 bg-gradient-to-bl from-amber-300/35 via-yellow-200/20 to-transparent rounded-bl-full pointer-events-none z-0" />
        <div className="absolute left-0 bottom-0 w-44 h-16 bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 rounded-tr-full opacity-35 pointer-events-none z-0" />
        <div className="absolute left-0 bottom-0 w-52 h-10 bg-gradient-to-tr from-emerald-800 via-teal-700 to-transparent rounded-tr-full opacity-25 pointer-events-none z-0" />

        {/* 1. Header (Logo & Organization Title) */}
        <div className="flex items-center gap-2 z-10 relative">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
            <img 
              src={getCorsSafeUrl("https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png")} 
              alt="HW Logo" 
              className="w-8 h-8 object-contain" 
              crossOrigin="anonymous" 
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[6.5px] font-black uppercase tracking-wider text-emerald-950">
              GERAKAN KEPANDUAN
            </span>
            <span className="text-[7.5px] font-black uppercase tracking-wider text-emerald-850 mt-0.5" style={{ color: '#064e3b' }}>
              HIZBUL WATHAN
            </span>
            <span className="text-[6.2px] font-black uppercase tracking-widest text-emerald-700 mt-0.5">
              JAWA TENGAH
            </span>
          </div>
        </div>

        {/* 2. Body (Photo Box + Member Details Table) */}
        <div className="flex gap-3 text-left relative z-10 -mt-1 mb-auto">
          {/* Photo Frame */}
          <div className="w-[66px] h-[84px] bg-white rounded-xl overflow-hidden border-2 border-emerald-600 shrink-0 flex flex-col items-center justify-center relative shadow-sm z-10">
            {photoUrl ? (
              <img src={getCorsSafeUrl(photoUrl)} alt="Foto KTA" className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <div className="flex flex-col items-center justify-center text-emerald-600 mb-2">
                <UserIcon size={18} />
                <span className="text-[5px] uppercase font-bold mt-0.5 text-center font-mono text-emerald-700">NO PHOTO</span>
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[5.5px] uppercase font-black text-center py-0.5 tracking-wider">
              HW JATENG
            </div>
          </div>

          {/* Member Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-center space-y-0.5 relative z-10">
            <h4 className="text-[8.5px] font-black uppercase tracking-wider text-emerald-800 mb-0.5 font-display" style={{ color: '#065f46' }}>
              KARTU ANGGOTA
            </h4>
            
            <table className="w-full text-left border-none border-collapse text-[6.8px] font-semibold leading-tight">
              <tbody>
                <tr>
                  <td className="w-13 font-bold uppercase py-0.1 text-gray-800">
                    NOMOR
                  </td>
                  <td className="w-2 text-center py-0.1 text-gray-800 font-bold">:</td>
                  <td className="font-mono font-black tracking-wider py-0.1 text-emerald-700">
                    {app.ktaNumber || '11.02.0027'}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold uppercase py-0.1 text-gray-800">
                    NAMA
                  </td>
                  <td className="text-center py-0.1 text-gray-800 font-bold">:</td>
                  <td className="font-black uppercase py-0.1 text-gray-950">
                    {truncateText(app.nama || 'CATUR TEDDY PAMUNGKAS', 32)}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold uppercase py-0.1 text-gray-800">
                    TTL
                  </td>
                  <td className="text-center py-0.1 text-gray-800 font-bold">:</td>
                  <td className="font-bold py-0.1 text-gray-900">
                    {formatTempatTanggalLahir(app.tempatLahir, app.tanggalLahir) || 'Banyumas, 17 September 2012'}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold uppercase py-0.1 text-gray-800">
                    ASAL
                  </td>
                  <td className="text-center py-0.1 text-gray-800 font-bold">:</td>
                  <td className="font-bold py-0.1 text-gray-900">
                    Kwarda {truncateText(app.asalDaerah || 'Kabupaten Banyumas', 26)}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold uppercase py-0.1 text-gray-800">
                    TINGKATAN
                  </td>
                  <td className="text-center py-0.1 text-gray-800 font-bold">:</td>
                  <td className="font-bold py-0.1 text-emerald-700">
                    {app.tingkatan || 'Pandu Pengenal'}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold uppercase py-0.1 text-gray-800 align-top">
                    ALAMAT
                  </td>
                  <td className="text-center py-0.1 text-gray-800 font-bold align-top">:</td>
                  <td className="font-medium py-0.1 text-[6.2px] leading-tight text-gray-800">
                    {truncateText(app.alamat || 'Tambaksari Kidul RT 07 RW 03, Kembaran, Banyumas', 55)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Footer (Date, Signatures & Stamp) */}
        <div className="z-10 flex flex-col items-end relative mt-auto pr-1">
          {/* Date Text */}
          <p className="text-[5.5px] font-bold text-gray-800 leading-none mb-0.5">
            {issueDateText}
          </p>
          
          {/* Signatures & Stamp Row */}
          <div className="flex items-center justify-between w-[150px] h-7 relative px-1">
            {/* Stamp overlapping center */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-90">
              {settings?.ktaStempelImage ? (
                <img src={getCorsSafeUrl(settings.ktaStempelImage)} alt="Stempel" className="w-10 h-10 object-contain rotate-[-10deg]" crossOrigin="anonymous" />
              ) : (
                <OfficialStempelKwarwil idSuffix={idSuffix} />
              )}
            </div>

            {/* Ketua Signature Block */}
            <div className="flex flex-col items-center w-[68px] relative text-center">
              <span className="text-[4.5px] font-bold uppercase text-gray-700 leading-none">Ketua</span>
              <div className="h-5 flex items-center justify-center my-0.5">
                {settings?.ktaTandaTanganKetua ? (
                  <img src={getCorsSafeUrl(settings.ktaTandaTanganKetua)} alt="Tanda Tangan Ketua" className="h-5 object-contain" crossOrigin="anonymous" />
                ) : (
                  <DefaultSignatureKetua />
                )}
              </div>
              <span className="text-[5px] font-black uppercase text-gray-900 leading-none truncate w-full">
                {settings?.ktaKetuaNama || 'TAUFIQ'}
              </span>
              <span className="text-[4px] font-bold text-gray-700 leading-none truncate w-full mt-0.5">
                {settings?.ktaKetuaNbm || 'NBM 1015096'}
              </span>
            </div>

            {/* Sekretaris Signature Block */}
            <div className="flex flex-col items-center w-[68px] relative text-center">
              <span className="text-[4.5px] font-bold uppercase text-gray-700 leading-none">Sekretaris</span>
              <div className="h-5 flex items-center justify-center my-0.5">
                {settings?.ktaTandaTanganSekretaris ? (
                  <img src={getCorsSafeUrl(settings.ktaTandaTanganSekretaris)} alt="Tanda Tangan Sekretaris" className="h-5 object-contain" crossOrigin="anonymous" />
                ) : (
                  <DefaultSignatureSekretaris />
                )}
              </div>
              <span className="text-[5px] font-black uppercase text-gray-900 leading-none truncate w-full">
                {settings?.ktaSekretarisNama || 'MUHAMMAD DZIKRON'}
              </span>
              <span className="text-[4px] font-bold text-gray-700 leading-none truncate w-full mt-0.5">
                {settings?.ktaSekretarisNbm || 'NBM 1029863'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // BACK SIDE CARD (Tampilan Belakang)
  // ==========================================
  return (
    <div 
      id={id}
      className={cn(
        "w-[350px] h-[220.72px] aspect-[856/540] rounded-[20px] overflow-hidden border border-gray-200/80 p-3.5 relative flex flex-col justify-between shadow-md select-none bg-white text-gray-800 kta-card-printable",
        className
      )}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Background Template Image (Full Bleed) */}
      {ktaBackBg && (
        <img 
          src={getCorsSafeUrl(ktaBackBg)} 
          alt="Template Back" 
          className="absolute inset-0 w-full h-full object-cover z-0" 
          crossOrigin="anonymous" 
          onError={(e) => {
            const img = e.currentTarget;
            if (img.getAttribute('crossOrigin') === 'anonymous') {
              img.removeAttribute('crossOrigin');
              img.src = ktaBackBg;
            }
          }}
        />
      )}

      {/* Vector Background Ornament */}
      <div className="absolute top-0 right-0 w-40 h-14 bg-gradient-to-bl from-amber-300/35 via-yellow-200/20 to-transparent rounded-bl-full pointer-events-none z-0" />
      <div className="absolute left-0 bottom-0 w-36 h-14 bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 rounded-tr-full opacity-35 pointer-events-none z-0" />

      {/* Top Center Badge: HW Jateng */}
      <div className="flex justify-center z-10 relative">
        <div className="px-3 py-1 bg-emerald-700 text-white rounded-full flex items-center gap-1.5 shadow-sm border border-emerald-800">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 flex items-center justify-center text-[5px] font-black text-emerald-950">
            ★
          </div>
          <span className="text-[7.5px] font-black tracking-wider uppercase font-display">
            HW Jateng
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center z-10 relative -mt-1">
        <h5 className="text-[8.5px] font-black uppercase tracking-wide text-emerald-850" style={{ color: '#064e3b' }}>
          Undang - undang Pandu Hizbul Wathan
        </h5>
      </div>

      {/* 10 Laws (Undang-undang Pandu Hizbul Wathan) */}
      <div className="z-10 relative px-2 -mt-1">
        <table className="w-full text-[5.8px] font-medium leading-snug border-collapse text-gray-850" style={{ color: '#1f2937' }}>
          <tbody>
            <tr>
              <td className="w-11 font-bold align-top py-0.2 text-gray-900">Satu,</td>
              <td className="py-0.2">Pandu Hizbul Wathan itu, dapat dipercaya</td>
            </tr>
            <tr>
              <td className="font-bold align-top py-0.2 text-gray-900">Dua,</td>
              <td className="py-0.2">Pandu Hizbul Wathan itu, setia dan teguh hati</td>
            </tr>
            <tr>
              <td className="font-bold align-top py-0.2 text-gray-900">Tiga,</td>
              <td className="py-0.2">Pandu Hizbul Wathan itu, siap menolong dan wajib berjasa</td>
            </tr>
            <tr>
              <td className="font-bold align-top py-0.2 text-gray-900">Empat,</td>
              <td className="py-0.2">Pandu Hizbul Wathan itu, suka perdamaian dan persaudaraan</td>
            </tr>
            <tr>
              <td className="font-bold align-top py-0.2 text-gray-900">Lima,</td>
              <td className="py-0.2">Pandu Hizbul Wathan itu, sopan santun dan perwira</td>
            </tr>
            <tr>
              <td className="font-bold align-top py-0.2 text-gray-900">Enam,</td>
              <td className="py-0.2">Pandu Hizbul Wathan itu, menyayangi semua makhluk</td>
            </tr>
            <tr>
              <td className="font-bold align-top py-0.2 text-gray-900">Tujuh,</td>
              <td className="py-0.2">Pandu Hizbul Wathan itu, melaksanakan perintah tanpa membantah</td>
            </tr>
            <tr>
              <td className="font-bold align-top py-0.2 text-gray-900">Delapan,</td>
              <td className="py-0.2">Pandu Hizbul Wathan itu, sabar dan pemaaf</td>
            </tr>
            <tr>
              <td className="font-bold align-top py-0.2 text-gray-900">Sembilan,</td>
              <td className="py-0.2">Pandu Hizbul Wathan itu, teliti dan hemat</td>
            </tr>
            <tr>
              <td className="font-bold align-top py-0.2 text-gray-900">Sepuluh,</td>
              <td className="py-0.2">Pandu Hizbul Wathan itu, suci dalam hati, pikiran, perkataan dan perbuatan</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom Footer: Website */}
      <div className="z-10 flex items-center justify-between relative mt-auto px-1">
        <div className="flex items-center gap-1 text-[5px] font-bold text-gray-600">
          <Globe size={8} className="text-emerald-700" />
          <span>www.hwjateng.com</span>
        </div>
      </div>
    </div>
  );
};
