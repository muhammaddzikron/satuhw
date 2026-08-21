import React, { useState } from 'react';
import { 
  X, CheckCircle2, XCircle, Award, FileText, ExternalLink, Calendar, 
  Clock, User as UserIcon, BookOpen, Sparkles, Filter, Search, Check, AlertCircle 
} from 'lucide-react';
import { 
  TestQuestion, 
  DEFAULT_50_QUESTIONS 
} from '../../data/trainingQuestions';

interface TestSubmissionViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: any;
  questions?: TestQuestion[];
}

export const TestSubmissionViewerModal: React.FC<TestSubmissionViewerModalProps> = ({
  isOpen,
  onClose,
  application,
  questions = DEFAULT_50_QUESTIONS
}) => {
  const [activeTab, setActiveTab] = useState<'pre_test' | 'post_test'>('pre_test');
  const [filterStatus, setFilterStatus] = useState<'all' | 'correct' | 'wrong'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !application) return null;

  const activeQuestions = questions && questions.length > 0 ? questions : DEFAULT_50_QUESTIONS;

  // Parse Pre Test Data
  let preTestData: any = null;
  if (application.preTestData) {
    try {
      preTestData = typeof application.preTestData === 'string' ? JSON.parse(application.preTestData) : application.preTestData;
    } catch (e) {
      preTestData = null;
    }
  }

  // Parse Post Test Data
  let postTestData: any = null;
  if (application.postTestData) {
    try {
      postTestData = typeof application.postTestData === 'string' ? JSON.parse(application.postTestData) : application.postTestData;
    } catch (e) {
      postTestData = null;
    }
  }

  const currentTestData = activeTab === 'pre_test' ? preTestData : postTestData;
  const currentAnswers: Record<number, string> = currentTestData?.answers || {};

  // Calculate detailed items for test review
  const testReviewItems = activeQuestions.map((q) => {
    const userAns = (currentAnswers[q.id] || '').toLowerCase().trim();
    const correctAns = (q.correctAnswer || '').toLowerCase().trim();
    const isAnswered = !!userAns;
    const isCorrect = isAnswered && userAns === correctAns;

    return {
      question: q,
      userAnswer: userAns,
      correctAnswer: correctAns,
      isAnswered,
      isCorrect
    };
  });

  const filteredItems = testReviewItems.filter(item => {
    if (filterStatus === 'correct' && !item.isCorrect) return false;
    if (filterStatus === 'wrong' && (item.isCorrect || !item.isAnswered)) return false;
    if (searchQuery) {
      const qText = item.question.question.toLowerCase();
      const qNum = String(item.question.id);
      return qText.includes(searchQuery.toLowerCase()) || qNum.includes(searchQuery);
    }
    return true;
  });

  const correctTotal = testReviewItems.filter(i => i.isCorrect).length;
  const wrongTotal = testReviewItems.filter(i => i.isAnswered && !i.isCorrect).length;
  const unsubmittedTotal = testReviewItems.filter(i => !i.isAnswered).length;
  const scoreCalculated = testReviewItems.length > 0 ? Math.round((correctTotal / testReviewItems.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden text-left relative">
        
        {/* HEADER WITH PARTICIPANT DETAILS */}
        <div className="bg-gradient-to-r from-emerald-800 via-hw-green to-teal-800 p-5 sm:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 overflow-hidden shrink-0 flex items-center justify-center">
              {application.photo ? (
                <img src={application.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={24} className="text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                  Lembar Rekap Tugas & Ujian
                </span>
                <span className="text-[10px] font-bold bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full">
                  {application.tingkatan || application.pelatihanAkanDiikuti || 'Peserta Pelatihan'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">{application.nama || application.namaLengkap}</h3>
              <p className="text-xs text-white/80 font-medium">
                {application.asalDaerah || 'Jawa Tengah'} • {application.email || application.noWa || 'Peserta Terdaftar'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer self-start sm:self-auto"
          >
            <X size={18} />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex bg-gray-50 border-b border-gray-150 px-4 sm:px-6 gap-2 pt-3">
          <button
            onClick={() => { setActiveTab('pre_test'); setFilterStatus('all'); }}
            className={`pb-3 px-4 font-black text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'pre_test'
                ? 'border-emerald-600 text-emerald-800 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'pre_test' ? 'text-emerald-600' : ''} />
            1. Lembar Pre Test
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              application.preTestScore !== undefined 
                ? 'bg-emerald-100 text-emerald-800 font-black' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {application.preTestScore !== undefined ? `${application.preTestScore}/100` : 'Belum'}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('post_test'); setFilterStatus('all'); }}
            className={`pb-3 px-4 font-black text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'post_test'
                ? 'border-emerald-600 text-emerald-800 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <CheckCircle2 size={14} className={activeTab === 'post_test' ? 'text-emerald-600' : ''} />
            2. Lembar Post Test
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              application.postTestScore !== undefined 
                ? 'bg-emerald-100 text-emerald-800 font-black' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {application.postTestScore !== undefined ? `${application.postTestScore}/100` : 'Belum'}
            </span>
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1 & 2: PRE TEST / POST TEST REVIEW */}
          {(activeTab === 'pre_test' || activeTab === 'post_test') && (
            <div className="space-y-5">
              
              {/* TEST SCORE SUMMARY BANNER */}
              {currentTestData ? (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                      <Award size={30} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                          {activeTab === 'pre_test' ? 'Rekap Pre Test' : 'Rekap Post Test'}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold">
                          {currentTestData.submittedAt ? new Date(currentTestData.submittedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-900 font-display">
                        Nilai: {currentTestData.score ?? scoreCalculated} / 100
                      </div>
                      <div className="text-xs text-emerald-800 font-bold flex items-center gap-3 mt-0.5">
                        <span className="text-green-700">✓ {correctTotal} Benar</span>
                        <span className="text-rose-600">✗ {wrongTotal} Salah</span>
                        {unsubmittedTotal > 0 && <span className="text-gray-500">⚪ {unsubmittedTotal} Kosong</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilterStatus('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                        filterStatus === 'all' ? 'bg-emerald-700 text-white' : 'bg-white text-gray-600 border border-gray-200'
                      }`}
                    >
                      Semua ({testReviewItems.length})
                    </button>
                    <button
                      onClick={() => setFilterStatus('correct')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                        filterStatus === 'correct' ? 'bg-green-600 text-white' : 'bg-white text-green-700 border border-green-200'
                      }`}
                    >
                      Benar ({correctTotal})
                    </button>
                    <button
                      onClick={() => setFilterStatus('wrong')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                        filterStatus === 'wrong' ? 'bg-rose-600 text-white' : 'bg-white text-rose-700 border border-rose-200'
                      }`}
                    >
                      Salah ({wrongTotal})
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-gray-400 space-y-2">
                  <AlertCircle size={32} className="mx-auto text-gray-300" />
                  <p className="font-black text-xs uppercase tracking-wider text-gray-600">
                    Peserta belum menyelesaikan {activeTab === 'pre_test' ? 'Pre Test' : 'Post Test'}.
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Setelah peserta mengerjakan ujian di dasbor pelatihan, lembar jawaban dan nilainya akan otomatis muncul di sini.
                  </p>
                </div>
              )}

              {/* SEARCH & DETAILED QUESTION CARDS */}
              {currentTestData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">
                      Rincian Lembar Jawaban Peserta ({filteredItems.length} Butir)
                    </h4>
                    <div className="relative w-64">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari soal / nomor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {filteredItems.map((item) => {
                      const q = item.question;
                      const userChoice = item.userAnswer;
                      const correctChoice = item.correctAnswer;

                      return (
                        <div 
                          key={q.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            item.isCorrect 
                              ? 'bg-green-50/30 border-green-200' 
                              : item.isAnswered 
                                ? 'bg-rose-50/30 border-rose-200' 
                                : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-gray-800 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                {q.id}
                              </span>
                              <span className="text-xs font-bold text-gray-800 leading-snug">
                                {q.question}
                              </span>
                            </div>

                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                              item.isCorrect 
                                ? 'bg-green-100 text-green-800' 
                                : item.isAnswered 
                                  ? 'bg-rose-100 text-rose-800' 
                                  : 'bg-gray-200 text-gray-600'
                            }`}>
                              {item.isCorrect ? <><Check size={11} /> Benar</> : item.isAnswered ? <><X size={11} /> Salah</> : 'Tidak Dijawab'}
                            </span>
                          </div>

                          {/* Options grid with participant selection highlight */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-2 border-t border-gray-150/70 text-xs">
                            {(['a', 'b', 'c', 'd'] as const).map((opt) => {
                              const isUserChoice = userChoice === opt;
                              const isKey = correctChoice === opt;

                              let optClass = 'bg-white/80 border-gray-200 text-gray-600';
                              if (isKey) {
                                optClass = 'bg-green-100/90 border-green-300 text-green-900 font-bold';
                              }
                              if (isUserChoice && !isKey) {
                                optClass = 'bg-rose-100/90 border-rose-300 text-rose-900 font-bold';
                              }

                              return (
                                <div key={opt} className={`p-2 rounded-xl border text-[11px] flex items-center justify-between ${optClass}`}>
                                  <span>
                                    <strong className="uppercase mr-1.5">{opt}.</strong>
                                    {q.options[opt]}
                                  </span>
                                  {isUserChoice && (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-black/10 rounded">
                                      Jawaban Peserta
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 bg-gray-50 border-t border-gray-150 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
