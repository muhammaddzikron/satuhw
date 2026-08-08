import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { cn, getCorsSafeUrl, formatIndonesianDate } from '../lib/utils';
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
  nama: 'Catur Teddy Pamungkas',
  tempatLahir: 'Banyumas',
  tanggalLahir: '2012-09-17',
  asalDaerah: 'Banyumas',
  qabilah: 'SMP Muhammadiyah 1',
  tingkatan: 'Pandu Pengenal',
  alamat: 'Tambaksari Kidul RT 07 RW 03, Kembaran, Banyumas',
  verifiedAt: new Date().toISOString()
};

function truncateText(str: string | undefined | null, maxLen: number): string {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 1) + '…';
}

export const DefaultStempel: React.FC<{ idSuffix?: string }> = ({ idSuffix = 'card' }) => {
  const topPathId = `stamp-path-top-${idSuffix}`;
  const bottomPathId = `stamp-path-bottom-${idSuffix}`;
  return (
    <svg viewBox="0 0 100 100" className="w-8 h-8 text-blue-600/85 font-black uppercase tracking-wider relative rotate-[-12deg]">
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="0.75" />
      <g transform="translate(50,50) scale(0.65)">
        <circle cx="0" cy="0" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
        {[...Array(12)].map((_, i) => (
          <path key={i} d="M0 -15 L3 -25 L0 -21 L-3 -25 Z" fill="currentColor" transform={`rotate(${i * 30})`} />
        ))}
      </g>
      <path id={topPathId} d="M 12 50 A 38 38 0 1 1 88 50" fill="none" stroke="none" />
      <path id={bottomPathId} d="M 88 50 A 38 38 0 1 1 12 50" fill="none" stroke="none" />
      <text className="text-[6.5px] fill-current font-bold" letterSpacing="1.2">
        <textPath href={`#${topPathId}`} startOffset="50%" textAnchor="middle">KWARWIL JAWA TENGAH</textPath>
      </text>
      <text className="text-[6.5px] fill-current font-bold" letterSpacing="1.2">
        <textPath href={`#${bottomPathId}`} startOffset="50%" textAnchor="middle">HIZBUL WATHAN</textPath>
      </text>
    </svg>
  );
};

export const DefaultSignatureKetua: React.FC = () => (
  <svg viewBox="0 0 100 40" className="w-16 h-8 text-blue-700 opacity-80" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 25c10-2 20-15 25-15s5 20 15 5c5-5 15-10 20-5c5 5-2 15 5 15c5 0 15-10 20-15" />
    <path d="M15 18c15 0 35 12 50 12" />
  </svg>
);

