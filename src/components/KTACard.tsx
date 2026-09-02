import React from 'react';
import { User as UserIcon, Globe } from 'lucide-react';
import { cn, getCorsSafeUrl, formatTempatTanggalLahir } from '../lib/utils';
import { KTAApplication, SystemSettings } from '../types';
import { 
  DEFAULT_LOCAL_KTA_FRONT, 
  DEFAULT_LOCAL_KTA_BACK, 
  LOCAL_KTA_FRONT_BASE64, 
  LOCAL_KTA_BACK_BASE64, 
  getSafeKtaFront, 
  getSafeKtaBack 
} from '../assets/ktaTemplates';

export interface KTACardProps {
  application?: Partial<KTAApplication> | any;
  member?: Partial<KTAApplication> | any;
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

export const DEFAULT_KTA_TEMPLATE_FRONT = DEFAULT_LOCAL_KTA_FRONT;
export const DEFAULT_KTA_TEMPLATE_BACK = DEFAULT_LOCAL_KTA_BACK;

export const KTACard: React.FC<KTACardProps> = ({
  application,
  member,
  settings: rawSettings,
  side,
  id,
  className,
  photoOverride
}) => {
  const app = application || member || defaultSampleApp;
  const settings: Partial<SystemSettings> = rawSettings || {};
  
  const ktaFrontBg = getSafeKtaFront(settings.ktaTemplateFront || (settings as any).ktaFrontBg);
  const ktaBackBg = getSafeKtaBack(settings.ktaTemplateBack || (settings as any).ktaBackBg);

  // Photo resolution
  const photoUrl = photoOverride || app.photo || app.foto || '';

  // ==========================================
  // FRONT SIDE CARD (Tampilan Depan)
  // ==========================================
  if (side === 'front') {
    return (
      <div 
        id={id}
        className={cn(
          "w-[350px] max-w-full h-auto aspect-[856/540] rounded-[20px] overflow-hidden border border-gray-200/80 p-3.5 flex flex-col justify-between relative shadow-md select-none bg-white text-gray-800 kta-card-printable shrink-0",
          className
        )}
        style={{ boxSizing: 'border-box' }}
      >
        {/* Master Template Background Image (Full Bleed) */}
        {ktaFrontBg && (
          <img 
            src={ktaFrontBg.startsWith('http') ? getCorsSafeUrl(ktaFrontBg) : ktaFrontBg} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" 
            crossOrigin={ktaFrontBg.startsWith('http') ? "anonymous" : undefined}
            onError={(e) => {
              const img = e.currentTarget;
              img.removeAttribute('crossOrigin');
              img.src = LOCAL_KTA_FRONT_BASE64;
            }}
          />
        )}

        {/* Fallback subtle ornament if background fails or transparent */}
        {!ktaFrontBg && (
          <div className="absolute top-0 right-0 w-36 h-12 bg-gradient-to-bl from-amber-300/35 via-yellow-200/20 to-transparent rounded-bl-full pointer-events-none z-0" />
        )}

        {/* Top Header Buffer (Keeps space clear for the Header & HW Logo already on depan.png) */}
        <div className="h-9 w-full z-10 pointer-events-none shrink-0" />

        {/* Member Details & Photo Body */}
        <div className="flex gap-3 text-left relative z-10 my-auto pl-0.5">
          {/* Photo Frame */}
          <div className="w-[66px] h-[84px] bg-white rounded-xl overflow-hidden border-2 border-emerald-600 shrink-0 flex flex-col items-center justify-center relative shadow-sm z-10">
            {photoUrl ? (
              <img src={getCorsSafeUrl(photoUrl)} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
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

          {/* Member Details Table */}
          <div className="flex-1 min-w-0 flex flex-col justify-center space-y-0.5 relative z-10 pr-1">
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
                    {app.ktaNumber || app.nomorKTA || '11.02.0027'}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold uppercase py-0.1 text-gray-800">
                    NAMA
                  </td>
                  <td className="text-center py-0.1 text-gray-800 font-bold">:</td>
                  <td className="font-black uppercase py-0.1 text-gray-950">
                    {truncateText(app.nama || app.namaLengkap || 'CATUR TEDDY PAMUNGKAS', 32)}
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
                    {(() => {
                      const rawAsal = (app.asalDaerah || app.asalKwarda || 'Kabupaten Banyumas').trim();
                      if (rawAsal.toLowerCase().startsWith('kwarda')) return truncateText(rawAsal, 26);
                      return `Kwarda ${truncateText(rawAsal, 20)}`;
                    })()}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold uppercase py-0.1 text-gray-800">
                    TINGKATAN
                  </td>
                  <td className="text-center py-0.1 text-gray-800 font-bold">:</td>
                  <td className="font-bold py-0.1 text-emerald-700">
                    {app.tingkatan || app.golongan || 'Pandu Pengenal'}
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

        {/* Bottom Signatures Buffer (Keeps space clear for Ketua, Sekretaris & Stempel on depan.png) */}
        <div className="h-8 w-full z-10 pointer-events-none shrink-0" />
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
        "w-[350px] max-w-full h-auto aspect-[856/540] rounded-[20px] overflow-hidden border border-gray-200/80 relative shadow-md select-none bg-white text-gray-800 kta-card-printable shrink-0",
        className
      )}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Master Template Background Image (Belakang) - Full Bleed */}
      {ktaBackBg ? (
        <img 
          src={ktaBackBg.startsWith('http') ? getCorsSafeUrl(ktaBackBg) : ktaBackBg} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" 
          crossOrigin={ktaBackBg.startsWith('http') ? "anonymous" : undefined}
          onError={(e) => {
            const img = e.currentTarget;
            img.removeAttribute('crossOrigin');
            img.src = LOCAL_KTA_BACK_BASE64;
          }}
        />
      ) : (
        /* Fallback if no template is provided */
        <div className="w-full h-full p-3.5 flex flex-col justify-between relative z-10">
          <div className="flex justify-center">
            <div className="px-3 py-1 bg-emerald-700 text-white rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="text-[7.5px] font-black tracking-wider uppercase font-display">
                HW Jateng
              </span>
            </div>
          </div>
          <div className="text-center -mt-1">
            <h5 className="text-[8.5px] font-black uppercase tracking-wide text-emerald-850">
              Undang - undang Pandu Hizbul Wathan
            </h5>
          </div>
          <div className="flex items-center justify-between text-[5px] font-bold text-gray-600">
            <div className="flex items-center gap-1">
              <Globe size={8} className="text-emerald-700" />
              <span>www.hwjateng.com</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
