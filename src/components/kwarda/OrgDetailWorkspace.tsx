import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Shield, 
  School, 
  Calendar, 
  ArrowLeft, 
  CheckCircle2, 
  MapPin, 
  CreditCard,
  LayoutDashboard,
  Sparkles,
  ExternalLink,
  BookOpen,
  FolderOpen
} from 'lucide-react';
import { KwardaPtmaEntity, MateriOrgItem } from '../../types';
import { PengurusListPanel } from './PengurusListPanel';
import { DewanSugliListPanel } from './DewanSugliListPanel';
import { QabilahListPanel } from './QabilahListPanel';
import { KegiatanListPanel } from './KegiatanListPanel';
import { MateriKwardaListPanel } from './MateriKwardaListPanel';
import { kwardaPtmaService } from '../../services/kwardaPtmaService';
import { formatDate } from '../../lib/utils';

interface OrgDetailWorkspaceProps {
  org: KwardaPtmaEntity;
  canManage: boolean;
  onBack?: () => void;
  showBack?: boolean;
}

export const OrgDetailWorkspace: React.FC<OrgDetailWorkspaceProps> = ({
  org,
  canManage,
  onBack,
  showBack = false
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'pengurus' | 'sugli' | 'qabilah' | 'kegiatan' | 'materi'>('dashboard');

  // Stats state
  const [pengurusCount, setPengurusCount] = useState(0);
  const [sugliCount, setSugliCount] = useState(0);
  const [qabilahCount, setQabilahCount] = useState(0);
  const [totalAnggota, setTotalAnggota] = useState(0);
  const [kegiatanCount, setKegiatanCount] = useState(0);
  const [materiCount, setMateriCount] = useState(0);
  const [recentKegiatan, setRecentKegiatan] = useState<any[]>([]);
  const [recentMateri, setRecentMateri] = useState<MateriOrgItem[]>([]);

  const loadStats = async () => {
    try {
      const [pengurus, sugli, qabilah, kegiatan, materi] = await Promise.all([
        kwardaPtmaService.getPengurusByOrg(org.code),
        kwardaPtmaService.getDewanSugliByOrg(org.code),
        org.type === 'Kwarda' ? kwardaPtmaService.getQabilahByOrg(org.code) : Promise.resolve([]),
        kwardaPtmaService.getKegiatanByOrg(org.code),
        kwardaPtmaService.getMateriByOrg(org.code)
      ]);

      setPengurusCount(pengurus.length);
      setSugliCount(sugli.length);
      setQabilahCount(qabilah.length);
      setTotalAnggota(qabilah.reduce((acc, curr) => acc + (Number(curr.jumlahAnggota) || 0), 0));
      setKegiatanCount(kegiatan.length);
      setMateriCount(materi.length);
      setRecentKegiatan(kegiatan.slice(0, 3));
      setRecentMateri(materi.slice(0, 3));
    } catch (err) {
      console.error('Failed to load workspace stats:', err);
    }
  };

  useEffect(() => {
    loadStats();
    const handleUpdate = () => loadStats();
    window.addEventListener('kwarda_ptma_updated', handleUpdate);
    return () => window.removeEventListener('kwarda_ptma_updated', handleUpdate);
  }, [org.code]);

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="bg-gradient-to-r from-hw-dark via-slate-900 to-emerald-950 text-white p-6 sm:p-7 rounded-[2rem] shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {showBack && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all cursor-pointer backdrop-blur-md shrink-0 active:scale-95"
                title="Kembali ke Monitoring"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-wider ${
                  org.type === 'Kwarda' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}>
                  {org.type}
                </span>
                <span className="px-3 py-1 bg-white/10 text-white/90 text-xs font-bold rounded-full border border-white/10 flex items-center gap-1.5">
                  <CreditCard size={13} className="text-amber-300" />
                  Kode KTA: {org.ktaCode}
                </span>
                {canManage && (
                  <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded-md flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    Akses Kelola Aktif
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight">
                {org.name}
              </h2>
              <p className="text-xs text-gray-300 mt-1 max-w-xl">
                {org.type === 'Kwarda' 
                  ? `Kwartir Daerah Gerakan Kepanduan Hizbul Wathan ${org.name}`
                  : `Qabilah Hizbul Wathan Perguruan Tinggi Muhammadiyah 'Aisyiyah ${org.name}`}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Stat Cards */}
        <div className="mt-6 pt-6 border-t border-white/10">
          {org.type === 'Kwarda' ? (
            /* Cards for Kwarda */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between text-emerald-300 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Qabilah</span>
                  <School size={16} />
                </div>
                <p className="text-xl font-black text-white">{qabilahCount}</p>
                <span className="text-[10px] text-gray-300">Pangkalan sekolah/ranting</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between text-blue-300 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Anggota</span>
                  <Users size={16} />
                </div>
                <p className="text-xl font-black text-white">{totalAnggota.toLocaleString('id-ID')}</p>
                <span className="text-[10px] text-gray-300">Pandu terdata</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between text-teal-300 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pengurus</span>
                  <Users size={16} />
                </div>
                <p className="text-xl font-black text-white">{pengurusCount}</p>
                <span className="text-[10px] text-gray-300">Struktur pimpinan</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between text-cyan-300 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Dewan Sugli</span>
                  <Shield size={16} />
                </div>
                <p className="text-xl font-black text-white">{sugliCount}</p>
                <span className="text-[10px] text-gray-300">Dewan Sugli Daerah</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between text-amber-300 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Kegiatan</span>
                  <Calendar size={16} />
                </div>
                <p className="text-xl font-black text-white">{kegiatanCount}</p>
                <span className="text-[10px] text-gray-300">Agenda daerah</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between text-violet-300 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Materi Kwarda</span>
                  <BookOpen size={16} />
                </div>
                <p className="text-xl font-black text-white">{materiCount}</p>
                <span className="text-[10px] text-gray-300">Google Drive modul</span>
              </div>
            </div>
          ) : (
            /* Cards for Qabilah PTMA */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between text-indigo-300 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Pengurus Qabilah</span>
                  <Users size={18} />
                </div>
                <p className="text-2xl font-black text-white">{pengurusCount}</p>
                <span className="text-[11px] text-gray-300">Struktur pimpinan kampus</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between text-cyan-300 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Dewan Sugli / Kafilah</span>
                  <Shield size={18} />
                </div>
                <p className="text-2xl font-black text-white">{sugliCount}</p>
                <span className="text-[11px] text-gray-300">Kafilah Penuntun PTMA</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between text-amber-300 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Kegiatan PTMA</span>
                  <Calendar size={18} />
                </div>
                <p className="text-2xl font-black text-white">{kegiatanCount}</p>
                <span className="text-[11px] text-gray-300">Agenda & kegiatan qabilah</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between text-violet-300 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Materi PTMA</span>
                  <BookOpen size={18} />
                </div>
                <p className="text-2xl font-black text-white">{materiCount}</p>
                <span className="text-[11px] text-gray-300">Google Drive arsip & modul</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation Menu */}
      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-xs flex flex-wrap items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'dashboard'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('pengurus')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'pengurus'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users size={16} />
          <span>Pengurus {org.type === 'Kwarda' ? 'Kwarda' : 'Qabilah'} ({pengurusCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('sugli')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'sugli'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Shield size={16} />
          <span>Dewan Sugli / Kafilah ({sugliCount})</span>
        </button>

        {org.type === 'Kwarda' && (
          <button
            type="button"
            onClick={() => setActiveSubTab('qabilah')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'qabilah'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <School size={16} />
            <span>Data Qabilah ({qabilahCount})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveSubTab('kegiatan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'kegiatan'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Calendar size={16} />
          <span>Kegiatan {org.type === 'Kwarda' ? 'Kwarda' : 'PTMA'} ({kegiatanCount})</span>
        </button>

        {/* 1 Fitur Tab setelah Kegiatan: Materi Kwarda / PTMA */}
        <button
          type="button"
          onClick={() => setActiveSubTab('materi')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'materi'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BookOpen size={16} />
          <span>Materi {org.type === 'Kwarda' ? 'Kwarda' : 'PTMA'} ({materiCount})</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="mt-4">
        {activeSubTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Overview Quick Stats & Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Recent Kegiatan & Materi */}
              <div className="lg:col-span-2 space-y-6">
                {/* Recent Kegiatan */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Calendar className="text-amber-600" size={20} />
                      Agenda Kegiatan Terkini
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('kegiatan')}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    >
                      Lihat Semua →
                    </button>
                  </div>

                  {recentKegiatan.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50/70 rounded-2xl border border-dashed border-gray-200">
                      <p className="text-xs font-medium">Belum ada agenda kegiatan yang dicatat.</p>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => setActiveSubTab('kegiatan')}
                          className="mt-2 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                        >
                          + Tambah Agenda
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {recentKegiatan.map((act) => (
                        <div
                          key={act.id}
                          className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                              {act.jadwal ? formatDate(act.jadwal) : 'Tanggal belum ditentukan'}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900 mt-1 truncate">
                              {act.jenisKegiatan}
                            </h4>
                          </div>
                          {act.linkProposal && (
                            <a
                              href={act.linkProposal}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0"
                              title="Lihat Proposal"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Materi Kwarda */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <BookOpen className="text-violet-600" size={20} />
                      Materi & Arsip Google Drive Terbaru
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('materi')}
                      className="text-xs font-bold text-violet-600 hover:text-violet-700 cursor-pointer"
                    >
                      Buka Tab Materi →
                    </button>
                  </div>

                  {recentMateri.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50/70 rounded-2xl border border-dashed border-gray-200">
                      <p className="text-xs font-medium">Belum ada berkas materi yang ditambahkan.</p>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => setActiveSubTab('materi')}
                          className="mt-2 text-xs font-bold text-violet-600 hover:underline cursor-pointer"
                        >
                          + Tambah Materi
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {recentMateri.map((mat) => (
                        <div
                          key={mat.id}
                          className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-violet-700 bg-violet-100/80 px-2 py-0.5 rounded-md">
                              {mat.kategoriMateri || 'Kepanduan HW'}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900 mt-1 truncate">
                              {mat.namaMateri}
                            </h4>
                          </div>
                          {mat.linkDrive && (
                            <a
                              href={mat.linkDrive}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors shrink-0 shadow-2xs"
                              title="Buka di Google Drive"
                            >
                              <FolderOpen size={13} className="text-blue-600" />
                              <span>Buka Drive</span>
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Guidelines Card */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-6 rounded-3xl border border-emerald-100/80 space-y-3">
                  <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <Sparkles className="text-emerald-600" size={18} />
                    Informasi & Ketentuan Modul {org.type}
                  </h4>
                  <ul className="text-xs text-emerald-900/80 space-y-1.5 list-disc list-inside">
                    <li>Data Kwarda / Qabilah PTMA ini terintegrasi penuh dengan Master KTA SATU HW Jateng.</li>
                    <li>Pengurus dan Dewan Sugli / Kafilah dapat diatur urutannya secara fleksibel menggunakan fitur drag & drop.</li>
                    {org.type === 'Kwarda' && (
                      <li>Data Qabilah menampilkan seluruh pangkalan satuan pandu di daerah beserta jumlah anggota aktif.</li>
                    )}
                    <li>Agenda kegiatan mendukung tautan proposal resmi (Google Drive / Cloud document).</li>
                    <li>Tab Materi {org.type} memuat nama materi dan link Google Drive langsung untuk berkas panduan & modul.</li>
                  </ul>
                </div>
              </div>

              {/* Right Col: Quick Access Nav */}
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-gray-900">Kelola Data Entitas</h3>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('pengurus')}
                      className="w-full flex items-center justify-between p-3 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900 rounded-2xl border border-emerald-100 transition-all text-xs font-bold text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users size={16} className="text-emerald-600" />
                        <span>Susunan Pengurus</span>
                      </div>
                      <span className="bg-white text-emerald-700 px-2 py-0.5 rounded-lg text-[10px] font-black shadow-2xs">
                        {pengurusCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSubTab('sugli')}
                      className="w-full flex items-center justify-between p-3 bg-cyan-50/60 hover:bg-cyan-100/70 text-cyan-900 rounded-2xl border border-cyan-100 transition-all text-xs font-bold text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Shield size={16} className="text-cyan-600" />
                        <span>Dewan Sugli / Kafilah</span>
                      </div>
                      <span className="bg-white text-cyan-700 px-2 py-0.5 rounded-lg text-[10px] font-black shadow-2xs">
                        {sugliCount}
                      </span>
                    </button>

                    {org.type === 'Kwarda' && (
                      <button
                        type="button"
                        onClick={() => setActiveSubTab('qabilah')}
                        className="w-full flex items-center justify-between p-3 bg-blue-50/60 hover:bg-blue-100/70 text-blue-900 rounded-2xl border border-blue-100 transition-all text-xs font-bold text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <School size={16} className="text-blue-600" />
                          <span>Data Qabilah Satuan</span>
                        </div>
                        <span className="bg-white text-blue-700 px-2 py-0.5 rounded-lg text-[10px] font-black shadow-2xs">
                          {qabilahCount}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveSubTab('kegiatan')}
                      className="w-full flex items-center justify-between p-3 bg-amber-50/60 hover:bg-amber-100/70 text-amber-900 rounded-2xl border border-amber-100 transition-all text-xs font-bold text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar size={16} className="text-amber-600" />
                        <span>Agenda Kegiatan & Pelatihan</span>
                      </div>
                      <span className="bg-white text-amber-700 px-2 py-0.5 rounded-lg text-[10px] font-black shadow-2xs">
                        {kegiatanCount}
                      </span>
                    </button>

                    {/* Materi Kwarda Link */}
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('materi')}
                      className="w-full flex items-center justify-between p-3 bg-violet-50/60 hover:bg-violet-100/70 text-violet-900 rounded-2xl border border-violet-100 transition-all text-xs font-bold text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <BookOpen size={16} className="text-violet-600" />
                        <span>Materi & Google Drive</span>
                      </div>
                      <span className="bg-white text-violet-700 px-2 py-0.5 rounded-lg text-[10px] font-black shadow-2xs">
                        {materiCount}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'pengurus' && (
          <PengurusListPanel org={org} canManage={canManage} />
        )}

        {activeSubTab === 'sugli' && (
          <DewanSugliListPanel org={org} canManage={canManage} />
        )}

        {activeSubTab === 'qabilah' && org.type === 'Kwarda' && (
          <QabilahListPanel org={org} canManage={canManage} />
        )}

        {activeSubTab === 'kegiatan' && (
          <KegiatanListPanel org={org} canManage={canManage} />
        )}

        {activeSubTab === 'materi' && (
          <MateriKwardaListPanel org={org} canManage={canManage} />
        )}
      </div>
    </div>
  );
};
