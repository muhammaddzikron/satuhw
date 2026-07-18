import React from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  ShieldCheck, 
  ShieldAlert,
  Award,
  LogOut,
  ChevronRight,
  ExternalLink,
  Edit2,
  Save,
  X,
  Lock,
  Info,
  CreditCard
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { sheetsService } from '../services/sheetsService';
import { Navigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const ProfileItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="flex items-center gap-4 p-4">
    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
      <Icon size={18} />
    </div>
    <div className="flex-1">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value || '-'}</p>
    </div>
  </div>
);

const ROLE_LABELS: Record<string, string> = {
  umum: 'Umum',
  kwarda: 'Kwartir Daerah',
  sugli: 'Dewan Sugli',
  jati1: 'Jati 1',
  jati2: 'Jati 2',
  jari1: 'Jari 1',
  superadmin: 'Super Admin'
};

export default function ProfilePage() {
  const { user, isAuthenticated, logout, updateUser, setAuth, activeRole, setActiveRole } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{type: 'success' | 'error', text: string} | null>(null);
  const [ktaApp, setKtaApp] = React.useState<any | null>(null);
  const [loadingKta, setLoadingKta] = React.useState(false);
  
  // Form state
  const [formData, setFormData] = React.useState({
    namaLengkap: user?.namaLengkap || '',
    golongan: user?.golongan || '',
    pendidikan: user?.pendidikan || '',
    noHp: user?.noHp || '',
    alamat: user?.alamat || '',
    sosmed: user?.sosmed || '',
    asalKwarda: user?.asalKwarda || '',
    qabilah: user?.qabilah || '',
    pelatihan: user?.pelatihan || [],
    role: user?.role || 'umum',
    password: '', // New password field
  });

  // Update formData when user changes
  React.useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        namaLengkap: user.namaLengkap || '',
        golongan: user.golongan || '',
        pendidikan: user.pendidikan || '',
        noHp: user.noHp || '',
        alamat: user.alamat || '',
        sosmed: user.sosmed || '',
        asalKwarda: user.asalKwarda || '',
        qabilah: user.qabilah || '',
        pelatihan: user.pelatihan || [],
        role: user.role || 'umum',
        password: '',
      });
    }
  }, [user, isEditing]);

  const fetchFreshProfile = async (showLoadingSpinner = false) => {
    if (!user) return;
    if (showLoadingSpinner) setIsRefreshing(true);
    try {
      const members = await sheetsService.getMembers();
      const freshUser = members.find(
        (m) => m.id === user.id || m.email?.toLowerCase() === user.email?.toLowerCase()
      );
      if (freshUser) {
        updateUser(freshUser);
      }
    } catch (e) {
      console.error('Error fetching fresh profile info:', e);
    } finally {
      if (showLoadingSpinner) setIsRefreshing(false);
    }
  };

  const fetchKtaStatus = async () => {
    if (!user) return;
    try {
      setLoadingKta(true);
      const apps = await sheetsService.getKTAApplications();
      const userApp = apps.find(
        (app: any) => app.userId === user.id || app.email?.toLowerCase() === user.email?.toLowerCase()
      );
      if (userApp) {
        setKtaApp(userApp);
      } else {
        setKtaApp(null);
      }
    } catch (e) {
      console.error('Error fetching KTA status:', e);
    } finally {
      setLoadingKta(false);
    }
  };

  React.useEffect(() => {
    fetchFreshProfile();
    fetchKtaStatus();
  }, [user?.id]);

  if (!isAuthenticated) return <Navigate to="/login" />;

  const handleRefresh = async () => {
    await Promise.all([
      fetchFreshProfile(true),
      fetchKtaStatus()
    ]);
  };

  const handleSave = async () => {
    if (!user) return;
    setMessage(null);
    try {
      setLoading(true);

      // Special check for super admin
      if (user.id === 'super-admin') {
        throw new Error('Akun Super Admin (Demo) tidak dapat diubah datanya.');
      }
      
      // Ensure we have a payload that includes identifier
      const payload = {
        ...user,
        ...formData
      };
      
      // Only include password in payload if it is not empty
      if (!formData.password) {
        delete (payload as any).password;
      }
      
      // Call service
      const res = await sheetsService.saveMember(payload);
      
      if (res && res.error) {
        throw new Error(res.error);
      }

      // Update local state - Merge with current user to keep fields not in formData
      // but ensure updated fields from formData are spread
      const { password, ...formDataWithoutPassword } = formData;
      updateUser(formDataWithoutPassword);
      
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profil berhasil diperbaharui! Data telah tersimpan di sistem.' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Update profile error:', error);
      setMessage({ 
        type: 'error', 
        text: `Gagal memperbaharui profil: ${error.message || 'Cek koneksi internet atau konfigurasi API'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Dashboard Header */}
      <section className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-gray-800">
            {isEditing ? 'Ubah Profil' : 'Dasbor Anggota'}
          </h2>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-hw-blue hover:bg-hw-blue/5 rounded-xl transition-all flex items-center gap-2"
                >
                  <span className="text-[10px] font-bold">Edit</span>
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={handleRefresh}
                  className={cn("p-2 text-hw-green hover:bg-hw-green/5 rounded-xl transition-all", isRefreshing && "animate-spin")}
                  title="Refresh Data"
                >
                  <ShieldCheck size={20} />
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(false)}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
        
        {/* Profile Update Prompt */}
        {!isEditing && (
          <div className="mb-4 p-3 bg-hw-blue/5 border border-hw-blue/10 rounded-2xl flex items-center justify-between gap-3">
            <p className="text-[10px] font-medium text-hw-blue leading-tight">
              Lengkapi data profil Anda untuk memudahkan koordinasi dan verifikasi anggota HW.
            </p>
            <button 
              onClick={() => setIsEditing(true)}
              className="shrink-0 px-3 py-1.5 bg-hw-blue text-white text-[9px] font-black uppercase rounded-lg shadow-sm"
            >
              Update Sekarang
            </button>
          </div>
        )}

        {/* Mock Mode Warning */}
        {sheetsService.isMock() && !isEditing && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
            <Info size={16} className="text-amber-500 shrink-0" />
            <p className="text-[10px] font-bold text-amber-700 leading-tight uppercase tracking-tight">
              Mode Demo: Perubahan data tidak akan tersimpan secara permanen karena API belum terhubung.
            </p>
          </div>
        )}

        {/* Profile Card / Edit Form Header */}
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mb-4 p-3 rounded-xl text-xs font-bold text-center border",
              message.type === 'success' ? "bg-hw-green/10 border-hw-green/20 text-hw-green" : "bg-red-50 border-red-100 text-red-500"
            )}
          >
            {message.text}
          </motion.div>
        )}
        <div className="relative p-6 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-hw-green/5 rounded-full -mr-16 -mt-16"></div>
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center border-4 border-white shadow-md overflow-hidden text-gray-300">
                <UserIcon size={40} />
              </div>
              {!isEditing && (
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-6 h-6 text-white rounded-lg flex items-center justify-center border-2 border-white shadow-sm",
                  user?.isVerified ? "bg-hw-green" : "bg-rose-500"
                )}>
                  {user?.isVerified ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                </div>
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Nama Lengkap</label>
                  <input 
                    type="text"
                    value={formData.namaLengkap}
                    onChange={(e) => setFormData({...formData, namaLengkap: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-hw-green transition-all"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {user?.roles && user.roles.length > 0 ? (
                      user.roles.map((r: string) => (
                        <span key={`edit-role-${r}`} className="px-2 py-0.5 rounded-md bg-hw-green/10 text-hw-green text-[9px] font-black uppercase tracking-wider">
                          {ROLE_LABELS[r] || r}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-hw-green/10 text-hw-green text-[9px] font-black uppercase tracking-wider">
                        {ROLE_LABELS[user?.role || 'umum']}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-gray-800 leading-tight">{user?.namaLengkap}</h3>
                  <p className="text-xs text-gray-400 font-medium mb-2">{user?.email}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {user?.roles && user.roles.length > 0 ? (
                      user.roles.map((r: string) => (
                        <span key={`profile-role-${r}`} className="px-2 py-0.5 rounded-md bg-hw-green/10 text-hw-green text-[9px] font-black uppercase tracking-wider">
                          {ROLE_LABELS[r] || r}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-hw-green/10 text-hw-green text-[9px] font-black uppercase tracking-wider">
                        {ROLE_LABELS[user?.role || 'umum']}
                      </span>
                    )}
                    {user?.isVerified ? (
                      <span className="px-2 py-0.5 rounded-md bg-hw-green text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck size={8} /> Terverifikasi
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-500 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border border-rose-100">
                        <ShieldAlert size={8} /> Belum Terverifikasi
                      </span>
                    )}
                  </div>
                  {user?.roles && user.roles.length > 1 && (
                    <div className="mt-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Pilih Akses Aktif</label>
                      <select 
                        value={activeRole || 'umum'}
                        onChange={(e) => setActiveRole(e.target.value as any)}
                        className="bg-white border border-gray-200 text-hw-dark rounded-xl px-2.5 py-1.5 text-xs font-bold focus:ring-2 focus:ring-hw-green outline-none"
                      >
                        {user.roles.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r] || r}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {isEditing ? (
        /* Edit Form Body */
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
            {/* 
            Role selection hidden from normal editing as per user request.
            Role should only be updated through upgrade process.
            */}
            {/* <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hak Akses (Role)</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-3 py-3 text-xs font-bold focus:ring-2 focus:ring-hw-green transition-all outline-none"
              >
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div> */}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Golongan</label>
                <select 
                  value={formData.golongan}
                  onChange={(e) => setFormData({...formData, golongan: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-xl px-3 py-3 text-xs font-bold focus:ring-2 focus:ring-hw-green transition-all outline-none"
                >
                  {['Tunas Athfal', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun', 'Dewasa', 'Pembina'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pendidikan</label>
                <select 
                  value={formData.pendidikan}
                  onChange={(e) => setFormData({...formData, pendidikan: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-xl px-3 py-3 text-xs font-bold focus:ring-2 focus:ring-hw-green transition-all outline-none"
                >
                  {['SD', 'SMP/MTs', 'SMA/SMK/MA', 'D1/D2/D3', 'S1', 'S2', 'S3'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp</label>
              <input 
                type="text"
                value={formData.noHp}
                onChange={(e) => setFormData({...formData, noHp: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-3 py-3 text-xs font-bold focus:ring-2 focus:ring-hw-green transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alamat</label>
              <textarea 
                value={formData.alamat}
                onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-3 py-3 text-xs font-bold focus:ring-2 focus:ring-hw-green transition-all h-20 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sosial Media</label>
              <input 
                type="text"
                value={formData.sosmed}
                onChange={(e) => setFormData({...formData, sosmed: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-3 py-3 text-xs font-bold focus:ring-2 focus:ring-hw-green transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pelatihan Diikuti</label>
              <div className="grid grid-cols-2 gap-2">
                {['Jati 1', 'Jati 2', 'Jari 1', 'Jari 2', 'Jawi'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      const current = formData.pelatihan;
                      if (current.includes(p)) {
                        setFormData({ ...formData, pelatihan: current.filter(item => item !== p) });
                      } else {
                        setFormData({ ...formData, pelatihan: [...current, p] });
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border text-[10px] font-bold transition-all",
                      formData.pelatihan.includes(p)
                        ? "bg-hw-green/10 border-hw-green/20 text-hw-green"
                        : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-md flex items-center justify-center border",
                      formData.pelatihan.includes(p) ? "bg-hw-green border-hw-green text-white" : "border-gray-200 bg-white"
                    )}>
                      {formData.pelatihan.includes(p) && <ShieldCheck size={10} />}
                    </div>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asal Kwarda</label>
                <input 
                  type="text"
                  value={formData.asalKwarda}
                  onChange={(e) => setFormData({...formData, asalKwarda: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-xl px-3 py-3 text-xs font-bold focus:ring-2 focus:ring-hw-green transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Qabilah</label>
                <input 
                  type="text"
                  value={formData.qabilah}
                  onChange={(e) => setFormData({...formData, qabilah: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-xl px-3 py-3 text-xs font-bold focus:ring-2 focus:ring-hw-green transition-all"
                />
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-gray-50">
              <label className="text-[10px] font-black text-hw-blue uppercase tracking-widest ml-1 flex items-center gap-1">
                <Lock size={10} /> Password Baru (Kosongkan jika tidak diubah)
              </label>
              <input 
                type="password"
                placeholder="Masukkan password baru..."
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-gray-50 border border-hw-blue/10 rounded-xl px-3 py-3 text-xs font-bold focus:ring-2 focus:ring-hw-blue transition-all"
              />
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-hw-green text-white font-black shadow-lg shadow-hw-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
            SIMPAN PERUBAHAN
          </button>
        </div>
      ) : (
        <>
          {/* Stats/Quick Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Golongan</span>
              <span className="text-sm font-bold text-gray-800">{user?.golongan || '-'}</span>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pendidikan</span>
              <span className="text-sm font-bold text-gray-800">{user?.pendidikan || '-'}</span>
            </div>
          </div>

          {/* Info Sections */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
            <div className="p-4 bg-gray-50/10 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Data Pribadi</h3>
              <UserIcon size={14} className="text-gray-300" />
            </div>
            <ProfileItem icon={Phone} label="WhatsApp" value={user?.noHp || ''} />
            <ProfileItem icon={MapPin} label="Alamat" value={user?.alamat || ''} />
            <ProfileItem icon={ExternalLink} label="Sosial Media" value={user?.sosmed || ''} />
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
            <div className="p-4 bg-gray-50/10 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Organisasi</h3>
              <Award size={14} className="text-gray-300" />
            </div>
            <ProfileItem icon={Award} label="Pelatihan Diikuti" value={user?.pelatihan?.join(', ') || 'Belum ada'} />
            <ProfileItem icon={MapPin} label="Kwarda / Qabilah" value={`${user?.asalKwarda || '-'} / ${user?.qabilah || '-'}`} />
          </div>

          {/* KTA Status Card */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-hw-green" />
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">KTA Digital</h4>
              </div>
              
              {loadingKta ? (
                <span className="animate-pulse px-2.5 py-1 rounded-full bg-gray-50 text-gray-400 text-[10px] font-bold">Memeriksa...</span>
              ) : ktaApp ? (
                ktaApp.status === 'approved' ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100 flex items-center gap-1 uppercase tracking-wider">
                    <ShieldCheck size={12} className="fill-emerald-50" /> Terverifikasi
                  </span>
                ) : ktaApp.status === 'rejected' ? (
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-100 flex items-center gap-1 uppercase tracking-wider">
                    <ShieldAlert size={12} className="fill-rose-50" /> Ditolak
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-100 flex items-center gap-1 uppercase tracking-wider">
                    <Info size={12} className="fill-amber-50" /> Dalam Proses
                  </span>
                )
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 text-[10px] font-bold border border-gray-150 uppercase tracking-wider">
                  Belum Mengajukan
                </span>
              )}
            </div>

            {ktaApp ? (
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <p className="text-gray-400 font-bold uppercase text-[9px]">Nomor Anggota</p>
                    <p className="font-mono font-bold text-gray-800">{ktaApp.ktaNumber || 'Belum Terbit'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-bold uppercase text-[9px]">Tingkatan</p>
                    <p className="font-bold text-gray-800">{ktaApp.tingkatan || 'Umum'}</p>
                  </div>
                </div>
                
                {ktaApp.status === 'rejected' && ktaApp.remark && (
                  <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100 text-[10px] text-rose-700 font-medium">
                    <strong>Alasan Penolakan:</strong> {ktaApp.remark}
                  </div>
                )}

                <Link 
                  to="/kta" 
                  className="w-full flex items-center justify-center gap-2 py-3 bg-hw-green text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors uppercase tracking-wider"
                >
                  <CreditCard size={14} /> Lihat KTA Digital Anda
                </Link>
              </div>
            ) : (
              <div className="text-center py-4 px-3 space-y-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                  Anda belum mengajukan Kartu Tanda Anggota (KTA) Hizbul Wathan Digital Jawa Tengah.
                </p>
                <Link 
                  to="/kta" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-hw-green text-white text-[10px] font-bold rounded-xl hover:bg-emerald-700 transition-colors uppercase tracking-wider"
                >
                  Ajukan KTA Sekarang
                </Link>
              </div>
            )}
          </div>

          {/* Account Actions */}
          <div className="grid grid-cols-1 gap-3">
            <Link to="/upgrade" className="w-full bg-hw-green text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-hw-green/20 hover:scale-[1.02] transition-all">
              <Award size={18} /> Upgrade Level Keanggotaan
            </Link>
            <button 
              onClick={logout}
              className="w-full bg-rose-50 text-rose-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 border border-rose-100 hover:bg-rose-100 transition-all"
            >
              <LogOut size={18} /> Keluar Aplikasi
            </button>
          </div>
        </>
      )}
    </div>
  );
}