export const DefaultSignatureSekretaris: React.FC = () => (
  <svg viewBox="0 0 100 40" className="w-16 h-8 text-blue-700 opacity-80" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
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
  
  const ktaFrontBg = settings.ktaTemplateFront;
  const ktaBackBg = settings.ktaTemplateBack;

  // Format issue date properly as "Semarang, 07 Agustus 2026"
  const rawKota = (settings?.ktaKotaPenerbit || 'Semarang').replace(/\.+$|…+$/g, '').trim() || 'Semarang';
  const rawDate = app.verifiedAt || app.createdAt;
  const formattedDate = formatIndonesianDate(rawDate);
  const issueDateText = `${rawKota}, ${formattedDate}`;

  // Photo resolution
  const photoUrl = photoOverride || app.photo || '';

  if (side === 'front') {
    return (
      <div 
        id={id}
        className={cn(
          "w-[350px] h-[220.72px] aspect-[856/540] rounded-3xl overflow-hidden border p-4 flex flex-col justify-between relative shadow-lg select-none",
          ktaFrontBg ? "text-gray-800 bg-white border-emerald-950/10" : "text-white bg-gradient-to-br from-hw-green via-emerald-800 to-emerald-950 border-emerald-800/20",
          className
        )}
        style={{ boxSizing: 'border-box' }}
      >
        {/* Background Template Image */}
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

        {/* Custom Date above pre-printed Sekretaris text on template background */}
        {ktaFrontBg && (
          <div className="absolute bottom-[70px] right-[20px] z-30 text-right pointer-events-none" style={{ position: 'absolute', zIndex: 30 }}>
            <p 
              className="text-[5.5px] font-bold text-gray-800 leading-none"
              style={{ color: '#1f2937', position: 'relative', zIndex: 30 }}
            >
              {'\u00A0\u00A0\u00A0\u00A0'}{issueDateText}
            </p>
          </div>
        )}

        {/* Default background ornament curves if no template front is active */}
        {!ktaFrontBg && (
          <>
            <div className="absolute right-0 top-0 w-40 h-16 bg-gradient-to-l from-amber-100/30 to-transparent rounded-bl-full pointer-events-none" />
            <div className="absolute left-0 bottom-0 right-0 h-20 bg-gradient-to-t from-emerald-500/10 via-teal-500/5 to-transparent pointer-events-none" />
            <div className="absolute left-0 bottom-0 w-44 h-14 bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-700 rounded-tr-full opacity-50 pointer-events-none" />
            <div className="absolute left-0 bottom-0 w-48 h-10 bg-gradient-to-tr from-amber-400 via-yellow-400 to-transparent rounded-tr-full opacity-20 pointer-events-none" />
            <div className="absolute -right-10 -bottom-10 w-44 h-44 opacity-10 bg-no-repeat bg-contain pointer-events-none" style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png')" }}></div>
          </>
        )}

        {/* Card Header */}
        <div className={cn("flex items-center gap-2.5 z-10 border-b pb-2", ktaFrontBg ? "border-transparent opacity-0 pointer-events-none" : "border-white/10")}>
          <img src={getCorsSafeUrl("https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png")} alt="HW Logo" className="w-8 h-8 object-contain" crossOrigin="anonymous" />
          <div className="min-w-0">
            <h4 className="text-[7.5px] font-black uppercase tracking-wider leading-tight">GERAKAN KEPANDUAN HIZBUL WATHAN</h4>
            <p className={cn("text-[6.5px] font-black uppercase tracking-widest leading-none", ktaFrontBg ? "text-hw-green" : "text-amber-300")}>KWARWIL JAWA TENGAH</p>
          </div>
        </div>

        {/* Card Body */}
        <div className={cn("flex gap-3 text-left relative z-20", ktaFrontBg ? "-mt-1.5 mb-auto" : "my-1")} style={{ position: 'relative', zIndex: 20 }}>
          {/* User photo */}
          <div className="w-16 h-20 bg-gray-50 rounded-lg overflow-hidden border-2 border-emerald-600 shrink-0 flex items-center justify-center relative shadow-sm z-20" style={{ position: 'relative', zIndex: 20 }}>
            {photoUrl ? (
              <img src={getCorsSafeUrl(photoUrl)} alt="Foto KTA" className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <div className="flex flex-col items-center justify-center text-emerald-600">
                <UserIcon size={14} />
                <span className="text-[5px] uppercase font-bold mt-1 text-center font-mono">No Photo</span>
              </div>
            )}
            <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[5px] uppercase font-black text-center py-0.5">
              HW JATENG
            </span>
          </div>

          {/* Member Details */}
          <div className="w-[240px] flex-1 min-w-0 flex flex-col justify-center space-y-0.5 relative z-20" style={{ width: '240px', position: 'relative', zIndex: 20 }}>
            <h4 
              className={cn("text-[8.5px] font-black uppercase tracking-wider mb-0.5", ktaFrontBg ? "text-emerald-800" : "text-amber-300")}
              style={{ color: ktaFrontBg ? '#065f46' : '#fcd34d', position: 'relative', zIndex: 20 }}
            >
              KARTU ANGGOTA
            </h4>
            
            <table className="w-full text-left border-none border-collapse text-[7px] font-semibold relative z-20" style={{ position: 'relative', zIndex: 20 }}>
              <tbody>
                <tr>
                  <td 
                    className="w-14 font-bold uppercase py-0.1" 
                    style={{ color: ktaFrontBg ? '#4b5563' : '#cbd5e1', position: 'relative', zIndex: 20 }}
                  >
                    Nomor
                  </td>
                  <td 
                    className="w-2 text-center py-0.1"
                    style={{ color: ktaFrontBg ? '#4b5563' : '#cbd5e1', position: 'relative', zIndex: 20 }}
                  >
                    :
                  </td>
                  <td 
                    className="font-mono font-black tracking-wider py-0.1"
                    style={{ color: ktaFrontBg ? '#065f46' : '#fde68a', position: 'relative', zIndex: 20 }}
                  >
                    {app.ktaNumber || 'KTA-HW.JT.XXXX'}
                  </td>
                </tr>
                <tr>
                  <td 
                    className="font-bold uppercase py-0.1" 
                    style={{ color: ktaFrontBg ? '#4b5563' : '#cbd5e1', position: 'relative', zIndex: 20 }}
                  >
                    Nama
                  </td>
                  <td 
                    className="text-center py-0.1"
                    style={{ color: ktaFrontBg ? '#4b5563' : '#cbd5e1', position: 'relative', zIndex: 20 }}
                  >
                    :
                  </td>
                  <td 
                    className="font-black uppercase py-0.1"
                    style={{ color: ktaFrontBg ? '#111827' : '#ffffff', position: 'relative', zIndex: 20 }}
                  >
                    {truncateText(app.nama || '', 32)}
                  </td>
                </tr>
                <tr>
                  <td 
                    className="font-bold uppercase py-0.1" 
                    style={{ color: ktaFrontBg ? '#4b5563' : '#cbd5e1', position: 'relative', zIndex: 20 }}
                  >
                    TTL
                  </td>
                  <td 
                    className="text-center py-0.1"
                    style={{ color: ktaFrontBg ? '#4b5563' : '#cbd5e1', position: 'relative', zIndex: 20 }}
                  >
                    :
                  </td>
                  <td 
                    className="font-bold py-0.1"
                    style={{ color: ktaFrontBg ? '#111827' : '#ffffff', position: 'relative', zIndex: 20 }}
                  >
                    {truncateText(app.tempatLahir || '-', 15)}, {app.tanggalLahir ? formatIndonesianDate(app.tanggalLahir) : '-'}
                  </td>
                </tr>
                <tr>
                  <td 
                    className="font-bold uppercase py-0.1" 
                    style={{ color: ktaFrontBg ? '#4b5563' : '#cbd5e1', position: 'relative', zIndex: 20 }}
                  >
                    Asal
                  </td>
                  <td 
                    className="text-center py-0.1"
                    style={{ color: ktaFrontBg ? '#4b5563' : '#cbd5e1', position: 'relative', zIndex: 20 }}
                  >
                    :
                  </td>
                  <td 
                    className="font-bold py-0.1"
                    style={{ color: ktaFrontBg ? '#111827' : '#ffffff', position: 'relative', zIndex: 20 }}
                  >
                    Kwarda {truncateText(app.asalDaerah || '', 22)}
                  </td>
                </tr>
                {app.qabilah && (
                  <tr>
                    <td 
                      className="font-bold uppercase py-0.1" 
                      style={{ color: ktaFrontBg ? '#4b5563' : '#cbd5e1', position: 'relative', zIndex: 20 }}
                    >
                      Qabilah
                    </td>
                    <td 
                      className="text-center py-0.1"
                      style={{ color: ktaFrontBg ? '#4b5563' : '#cbd5e1', position: 'relative', zIndex: 20 }}
                    >
                      :
                    </td>
                    <td 
                      className="font-bold py-0.1"
                      style={{ color: ktaFrontBg ? '#111827' : '#ffffff', position: 'relative', zIndex: 20 }}
                    >
                      {truncateText(app.qabilah, 25)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td 
                    className="font-bold uppercase py-0.1" 
                    style={{ color: ktaFrontBg ? '#4b5563' : '#cbd5e1', position: 'relative', zIndex: 20 }}
                  >
                    Tingkatan
                  </td>
                  <td 
                    className="text-center py-0.1"
                    style={{ color: ktaFrontBg ? '#4b5563' : '#cbd5e1', position: 'relative', zIndex: 20 }}
                  >
                    :
                  </td>
                  <td 
                    className="font-bold py-0.1"
                    style={{ color: ktaFrontBg ? '#047857' : '#fde68a', position: 'relative', zIndex: 20 }}
                  >
                    {app.tingkatan || 'Pandu'}
                  </td>
                </tr>
                <tr>
                  <td 
                    className="font-bold uppercase py-0.1" 
                    style={{ color: ktaFrontBg ? '#4b5563' : '#cbd5e1', position: 'relative', zIndex: 20 }}
                  >
                    Alamat
                  </td>
                  <td 
                    className="text-center py-0.1"
                    style={{ color: ktaFrontBg ? '#4b5563' : '#cbd5e1', position: 'relative', zIndex: 20 }}
                  >
                    :
                  </td>
                  <td 
                    className="font-bold py-0.1 text-[6.5px] leading-tight"
                    style={{ color: ktaFrontBg ? '#4b5563' : '#cbd5e1', position: 'relative', zIndex: 20 }}
                  >
                    {truncateText(app.alamat || '-', 55)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-1 z-10 flex items-center justify-between relative mt-auto">
          <span className="text-[5px]"></span>
          
          {/* Right side signatures section */}
          <div className={cn("flex flex-col items-end text-right w-[150px] shrink-0 relative", ktaFrontBg ? "opacity-0 pointer-events-none hidden" : "")}>
            <p className={cn("text-[5.5px] font-bold leading-none pt-0.5", ktaFrontBg ? "text-gray-500" : "text-slate-300")}>{issueDateText}</p>
            
            {/* Signatures & stamp overlapping row */}
            <div className="flex items-center justify-between w-full h-8 relative mt-0.5 px-1">
              {/* Stamp overlaying center */}
              <div className="absolute left-[35%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-85">
                {settings?.ktaStempelImage ? (
                  <img src={getCorsSafeUrl(settings.ktaStempelImage)} alt="Stempel" className="w-8 h-8 object-contain rotate-[-12deg]" crossOrigin="anonymous" />
                ) : (
                  <DefaultStempel idSuffix={idSuffix} />
                )}
              </div>

              {/* Ketua Signature Block */}
              <div className="flex flex-col items-center w-1/2 relative">
                <span className={cn("text-[4px] font-bold uppercase", ktaFrontBg ? "text-gray-400" : "text-slate-400")}>Ketua</span>
                <div className="h-6 flex items-center justify-center">
                  {settings?.ktaTandaTanganKetua ? (
                    <img src={getCorsSafeUrl(settings.ktaTandaTanganKetua)} alt="Tanda Tangan Ketua" className="h-6 object-contain" crossOrigin="anonymous" />
                  ) : (
                    <DefaultSignatureKetua />
                  )}
                </div>
                <span className={cn("text-[4.5px] font-black leading-none uppercase truncate w-full text-center", ktaFrontBg ? "text-gray-800" : "text-white")}>{settings?.ktaKetuaNama || 'Ramanda Budi'}</span>
                <span className={cn("text-[3.5px] font-semibold leading-none truncate w-full text-center", ktaFrontBg ? "text-gray-400" : "text-slate-300")}>{settings?.ktaKetuaNbm || 'NBM. 123 456'}</span>
              </div>

              {/* Sekretaris Signature Block */}
              <div className="flex flex-col items-center w-1/2 relative">
                <span className={cn("text-[4px] font-bold uppercase", ktaFrontBg ? "text-gray-400" : "text-slate-400")}>Sekretaris</span>
                <div className="h-6 flex items-center justify-center">
                  {settings?.ktaTandaTanganSekretaris ? (
                    <img src={getCorsSafeUrl(settings.ktaTandaTanganSekretaris)} alt="Tanda Tangan Sekretaris" className="h-6 object-contain" crossOrigin="anonymous" />
                  ) : (
                    <DefaultSignatureSekretaris />
                  )}
                </div>
                <span className={cn("text-[4.5px] font-black leading-none uppercase truncate w-full text-center", ktaFrontBg ? "text-gray-800" : "text-white")}>{settings?.ktaSekretarisNama || 'Ramanda Siti'}</span>
                <span className={cn("text-[3.5px] font-semibold leading-none truncate w-full text-center", ktaFrontBg ? "text-gray-400" : "text-slate-300")}>{settings?.ktaSekretarisNbm || 'NBM. 654 321'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // BACK SIDE CARD
  return (
    <div 
      id={id}
      className={cn(
        "w-[350px] h-[220.72px] aspect-[856/540] rounded-3xl overflow-hidden border relative flex flex-col justify-between shadow-lg select-none",
        ktaBackBg ? "bg-white border-emerald-950/10" : "text-white bg-gradient-to-tr from-emerald-950 via-emerald-900 to-slate-900 border-emerald-950/20 p-4",
        className
      )}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Background Template Image - Full Bleed without member data or text overlay */}
      {ktaBackBg ? (
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
      ) : (
        /* Default system background if no template */
        <>
          <div className="absolute -left-10 -top-10 w-36 h-36 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="absolute right-0 bottom-0 w-40 h-16 bg-gradient-to-t from-emerald-500/5 to-transparent rounded-tl-full pointer-events-none" />
          <div className="absolute left-6 top-6 w-32 h-32 opacity-5 bg-no-repeat bg-contain pointer-events-none" style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png')" }}></div>

          {/* Rules and Pledge */}
          <div className="space-y-1 z-10 px-1 text-left leading-tight">
            <h5 className="text-[7.5px] font-black uppercase tracking-wider text-center border-b border-white/10 pb-0.5 text-amber-300">Undang-Undang Pandu Hizbul Wathan</h5>
            <ol className="grid grid-cols-2 gap-x-3 gap-y-0.25 text-[4.8px] list-decimal pl-3 font-semibold leading-tight mt-1 text-slate-300">
              <li>Satu, Pandu Hizbul Wathan itu, dapat dipercaya.</li>
              <li>Dua, Pandu Hizbul Wathan itu, setia dan teguh hati.</li>
              <li>Tiga, Pandu Hizbul Wathan itu, siap menolong dan wajib berjasa.</li>
              <li>Empat, Pandu Hizbul Wathan itu, suka perdamaian dan persaudaraan.</li>
              <li>Lima, Pandu Hizbul Wathan itu, sopan santun dan perwira.</li>
              <li>Enam, Pandu Hizbul Wathan itu, menyayangi semua makhluk.</li>
              <li>Tujuh, Pandu Hizbul Wathan itu, melaksanakan perintah tanpa membantah.</li>
              <li>Delapan, Pandu Hizbul Wathan itu, sabar dan pemaaf.</li>
              <li>Sembilan, Pandu Hizbul Wathan itu, teliti dan hemat.</li>
              <li>Sepuluh, Pandu Hizbul Wathan itu, suci dalam hati, pikiran, perkataan dan perbuatan.</li>
            </ol>
          </div>

          <div className="border-t border-white/10 pt-1.5 z-10 flex items-center justify-between relative mt-auto text-left">
            <div className="space-y-0.5 max-w-[140px] leading-tight">
              <p className="text-[4px] uppercase font-bold text-slate-400">Diterbitkan oleh :</p>
              <p className="text-[5.5px] font-black uppercase leading-none text-white">Pimpinan Wilayah HW Jawa Tengah</p>
              <p className="text-[4px] text-slate-450">Jl. Singosari No.33, Semarang</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
