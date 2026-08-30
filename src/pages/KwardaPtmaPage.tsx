import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Users, 
  Shield, 
  School, 
  Calendar, 
  Search, 
  Filter, 
  CreditCard, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Layers,
  TrendingUp,
  Lock
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { KwardaPtmaEntity, KwardaPtmaSummaryItem } from '../types';
import { 
  getKwardaPtmaMasterList, 
  getKwardaPtmaByCode, 
  resolveUserOrgAccess 
} from '../utils/kwardaPtmaUtils';
import { kwardaPtmaService } from '../services/kwardaPtmaService';
import { OrgDetailWorkspace } from '../components/kwarda/OrgDetailWorkspace';

export default function KwardaPtmaPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Resolve RBAC access
  const access = useMemo(() => resolveUserOrgAccess(user), [user]);
  
  // Selected Org for Super Admin drilldown
  const [selectedOrgCode, setSelectedOrgCode] = useState<string | null>(() => {
    const fromUrl = searchParams.get('org');
    return fromUrl || null;
  });

  // Filter & Search state for Super Admin monitoring
  const [activeFilter, setActiveFilter] = useState<'all' | 'kwarda' | 'ptma'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Summary stats state
  const [summaryData, setSummaryData] = useState<{
    totalKwarda: number;
    totalQabilahPtma: number;
    totalQabilahCount: number;
    totalAnggotaCount: number;
    totalPengurusCount: number;
    totalDewanSugliCount: number;
    totalKegiatanCount: number;
    totalMateriCount: number;
    items: KwardaPtmaSummaryItem[];
  }>({
    totalKwarda: 35,
    totalQabilahPtma: 23,
    totalQabilahCount: 0,
    totalAnggotaCount: 0,
    totalPengurusCount: 0,
    totalDewanSugliCount: 0,
    totalKegiatanCount: 0,
    totalMateriCount: 0,
    items: []
  });
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await kwardaPtmaService.getAllSummaryStats();
      setSummaryData(data);
    } catch (err) {
      console.error('Failed to load summary stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    const handleUpdate = () => loadSummary();
    window.addEventListener('kwarda_ptma_updated', handleUpdate);
    return () => window.removeEventListener('kwarda_ptma_updated', handleUpdate);
  }, []);

  // Synchronize URL query param
  const handleSelectOrg = (code: string | null) => {
    setSelectedOrgCode(code);
    if (code) {
      setSearchParams({ org: code });
    } else {
      setSearchParams({});
    }
  };

  // Filtered monitoring table (strictly preserving natural KTA sequence)
  const filteredItems = useMemo(() => {
    return summaryData.items.filter(item => {
      // 1. Filter by entity type
      if (activeFilter === 'kwarda' && item.type !== 'Kwarda') return false;
      if (activeFilter === 'ptma' && item.type !== 'Qabilah PTMA') return false;

      // 2. Search query matching
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCode = item.code.includes(q) || item.ktaCode.toLowerCase().includes(q);
        const matchType = item.type.toLowerCase().includes(q);
        return matchName || matchCode || matchType;
      }

      return true;
    });
  }, [summaryData.items, activeFilter, searchQuery]);

  // ---------------------------------------------------------------------------
  // 1. DRILLDOWN VIEW (Managing or Viewing a specific org)
  // ---------------------------------------------------------------------------
  if (selectedOrgCode) {
    const targetOrg = getKwardaPtmaByCode(selectedOrgCode);
    if (targetOrg) {
      const canManage = access.isSuperAdmin || (access.isOrgAdmin && access.assignedOrg?.code === targetOrg.code);
      return (
        <div className="max-w-6xl mx-auto py-2">
          <OrgDetailWorkspace 
            org={targetOrg} 
            canManage={canManage} 
            showBack={true} 
            onBack={() => handleSelectOrg(null)} 
          />
        </div>
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 2. ORG ADMIN DEFAULT VIEW (If org admin navigates without query param)
  // ---------------------------------------------------------------------------
  if (access.isOrgAdmin && access.assignedOrg && !searchParams.get('view_all')) {
    return (
      <div className="max-w-6xl mx-auto py-2 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-2xl">
          <span className="text-xs font-bold text-emerald-800">
            Anda terautentikasi sebagai Pengurus <strong>{access.assignedOrg.name}</strong>
          </span>
          <button
            type="button"
            onClick={() => setSearchParams({ view_all: 'true' })}
            className="text-xs font-black text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
          >
            Lihat Direktori Seluruh Kwarda / PTMA Se-Jateng &rarr;
          </button>
        </div>
        <OrgDetailWorkspace 
          org={access.assignedOrg} 
          canManage={true} 
          showBack={false} 
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. GLOBAL DIRECTORY & MONITORING VIEW (All 58 Orgs)
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-hw-dark via-slate-900 to-emerald-950 text-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-black rounded-full border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 size={13} />
              Super Admin Monitoring
            </span>
            <span className="px-3 py-1 bg-white/10 text-white/90 text-xs font-bold rounded-full border border-white/10">
              Master Data KTA Jawa Tengah
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
            Kwarda / Qabilah PTMA
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl">
            Pusat monitoring dan pengelolaan struktur organisasi Kwarda (Kabupaten/Kota) dan Qabilah PTMA (Perguruan Tinggi) se-Jawa Tengah terintegrasi KTA.
          </p>
        </div>

        {/* 8 Core Stat Cards for Super Admin */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-2.5 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Total Kwarda</span>
            <p className="text-xl font-black text-white mt-1">{summaryData.totalKwarda}</p>
            <span className="text-[9px] text-gray-300">Kab / Kota</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Qabilah PTMA</span>
            <p className="text-xl font-black text-white mt-1">{summaryData.totalQabilahPtma}</p>
            <span className="text-[9px] text-gray-300">Kampus PTMA</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">Total Qabilah</span>
            <p className="text-xl font-black text-white mt-1">{summaryData.totalQabilahCount}</p>
            <span className="text-[9px] text-gray-300">Pangkalan sekolah</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">Total Anggota</span>
            <p className="text-xl font-black text-white mt-1">{summaryData.totalAnggotaCount.toLocaleString('id-ID')}</p>
            <span className="text-[9px] text-gray-300">Pandu terdaftar</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider block">Total Pengurus</span>
            <p className="text-xl font-black text-white mt-1">{summaryData.totalPengurusCount}</p>
            <span className="text-[9px] text-gray-300">Pimpinan struktural</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">Dewan Sugli</span>
            <p className="text-xl font-black text-white mt-1">{summaryData.totalDewanSugliCount}</p>
            <span className="text-[9px] text-gray-300">Sugli & Kafilah</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Kegiatan</span>
            <p className="text-xl font-black text-white mt-1">{summaryData.totalKegiatanCount}</p>
            <span className="text-[9px] text-gray-300">Agenda aktif</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider block">Materi Kwarda</span>
            <p className="text-xl font-black text-white mt-1">{summaryData.totalMateriCount || 0}</p>
            <span className="text-[9px] text-gray-300">Google Drive arsip</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Semua ({summaryData.items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('kwarda')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'kwarda'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-emerald-700'
            }`}
          >
            Kwarda ({summaryData.totalKwarda})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ptma')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'ptma'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-indigo-700'
            }`}
          >
            Qabilah PTMA ({summaryData.totalQabilahPtma})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute left-3.5 top-3 text-gray-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kabupaten/kota, kampus, kode KTA..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs font-bold text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Monitoring Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-12">No</th>
                <th className="py-3.5 px-4">Nama Entitas</th>
                <th className="py-3.5 px-3 text-center">Jenis</th>
                <th className="py-3.5 px-3 text-center">Kode KTA</th>
                <th className="py-3.5 px-3 text-center">Total Qabilah</th>
                <th className="py-3.5 px-3 text-center">Total Anggota</th>
                <th className="py-3.5 px-3 text-center">Pengurus</th>
                <th className="py-3.5 px-3 text-center">Dewan Sugli</th>
                <th className="py-3.5 px-3 text-center">Kegiatan</th>
                <th className="py-3.5 px-3 text-center">Materi</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-gray-400">
                    <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat master data Kwarda & Qabilah PTMA...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-400">
                    Tidak ditemukan data yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr 
                    key={item.code} 
                    className="hover:bg-emerald-50/30 transition-colors group"
                  >
                    <td className="py-3.5 px-4 text-center font-bold text-gray-400">
                      {item.order}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 group-hover:text-emerald-800 transition-colors">
                        {item.name}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-black rounded-md ${
                        item.type === 'Kwarda'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                          : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-mono text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {item.ktaCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-gray-700">
                      {item.type === 'Kwarda' ? item.totalQabilah : <span className="text-gray-300 font-normal">-</span>}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-gray-700">
                      {item.type === 'Kwarda' ? item.totalAnggota.toLocaleString('id-ID') : <span className="text-gray-300 font-normal">-</span>}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-emerald-700">
                      {item.totalPengurus}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-cyan-700">
                      {item.totalDewanSugli}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-amber-700">
                      {item.totalKegiatan}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-violet-700">
                      {item.totalMateri || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSelectOrg(item.code)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer active:scale-95"
                      >
                        <span>{access.isSuperAdmin || (access.isOrgAdmin && access.assignedOrg?.code === item.code) ? 'Kelola' : 'Buka Detail'}</span>
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
