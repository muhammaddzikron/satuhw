import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Award, 
  Search, 
  Filter, 
  MapPin, 
  GraduationCap, 
  User as UserIcon,
  X,
  ShieldCheck,
  RefreshCw,
  Building2,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sheetsService } from '../services/sheetsService';
import { User } from '../types';
import { safeJsonParse, getCorsSafeUrl, getDriveDirectLink } from '../lib/utils';
import { KWARDA_QABILAH_JATENG } from './KTAPage';

export default function PelatihNasionalPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedKwardaQabilah, setSelectedKwardaQabilah] = useState<string>('semua');

  useEffect(() => {
    // Instant cache prefill
    try {
      const cached = localStorage.getItem('mock_members');
      if (cached) {
        const parsed = safeJsonParse(cached, []);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMembers(parsed);
          setLoading(false);
        }
      }
    } catch (e) {
      console.warn('Cache prefill warning:', e);
    }

    // Fetch fresh data
    const loadData = async () => {
      try {
        const data = await sheetsService.getMembers();
        if (Array.isArray(data)) {
          setMembers(data);
        }
      } catch (err) {
        console.error('Gagal memuat data anggota:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper to check if a member is Super Admin system account
  const isSuperAdminAccount = (m: User): boolean => {
    if (!m) return false;
    const email = String(m.email || '').toLowerCase().trim();
    const nama = String(m.namaLengkap || '').toLowerCase().trim();
    const id = String(m.id || '').toLowerCase().trim();

    return (
      id === 'admin-1' ||
      email === 'admin@hwjateng.com' ||
      email === 'admin@hw.org' ||
      email === 'admin@hw.or.id' ||
      email === 'admin@admin.com' ||
      nama === 'super admin' ||
      nama === 'super admin hw'
    );
  };

  // Check if member belongs to Pelatih Nasional (Jaya Matahari 1 / jari1 or Jaya Matahari 2 / jari2)
  const isPelatihNasional = (m: User): boolean => {
    if (!m) return false;

    // Filter out default superadmin system accounts
    if (isSuperAdminAccount(m)) return false;

    const targets = [
      'jari1', 'jari2', 
      'jaya matahari 1', 'jaya matahari 2', 
      'jari 1', 'jari 2', 
      'jaya matahari', 
      'pelatih nasional', 
      'pelatih'
    ];

    const checkValue = (val: any): boolean => {
      if (!val) return false;
      if (Array.isArray(val)) {
        return val.some(v => checkValue(v));
      }
      if (typeof val === 'string') {
        const lower = val.toLowerCase().trim();
        if (lower.startsWith('[') && lower.endsWith(']')) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              return parsed.some(v => checkValue(v));
            }
          } catch (e) {
            // fallback to string match
          }
        }
        return targets.some(t => lower.includes(t));
      }
      return false;
    };

    return (
      checkValue(m.role) ||
      checkValue(m.roles) ||
      checkValue(m.activeRole) ||
      checkValue(m.golongan) ||
      checkValue(m.pelatihan) ||
      checkValue(m.pendidikan) ||
      checkValue((m as any).kategori) ||
      checkValue((m as any).tingkat) ||
      checkValue((m as any).tingkatan) ||
      checkValue(m.upgradeRequests) ||
      checkValue((m as any).pelatihanAkanDiikuti)
    );
  };

  // Helper to calculate regional sort rank based on KWARDA_QABILAH_JATENG (01..35 for Kwarda, 36..58 for Qabilah PTMA)
  const getSortRank = (m: User): { codeIndex: number; label: string } => {
    const kwardaStr = (m.asalKwarda || '').trim().toLowerCase();
    const qabilahStr = (m.qabilah || '').trim().toLowerCase();

    // 1. Check if Qabilah matches Qabilah PTMA list first (codes 36..58)
    if (qabilahStr) {
      for (let i = 35; i < KWARDA_QABILAH_JATENG.length; i++) {
        const item = KWARDA_QABILAH_JATENG[i];
        const itemName = item.name.toLowerCase();
        const matchParen = item.name.match(/\(([^)]+)\)/);
        const acronym = matchParen ? matchParen[1].toLowerCase() : '';

        if (
          qabilahStr === itemName ||
          itemName.includes(qabilahStr) ||
          qabilahStr.includes(itemName) ||
          (acronym && qabilahStr.includes(acronym)) ||
          (acronym && acronym.includes(qabilahStr))
        ) {
          return { codeIndex: parseInt(item.code, 10), label: item.name };
        }
      }
    }

    // 2. Check if Kwarda matches Kwarda list (codes 01..35)
    if (kwardaStr) {
      for (let i = 0; i < 35; i++) {
        const item = KWARDA_QABILAH_JATENG[i];
        const itemName = item.name.toLowerCase();
        const cleanItemName = itemName.replace('kabupaten ', '').replace('kota ', '');

        if (
          kwardaStr === itemName ||
          kwardaStr === cleanItemName ||
          itemName.includes(kwardaStr) ||
          kwardaStr.includes(cleanItemName)
        ) {
          return { codeIndex: parseInt(item.code, 10), label: item.name };
        }
      }
    }

    // 3. Check if Kwarda matches Qabilah PTMA list (codes 36..58)
    if (kwardaStr) {
      for (let i = 35; i < KWARDA_QABILAH_JATENG.length; i++) {
        const item = KWARDA_QABILAH_JATENG[i];
        const itemName = item.name.toLowerCase();
        const matchParen = item.name.match(/\(([^)]+)\)/);
        const acronym = matchParen ? matchParen[1].toLowerCase() : '';

        if (
          kwardaStr === itemName ||
          itemName.includes(kwardaStr) ||
          kwardaStr.includes(itemName) ||
          (acronym && kwardaStr.includes(acronym)) ||
          (acronym && acronym.includes(kwardaStr))
        ) {
          return { codeIndex: parseInt(item.code, 10), label: item.name };
        }
      }
    }

    // 4. Fallback for unlisted items
    return { codeIndex: 999, label: m.asalKwarda || m.qabilah || 'Lainnya' };
  };

  // Helper to determine exact trainer level title
  const getPelatihLevel = (m: User): string => {
    const combinedStr = [
      m.role,
      m.roles,
      m.activeRole,
      m.golongan,
      m.pelatihan,
      m.pendidikan,
      (m as any).kategori,
      (m as any).tingkat,
      (m as any).tingkatan,
      (m as any).pelatihanAkanDiikuti
    ].flatMap(v => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') {
        if (v.startsWith('[') && v.endsWith(']')) {
          try {
            const p = JSON.parse(v);
            if (Array.isArray(p)) return p;
          } catch (e) {}
        }
        return [v];
      }
      return [String(v)];
    }).filter(Boolean).join(' ').toLowerCase();

    if (combinedStr.includes('jari2') || combinedStr.includes('jaya matahari 2') || combinedStr.includes('jari 2')) {
      return 'Jaya Matahari 2';
    }
    if (combinedStr.includes('jari1') || combinedStr.includes('jaya matahari 1') || combinedStr.includes('jari 1')) {
      return 'Jaya Matahari 1';
    }
    return m.golongan || 'Jaya Matahari';
  };

  // Helper to extract and resolve member profile photo safely
  const getPelatihPhoto = (m: User): string => {
    if (!m) return '';
    let raw = m.photo || (m as any).foto || (m as any).fotoUrl || (m as any).avatar || (m as any).imageUrl || (m as any).Photo || (m as any).Foto || '';

    // Check localStorage mock_kta_applications or mock_members if empty
    if (!raw && m.email) {
      try {
        const cachedKta = localStorage.getItem('mock_kta_applications');
        if (cachedKta) {
          const ktaList = safeJsonParse(cachedKta, []);
          if (Array.isArray(ktaList)) {
            const match = ktaList.find((k: any) => 
              (k.email && k.email.toLowerCase().trim() === m.email?.toLowerCase().trim()) ||
              (k.userId && String(k.userId) === String(m.id))
            );
            if (match && match.photo) {
              raw = match.photo;
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }

    if (!raw) return '';
    if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
    return getCorsSafeUrl(raw);
  };

  // Filter members list to Pelatih Nasional & sort by Kwarda then Qabilah PTMA & then alphabetically by name
  const pelatihList = useMemo(() => {
    const filtered = members.filter(isPelatihNasional);

    return filtered.sort((a, b) => {
      const rankA = getSortRank(a);
      const rankB = getSortRank(b);

      // 1. Sort by Kwarda (01..35) then Qabilah PTMA (36..58)
      if (rankA.codeIndex !== rankB.codeIndex) {
        return rankA.codeIndex - rankB.codeIndex;
      }

      // 2. Within each Kwarda or Qabilah PTMA, sort alphabetically by member name
      const nameA = (a.namaLengkap || '').trim();
      const nameB = (b.namaLengkap || '').trim();
      const nameComp = nameA.localeCompare(nameB, 'id', { sensitivity: 'base' });
      if (nameComp !== 0) return nameComp;

      // 3. Fallback: Asal Kwarda
      const kwardaComp = (a.asalKwarda || '').localeCompare(b.asalKwarda || '');
      if (kwardaComp !== 0) return kwardaComp;

      // 4. Fallback: Qabilah
      return (a.qabilah || '').localeCompare(b.qabilah || '');
    });
  }, [members]);

  // Extract unique Kwarda & Qabilah options for filter dropdown, sorted by official rank order
  const kwardaQabilahOptions = useMemo(() => {
    const optionsMap = new Map<string, number>();

    pelatihList.forEach(m => {
      const rank = getSortRank(m);
      if (m.asalKwarda && m.asalKwarda.trim()) {
        const k = m.asalKwarda.trim();
        if (!optionsMap.has(k)) {
          optionsMap.set(k, rank.codeIndex);
        }
      }
      if (m.qabilah && m.qabilah.trim()) {
        const q = m.qabilah.trim();
        if (!optionsMap.has(q)) {
          optionsMap.set(q, rank.codeIndex);
        }
      }
    });

    return Array.from(optionsMap.entries())
      .sort((a, b) => {
        if (a[1] !== b[1]) return a[1] - b[1];
        return a[0].localeCompare(b[0]);
      })
      .map(entry => entry[0]);
  }, [pelatihList]);

  // Apply search & dropdown filters
  const filteredPelatih = useMemo(() => {
    return pelatihList.filter(m => {
      // Filter Kwarda / Qabilah
      if (selectedKwardaQabilah !== 'semua') {
        const matchKwarda = m.asalKwarda && m.asalKwarda.trim().toLowerCase() === selectedKwardaQabilah.toLowerCase();
        const matchQabilah = m.qabilah && m.qabilah.trim().toLowerCase() === selectedKwardaQabilah.toLowerCase();
        if (!matchKwarda && !matchQabilah) return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nama = (m.namaLengkap || '').toLowerCase();
        const kwarda = (m.asalKwarda || '').toLowerCase();
        const qabilah = (m.qabilah || '').toLowerCase();
        const level = getPelatihLevel(m).toLowerCase();
        const email = (m.email || '').toLowerCase();

        return nama.includes(q) || kwarda.includes(q) || qabilah.includes(q) || level.includes(q) || email.includes(q);
      }

      return true;
    });
  }, [pelatihList, searchQuery, selectedKwardaQabilah]);

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-100 rounded-2xl text-gray-700 hover:text-hw-green transition-colors shadow-xs font-bold text-xs cursor-pointer"
          >
            <ArrowLeft size={18} />
            <span>Kembali</span>
          </button>
          <div>
            <h2 className="text-base font-display font-bold text-gray-800">Pelatih Nasional HW</h2>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">HIZBUL WATHAN JAWA TENGAH</p>
          </div>
        </div>
      </div>

      {/* Gold Gradient Hero Banner */}
      <section className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-400 text-amber-950 p-6 rounded-[2.5rem] shadow-xl shadow-amber-500/20 border border-yellow-300/60 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-amber-950 text-amber-300 rounded-2xl shadow-sm">
              <Award size={22} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-amber-950/15 text-amber-950 px-2.5 py-1 rounded-full border border-amber-950/20">
              Kategori Pelatih
            </span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-display font-black text-amber-950 uppercase tracking-tight leading-tight">
              Pelatih Nasional HW Jateng
            </h1>
            <p className="text-xs text-amber-950/80 font-medium mt-1 leading-relaxed">
              Direktori Anggota Hizbul Wathan dengan kualifikasi Kepelatihan Tingkat <span className="font-extrabold text-amber-950 underline">Jaya Matahari 1</span> & <span className="font-extrabold text-amber-950 underline">Jaya Matahari 2</span>.
            </p>
          </div>

          <div className="pt-1 flex items-center gap-3 flex-wrap text-xs font-bold">
            <div className="bg-amber-950 text-amber-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <Sparkles size={14} />
              <span>{pelatihList.length} Pelatih Terdaftar</span>
            </div>
            <div className="bg-white/40 backdrop-blur-xs text-amber-950 px-3 py-1.5 rounded-xl border border-amber-950/10">
              Jawa Tengah
            </div>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute top-[-30px] right-[-30px] w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 bg-amber-950/10 rounded-full blur-xl pointer-events-none"></div>
      </section>

      {/* Filter and Search Section */}
      <section className="space-y-3 bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-amber-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">Cari & Filter Pelatih</h3>
          </div>
          {(searchQuery || selectedKwardaQabilah !== 'semua') && (
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedKwardaQabilah('semua');
              }}
              className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X size={12} />
              Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Search Bar Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Cari nama pelatih, kwarda, qabilah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-2.5 pl-10 pr-9 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Kwarda / Qabilah Filter Dropdown */}
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            <select
              value={selectedKwardaQabilah}
              onChange={(e) => setSelectedKwardaQabilah(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-2.5 pl-10 pr-8 text-xs font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="semua">Semua Kwarda / Qabilah PTMA</option>
              {kwardaQabilahOptions.map((opt, idx) => (
                <option key={`kwarda-opt-${idx}`} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">
              ▼
            </div>
          </div>
        </div>
      </section>

      {/* Trainers List Result */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Menampilkan {filteredPelatih.length} dari {pelatihList.length} Pelatih
          </span>
          {loading && (
            <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
              <RefreshCw size={12} className="animate-spin" /> Memuat...
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={`skeleton-${i}`} className="p-4 bg-white rounded-3xl border border-gray-100 shadow-xs animate-pulse flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPelatih.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-gray-100 shadow-xs">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-100">
              <Award size={32} />
            </div>
            <h4 className="text-sm font-bold text-gray-800">Tidak Ada Data Pelatih Ditemukan</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              {searchQuery || selectedKwardaQabilah !== 'semua' 
                ? 'Tidak ada pelatih nasional yang sesuai dengan kriteria pencarian atau filter pilihan Anda.'
                : 'Belum ada data anggota dengan akses role Jaya Matahari 1 atau Jaya Matahari 2.'}
            </p>
            {(searchQuery || selectedKwardaQabilah !== 'semua') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedKwardaQabilah('semua');
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/10 hover:bg-amber-700 transition-all cursor-pointer"
              >
                Tampilkan Semua Pelatih
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredPelatih.map((m, idx) => {
              const level = getPelatihLevel(m);
              const isJM2 = level.includes('2');
              const asalKwarda = m.asalKwarda?.trim() || '';
              const qabilah = m.qabilah?.trim() || '';
              const photoUrl = getPelatihPhoto(m);

              return (
                <motion.div
                  key={m.id || `pelatih-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-200/60 shadow-xs hover:shadow-md transition-all space-y-3 relative overflow-hidden group"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Avatar / Profile Image */}
                    <div className="relative shrink-0">
                      {photoUrl ? (
                        <img 
                          src={photoUrl} 
                          alt={m.namaLengkap || 'Pelatih'} 
                          className="w-12 h-14 object-cover rounded-2xl border-2 border-amber-400 shadow-xs" 
                          referrerPolicy="no-referrer" 
                          onError={(e) => {
                            // If photo fails to load, try raw drive link before hiding
                            const raw = m.photo || (m as any).foto || '';
                            if (raw && !e.currentTarget.dataset.retried) {
                              e.currentTarget.dataset.retried = 'true';
                              const directLink = getDriveDirectLink(raw);
                              if (directLink && directLink !== photoUrl) {
                                e.currentTarget.src = directLink;
                                return;
                              }
                            }
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const fallback = parent.querySelector('.photo-fallback') as HTMLElement;
                              if (fallback) fallback.classList.remove('hidden');
                            }
                          }}
                        />
                      ) : null}
                      
                      <div 
                        className={`photo-fallback w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 text-amber-950 items-center justify-center font-black text-lg shadow-sm border border-yellow-300 ${
                          photoUrl ? 'hidden flex' : 'flex'
                        }`}
                      >
                        {m.namaLengkap ? m.namaLengkap.trim().charAt(0).toUpperCase() : 'P'}
                      </div>
                      
                      <div className="absolute -bottom-1 -right-1 bg-amber-950 text-amber-300 p-0.5 rounded-full border border-yellow-300">
                        <Award size={10} />
                      </div>
                    </div>

                    {/* Member Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap justify-between">
                        <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 leading-snug group-hover:text-amber-700 transition-colors">
                          {m.namaLengkap || 'Nama Tidak Tersedia'}
                        </h3>
                        
                        {/* Tingkat Golongan Badge */}
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-xl shadow-2xs border tracking-wider shrink-0 ${
                          isJM2 
                            ? 'bg-amber-500 text-amber-950 border-amber-300' 
                            : 'bg-amber-100 text-amber-900 border-amber-200'
                        }`}>
                          {level}
                        </span>
                      </div>

                      {/* Asal Kwarda / Qabilah PTMA */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold pt-0.5">
                        <MapPin size={13} className="text-amber-600 shrink-0" />
                        <span className="truncate">
                          {asalKwarda && qabilah 
                            ? `${asalKwarda} • ${qabilah}`
                            : asalKwarda || qabilah || 'Kwarda / Qabilah belum diisi'}
                        </span>
                      </div>

                      {/* Additional Tags (Golongan / Gender / Verified) */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap text-[10px] text-gray-600 font-medium">
                        <span className="bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-amber-200/80">
                          <GraduationCap size={11} className="text-amber-700" /> Golongan: {level}
                        </span>

                        {m.jenisKelamin && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded-md text-gray-600 font-bold">
                            {m.jenisKelamin === 'P' || m.jenisKelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki'}
                          </span>
                        )}

                        {m.isVerified && (
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-emerald-200/60">
                            <ShieldCheck size={11} /> Terverifikasi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
