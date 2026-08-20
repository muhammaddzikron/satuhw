import React, { useState } from 'react';
import { 
  Settings, Clock, Calendar, CheckCircle2, XCircle, Edit3, Trash2, 
  Plus, RotateCcw, Save, BookOpen, AlertCircle, FileText, ChevronDown, ChevronUp, Search, Sparkles
} from 'lucide-react';
import { 
  TestQuestion, 
  TestScheduleSettings, 
  DEFAULT_PRE_TEST_SETTINGS, 
  DEFAULT_POST_TEST_SETTINGS, 
  DEFAULT_50_QUESTIONS 
} from '../../data/trainingQuestions';

interface TestManagementPanelProps {
  settings: any;
  onSaveSettings: (updatedSettings: any) => Promise<void>;
}

export const TestManagementPanel: React.FC<TestManagementPanelProps> = ({
  settings,
  onSaveSettings
}) => {
  const [activeTestTab, setActiveTestTab] = useState<'pre_test' | 'post_test'>('pre_test');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);

  // Read current settings with fallback
  const preTestSettings: TestScheduleSettings = settings?.preTestSettings || DEFAULT_PRE_TEST_SETTINGS;
  const postTestSettings: TestScheduleSettings = settings?.postTestSettings || DEFAULT_POST_TEST_SETTINGS;

  const currentTestSettings = activeTestTab === 'pre_test' ? preTestSettings : postTestSettings;

  // Questions bank: Can be stored per test or shared
  const questions: TestQuestion[] = Array.isArray(settings?.trainingQuestions) && settings.trainingQuestions.length > 0
    ? settings.trainingQuestions
    : DEFAULT_50_QUESTIONS;

  // Local editing states
  const [localPreSettings, setLocalPreSettings] = useState<TestScheduleSettings>(preTestSettings);
  const [localPostSettings, setLocalPostSettings] = useState<TestScheduleSettings>(postTestSettings);
  const [localQuestions, setLocalQuestions] = useState<TestQuestion[]>(questions);

  const activeLocalSettings = activeTestTab === 'pre_test' ? localPreSettings : localPostSettings;

  const handleUpdateActiveSettings = (field: keyof TestScheduleSettings, value: any) => {
    if (activeTestTab === 'pre_test') {
      setLocalPreSettings(prev => ({ ...prev, [field]: value }));
    } else {
      setLocalPostSettings(prev => ({ ...prev, [field]: value }));
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
      alert('Pengaturan Pre Test, Post Test & Bank Soal berhasil disimpan ke sistem!');
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
              Pengaturan Pre Test & Post Test Pelatihan HW
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              Atur jadwal buka/tutup, durasi, KKM, serta kelola 50 bank soal dan kunci jawaban peserta.
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

      {/* TEST TAB SWITCHER: PRE TEST vs POST TEST */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTestTab('pre_test')}
          className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTestTab === 'pre_test'
              ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Sparkles size={15} className={activeTestTab === 'pre_test' ? 'text-emerald-600' : ''} />
          1. Pre Test (Awal)
          {localPreSettings.isOpen && (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTestTab('post_test')}
          className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTestTab === 'post_test'
              ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <CheckCircle2 size={15} className={activeTestTab === 'post_test' ? 'text-emerald-600' : ''} />
          2. Post Test (Akhir)
          {localPostSettings.isOpen && (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          )}
        </button>
      </div>

      {/* SCHEDULE & CONFIGURATION CARD */}
      <div className="bg-gray-50/70 p-5 rounded-3xl border border-gray-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-emerald-700" />
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">
              Jadwal & Kontrol Akses {activeTestTab === 'pre_test' ? 'Pre Test' : 'Post Test'}
            </h4>
          </div>
          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
            activeLocalSettings.isOpen 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            {activeLocalSettings.isOpen ? 'Status: DIBUKA' : 'Status: DITUTUP'}
          </span>
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
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                  activeLocalSettings.isOpen 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Buka Ujian
              </button>
              <button
                type="button"
                onClick={() => handleUpdateActiveSettings('isOpen', false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                  !activeLocalSettings.isOpen 
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs' 
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

    </div>
  );
};
