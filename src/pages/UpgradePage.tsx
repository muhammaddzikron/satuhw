import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'motion/react';
import { Award, Star, ArrowUpCircle, MessageCircle, Info, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { sheetsService } from '../services/sheetsService';
import { cn } from '../lib/utils';

const ROLE_OPTIONS = [
  { id: 'sugli', title: 'Dewan Sugli', price: 'Rp 0', description: 'Akses manajemen materi Sugli dan kordinasi daerah. Memerlukan lampiran SK Keanggotaan via WhatsApp.' },
  { id: 'kwarda', title: 'Kwarda', price: 'Rp 0', description: 'Akses manajemen data anggota dan materi tingkat kwarda. Memerlukan lampiran SK Keanggotaan via WhatsApp.' },
  { id: 'jati1', title: 'Jaya Melati 1', price: 'Rp 50.000', description: 'Akses penuh materi pelatihan tingkat Jaya Melati 1.' },
  { id: 'jati2', title: 'Jaya Melati 2', price: 'Rp 50.000', description: 'Akses penuh materi pelatihan tingkat Jaya Melati 2.' },
  { id: 'jari1', title: 'Jaya Matahari 1', price: 'Rp 50.000', description: 'Akses penuh materi pelatihan tingkat Jaya Matahari 1.' },
];

export default function UpgradePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{type: 'success' | 'error', text: string} | null>(null);
  const [roleOptions, setRoleOptions] = React.useState(ROLE_OPTIONS);
  const [waNumber, setWaNumber] = React.useState('6281234567890');

  React.useEffect(() => {
    const fetchFees = async () => {
      try {
        const s = await sheetsService.getSettings();
        if (Array.isArray(s.upgradeFees)) {
          const mapped = s.upgradeFees.map((fee: any) => ({
            id: fee.id,
            title: fee.label,
            price: fee.value,
            description: fee.note
          }));
          setRoleOptions(mapped);
        }
        if (s.waConfirmation) {
          setWaNumber(s.waConfirmation);
        }
      } catch (error) {
        console.error('Error fetching fees:', error);
      }
    };
    fetchFees();
  }, []);

  if (!isAuthenticated) return <Navigate to="/login" />;

  const handleRequestUpgrade = async (roleId: string) => {
    if (!user) return;
    setLoading(true);
    setSelectedId(roleId);
    setMessage(null);
    
    try {
      const res = await sheetsService.requestUpgrade(user.id, roleId);
      
      if (res.success) {
        setMessage({ 
          type: 'success', 
          text: 'Permintaan upgrade berhasil dikirim! Silakan hubungi admin untuk aktivasi.' 
        });
        
        // Update local state to reflect the request
        const updatedRequests = [...(user.upgradeRequests || []), roleId];
        updateUser({ upgradeRequests: updatedRequests });
      } else {
        setMessage({ type: 'error', text: res.message || 'Gagal mengirim permintaan.' });
      }
    } catch (error) {
      console.error('Upgrade request error:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan sistem. Coba lagi nanti.' });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = (roleTitle: string, price: string) => {
    let text = "";
    if (price === 'Rp 0') {
      text = encodeURIComponent(`Assalamu'alaikum Admin, Saya ingin mengajukan upgrade ke ${roleTitle}.\n\nNama: ${user?.namaLengkap}\nEmail: ${user?.email}\n\nBerikut saya lampirkan SK Keanggotaan saya.`);
    } else {
      text = encodeURIComponent(`Assalamu'alaikum Admin, Saya ingin konfirmasi pembayaran upgrade ke ${roleTitle}.\n\nNama: ${user?.namaLengkap}\nEmail: ${user?.email}`);
    }
    window.open(`https://wa.me/${String(waNumber).replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/profile')} 
          className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-hw-green transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
          <ArrowUpCircle size={24} />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-gray-800">Ajuan Upgrade Role</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tingkatkan Level Keanggotaan</p>
        </div>
      </div>

      <div className="bg-hw-blue/10 p-5 rounded-3xl border border-hw-blue/20 flex gap-4 items-center">
        <Info className="text-hw-blue shrink-0" size={20} />
        <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
          Pilih role yang anda kehendaki. Biaya infak pengembangan adalah <strong>Rp 50.000</strong> per role.
        </p>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-2xl border text-xs font-bold text-center",
            message.type === 'success' ? "bg-hw-green/10 border-hw-green/10 text-hw-green" : "bg-red-50 border-red-100 text-red-500"
          )}
        >
          {message.text}
          {message.type === 'success' && (
            <button 
              onClick={() => {
                const opt = roleOptions.find(r => r.id === selectedId);
                handleWhatsApp(opt?.title || '', opt?.price || '');
              }}
              className="block w-full mt-3 py-3 bg-hw-green text-white rounded-xl flex items-center justify-center gap-2"
            >
              <MessageCircle size={14} /> Konfirmasi via WhatsApp
            </button>
          )}
        </motion.div>
      )}

      <div className="space-y-3">
        {roleOptions.filter(option => {
          // Hide if it's the current role or in the roles list
          const isCurrentRole = user?.role === option.id;
          const isInRolesList = user?.roles?.includes(option.id as any);
          return !isCurrentRole && !isInRolesList;
        }).map((option) => {
          const isRequested = user?.upgradeRequests?.includes(option.id);
          
          return (
            <div 
              key={option.id}
              className={cn(
                "p-5 rounded-[2rem] border transition-all relative overflow-hidden",
                isRequested 
                  ? "bg-gray-50 border-gray-100 opacity-80" 
                  : "bg-white border-gray-100 shadow-sm hover:border-hw-green/30"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-display font-black text-lg leading-tight">{option.title}</h4>
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest", "text-gray-400")}>
                    {isRequested ? 'Dalam Antrian Verifikasi' : 'Syarat Administrasi'}
                  </p>
                </div>
                <div className={cn("text-lg font-black", "text-hw-blue")}>
                  {option.price}
                </div>
              </div>
              
              <p className={cn("text-[11px] leading-relaxed mb-4", "text-gray-500")}>
                {option.description}
              </p>

              {!isRequested && (
                <button 
                  onClick={() => handleRequestUpgrade(option.id)}
                  disabled={loading}
                  className="w-full py-3 bg-hw-green text-white text-xs font-black rounded-xl shadow-lg shadow-hw-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {loading && selectedId === option.id ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                  AJUKAN UPGRADE SEKARANG
                </button>
              )}

              {isRequested && (
                <div className="flex items-center gap-2 text-hw-green text-xs font-bold bg-white/50 p-3 rounded-xl">
                  <CheckCircle2 size={16} />
                  Sudah Diajukan
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
