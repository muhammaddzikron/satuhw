import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, AlertCircle, Clock, ChevronLeft, ChevronRight, 
  Send, HelpCircle, FileCheck, Award, Sparkles, BookOpen 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TestQuestion, 
  TestScheduleSettings, 
  calculateTestResult, 
  DEFAULT_50_QUESTIONS 
} from '../../data/trainingQuestions';

interface ParticipantTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  testType: 'pre_test' | 'post_test';
  testSettings: TestScheduleSettings;
  questions?: TestQuestion[];
  participantData: {
    id: string;
    nama: string;
    email?: string;
    tingkatan?: string;
    asalDaerah?: string;
  };
  existingSubmission?: any;
  onSubmitTest: (submission: {
    testType: 'pre_test' | 'post_test';
    score: number;
    correctCount: number;
    totalQuestions: number;
    answers: Record<number, string>;
    submittedAt: string;
  }) => Promise<void>;
}

export const ParticipantTestModal: React.FC<ParticipantTestModalProps> = ({
  isOpen,
  onClose,
  testType,
  testSettings,
  questions = DEFAULT_50_QUESTIONS,
  participantData,
  existingSubmission,
  onSubmitTest
}) => {
  // Ensure activeQuestions is strictly a valid array
  let activeQuestions: TestQuestion[] = Array.isArray(DEFAULT_50_QUESTIONS) ? DEFAULT_50_QUESTIONS : [];
  if (Array.isArray(questions) && questions.length > 0) {
    activeQuestions = questions;
  } else if (questions && typeof questions === 'object') {
    if (Array.isArray((questions as any).questions)) {
      activeQuestions = (questions as any).questions;
    } else {
      const values = Object.values(questions).filter((v: any) => v && typeof v === 'object' && v.question);
      if (values.length > 0) {
        activeQuestions = values as TestQuestion[];
      }
    }
  }
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [testCompletedResult, setTestCompletedResult] = useState<any>(null);
  
  // Timer state (seconds)
  const durationMinutes = testSettings?.durationMinutes || 60;
  const [timeLeft, setTimeLeft] = useState<number>(durationMinutes * 60);

  // Initialize or reset when opened
  useEffect(() => {
    if (isOpen) {
      if (existingSubmission) {
        let parsedAnswers: Record<number, string> = {};
        try {
          const subObj = typeof existingSubmission === 'string' ? JSON.parse(existingSubmission) : existingSubmission;
          parsedAnswers = subObj.answers || {};
          setTestCompletedResult(subObj);
        } catch (e) {
          parsedAnswers = {};
        }
        setAnswers(parsedAnswers);
      } else {
        setAnswers({});
        setTestCompletedResult(null);
        setCurrentIdx(0);
        setTimeLeft(durationMinutes * 60);
      }
    }
  }, [isOpen, existingSubmission, durationMinutes]);

  // Countdown timer when test is active and not already completed
  useEffect(() => {
    if (!isOpen || testCompletedResult || existingSubmission || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, testCompletedResult, existingSubmission, timeLeft]);

  const handleSelectOption = (questionId: number, optionKey: string) => {
    if (testCompletedResult || existingSubmission) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionKey
    }));
  };

  const answeredCount = Object.keys(answers).length;
  const totalCount = activeQuestions.length;
  const currentQuestion = activeQuestions[currentIdx] || activeQuestions[0];
  const calculatedResult = calculateTestResult(answers, activeQuestions);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAutoSubmit = async () => {
    alert('Waktu pengerjaan telah habis! Jawaban Anda akan otomatis dikumpulkan.');
    await handleFinalSubmit();
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = calculateTestResult(answers, activeQuestions);
      const submissionData = {
        testType,
        score: result.score,
        correctCount: result.correctCount,
        totalQuestions: result.totalQuestions,
        answers,
        submittedAt: new Date().toISOString()
      };

      await onSubmitTest(submissionData);
      setTestCompletedResult(submissionData);
      setShowConfirmModal(false);
    } catch (err: any) {
      alert('Gagal mengirim jawaban: ' + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const testTitle = testType === 'pre_test' ? 'Pre Test Wajib Pelatihan' : 'Post Test Wajib Pelatihan';
  const testBadgeColor = testType === 'pre_test' ? 'bg-teal-600' : 'bg-emerald-700';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden text-left relative">
        
        {/* HEADER */}
        <div className={`p-4 sm:p-5 text-white ${testBadgeColor} flex items-center justify-between shadow-md relative`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                  Tugas Wajib Kurikulum HW
                </span>
                {testCompletedResult && (
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} /> Sudah Selesai
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">{testTitle}</h3>
              <p className="text-xs text-white/80 font-medium">
                Peserta: <span className="font-bold text-white">{participantData.nama}</span> {participantData.tingkatan ? `(${participantData.tingkatan})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!testCompletedResult && !existingSubmission && (
              <div className="bg-black/25 px-3.5 py-1.5 rounded-xl border border-white/20 flex items-center gap-2">
                <Clock size={16} className="text-amber-300 animate-pulse" />
                <span className="font-mono text-sm sm:text-base font-black text-amber-200 tracking-wider">
                  {formatTimer(timeLeft)}
                </span>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PETUNJUK BAR */}
        <div className={`border-b px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-medium ${
          testCompletedResult || existingSubmission
            ? 'bg-emerald-50/80 border-emerald-150 text-emerald-900'
            : 'bg-amber-50/80 border-amber-150 text-amber-900'
        }`}>
          <div className="flex items-center gap-2">
            {testCompletedResult || existingSubmission ? (
              <>
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span className="font-bold">MODE TINJAU HASIL:</span>
                <span className="hidden sm:inline">Ujian telah selesai dikerjakan dan akses pengerjaan ulang ditutup. Anda sedang meninjau lembar evaluasi.</span>
                <span className="sm:hidden">Meninjau lembar evaluasi ujian (Selesai).</span>
              </>
            ) : (
              <>
                <HelpCircle size={15} className="text-amber-600 shrink-0" />
                <span className="font-bold">PETUNJUK:</span>
                <span className="hidden sm:inline">Jawablah pertanyaan berikut dengan cara memilih opsi (a, b, c, atau d) yang paling tepat.</span>
                <span className="sm:hidden">Pilihlah jawaban a, b, c, atau d yang paling tepat.</span>
              </>
            )}
          </div>
          <div className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full shrink-0 ${
            testCompletedResult || existingSubmission
              ? 'text-emerald-800 bg-emerald-100'
              : 'text-amber-800 bg-amber-100'
          }`}>
            {testCompletedResult || existingSubmission ? 'Status: Terkunci Permanen' : `Terjawab: ${answeredCount} / ${totalCount}`}
          </div>
        </div>

        {/* COMPLETED RESULT BANNER IF ALREADY SUBMITTED */}
        {testCompletedResult && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
                <Award size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-900 uppercase">Hasil Penilaian Ujian</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    {(testCompletedResult.score ?? calculatedResult.score) >= (testSettings.passingScore || 70) ? 'Lulus KKM' : 'Tercatat'}
                  </span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                    Akses Ditutup (Selesai)
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-800 font-display">
                  Skor: {testCompletedResult.score ?? calculatedResult.score} / 100
                </div>
                <div className="text-xs text-emerald-700 font-semibold">
                  Jawaban Benar: <span className="font-bold">{testCompletedResult.correctCount ?? (Object.keys(answers).length > 0 ? calculatedResult.correctCount : Math.round(((testCompletedResult.score ?? calculatedResult.score) / 100) * totalCount))}</span> dari {totalCount} soal
                </div>
              </div>
            </div>
            <div className="text-right text-xs text-emerald-800 font-medium">
              <div>Waktu Pengumpulan:</div>
              <div className="font-bold">
                {testCompletedResult.submittedAt 
                  ? new Date(testCompletedResult.submittedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                  : 'Selesai'}
              </div>
            </div>
          </div>
        )}

        {/* MAIN BODY: 2 COLUMNS (Question Content + Number Navigation Grid) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: QUESTION CONTENT (lg:col-span-8) */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              
              {/* Question Header & Index */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-850 font-black text-sm flex items-center justify-center shadow-xs">
                    {currentIdx + 1}
                  </span>
                  <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
                    Soal No. {currentIdx + 1} dari {totalCount}
                  </span>
                </div>

                {answers[currentQuestion.id] && (
                  <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Pilihan: {answers[currentQuestion.id].toUpperCase()}
                  </span>
                )}
              </div>

              {/* Question Text */}
              <div className="bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-150">
                <p className="text-sm sm:text-base font-bold text-gray-800 leading-relaxed whitespace-pre-line">
                  {currentQuestion.question}
                </p>
              </div>

              {/* Options A, B, C, D */}
              <div className="space-y-2.5 pt-1">
                {(['a', 'b', 'c', 'd'] as const).map((optKey) => {
                  const optionText = currentQuestion.options[optKey];
                  const isSelected = (answers[currentQuestion.id] || '').toLowerCase() === optKey;
                  
                  // In review mode (when already completed)
                  const isCorrectAnswer = (currentQuestion.correctAnswer || '').toLowerCase() === optKey;
                  const isReviewMode = !!testCompletedResult;

                  let optionBorder = 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30';
                  let optionBg = 'bg-white';
                  let radioBg = 'border-gray-300 text-transparent';

                  if (isSelected) {
                    optionBorder = 'border-emerald-500 ring-2 ring-emerald-400/40';
                    optionBg = 'bg-emerald-50/80';
                    radioBg = 'border-emerald-600 bg-emerald-600 text-white';
                  }

                  if (isReviewMode) {
                    if (isCorrectAnswer) {
                      optionBorder = 'border-green-500 bg-green-50/90 ring-2 ring-green-400/50';
                      radioBg = 'border-green-600 bg-green-600 text-white';
                    } else if (isSelected && !isCorrectAnswer) {
                      optionBorder = 'border-rose-400 bg-rose-50/90';
                      radioBg = 'border-rose-500 bg-rose-500 text-white';
                    }
                  }

                  return (
                    <button
                      key={optKey}
                      type="button"
                      disabled={isReviewMode}
                      onClick={() => handleSelectOption(currentQuestion.id, optKey)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${optionBg} ${optionBorder}`}
                    >
                      <div className={`w-7 h-7 rounded-xl border flex items-center justify-center font-black text-xs uppercase shrink-0 transition-all ${
                        isSelected 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {optKey}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className={`text-xs sm:text-sm font-semibold leading-snug ${isSelected ? 'text-emerald-950 font-bold' : 'text-gray-700'}`}>
                          {optionText}
                        </p>
                        {isReviewMode && isCorrectAnswer && (
                          <span className="text-[10px] text-green-700 font-black uppercase mt-1 inline-block">
                            ✓ Kunci Jawaban Benar
                          </span>
                        )}
                        {isReviewMode && isSelected && !isCorrectAnswer && (
                          <span className="text-[10px] text-rose-600 font-black uppercase mt-1 inline-block">
                            ✗ Jawaban Anda (Kurang Tepat)
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PREV / NEXT NAVIGATION CONTROLS */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
              <button
                type="button"
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
              >
                <ChevronLeft size={16} /> Sebelumnya
              </button>

              <div className="text-xs font-bold text-gray-400">
                {currentIdx + 1} / {totalCount}
              </div>

              {currentIdx < totalCount - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIdx(prev => Math.min(totalCount - 1, prev + 1))}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  Selanjutnya <ChevronRight size={16} />
                </button>
              ) : (
                !testCompletedResult && !existingSubmission ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer animate-bounce"
                  >
                    <Send size={15} /> Selesaikan Ujian
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 size={15} /> Tutup Lembar Hasil
                  </button>
                )
              )}
            </div>
          </div>

          {/* RIGHT: QUESTION NUMBER GRID (lg:col-span-4) */}
          <div className="lg:col-span-4 bg-gray-50/80 p-4 sm:p-5 rounded-3xl border border-gray-200/80 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">
                  Daftar Nomor Soal
                </h4>
                <span className="text-[10px] font-bold text-gray-400">
                  Total {totalCount} Butir
                </span>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-2 text-[10px] font-bold mb-3 pb-3 border-b border-gray-200">
                <span className="flex items-center gap-1 text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Dijawab
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-200"></span> Kosong
                </span>
                <span className="flex items-center gap-1 text-teal-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> Aktif
                </span>
              </div>

              {/* Number Buttons Grid 1 to 50 */}
              <div className="grid grid-cols-5 sm:grid-cols-5 gap-1.5 max-h-[340px] overflow-y-auto pr-1">
                {activeQuestions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isCurrent = currentIdx === idx;
                  
                  let btnClass = 'bg-white text-gray-600 border-gray-200 hover:border-gray-300';
                  if (isAnswered) {
                    btnClass = 'bg-emerald-500 text-white border-emerald-600 font-black';
                  }
                  if (isCurrent) {
                    btnClass = 'bg-teal-700 text-white border-teal-900 ring-2 ring-teal-400 font-black scale-105';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-9 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer relative ${btnClass}`}
                    >
                      <span>{idx + 1}</span>
                      {isAnswered && (
                        <span className="text-[8px] uppercase font-black leading-none opacity-90">
                          {answers[q.id]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Submit Action */}
            {!testCompletedResult && (
              <div className="pt-3 border-t border-gray-200 space-y-2">
                <div className="text-[11px] text-gray-500 font-medium flex items-center justify-between">
                  <span>Progres Pengerjaan:</span>
                  <span className="font-black text-gray-800">{Math.round((answeredCount / totalCount) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${(answeredCount / totalCount) * 100}%` }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full mt-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Send size={14} /> Selesai & Kumpulkan Jawaban
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CONFIRMATION MODAL */}
        <AnimatePresence>
          {showConfirmModal && (
            <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 text-center space-y-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <FileCheck size={28} />
                </div>
                <div>
                  <h4 className="text-base font-black text-gray-800 uppercase tracking-tight">
                    Kumpulkan Jawaban {testTitle}?
                  </h4>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Anda telah menjawab <span className="font-black text-emerald-600">{answeredCount}</span> dari total <span className="font-bold text-gray-700">{totalCount}</span> soal.
                    {answeredCount < totalCount && (
                      <span className="block text-rose-600 font-bold mt-1">
                        ⚠️ Terdapat {totalCount - answeredCount} butir soal yang belum Anda jawab!
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-gray-50 cursor-pointer"
                  >
                    Periksa Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? 'Mengirim...' : 'Ya, Kumpulkan!'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
