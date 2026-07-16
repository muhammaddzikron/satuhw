import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Lock, 
  ChevronRight, 
  Clock, 
  Tag, 
  FileText,
  AlertCircle,
  ArrowLeft,
  X,
  Award,
  Download
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { sheetsService } from '../services/sheetsService';
import { Materi } from '../types';
import LoadingPage from './LoadingPage';
import { safeJsonParse } from '../lib/utils';

const ROLE_DISPLAY: Record<string, string> = {
  umum: 'Umum',
  kwarda: 'Kwarda',
  sugli: 'Sugli',
  jati1: 'Jati 1',
  jati2: 'Jati 2',
  jari1: 'Jari 1'
};

const KATEGORI_COLORS: Record<string, string> = {
  umum: 'bg-blue-100 text-blue-600',
  kwarda: 'bg-purple-100 text-purple-600',
  sugli: 'bg-orange-100 text-orange-600',
  jati1: 'bg-green-100 text-green-600',
  jati2: 'bg-emerald-100 text-emerald-600',
  jari1: 'bg-yellow-100 text-yellow-600'
};

export default function MateriPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, activeRole } = useAuthStore();
  const [materi, setMateri] = useState<Materi[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('umum');
  const [search, setSearch] = useState('');

  // Participant Dashboard States
  const [myTrainingApp, setMyTrainingApp] = useState<any | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskLink, setTaskLink] = useState('');
  const [selectedTaskMateriId, setSelectedTaskMateriId] = useState<string>('umum');
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [submittingTask, setSubmittingTask] = useState(false);

  useEffect(() => {
    if (location.state?.searchQuery) {
      setSearch(location.state.searchQuery);
    }
    if (location.state?.filter) {
      setFilter(location.state.filter);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchMateri = async () => {
      setLoading(true);
      try {
        // Collect all roles user has access to
        // Everyone has access to 'umum'
        let rolesToFetch = ['umum'];
        
        if (isAuthenticated && user?.roles && Array.isArray(user.roles) && user.roles.length > 0) {
          rolesToFetch = Array.from(new Set(['umum', ...user.roles]));
        } else if (isAuthenticated && activeRole) {
          rolesToFetch = Array.from(new Set(['umum', activeRole]));
        }

        // Special case: admin/superadmin sees everything
        const isPrivileged = activeRole === 'admin' || activeRole === 'superadmin' || (user?.role === 'admin' || user?.role === 'superadmin');
        if (isPrivileged) {
          rolesToFetch = ['umum', 'jati1', 'jati2', 'jari1', 'sugli', 'kwarda'];
        }

        const results = await Promise.all(rolesToFetch.map(r => sheetsService.getMateri(r)));
        const flatResults = results.flat().filter(Boolean);
        
        // Remove duplicates
        const uniqueResults = Array.from(new Map(flatResults.map(item => [item.id, item])).values());
        
        setMateri(uniqueResults);
      } catch (error) {
        console.error('Error fetching materi:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMateri();
  }, [activeRole, user?.roles, isAuthenticated, user?.role]);

  const hasAccess = (cat: string) => {
    if (!isAuthenticated) return cat === 'umum';
    const isPrivileged = activeRole === 'superadmin' || activeRole === 'admin' || user?.role === 'superadmin' || user?.role === 'admin';
    if (isPrivileged) return true;
    if (cat === 'semua' || cat === 'umum') return true;
    
    // Check if category is in user's roles
    if (user?.roles && user.roles.includes(cat as any)) return true;
    
    return activeRole === cat;
  };

  const filteredMateri = materi.filter(m => {
    const matchFilter = filter === 'semua' || m.kategori === filter;
    const matchSearch = m.judul.toLowerCase().includes(search.toLowerCase()) || 
                       m.konten.toLowerCase().includes(search.toLowerCase());
    const isAccessible = hasAccess(m.kategori);
    return matchFilter && matchSearch && isAccessible;
  });

  const handleUpgradeRequest = async (cat: string) => {
    if (!user) return;
    try {
      setLoading(true);
      await sheetsService.requestUpgrade(user.id, cat);
      alert('Permohonan upgrade telah dikirim. Silakan tunggu verifikasi admin.');
    } catch (error) {
      alert('Gagal mengirim permohonan upgrade');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMyTraining = async () => {
      if (!isAuthenticated || !user) return;
      try {
        const apps = await sheetsService.getTrainingApplications();
        const myApp = apps?.find((a: any) => a.email === user.email || a.userId === user.id);
        if (myApp) {
          setMyTrainingApp(myApp);
        }
      } catch (err) {
        console.error('Error fetching my training application:', err);
      }
    };
    fetchMyTraining();
  }, [isAuthenticated, user]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsData = await sheetsService.getSettings();
        if (settingsData && settingsData.assignedTasks) {
          const parsed = Array.isArray(settingsData.assignedTasks) 
            ? settingsData.assignedTasks 
            : safeJsonParse<any[]>(settingsData.assignedTasks, []);
          setAssignedTasks(parsed);
        }
      } catch (err) {
        console.error('Error fetching settings for assigned tasks:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myTrainingApp) return;
    if (!taskTitle.trim() || !taskLink.trim()) {
      alert('Mohon isi judul tugas dan link tugas.');
      return;
    }
    
    setSubmittingTask(true);
    try {
      // Parse existing tasks list or start fresh
      let tasks: any[] = [];
      if (myTrainingApp.tugas) {
        try {
          tasks = typeof myTrainingApp.tugas === 'string' ? JSON.parse(myTrainingApp.tugas) : myTrainingApp.tugas;
          if (!Array.isArray(tasks)) tasks = [tasks];
        } catch (e) {
          tasks = [];
        }
      }
      
      const newTask = {
        title: taskTitle,
        link: taskLink,
        materiId: selectedTaskMateriId !== 'umum' ? selectedTaskMateriId : undefined,
        submittedAt: new Date().toISOString()
      };
      
      tasks.push(newTask);
      
      await sheetsService.submitAssignment(myTrainingApp.id, { tasks });
      alert('Tugas berhasil dikumpulkan!');
      setTaskTitle('');
      setTaskLink('');
      setSelectedTaskMateriId('umum');
      
      // Reload training application state
      const apps = await sheetsService.getTrainingApplications();
      const updatedApp = apps?.find((a: any) => a.email === user?.email || a.userId === user?.id);
      if (updatedApp) {
        setMyTrainingApp(updatedApp);
      }
    } catch (err: any) {
      alert('Gagal mengumpulkan tugas: ' + err.message);
    } finally {
      setSubmittingTask(false);
    }
  };

  if (loading) return <LoadingPage />;

  const noAccess = !hasAccess(filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-hw-green transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-display font-bold text-gray-800">SATU HW</h2>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">HIZBUL WATHAN SUPER APPS</p>
          </div>
        </div>
        {!isAuthenticated && (
          <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-bold border border-yellow-100">
            <Lock size={12} /> Mode Terbatas
          </div>
        )}
      </div>

      {/* Participant Dashboard */}
      {isAuthenticated && myTrainingApp && myTrainingApp.status === 'approved' && (
        <div className="bg-gradient-to-r from-hw-green/5 via-hw-blue/5 to-white border border-hw-green/20 rounded-[2rem] p-6 space-y-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-150/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-hw-green/10 flex items-center justify-center text-hw-green">
                <Award size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Dasbor Pelatihan Aktif</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Program: <span className="text-hw-green">{myTrainingApp.pelatihanAkanDiikuti}</span>
                </p>
              </div>
            </div>
            <div className="px-3 py-1 bg-hw-green text-white rounded-full text-[9px] font-black uppercase tracking-widest">
              Peserta Resmi
            </div>
          </div>

          {/* Task Notifications Box */}
          {(() => {
            const myLevel = myTrainingApp.pelatihanAkanDiikuti;
            const myTasks = assignedTasks.filter(t => t.level === myLevel);

            if (myTasks.length === 0) return null;

            return (
              <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider">Pemberitahuan Tugas Kurikulum Jaya Melati</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {myTasks.map((t) => {
                    let tasksList: any[] = [];
                    try {
                      if (myTrainingApp.tugas) {
                        tasksList = typeof myTrainingApp.tugas === 'string' ? JSON.parse(myTrainingApp.tugas) : myTrainingApp.tugas;
                        if (!Array.isArray(tasksList)) tasksList = [tasksList];
                      }
                    } catch (e) {}

                    const isSubmitted = tasksList.some((sub: any) => String(sub.materiId) === String(t.materiId));

                    return (
                      <div key={t.materiId} className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">TUGAS AKTIF</span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${isSubmitted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-750'}`}>
                              {isSubmitted ? 'SUDAH DIKIRIM' : 'BELUM DIKIRIM'}
                            </span>
                          </div>
                          <h5 className="text-[11px] font-black text-gray-800 leading-tight">{t.materiJudul}</h5>
                          <p className="text-[10px] text-gray-500 font-bold mt-1.5 leading-relaxed bg-gray-50 p-2 rounded-lg border border-gray-100">
                            📌 <span className="text-gray-700">{t.instruksi || 'Silakan kerjakan tugas untuk materi ini.'}</span>
                          </p>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-50 pt-2 border-dashed">
                          <span className="text-[9px] text-gray-400 font-bold block">
                            🕒 Batas: {t.deadline || 'Tidak ada batas waktu'}
                          </span>
                          {!isSubmitted && (
                            <button
                              onClick={() => {
                                setSelectedTaskMateriId(t.materiId);
                                setTaskTitle(`Tugas: ${t.materiJudul}`);
                              }}
                              className="px-2.5 py-1 bg-hw-green hover:bg-emerald-700 text-white rounded-lg font-black text-[9px] uppercase tracking-wider transition-all"
                            >
                              Kerjakan
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Attendance status block */}
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-gray-100">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Absensi</h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(() => {
                  const catMap: Record<string, string> = {
                    'Jati 1': 'jati1',
                    'Jati 2': 'jati2',
                    'Jari 1': 'jari1'
                  };
                  const progCat = catMap[myTrainingApp.pelatihanAkanDiikuti] || 'jati1';
                  const progMaterials = materi.filter(m => m.kategori === progCat);
                  const items = progMaterials.length > 0 
                    ? progMaterials.map(m => m.judul) 
                    : ['Sesi 1', 'Sesi 2', 'Sesi 3'];

                  return items.map((sesi) => {
                    let attObj: Record<string, boolean> = {};
                    if (myTrainingApp.kehadiran) {
                      attObj = safeJsonParse<Record<string, boolean>>(myTrainingApp.kehadiran, {});
                    }
                    const isPresent = !!attObj[sesi];

                    return (
                      <div key={sesi} className="flex items-start justify-between p-2 rounded-xl bg-gray-50/50 gap-2">
                        <span className="text-[11px] font-bold text-gray-600 uppercase leading-snug break-words flex-1">{sesi}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shrink-0 ${
                          isPresent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {isPresent ? 'Hadir' : 'Absen'}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Task Submission Block */}
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-gray-100 md:col-span-2 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pengumpulan Tugas & Hasil Evaluasi</h4>
                
                {(() => {
                  let tasks: any[] = [];
                  try {
                    if (myTrainingApp.tugas) {
                      tasks = typeof myTrainingApp.tugas === 'string' ? JSON.parse(myTrainingApp.tugas) : myTrainingApp.tugas;
                      if (!Array.isArray(tasks)) tasks = [tasks];
                    }
                  } catch (e) {}

                  const myLevel = myTrainingApp.pelatihanAkanDiikuti;
                  const myTasks = assignedTasks.filter(t => t.level === myLevel);

                  return (
                    <div className="space-y-4">
                      {tasks.length > 0 && (
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Riwayat Tugas yang Dikumpulkan:</p>
                          {tasks.map((t, tid) => (
                            <div key={tid} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100 text-[10px] font-bold">
                              <div className="flex flex-col">
                                <span className="text-gray-700">{t.title}</span>
                                {t.submittedAt && (
                                  <span className="text-[8px] text-gray-400">Dikirim: {new Date(t.submittedAt).toLocaleDateString('id-ID')}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {t.link && (
                                  <a href={t.link} target="_blank" rel="noopener noreferrer" className="text-hw-green underline">
                                    Lihat Link
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Assignment Submit Form */}
                      <form onSubmit={handleSubmitTask} className="space-y-3 pt-3 border-t border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kumpulkan Tugas Baru:</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Pilih Jenis Tugas / Materi</label>
                            <select
                              value={selectedTaskMateriId}
                              onChange={(e) => {
                                const mId = e.target.value;
                                setSelectedTaskMateriId(mId);
                                if (mId === 'umum') {
                                  setTaskTitle('');
                                } else {
                                  const matched = myTasks.find(t => String(t.materiId) === String(mId));
                                  setTaskTitle(matched ? `Tugas: ${matched.materiJudul}` : '');
                                }
                              }}
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-hw-green/20"
                            >
                              <option value="umum">Tugas Umum / Lainnya</option>
                              {myTasks.map(t => (
                                <option key={t.materiId} value={t.materiId}>[TUGAS] {t.materiJudul}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Judul Tugas</label>
                            <input 
                              type="text" 
                              placeholder="Judul Tugas (misal: Resume Jati 1)"
                              value={taskTitle}
                              onChange={(e) => setTaskTitle(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold text-gray-750 outline-none focus:ring-2 focus:ring-hw-green/20"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Link File / Folder Tugas</label>
                            <input 
                              type="text" 
                              placeholder="Link Tugas (Google Drive / URL)"
                              value={taskLink}
                              onChange={(e) => setTaskLink(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold text-gray-750 outline-none focus:ring-2 focus:ring-hw-green/20"
                            />
                          </div>
                          <div className="sm:self-end">
                            <button
                              type="submit"
                              disabled={submittingTask}
                              className="w-full sm:w-auto bg-hw-green text-white font-black text-[10px] uppercase tracking-wider px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 shrink-0"
                            >
                              {submittingTask ? 'Mengirim...' : 'Kirim Tugas'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  );
                })()}
              </div>

              {/* Coach Grade & Review */}
              <div className="pt-3 border-t border-gray-100/50 flex flex-wrap items-start justify-between gap-4 mt-4">
                <div>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Hasil Evaluasi Pelatih</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Nilai Akhir:</span>
                    <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded text-xs font-black uppercase tracking-wider">
                      {myTrainingApp.nilai || 'Belum Dinilai'}
                    </span>
                    {myTrainingApp.statusKelulusan && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                        myTrainingApp.statusKelulusan === 'Lulus'
                          ? 'bg-green-50 border-green-100 text-green-700'
                          : myTrainingApp.statusKelulusan === 'Lulus Bersyarat'
                            ? 'bg-amber-50 border-amber-100 text-amber-700'
                            : 'bg-red-50 border-red-100 text-red-650'
                      }`}>
                        {myTrainingApp.statusKelulusan}
                      </span>
                    )}
                  </div>
                </div>
                {myTrainingApp.remark && (
                  <div className="flex-1 max-w-sm">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Catatan/Ulasan:</span>
                    <p className="text-[10px] text-gray-600 font-bold italic bg-gray-50 p-2 rounded-xl border border-gray-100 leading-relaxed">
                      "{myTrainingApp.remark}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari materi..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-hw-green/20 outline-none text-sm shadow-sm"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-hw-green"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 pb-2">
          {['umum', 'jati1', 'jati2', 'jari1', 'sugli', 'kwarda'].map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filter === k 
                ? 'gradient-bg text-white shadow-md' 
                : 'bg-white text-gray-500 border border-gray-100'
              }`}
            >
              {ROLE_DISPLAY[k] || k}
            </button>
          ))}
        </div>

        {search && (
          <div className="px-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Hasil Pencarian: <span className="text-hw-green">{filteredMateri.length}</span> materi ditemukan
            </p>
          </div>
        )}
      </div>

      {/* Materi List */}
      <div className="grid grid-cols-1 gap-4">
        {noAccess ? (
          <div className="bg-white rounded-3xl p-10 text-center space-y-6 shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Lock size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-display font-bold text-gray-800">Maaf Belum mempunyai Akses</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Materi kategori <span className="font-bold text-hw-green">{ROLE_DISPLAY[filter] || filter}</span> hanya tersedia untuk anggota dengan akses khusus.
              </p>
            </div>
            <button 
              onClick={() => handleUpgradeRequest(filter)}
              className="w-full max-w-xs mx-auto py-4 rounded-2xl bg-hw-green text-white font-bold shadow-lg shadow-hw-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Award size={20} />
              UPGRADE SEKARANG
            </button>
          </div>
        ) : filteredMateri.length > 0 ? (
          filteredMateri.map((item, index) => (
            <motion.div
              key={`materi-${item.id}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all group flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center border border-gray-100">
                <img 
                  src={item.coverImage || 'https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png'} 
                  alt={item.judul} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                />
              </div>
              
              <div className="flex-1 min-w-0 py-1">
                <div className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter mb-1 ${KATEGORI_COLORS[item.kategori] || 'bg-gray-100 text-gray-600'}`}>
                  {ROLE_DISPLAY[item.kategori] || item.kategori}
                </div>
                <h3 className="font-display font-bold text-gray-800 text-sm leading-tight break-words group-hover:text-hw-green transition-colors">
                  {item.judul}
                </h3>
                <p className="text-gray-400 text-[10px] font-medium mt-1">
                  {new Date(item.tanggal).toLocaleDateString('id-ID')}
                </p>
              </div>

              <div className="flex items-center shrink-0 ml-auto mr-2">
                {item.driveUrl && (
                  <a 
                    href={item.driveUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-1 p-3 bg-hw-green/10 text-hw-green rounded-2xl hover:bg-hw-green hover:text-white transition-all border border-hw-green/20 min-w-[80px]"
                    title="Download / Buka Materi"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download size={20} />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Materi</span>
                  </a>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 px-10 space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <FileText size={32} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-800">Materi Tidak Ditemukan</h4>
              <p className="text-xs text-gray-500">Coba gunakan kata kunci lain atau filter kategori yang berbeda.</p>
            </div>
          </div>
        )}
      </div>

      {!isAuthenticated && (
        <div className="bg-hw-blue/10 p-5 rounded-3xl border border-hw-blue/20 flex gap-4 items-start">
          <AlertCircle className="text-hw-blue shrink-0" size={24} />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-hw-blue">Akses Premium</h4>
            <p className="text-xs text-gray-600 leading-relaxed">Anda saat ini berada dalam mode umum. Silakan login untuk mendapatkan akses ke materi Jati, Jari, dan lainnya.</p>
            <Link to="/login" className="inline-block pt-1 text-xs font-black text-hw-blue hover:underline">MASUK SEKARANG &rarr;</Link>
          </div>
        </div>
      )}
    </div>
  );
}
