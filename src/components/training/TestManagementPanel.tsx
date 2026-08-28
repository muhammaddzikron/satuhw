import React, { useState } from 'react';
import { 
  Settings, Clock, Calendar, CheckCircle2, XCircle, Edit3, Trash2, 
  Plus, RotateCcw, Save, BookOpen, AlertCircle, FileText, ChevronDown, ChevronUp, Search, Sparkles, Check, ToggleLeft, ToggleRight,
  Award, Users, Filter, ArrowUpDown, Eye
} from 'lucide-react';
import { 
  TestQuestion, 
  TestScheduleSettings, 
  DEFAULT_PRE_TEST_SETTINGS, 
  DEFAULT_POST_TEST_SETTINGS, 
  DEFAULT_50_QUESTIONS,
  parseTestScheduleSettings,
  isTestCurrentlyOpen
} from '../../data/trainingQuestions';
import { generateSamplePreTestForParticipants } from '../../utils/trainingUtils';
import { sheetsService } from '../../services/sheetsService';

interface TestManagementPanelProps {
  settings: any;
  onSaveSettings: (updatedSettings: any) => Promise<void>;
  applications?: any[];
  onViewTestApp?: (app: any) => void;
}

export const TestManagementPanel: React.FC<TestManagementPanelProps> = ({
  settings,
  onSaveSettings,
  applications = [],
  onViewTestApp
}) => {
  const [activeTestTab, setActiveTestTab] = useState<'pre_test' | 'post_test' | 'rekap'>('pre_test');
  const [isSaving, setIsSaving] = useState(false);
  const [quickSavingType, setQuickSavingType] = useState<'pre_test' | 'post_test' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rekapSearchQuery, setRekapSearchQuery] = useState('');
  const [rekapFilter, setRekapFilter] = useState<'all' | 'done_pre' | 'done_post' | 'done_both' | 'passed'>('all');
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);

  // Read current settings with fallback and safe parser
  const preTestSettings: TestScheduleSettings = parseTestScheduleSettings(settings?.preTestSettings, DEFAULT_PRE_TEST_SETTINGS);
  const postTestSettings: TestScheduleSettings = parseTestScheduleSettings(settings?.postTestSettings, DEFAULT_POST_TEST_SETTINGS);

  // Questions bank: Can be stored per test or shared
  const questions: TestQuestion[] = Array.isArray(settings?.trainingQuestions) && settings.trainingQuestions.length > 0
    ? settings.trainingQuestions
    : (typeof settings?.trainingQuestions === 'string' ? (() => { try { return JSON.parse(settings.trainingQuestions); } catch(e) { return DEFAULT_50_QUESTIONS; } })() : DEFAULT_50_QUESTIONS);

  // Local editing states
  const [localPreSettings, setLocalPreSettings] = useState<TestScheduleSettings>(preTestSettings);
  const [localPostSettings, setLocalPostSettings] = useState<TestScheduleSettings>(postTestSettings);
  const [localQuestions, setLocalQuestions] = useState<TestQuestion[]>(questions);

  // Keep local state in sync when settings prop updates
  React.useEffect(() => {
    if (settings?.preTestSettings) {
      setLocalPreSettings(parseTestScheduleSettings(settings.preTestSettings, DEFAULT_PRE_TEST_SETTINGS));
    }
    if (settings?.postTestSettings) {
      setLocalPostSettings(parseTestScheduleSettings(settings.postTestSettings, DEFAULT_POST_TEST_SETTINGS));
    }
    if (settings?.trainingQuestions) {
      const qList = Array.isArray(settings.trainingQuestions) 
        ? settings.trainingQuestions 
        : (() => { try { return JSON.parse(settings.trainingQuestions); } catch(e) { return DEFAULT_50_QUESTIONS; } })();
      if (Array.isArray(qList) && qList.length > 0) {
        setLocalQuestions(qList);
      }
    }
  }, [settings]);

  const activeLocalSettings = activeTestTab === 'pre_test' ? localPreSettings : localPostSettings;

  const handleUpdateActiveSettings = (field: keyof TestScheduleSettings, value: any) => {
    if (activeTestTab === 'pre_test') {
      setLocalPreSettings(prev => ({ ...prev, [field]: value }));
    } else {
      setLocalPostSettings(prev => ({ ...prev, [field]: value }));
    }
  };

  // Instant 1-click Quick Toggle with Immediate Auto-Save
  const handleQuickToggleAccess = async (testType: 'pre_test' | 'post_test', newIsOpen: boolean) => {
    setQuickSavingType(testType);
    try {
      const updatedPre = testType === 'pre_test' 
        ? { ...localPreSettings, isOpen: newIsOpen } 
        : localPreSettings;
      const updatedPost = testType === 'post_test' 
        ? { ...localPostSettings, isOpen: newIsOpen } 
        : localPostSettings;

      if (testType === 'pre_test') {
        setLocalPreSettings(updatedPre);
      } else {
        setLocalPostSettings(updatedPost);
      }

      const updated = {
        ...settings,
        preTestSettings: updatedPre,
        postTestSettings: updatedPost,
        trainingQuestions: localQuestions
      };

      await onSaveSettings(updated);
    } catch (err: any) {
      alert('Gagal mengubah status akses: ' + (err?.message || err));
    } finally {
      setQuickSavingType(null);
    }
  };

  const handleUpdateQuestion = (qId: number, field: string, value: any) => {
    setLocalQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      if (field === 'question') return { ...q, question: value };
      if (field === 'correctAnswer') return { ...q, correctAnswer: value };
      if (field.startsWith('opt_')) {
        const optKey = field.replace('opt_', '') as 'a' | 'b' | 'c' | 'd';
        return {
          ...q,
          options: {
            ...q.options,
            [optKey]: value
          }
        };
      }
      return q;
    }));
  };

  const handleAddNewQuestion = () => {
    const nextId = localQuestions.length > 0 ? Math.max(...localQuestions.map(q => q.id)) + 1 : 1;
    const newQ: TestQuestion = {
      id: nextId,
      question: `Pertanyaan baru #${nextId}...`,
      options: {
        a: "Pilihan A",
        b: "Pilihan B",
        c: "Pilihan C",
        d: "Pilihan D"
      },
      correctAnswer: "a"
    };
    setLocalQuestions(prev => [...prev, newQ]);
    setExpandedQuestionId(nextId);
  };

  const handleDeleteQuestion = (qId: number) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus butir soal #${qId}?`)) return;
    setLocalQuestions(prev => prev.filter(q => q.id !== qId));
  };

  const handleResetToDefault50 = () => {
    if (!window.confirm('Kembalikan ke 50 butir soal standar Hizbul Wathan beserta kunci jawabannya?')) return;
    setLocalQuestions(DEFAULT_50_QUESTIONS);
    alert('Bank soal telah direset ke 50 soal standar Hizbul Wathan!');
  };

  const handleClearPostTest = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus / mengosongkan nilai Post-Test seluruh peserta pelatihan Jaya Melati 1 Solo? (Karena Post-Test belum dilaksanakan)')) return;
    try {
      await sheetsService.clearPostTestScoresForTraining('act-jm1-solo');
      alert('Nilai Post-Test seluruh peserta pelatihan Jaya Melati 1 Solo berhasil dikosongkan!');
    } catch (e: any) {
      alert('Gagal mengosongkan nilai Post-Test: ' + (e?.message || e));
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const updated = {
        ...settings,
        preTestSettings: localPreSettings,
        postTestSettings: localPostSettings,
        trainingQuestions: localQuestions
      };
      await onSaveSettings(updated);
      alert('Pengaturan Pre Test, Post Test & Bank Soal berhasil disinkronkan ke seluruh sistem!');
    } catch (err: any) {
      alert('Gagal menyimpan: ' + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredQuestions = localQuestions.filter(q => {
    const text = (q.question || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return text.includes(query) || String(q.id).includes(query);
  });

  const preLiveStatus = isTestCurrentlyOpen(localPreSettings, DEFAULT_PRE_TEST_SETTINGS);
  const postLiveStatus = isTestCurrentlyOpen(localPostSettings, DEFAULT_POST_TEST_SETTINGS);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-left space-y-6 p-5 sm:p-6">
      
      {/* HEADER WITH TITLE AND SAVE BUTTON */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-150">
                Penugasan Wajib Peserta
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-gray-800 uppercase tracking-wide">
              Pengaturan Akses Pre Test & Post Test Pelatihan HW
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              Atur status buka/tutup akses pengerjaan peserta secara real-time, durasi, KKM, serta kelola 50 bank soal.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Save size={16} />
          {isSaving ? 'Menyimpan Pengaturan...' : 'Simpan Semua Pengaturan'}
        </button>
      </div>

      {/* QUICK REAL-TIME STATUS & 1-CLICK TOGGLE BAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PRE TEST QUICK CARD */}
        <div className={`p-4 rounded-2xl border transition-all ${
          preLiveStatus.isOpen 
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50/70 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white px-2 py-0.5 rounded-full shadow-2xs">
                  1. Pre Test (Awal)
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  preLiveStatus.isOpen ? 'bg-emerald-600 text-white animate-pulse' : 'bg-rose-600 text-white'
                }`}>
                  {preLiveStatus.isOpen ? '● AKSES DIBUKA' : '● AKSES DITUTUP'}
                </span>
              </div>
              <p className="text-xs font-semibold">
                {preLiveStatus.statusMessage}
              </p>
            </div>

            <button
              type="button"
              disabled={quickSavingType === 'pre_test'}
              onClick={() => handleQuickToggleAccess('pre_test', !localPreSettings.isOpen)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border shadow-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                localPreSettings.isOpen
                  ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
              }`}
            >
              {quickSavingType === 'pre_test' ? (
                'Memperbarui...'
              ) : localPreSettings.isOpen ? (
                <>
                  <XCircle size={14} /> Tutup Akses Pre Test
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Buka Akses Pre Test
                </>
              )}
            </button>
          </div>
        </div>

        {/* POST TEST QUICK CARD */}
        <div className={`p-4 rounded-2xl border transition-all ${
          postLiveStatus.isOpen 
            ? 'bg-teal-50/70 border-teal-200 text-teal-900' 
            : 'bg-rose-50/70 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white px-2 py-0.5 rounded-full shadow-2xs">
                  2. Post Test (Akhir)
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  postLiveStatus.isOpen ? 'bg-teal-600 text-white animate-pulse' : 'bg-rose-600 text-white'
                }`}>
                  {postLiveStatus.isOpen ? '● AKSES DIBUKA' : '● AKSES DITUTUP'}
                </span>
              </div>
              <p className="text-xs font-semibold">
                {postLiveStatus.statusMessage}
              </p>
            </div>

            <button
              type="button"
              disabled={quickSavingType === 'post_test'}
              onClick={() => handleQuickToggleAccess('post_test', !localPostSettings.isOpen)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border shadow-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                localPostSettings.isOpen
                  ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700'
                  : 'bg-teal-600 hover:bg-teal-700 text-white border-teal-700'
              }`}
            >
              {quickSavingType === 'post_test' ? (
                'Memperbarui...'
              ) : localPostSettings.isOpen ? (
                <>
                  <XCircle size={14} /> Tutup Akses Post Test
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Buka Akses Post Test
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* TEST TAB SWITCHER: PRE TEST vs POST TEST vs REKAP HASIL */}
      <div className="flex flex-wrap bg-gray-100 p-1.5 rounded-2xl max-w-2xl gap-1">
        <button
          onClick={() => setActiveTestTab('pre_test')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTestTab === 'pre_test'
              ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Sparkles size={15} className={activeTestTab === 'pre_test' ? 'text-emerald-600' : ''} />
          1. Pre Test
          <span className={`w-2.5 h-2.5 rounded-full ${localPreSettings.isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
        </button>

        <button
          onClick={() => setActiveTestTab('post_test')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTestTab === 'post_test'
              ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <CheckCircle2 size={15} className={activeTestTab === 'post_test' ? 'text-emerald-600' : ''} />
          2. Post Test
          <span className={`w-2.5 h-2.5 rounded-full ${localPostSettings.isOpen ? 'bg-teal-500' : 'bg-rose-500'}`}></span>
        </button>

        <button
          onClick={() => setActiveTestTab('rekap')}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTestTab === 'rekap'
              ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Award size={15} className={activeTestTab === 'rekap' ? 'text-amber-600' : ''} />
          3. Rekap Hasil Ujian ({applications.filter(a => a && (a.preTestScore !== undefined || a.postTestScore !== undefined || a.preTestData || a.postTestData)).length})
        </button>
      </div>

      {/* REKAP TAB CONTENT */}
      {activeTestTab === 'rekap' && (() => {
        const validApps = applications.filter(a => a && a.status !== 'deleted' && a.status !== 'rejected');
        
        const getPreScore = (app: any) => {
          if (app.preTestScore !== undefined && app.preTestScore !== null && app.preTestScore !== '') return Number(app.preTestScore);
          if (app.preTestData) {
            try {
              const p = typeof app.preTestData === 'string' ? JSON.parse(app.preTestData) : app.preTestData;
              if (p && p.score !== undefined && p.score !== null && p.score !== '') return Number(p.score);
            } catch(e) {}
          }
          return null;
        };

        const getPostScore = (app: any) => {
          if (app.postTestScore !== undefined && app.postTestScore !== null && app.postTestScore !== '') return Number(app.postTestScore);
          if (app.postTestData) {
            try {
              const p = typeof app.postTestData === 'string' ? JSON.parse(app.postTestData) : app.postTestData;
              if (p && p.score !== undefined && p.score !== null && p.score !== '') return Number(p.score);
            } catch(e) {}
          }
          return null;
        };

        const preScores = validApps.map(getPreScore).filter((s): s is number => s !== null);
        const postScores = validApps.map(getPostScore).filter((s): s is number => s !== null);
        
        const avgPre = preScores.length > 0 ? Math.round(preScores.reduce((a, b) => a + b, 0) / preScores.length) : 0;
        const avgPost = postScores.length > 0 ? Math.round(postScores.reduce((a, b) => a + b, 0) / postScores.length) : 0;

        const filteredApps = validApps.filter(app => {
          const pre = getPreScore(app);
          const post = getPostScore(app);

          if (rekapFilter === 'done_pre' && pre === null) return false;
          if (rekapFilter === 'done_post' && post === null) return false;
          if (rekapFilter === 'done_both' && (pre === null || post === null)) return false;
          if (rekapFilter === 'passed' && (post === null || post < (localPostSettings.passingScore || 70))) return false;

          if (rekapSearchQuery) {
            const q = rekapSearchQuery.toLowerCase().trim();
            const name = (app.nama || app.namaLengkap || '').toLowerCase();
            const qabilah = (app.qabilah || '').toLowerCase();
            const daerah = (app.asalDaerah || '').toLowerCase();
            const nbm = (app.nbm || app.ktaNumber || '').toLowerCase();
            return name.includes(q) || qabilah.includes(q) || daerah.includes(q) || nbm.includes(q);
          }

          return true;
        });

        return (
          <div className="space-y-6">
            {/* STAT CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Total Peserta Terdaftar</span>
                <div className="text-2xl font-black text-emerald-950 font-display">{validApps.length}</div>
                <span className="text-[11px] text-emerald-700 font-bold">Peserta Pelatihan</span>
              </div>

              <div className="bg-teal-50/80 border border-teal-200 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-800">Telah Pre Test</span>
                <div className="text-2xl font-black text-teal-950 font-display">{preScores.length} / {validApps.length}</div>
                <span className="text-[11px] text-teal-700 font-bold">Rata-rata: {avgPre} / 100</span>
              </div>

              <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800">Telah Post Test</span>
                <div className="text-2xl font-black text-indigo-950 font-display">{postScores.length} / {validApps.length}</div>
                <span className="text-[11px] text-indigo-700 font-bold">Rata-rata: {avgPost} / 100</span>
              </div>

              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Lulus KKM Post Test</span>
                <div className="text-2xl font-black text-amber-950 font-display">
                  {validApps.filter(a => (getPostScore(a) ?? 0) >= (localPostSettings.passingScore || 70)).length}
                </div>
                <span className="text-[11px] text-amber-700 font-bold">KKM: {localPostSettings.passingScore || 70}</span>
              </div>
            </div>

            {/* FILTER & SEARCH BAR */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={rekapSearchQuery}
                  onChange={(e) => setRekapSearchQuery(e.target.value)}
                  placeholder="Cari nama peserta, NBM, qabilah, asal daerah..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setRekapFilter('all')}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
                    rekapFilter === 'all' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  Semua ({validApps.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRekapFilter('done_pre')}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
                    rekapFilter === 'done_pre' ? 'bg-teal-700 text-white shadow-xs' : 'bg-white text-teal-700 border border-teal-200'
                  }`}
                >
                  Pre Test ({preScores.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRekapFilter('done_post')}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
                    rekapFilter === 'done_post' ? 'bg-indigo-700 text-white shadow-xs' : 'bg-white text-indigo-700 border border-indigo-200'
                  }`}
                >
                  Post Test ({postScores.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRekapFilter('passed')}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
                    rekapFilter === 'passed' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-amber-700 border border-amber-200'
                  }`}
                >
                  Lulus KKM
                </button>
              </div>
            </div>

            {/* PARTICIPANTS TABLE */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-xs">
              <table className="w-full text-left text-xs border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100/80 text-gray-600 border-b border-gray-200 text-[11px] font-black uppercase tracking-wider">
                    <th className="py-3.5 px-4 text-center w-12">No</th>
                    <th className="py-3.5 px-4">Nama Peserta</th>
                    <th className="py-3.5 px-4">Qabilah / Daerah</th>
                    <th className="py-3.5 px-4 text-center">Nilai Pre Test</th>
                    <th className="py-3.5 px-4 text-center">Nilai Post Test</th>
                    <th className="py-3.5 px-4 text-center">Status Kelulusan</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-400">
                        <AlertCircle size={28} className="mx-auto text-gray-300 mb-2" />
                        Tidak ada data peserta yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app, idx) => {
                      const pre = getPreScore(app);
                      const post = getPostScore(app);
                      const isPassingPost = post !== null && post >= (localPostSettings.passingScore || 70);

                      return (
                        <tr key={app.id || idx} className="hover:bg-emerald-50/40 transition-colors">
                          <td className="py-3 px-4 text-center font-bold text-gray-400">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-black text-gray-900">{app.nama || app.namaLengkap}</div>
                            <div className="text-[10px] text-gray-400">{app.email || app.noWa || '-'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-700">{app.qabilah || '-'}</div>
                            <div className="text-[10px] text-gray-400">{app.asalDaerah || 'Jawa Tengah'}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {pre !== null ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-200">
                                {pre} / 100
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-400 font-medium italic">Belum Mengerjakan</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {post !== null ? (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border ${
                                isPassingPost 
                                  ? 'bg-teal-100 text-teal-900 border-teal-200' 
                                  : 'bg-rose-100 text-rose-900 border-rose-200'
                              }`}>
                                {post} / 100 {isPassingPost ? '✓' : ''}
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-400 font-medium italic">Belum Mengerjakan</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              app.statusKelulusan === 'Lulus'
                                ? 'bg-emerald-100 text-emerald-800'
                                : app.statusKelulusan === 'Lulus Bersyarat'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-600'
                            }`}>
                              {app.statusKelulusan || 'Proses'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {onViewTestApp ? (
                              <button
                                type="button"
                                onClick={() => onViewTestApp(app)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                              >
                                <Eye size={13} /> Tinjau Lembar Jawaban
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* SCHEDULE & CONFIGURATION CARD (ONLY ON PRE / POST TEST TABS) */}
      {activeTestTab !== 'rekap' && (
        <>
      <div className="bg-gray-50/70 p-5 rounded-3xl border border-gray-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-emerald-700" />
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">
              Jadwal & Kontrol Akses {activeTestTab === 'pre_test' ? 'Pre Test' : 'Post Test'}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            {activeTestTab === 'post_test' && (
              <button
                type="button"
                onClick={handleClearPostTest}
                className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Kosongkan seluruh nilai Post-Test peserta Solo karena belum dilaksanakan"
              >
                <Trash2 size={12} />
                <span>Kosongkan Nilai Post-Test</span>
              </button>
            )}
            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
              activeLocalSettings.isOpen 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              {activeLocalSettings.isOpen ? 'Status: DIBUKA' : 'Status: DITUTUP'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Mode Operasional */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Mode Akses Ujian
            </label>
            <select
              value={activeLocalSettings.mode || 'manual'}
              onChange={(e) => handleUpdateActiveSettings('mode', e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="manual">Manual (Admin Buka/Tutup Langsung)</option>
              <option value="scheduled">Jadwal Otomatis (Sesuai Tanggal & Jam)</option>
            </select>
          </div>

          {/* Toggle Buka / Tutup Manual */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Status Buka Akses
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleUpdateActiveSettings('isOpen', true)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                  activeLocalSettings.isOpen 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-black' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Buka Ujian
              </button>
              <button
                type="button"
                onClick={() => handleUpdateActiveSettings('isOpen', false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                  !activeLocalSettings.isOpen 
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs font-black' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Tutup Ujian
              </button>
            </div>
          </div>

          {/* Durasi Ujian (Menit) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Durasi Pengerjaan (Menit)
            </label>
            <input
              type="number"
              min="0"
              max="300"
              value={activeLocalSettings.durationMinutes || 60}
              onChange={(e) => handleUpdateActiveSettings('durationMinutes', parseInt(e.target.value) || 0)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
              placeholder="Contoh: 60"
            />
          </div>

          {/* Nilai Minimal KKM */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Standar Nilai Minimal (KKM)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={activeLocalSettings.passingScore || 70}
              onChange={(e) => handleUpdateActiveSettings('passingScore', parseInt(e.target.value) || 70)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
              placeholder="Contoh: 70"
            />
          </div>
        </div>

        {/* Tanggal & Jam Buka dan Tutup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-gray-200/60">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1">
              <Calendar size={12} /> Tanggal Buka (Mulai)
            </label>
            <input
              type="date"
              value={activeLocalSettings.startDate || ''}
              onChange={(e) => handleUpdateActiveSettings('startDate', e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1">
              <Clock size={12} /> Jam Buka (Mulai)
            </label>
            <input
              type="time"
              value={activeLocalSettings.startTime || '08:00'}
              onChange={(e) => handleUpdateActiveSettings('startTime', e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1">
              <Calendar size={12} /> Tanggal Tutup (Selesai)
            </label>
            <input
              type="date"
              value={activeLocalSettings.endDate || ''}
              onChange={(e) => handleUpdateActiveSettings('endDate', e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1">
              <Clock size={12} /> Jam Tutup (Selesai)
            </label>
            <input
              type="time"
              value={activeLocalSettings.endTime || '23:59'}
              onChange={(e) => handleUpdateActiveSettings('endTime', e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
            />
          </div>
        </div>
      </div>

      {/* QUESTION BANK MANAGEMENT SECTION */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-emerald-700" />
              Kelola Bank Soal & Kunci Jawaban ({localQuestions.length} Butir Soal)
            </h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Klik butir soal di bawah untuk mengedit teks pertanyaan, opsi jawaban, atau mengubah kunci jawaban.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleAddNewQuestion}
              className="px-3.5 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={14} /> Tambah Soal
            </button>
            <button
              onClick={handleResetToDefault50}
              className="px-3.5 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              title="Reset ke 50 Soal Standar HW"
            >
              <RotateCcw size={14} /> Reset 50 Soal
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nomor atau kata kunci soal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Question List Accordion / Editor */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredQuestions.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 font-bold text-xs">
              Tidak ada butir soal yang sesuai dengan pencarian "{searchQuery}".
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isExpanded = expandedQuestionId === q.id;

              return (
                <div 
                  key={q.id}
                  className={`rounded-2xl border transition-all ${
                    isExpanded 
                      ? 'bg-white border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs' 
                      : 'bg-gray-50/60 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {/* Question Summary Row */}
                  <div 
                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                    className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                        {q.id}
                      </span>
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {q.question}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Kunci: {q.correctAnswer.toUpperCase()}
                      </span>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded Editor Form */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 border-t border-gray-150 bg-white rounded-b-2xl space-y-4">
                      {/* Question Textarea */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                          Teks Pertanyaan
                        </label>
                        <textarea
                          rows={3}
                          value={q.question}
                          onChange={(e) => handleUpdateQuestion(q.id, 'question', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold text-gray-800 focus:bg-white resize-none"
                          placeholder="Tuliskan pertanyaan di sini..."
                        />
                      </div>

                      {/* Options Grid (A, B, C, D) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(['a', 'b', 'c', 'd'] as const).map((opt) => (
                          <div key={opt} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                                Pilihan {opt.toUpperCase()}
                              </label>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuestion(q.id, 'correctAnswer', opt)}
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded cursor-pointer ${
                                  q.correctAnswer === opt 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                {q.correctAnswer === opt ? '✓ KUNCI JAWABAN' : 'Set Sebagai Kunci'}
                              </button>
                            </div>
                            <input
                              type="text"
                              value={q.options[opt]}
                              onChange={(e) => handleUpdateQuestion(q.id, `opt_${opt}`, e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:bg-white"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Action buttons inside item */}
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} /> Hapus Butir Soal Ini
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      </>
      )}

    </div>
  );
};
