import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  ClipboardList, 
  Clock, 
  Download, 
  ExternalLink, 
  FileText, 
  GraduationCap, 
  Loader2, 
  Lock, 
  Shield, 
  User, 
  Users, 
  X, 
  RefreshCw,
  Search,
  Check,
  AlertCircle,
  Info,
  Pencil,
  MapPin,
  FileCheck,
  ScrollText,
  ArrowLeft,
  Sparkles,
  CreditCard,
  MessageCircle,
  Upload,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { sheetsService } from '../services/sheetsService';
import { firestoreService } from '../services/firestoreService';
import { isOnlyTrainingActivity } from '../utils/activityUtils';
import { getCorsSafeUrl, getDriveDirectLink, cn } from '../lib/utils';
import { ParticipantTestModal } from '../components/training/ParticipantTestModal';
import { 
  DEFAULT_PRE_TEST_SETTINGS, 
  DEFAULT_POST_TEST_SETTINGS, 
  DEFAULT_50_QUESTIONS,
  parseTestScheduleSettings,
  isTestCurrentlyOpen 
} from '../data/trainingQuestions';
import { 
  normalizeTrainingKey, 
  isSameTrainingParticipant, 
  normalizeParticipantName 
} from '../utils/trainingUtils';

export {
  type TrainingProgram,
  type TrainingActivityItem,
  JATI1_36_SESSIONS,
  JATI1_36_ASSIGNMENTS,
  DEFAULT_JATI1_36_MATERI,
  TRAINING_PROGRAMS,
  DEFAULT_TRAINING_ACTIVITIES
} from '../data/trainingData';
import {
  type TrainingProgram,
  type TrainingActivityItem,
  JATI1_36_SESSIONS,
  JATI1_36_ASSIGNMENTS,
  DEFAULT_JATI1_36_MATERI,
  TRAINING_PROGRAMS,
  DEFAULT_TRAINING_ACTIVITIES
} from '../data/trainingData';

export default function PelatihanPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  
  const [trainingActivities, setTrainingActivities] = useState<TrainingActivityItem[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<TrainingActivityItem | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<'Jati 1' | 'Jati 2' | 'Jari 1'>('Jati 1');
  const [perspective, setPerspective] = useState<'peserta' | 'admin'>('peserta');
  const [viewOtherTrainings, setViewOtherTrainings] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [userApp, setUserApp] = useState<any | null>(null);
  
  // Tab within verified participant portal
  const [activeTab, setActiveTab] = useState<'materi' | 'presensi' | 'tugas' | 'piagam'>('materi');
  const [materiList, setMateriList] = useState<any[]>([]);
  const [loadingMateri, setLoadingMateri] = useState(false);
  
  // Submit task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskMateriId, setTaskMateriId] = useState('');
  const [taskLink, setTaskLink] = useState('');
  const [taskMessage, setTaskMessage] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  
  // Admin interaction state
  const [searchQuery, setSearchQuery] = useState('');
  const [gradingApp, setGradingApp] = useState<any | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [remarkInput, setRemarkInput] = useState('');
  const [passingStatus, setPassingStatus] = useState('Lulus');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Attendance interactive states
  const [activeEditSession, setActiveEditSession] = useState<string | null>(null);
  const [savingAttendance, setSavingAttendance] = useState<Record<string, boolean>>({});

  // Pre Test & Post Test states
  const [activeTestModal, setActiveTestModal] = useState<'pre_test' | 'post_test' | null>(null);
  const [trainingSettings, setTrainingSettings] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const apps = await sheetsService.getTrainingApplications();
      setApplications(apps || []);

      // Fetch dynamic training activities from Settings & Realtime Activities
      try {
        const [settingsData, generalActs] = await Promise.all([
          sheetsService.getSettings(),
          sheetsService.getActivities()
        ]);

        if (settingsData) {
          setTrainingSettings(settingsData);
        }

        if (settingsData?.assignedTasks) {
          const parsed = Array.isArray(settingsData.assignedTasks) 
            ? settingsData.assignedTasks 
            : JSON.parse(settingsData.assignedTasks || '[]');
          setAssignedTasks(parsed);
        }

        const map = new Map<string, any>();
        if (settingsData && settingsData.trainingActivities !== undefined) {
          const acts = (Array.isArray(settingsData.trainingActivities)
            ? settingsData.trainingActivities
            : JSON.parse(settingsData.trainingActivities || '[]')).filter(isOnlyTrainingActivity);
          acts.forEach(a => { if (a && a.id) map.set(a.id, a); });
        }
        if (Array.isArray(generalActs)) {
          generalActs.filter(isOnlyTrainingActivity).forEach(a => {
            if (a && a.id) {
              if (map.has(a.id)) {
                map.set(a.id, { ...map.get(a.id), ...a });
              } else {
                map.set(a.id, a);
              }
            }
          });
        }
        setTrainingActivities(Array.from(map.values()).filter(isOnlyTrainingActivity));
      } catch (err) {
        console.error('Failed to fetch settings for activities:', err);
      }

      const unsubSettings = sheetsService.subscribeToSettings((settingsData: any) => {
        if (settingsData) {
          setTrainingSettings(settingsData);
        }
        if (settingsData && settingsData.trainingActivities !== undefined) {
          const acts = (Array.isArray(settingsData.trainingActivities)
            ? settingsData.trainingActivities
            : JSON.parse(settingsData.trainingActivities || '[]')).filter(isOnlyTrainingActivity);
          setTrainingActivities(prev => {
            const map = new Map<string, any>();
            (prev || []).filter(isOnlyTrainingActivity).forEach(a => { if (a && a.id) map.set(a.id, a); });
            acts.forEach(a => {
              if (a && a.id) {
                if (map.has(a.id)) {
                  map.set(a.id, { ...map.get(a.id), ...a });
                } else {
                  map.set(a.id, a);
                }
              }
            });
            return Array.from(map.values()).filter(isOnlyTrainingActivity);
          });
        }
      });

      const unsubActivities = sheetsService.subscribeToActivities((acts: any[]) => {
        if (acts && acts.length > 0) {
          setTrainingActivities(prev => {
            const map = new Map<string, any>();
            (prev || []).filter(isOnlyTrainingActivity).forEach(a => { if (a && a.id) map.set(a.id, a); });
            (acts || []).forEach(a => {
              if (a && a.id && isOnlyTrainingActivity(a)) {
                if (map.has(a.id)) {
                  const existing = map.get(a.id) || {};
                  map.set(a.id, { ...existing, ...a });
                } else {
                  map.set(a.id, a);
                }
              }
            });
            return Array.from(map.values()).filter(isOnlyTrainingActivity);
          });
        }
      });

      const unsubTrainingApps = sheetsService.subscribeToTrainingApplications((freshApps: any[]) => {
        if (Array.isArray(freshApps) && freshApps.length > 0) {
          setApplications(freshApps);
          if (user) {
            const myApp = findUserAppForLevel(freshApps, user, selectedActivity?.jenisPelatihan || selectedLevel);
            setUserApp(myApp || null);

            // Auto-grant jati1 role if registered as Jaya Melati 1
            const hasJati1App = freshApps.some((a: any) => {
              if (!isUserAppMatch(a, user)) return false;
              const norm = normalizeLevelCode(a.pelatihanAkanDiikuti);
              return norm === 'jati1' && a.status !== 'deleted' && a.status !== 'rejected';
            });
            if (hasJati1App) {
              const currentRoles = Array.isArray(user.roles) ? user.roles : [user.role || 'umum'];
              if (!currentRoles.includes('jati1')) {
                useAuthStore.getState().updateUser({
                  roles: Array.from(new Set([...currentRoles, 'jati1'])) as any,
                  activeRole: (user.activeRole === 'umum' || !user.activeRole) ? 'jati1' : user.activeRole
                });
              }
            }
          }
        }
      });

      // Find user app for selected level or activity
      if (user) {
        const myApp = findUserAppForLevel(apps || [], user, selectedActivity?.jenisPelatihan || selectedLevel);
        setUserApp(myApp || null);

        // Auto-grant jati1 role if registered as Jaya Melati 1
        const hasJati1App = (apps || []).some((a: any) => {
          if (!isUserAppMatch(a, user)) return false;
          const norm = normalizeLevelCode(a.pelatihanAkanDiikuti);
          return norm === 'jati1' && a.status !== 'deleted' && a.status !== 'rejected';
        });
        if (hasJati1App) {
          const currentRoles = Array.isArray(user.roles) ? user.roles : [user.role || 'umum'];
          if (!currentRoles.includes('jati1')) {
            useAuthStore.getState().updateUser({
              roles: Array.from(new Set([...currentRoles, 'jati1'])) as any,
              activeRole: (user.activeRole === 'umum' || !user.activeRole) ? 'jati1' : user.activeRole
            });
          }
        }
      } else {
        setUserApp(null);
      }

      // Fetch materials specifically for Jaya Melati 1 (Jati 1) as required for member dashboard
      setLoadingMateri(true);
      try {
        const mats = await sheetsService.getMateri('jati1');
        const adminMats = await sheetsService.getMateri('admin');
        const combined = [...(mats || []), ...(adminMats || [])];
        const map = new Map<string, any>();
        combined.forEach(m => { if (m && m.id) map.set(String(m.id), m); });
        const allMats = Array.from(map.values());

        const j1Mats = allMats.filter(m => {
          const k = (m.kategori || '').toLowerCase().trim();
          return k === 'jati1' || k === 'jati 1' || k.includes('jati 1') || k.includes('jaya melati 1');
        });

        if (j1Mats.length >= 36) {
          setMateriList(j1Mats);
        } else {
          // Merge uploaded materials with DEFAULT_JATI1_36_MATERI to ensure all 36 materials are available
          const merged36 = DEFAULT_JATI1_36_MATERI.map((defM, idx) => {
            const matched = j1Mats.find(m => 
              m.judul && (
                m.judul.toLowerCase().includes(`materi ${idx + 1}:`) || 
                m.judul.toLowerCase().includes(`sesi ${idx + 1}:`) ||
                m.judul.toLowerCase().trim() === defM.judul.toLowerCase().trim()
              )
            );
            return matched || defM;
          });
          setMateriList(merged36);
        }
      } catch (err) {
        console.error('Failed to load materials for Jati 1:', err);
      } finally {
        setLoadingMateri(false);
      }

    } catch (err) {
      console.error('Failed to load training data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to real-time custom event when admin changes test settings
    const handleSettingsUpdated = (e: any) => {
      if (e?.detail) {
        setTrainingSettings(e.detail);
      }
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'hw_settings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setTrainingSettings(parsed);
        } catch (err) {}
      }
    };

    window.addEventListener('hw_settings_updated', handleSettingsUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('hw_settings_updated', handleSettingsUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, [selectedLevel, isAuthenticated, user?.id, user?.role, (user as any)?.adminType]);

  useEffect(() => {
    const isRealAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'sugli' || user?.role === 'kwarda' || user?.role === 'admin_diklat' || user?.role === 'diklat' || (user as any)?.adminType === 'diklat' || user?.email === 'diklat' || user?.email === 'diklat@hwjateng.com';
    if (isRealAdmin) {
      setPerspective('admin');
    } else {
      setPerspective('peserta');
    }
  }, [user?.role, user?.email, (user as any)?.adminType]);

  const program = perspective === 'peserta' 
    ? (TRAINING_PROGRAMS.find(p => p.id === 'Jati 1') || TRAINING_PROGRAMS[0])
    : (TRAINING_PROGRAMS.find(p => p.id === selectedLevel) || TRAINING_PROGRAMS[0]);

  const normalizeLevelCode = (str?: string): string => {
    if (!str) return 'jati1';
    const key = normalizeTrainingKey(str);
    if (key) return key;
    const clean = str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (clean.includes('jati2') || clean.includes('melati2')) return 'jati2';
    if (clean.includes('jari1') || clean.includes('matahari1')) return 'jari1';
    if (clean.includes('jari2') || clean.includes('matahari2')) return 'jari2';
    if (clean.includes('jati1') || clean.includes('melati1') || clean.includes('pelatihan')) return 'jati1';
    return clean || 'jati1';
  };

  const isUserAppMatch = (a: any, u: any): boolean => {
    if (!a || !u) return false;
    if (isSameTrainingParticipant(a, u)) return true;
    if (a.email && u.email && a.email.toLowerCase().trim() === u.email.toLowerCase().trim()) return true;
    if (a.userId && (String(a.userId) === String(u.id) || String(a.userId) === String(u.userId))) return true;
    if (a.id && (String(a.id) === String(u.id) || String(a.id) === String(u.trainingAppId))) return true;
    
    const aWa = String(a.noWa || a.noHp || '').replace(/[^0-9]/g, '');
    const uWa = String(u.noHp || u.noWa || '').replace(/[^0-9]/g, '');
    if (aWa && uWa && aWa.length >= 7 && (aWa === uWa || aWa.endsWith(uWa.slice(-8)) || uWa.endsWith(aWa.slice(-8)))) return true;

    const aNbm = String(a.nbm || a.ktaNumber || a.nomorKTA || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
    const uNbm = String(u.nbm || u.ktaNumber || u.nomorKTA || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
    if (aNbm && uNbm && aNbm.length >= 4 && aNbm === uNbm) return true;

    const aName = normalizeParticipantName(a.nama || a.namaLengkap || '');
    const uName = normalizeParticipantName(u.namaLengkap || u.nama || '');
    if (aName && uName && (aName === uName || aName.includes(uName) || uName.includes(aName))) return true;

    return false;
  };

  const findUserAppForLevel = (appsList: any[], currentUser: any, targetLevelStr?: string) => {
    if (!currentUser || !Array.isArray(appsList) || appsList.length === 0) return null;
    const targetNorm = normalizeLevelCode(targetLevelStr || selectedActivity?.jenisPelatihan || selectedLevel);
    
    // 1. Exact / matching level
    const matchLevel = appsList.find((a: any) => {
      if (!isUserAppMatch(a, currentUser)) return false;
      if (a.status === 'deleted' || a.status === 'rejected') return false;
      const aNorm = normalizeLevelCode(a.pelatihanAkanDiikuti || a.jenisPelatihan || a.namaKegiatan);
      return aNorm === targetNorm || aNorm.includes(targetNorm) || targetNorm.includes(aNorm);
    });
    if (matchLevel) return matchLevel;

    // 2. Any approved application
    const anyApproved = appsList.find((a: any) => {
      if (!isUserAppMatch(a, currentUser)) return false;
      if (a.status === 'deleted' || a.status === 'rejected') return false;
      return (
        a.status === 'approved' || 
        a.status === 'terverifikasi' || 
        a.status === 'disetujui' ||
        a.statusPembayaran === 'Lunas'
      );
    });
    if (anyApproved) return anyApproved;

    // 3. Any valid application
    return appsList.find((a: any) => isUserAppMatch(a, currentUser) && a.status !== 'deleted' && a.status !== 'rejected') || null;
  };

  const approvedUserApps = user ? applications.filter((a: any) => {
    if (!isUserAppMatch(a, user)) return false;
    if (a.status === 'deleted' || a.status === 'rejected') return false;
    return (
      a.status === 'approved' || 
      a.status === 'terverifikasi' || 
      a.status === 'disetujui' ||
      a.statusPembayaran === 'Lunas' ||
      a.statusKelulusan === 'Lulus'
    );
  }) : [];

  const openApprovedPortal = (app: any, targetTab: 'materi' | 'presensi' | 'tugas' | 'piagam' = 'materi') => {
    const normLevel = normalizeLevelCode(app?.pelatihanAkanDiikuti);
    const matchedAct = trainingActivities.find(act => normalizeLevelCode(act.jenisPelatihan) === normLevel) || {
      id: app?.id || 'act-approved',
      namaKegiatan: app?.pelatihanAkanDiikuti ? `Pelatihan ${app.pelatihanAkanDiikuti}` : 'Pelatihan HW Jateng',
      jenisPelatihan: app?.pelatihanAkanDiikuti || 'Jati 1',
      status: 'Buka',
      deskripsi: 'Kegiatan Pelatihan HW Jateng Terverifikasi',
      lokasiPelatihan: app?.lokasiPelatihan || 'Pusdiklat HW Jateng',
      tanggalPelatihan: app?.tanggalPelatihan || 'Sesuai Jadwal',
      biayaPelatihan: app?.biayaPelatihan || 'Rp 50.000',
      rekeningPembiayaan: app?.rekeningPembiayaan || 'Bank BSI 7307427448',
      noWhatsappPanitia: app?.noWhatsappPanitia || '089688754000'
    };

    setSelectedActivity(matchedAct);
    if (['jati1', 'jati2', 'jari1'].includes(normLevel)) {
      const levelName = normLevel === 'jati2' ? 'Jati 2' : normLevel === 'jari1' ? 'Jari 1' : 'Jati 1';
      setSelectedLevel(levelName as any);
    }
    setUserApp(app);
    setActiveTab(targetTab);
  };

  // Check if user is verified for a specific level or selected activity
  const isUserVerifiedForActivity = (activityJenis: string): { isVerified: boolean; userApplication: any | null } => {
    if (!user) return { isVerified: false, userApplication: null };

    const isAdmin = user.role === 'admin' || user.role === 'superadmin' || user.role === 'sugli' || user.role === 'kwarda' || user.role === 'admin_diklat' || user.role === 'diklat' || (user as any)?.adminType === 'diklat' || user.email === 'diklat' || user.email === 'diklat@hwjateng.com';
    if (isAdmin && perspective === 'admin') {
      return { isVerified: true, userApplication: null };
    }

    const targetKey = normalizeLevelCode(activityJenis);

    // Check if user has an application
    const myApp = applications.find((a: any) => {
      if (!isUserAppMatch(a, user)) return false;
      const appKey = normalizeLevelCode(a.pelatihanAkanDiikuti);
      return appKey === targetKey || appKey.includes(targetKey) || targetKey.includes(appKey);
    });

    if (!myApp) {
      return { isVerified: false, userApplication: null };
    }

    if (myApp.status === 'deleted' || myApp.status === 'rejected') {
      return { isVerified: false, userApplication: null };
    }

    const isApproved = (
      myApp.status === 'approved' || 
      myApp.status === 'terverifikasi' || 
      myApp.status === 'disetujui' ||
      myApp.statusPembayaran === 'Lunas' ||
      myApp.statusKelulusan === 'Lulus'
    );

    return { isVerified: Boolean(isApproved), userApplication: isApproved ? myApp : myApp };
  };

  // Auto-reset open portal dashboard if participant is deleted, rejected, or no longer verified
  useEffect(() => {
    if (selectedActivity && perspective === 'peserta' && user) {
      const { isVerified } = isUserVerifiedForActivity(selectedActivity.jenisPelatihan);
      if (!isVerified) {
        setSelectedActivity(null);
      }
    }
  }, [selectedActivity, applications, perspective, user]);

  // Auto-open active participant dashboard if user is approved and not explicitly browsing other trainings
  useEffect(() => {
    if (perspective === 'peserta' && approvedUserApps.length > 0 && !selectedActivity && !viewOtherTrainings) {
      openApprovedPortal(approvedUserApps[0], 'materi');
    }
  }, [approvedUserApps, selectedActivity, viewOtherTrainings, perspective]);

  // Helper for attendance status
  const getAttendanceStatus = (attendanceMap: any, sesId: string): string => {
    if (!attendanceMap) return 'belum';
    let item = attendanceMap[sesId];
    if (item === undefined) {
      const numMatch = sesId.match(/\d+/);
      if (numMatch) {
        const num = numMatch[0];
        item = attendanceMap[`Sesi ${num}`] ?? attendanceMap[`sesi_${num}`] ?? attendanceMap[`Materi ${num}`] ?? attendanceMap[`materi_${num}`] ?? attendanceMap[num];
      }
    }
    if (item === undefined || item === null) return 'belum';
    if (typeof item === 'boolean') return item ? 'hadir' : 'absen';
    if (typeof item === 'object' && item !== null) return item.status || 'belum';
    if (typeof item === 'string') {
      if (item === 'true' || item.toLowerCase() === 'hadir') return 'hadir';
      if (item === 'false' || item.toLowerCase() === 'absen') return 'absen';
      return item.toLowerCase();
    }
    return 'belum';
  };

  const getAttendanceTimestamp = (attendanceMap: any, sesId: string): string | null => {
    if (!attendanceMap) return null;
    let item = attendanceMap[sesId];
    if (item === undefined) {
      const numMatch = sesId.match(/\d+/);
      if (numMatch) {
        const num = numMatch[0];
        item = attendanceMap[`Sesi ${num}`] ?? attendanceMap[`sesi_${num}`] ?? attendanceMap[`Materi ${num}`] ?? attendanceMap[`materi_${num}`] ?? attendanceMap[num];
      }
    }
    if (item && typeof item === 'object' && item !== null) {
      return item.timestamp || null;
    }
    return null;
  };

  // Participant attendance submission
  const handleUserSubmitAttendance = async (sessionId: string, status: string) => {
    try {
      setSavingAttendance(prev => ({ ...prev, [sessionId]: true }));
      
      // Auto-resolve or create participant application if user is verified
      let currentApp = userApp;
      if (!currentApp) {
        currentApp = approvedUserApps.find(a => normalizeLevelCode(a.pelatihanAkanDiikuti) === normalizeLevelCode(selectedActivity?.jenisPelatihan || selectedLevel))
          || applications.find(a => isUserAppMatch(a, user))
          || approvedUserApps[0];
      }

      if (!currentApp && user) {
        const newAppId = `train-app-${Date.now()}`;
        currentApp = {
          id: newAppId,
          userId: user.id || `user-${Date.now()}`,
          nama: user.namaLengkap || user.nama || 'Peserta Pelatihan',
          email: user.email || '',
          noWa: user.noHp || '',
          nbm: (user as any)?.nbm || user.ktaNumber || user.nomorKTA || '',
          ktaNumber: (user as any)?.nbm || user.ktaNumber || user.nomorKTA || '',
          nomorKTA: (user as any)?.nbm || user.ktaNumber || user.nomorKTA || '',
          asalDaerah: user.asalKwarda || 'Jawa Tengah',
          pelatihanAkanDiikuti: selectedActivity?.jenisPelatihan || selectedLevel || 'Jati 1',
          status: 'approved',
          statusPembayaran: 'Lunas',
          statusKelulusan: 'Proses Pelatihan',
          kehadiran: '{}'
        };
        await Promise.all([
          sheetsService.applyTraining(currentApp).catch(e => console.warn(e)),
          firestoreService.createTrainingApplication(currentApp).catch(e => console.warn(e))
        ]);
        setApplications(prev => [currentApp, ...prev]);
        setUserApp(currentApp);
      }

      if (!currentApp) {
        alert('Data pendaftaran Anda tidak ditemukan. Silakan login atau pilih pelatihan yang diikuti.');
        return;
      }

      let attendanceMap: Record<string, any> = {};
      try {
        attendanceMap = currentApp.kehadiran ? (typeof currentApp.kehadiran === 'string' ? JSON.parse(currentApp.kehadiran) : currentApp.kehadiran) : {};
        if (typeof attendanceMap !== 'object' || attendanceMap === null) attendanceMap = {};
      } catch (err) {
        attendanceMap = {};
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const timestamp = `${dateStr} pukul ${timeStr}`;

      attendanceMap[sessionId] = {
        status: status,
        timestamp: timestamp
      };

      const updatedKehadiranStr = JSON.stringify(attendanceMap);
      const updatedUserApp = { ...currentApp, kehadiran: updatedKehadiranStr };

      // Instant optimistic state update
      setUserApp(updatedUserApp);
      setApplications(prev => prev.map(app => (app.id === currentApp.id || (user && isUserAppMatch(app, user))) ? { ...app, kehadiran: updatedKehadiranStr } : app));

      // Local storage instant persistence
      try {
        const stored = localStorage.getItem('training_applications');
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            const updatedList = list.map((item: any) => {
              if (item && (String(item.id) === String(currentApp.id) || (user && isUserAppMatch(item, user)))) {
                return { ...item, kehadiran: updatedKehadiranStr };
              }
              return item;
            });
            localStorage.setItem('training_applications', JSON.stringify(updatedList));
          }
        }
      } catch (e) {}

      // Background persist & sync to backend / sheets / firestore
      await Promise.all([
        sheetsService.updateAttendance(currentApp.id, updatedKehadiranStr),
        firestoreService.updateAttendance(currentApp.id, updatedKehadiranStr, currentApp)
      ]);

      setActiveEditSession(null);
      alert(`Presensi ${status === 'hadir' ? 'Hadir' : status === 'izin' ? 'Izin' : 'Tidak Hadir'} berhasil disimpan! Data presensi otomatis terekap.`);
    } catch (err: any) {
      alert('Gagal menyimpan presensi: ' + err.message);
    } finally {
      setSavingAttendance(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  // Participant assignment submission
  const handleUserSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    let currentApp = userApp;
    if (!currentApp) {
      currentApp = approvedUserApps.find(a => normalizeLevelCode(a.pelatihanAkanDiikuti) === normalizeLevelCode(selectedActivity?.jenisPelatihan || selectedLevel))
        || applications.find(a => isUserAppMatch(a, user))
        || approvedUserApps[0];
    }
    if (!currentApp) {
      alert('Anda belum terdaftar atau pendaftaran belum disetujui untuk kegiatan ini.');
      return;
    }
    if (!taskTitle || !taskLink) {
      alert('Mohon lengkapi nama tugas dan tautan (link) tugas Anda.');
      return;
    }

    setSubmittingTask(true);
    try {
      let currentTasks: any[] = [];
      try {
        currentTasks = currentApp.tugas ? (typeof currentApp.tugas === 'string' ? JSON.parse(currentApp.tugas) : currentApp.tugas) : [];
        if (!Array.isArray(currentTasks)) currentTasks = [];
      } catch (err) {
        currentTasks = [];
      }

      // Try finding corresponding assigned task
      const matchedAssigned = assignedTasks.find(t => 
        (taskMateriId && String(t.materiId) === String(taskMateriId)) ||
        (t.materiJudul && (taskTitle.includes(t.materiJudul) || t.materiJudul.includes(taskTitle)))
      );

      const newTask = {
        id: matchedAssigned ? `task_${matchedAssigned.materiId}` : `task_${Date.now()}`,
        materiId: matchedAssigned ? matchedAssigned.materiId : (taskMateriId || ''),
        title: taskTitle,
        link: taskLink.trim(),
        pesan: taskMessage.trim(),
        submittedAt: new Date().toISOString()
      };

      // Check if task already exists -> update it (upsert)
      const existingIdx = currentTasks.findIndex((t: any) => 
        (newTask.materiId && String(t.materiId) === String(newTask.materiId)) ||
        (t.title && t.title.toLowerCase().trim() === newTask.title.toLowerCase().trim())
      );

      let updatedTasks: any[];
      if (existingIdx >= 0) {
        updatedTasks = [...currentTasks];
        updatedTasks[existingIdx] = { ...updatedTasks[existingIdx], ...newTask };
      } else {
        updatedTasks = [...currentTasks, newTask];
      }

      const updatedTasksStr = JSON.stringify(updatedTasks);
      await Promise.all([
        sheetsService.submitAssignment(currentApp.id, updatedTasksStr),
        firestoreService.updateAssignmentGrade(currentApp.id, updatedTasksStr, undefined)
      ]);
      const updatedUserApp = { ...currentApp, tugas: updatedTasksStr };
      setUserApp(updatedUserApp);
      setApplications(prev => prev.map(app => app.id === currentApp.id ? updatedUserApp : app));
      window.dispatchEvent(new Event('training_applications_updated'));
      alert('Tugas berhasil dikumpulkan & disimpan!');
      setTaskTitle('');
      setTaskMateriId('');
      setTaskLink('');
      setTaskMessage('');
      loadData();
    } catch (err: any) {
      alert('Gagal mengumpulkan tugas: ' + err.message);
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleUserDeleteTask = async (taskIndex: number) => {
    let currentApp = userApp;
    if (!currentApp) {
      currentApp = approvedUserApps.find(a => normalizeLevelCode(a.pelatihanAkanDiikuti) === normalizeLevelCode(selectedActivity?.jenisPelatihan || selectedLevel))
        || applications.find(a => isUserAppMatch(a, user))
        || approvedUserApps[0];
    }
    if (!currentApp) return;
    if (!window.confirm('Apakah Anda yakin ingin menghapus berkas pengumpulan tugas ini?')) return;

    try {
      let currentTasks: any[] = [];
      try {
        currentTasks = currentApp.tugas ? (typeof currentApp.tugas === 'string' ? JSON.parse(currentApp.tugas) : currentApp.tugas) : [];
        if (!Array.isArray(currentTasks)) currentTasks = [];
      } catch (err) {
        currentTasks = [];
      }

      const updatedTasks = currentTasks.filter((_, idx) => idx !== taskIndex);
      const updatedTasksStr = JSON.stringify(updatedTasks);

      await Promise.all([
        sheetsService.submitAssignment(currentApp.id, updatedTasksStr),
        firestoreService.updateAssignmentGrade(currentApp.id, updatedTasksStr, undefined)
      ]);
      const updatedUserApp = { ...currentApp, tugas: updatedTasksStr };
      setUserApp(updatedUserApp);
      setApplications(prev => prev.map(app => app.id === currentApp.id ? updatedUserApp : app));
      window.dispatchEvent(new Event('training_applications_updated'));
      alert('Pengumpulan tugas berhasil dihapus.');
      loadData();
    } catch (err: any) {
      alert('Gagal menghapus tugas: ' + err.message);
    }
  };

  // Admin approval
  const handleUpdateStatus = async (appId: string, status: 'approved' | 'rejected') => {
    if (!window.confirm(`Apakah Anda yakin ingin ${status === 'approved' ? 'menyetujui & memverifikasi' : 'menolak'} pendaftaran ini?`)) return;
    try {
      // 1. Optimistic state updates
      setApplications(prev => prev.map(a => String(a.id) === String(appId) ? { ...a, status } : a));
      if (userApp && String(userApp.id) === String(appId)) {
        setUserApp((prev: any) => ({ ...prev, status }));
      }
      alert(`Pendaftaran berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}!`);

      // 2. Background sync
      (async () => {
        await sheetsService.updateTrainingStatus(appId, status, status === 'approved' ? 'Pendaftaran disetujui oleh admin' : 'Pendaftaran ditolak');
        loadData();
      })().catch(err => console.warn('Background update training status warning:', err));

    } catch (err: any) {
      alert('Gagal mengupdate status: ' + err.message);
    }
  };

  // Admin attendance control
  const handleToggleAttendance = async (app: any, sessionId: string, status: string) => {
    try {
      let attendanceMap: Record<string, any> = {};
      try {
        attendanceMap = app.kehadiran ? (typeof app.kehadiran === 'string' ? JSON.parse(app.kehadiran) : app.kehadiran) : {};
        if (typeof attendanceMap !== 'object') attendanceMap = {};
      } catch (err) {
        attendanceMap = {};
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const timestamp = `${dateStr} pukul ${timeStr} (oleh Admin)`;

      attendanceMap[sessionId] = { status, timestamp };
      const attendanceStr = JSON.stringify(attendanceMap);

      await Promise.all([
        sheetsService.updateAttendance(app.id, attendanceStr),
        firestoreService.updateAttendance(app.id, attendanceStr, app)
      ]);
      loadData();
    } catch (err: any) {
      alert('Gagal mengupdate kehadiran: ' + err.message);
    }
  };

  const openGradingDialog = (app: any) => {
    setGradingApp(app);
    setGradeInput(app.nilai || '');
    setRemarkInput(app.remark || '');
    setPassingStatus(app.statusKelulusan || 'Lulus');
  };

  const handleSaveGrade = async () => {
    if (!gradingApp) return;
    try {
      setActionLoading(true);
      await sheetsService.updateGrade(gradingApp.id, {
        grade: gradeInput,
        remark: remarkInput,
        statusKelulusan: passingStatus
      });
      alert('Penilaian & Status Kelulusan berhasil disimpan!');
      setGradingApp(null);
      loadData();
    } catch (err: any) {
      alert('Gagal menyimpan penilaian: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const parseAttendance = (app: any): Record<string, any> => {
    if (!app || !app.kehadiran) return {};
    try {
      const res = typeof app.kehadiran === 'string' ? JSON.parse(app.kehadiran) : app.kehadiran;
      return typeof res === 'object' ? res : {};
    } catch (e) {
      return {};
    }
  };

  const parseTasks = (app: any): any[] => {
    if (!app || !app.tugas) return [];
    try {
      const res = typeof app.tugas === 'string' ? JSON.parse(app.tugas) : app.tugas;
      return Array.isArray(res) ? res : [];
    } catch (e) {
      return [];
    }
  };

  const filteredApps = applications.filter(app => {
    const matchesQuery = !searchQuery ? true : (
      (app.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.asalDaerah || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.pelatihanAkanDiikuti || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesQuery;
  }).sort((a, b) => {
    const nameA = String(a.nama || a.namaLengkap || '').trim();
    const nameB = String(b.nama || b.namaLengkap || '').trim();
    return nameA.localeCompare(nameB, 'id', { sensitivity: 'base' });
  });

  const isRealAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'sugli' || user?.role === 'kwarda' || user?.role === 'admin_diklat' || user?.role === 'diklat' || (user as any)?.adminType === 'diklat' || user?.email === 'diklat' || user?.email === 'diklat@hwjateng.com';

  const userRolesList = [
    ...(Array.isArray(user?.roles) ? user.roles : []),
    user?.role,
    ...(Array.isArray(user?.pelatihan) ? user.pelatihan : [user?.pelatihan]),
    (user as any)?.golonganPelatih,
    (user as any)?.tingkatan
  ].filter(Boolean).map(r => String(r).toLowerCase().trim());

  const jayaMatahariIdentifiers = [
    'jari1', 'jari2', 'jari 1', 'jari 2',
    'jaya_matahari_1', 'jaya_matahari_2', 'jaya matahari 1', 'jaya matahari 2', 'jaya matahari',
    'pelatih', 'pelatih_nasional', 'pelatih nasional'
  ];

  const isJayaMatahariRole = userRolesList.some(r => 
    jayaMatahariIdentifiers.some(tr => r.includes(tr) || tr.includes(r)) ||
    r.includes('matahari') || r.includes('jari')
  );

  const userEmailStr = (user?.email || '').toLowerCase().trim();
  const userNameStr = (user?.namaLengkap || user?.nama || (user as any)?.name || '').toLowerCase().trim();
  const userNbmStr = ((user as any)?.nbm || (user as any)?.noNbm || (user as any)?.ktaNumber || (user as any)?.nomorKTA || '').toLowerCase().trim();

  const isAssignedTrainerInAnyActivity = (Array.isArray(trainingActivities) ? trainingActivities : []).some((act: any) => {
    if (!act) return false;
    const parseList = (val: any) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && val.trim()) return val.split(/[,;]/).map((s: string) => s.trim());
      return [];
    };
    const pelatihList = parseList(act.pelatih);
    const asistenList = parseList(act.asistenPelatih);
    const allTrainers = [...pelatihList, ...asistenList].map((s: string) => String(s).toLowerCase().trim());

    return allTrainers.some((t: string) => {
      if (!t) return false;
      if (userNameStr && (t.includes(userNameStr) || userNameStr.includes(t))) return true;
      if (userNbmStr && userNbmStr.length >= 4 && t.includes(userNbmStr)) return true;
      if (userEmailStr && userEmailStr.length >= 4 && t.includes(userEmailStr.split('@')[0])) return true;
      const nameWords = userNameStr.split(/\s+/).filter(w => w.length >= 3);
      if (nameWords.length > 0) {
        const matchingWords = nameWords.filter(w => t.includes(w) || w.includes(t));
        if (nameWords.length >= 2 && matchingWords.length >= 2) return true;
        if (nameWords.length === 1 && matchingWords.length === 1 && nameWords[0].length >= 4) return true;
      }
      return false;
    });
  });

  // Mode Anggota and Mode Pelatih switcher ONLY appears for Jaya Matahari members who are appointed as trainers in an activity (NOT admin, NOT regular members)
  const isAppointedJayaMatahariTrainer = !isRealAdmin && isJayaMatahariRole && isAssignedTrainerInAnyActivity;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-hw-green transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          Kembali
        </button>

        {isAppointedJayaMatahariTrainer && (
          <div className="bg-gray-100 p-1 rounded-2xl flex items-center border border-gray-200/60 shadow-xs">
            <button
              onClick={() => setPerspective('peserta')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                perspective === 'peserta' ? 'bg-white text-hw-green shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Mode Anggota
            </button>
            <button
              onClick={() => navigate('/admin?tab=pelatihan')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 bg-hw-green text-white shadow-xs hover:bg-emerald-700`}
            >
              <GraduationCap size={13} />
              Mode Pelatih
            </button>
          </div>
        )}
      </div>

      {/* Hero Header Card */}
      <div className="flex flex-col gap-2 bg-gradient-to-r from-emerald-700 via-teal-600 to-sky-600 p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
          <GraduationCap size={180} />
        </div>

        <div className="flex items-center gap-2">
          <GraduationCap className="text-emerald-200 animate-pulse" size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100 bg-white/10 px-3 py-1 rounded-full border border-white/20">
            Satu HW Training Portal
          </span>
        </div>

        <h2 className="text-2xl font-black text-white leading-tight font-display">
          Pelatihan Kepanduan HW Jawa Tengah
        </h2>
        <p className="text-xs text-emerald-100 font-medium max-w-xl leading-relaxed">
          Daftar kegiatan pelatihan resmi HW Jateng. Setelah terverifikasi sebagai peserta, Anda dapat mengakses materi, absensi per sesi, tugas tim pelatih, dan mengunduh piagam kelulusan.
        </p>
      </div>

      {/* Main View Switcher */}
      {perspective === 'peserta' ? (
        /* ========================================================================= */
        /* MODE ANGGOTA: DAFTAR KEGIATAN & PORTAL KEBUTUHAN PELATIHAN                */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Pengelolaan Pelatihan Ditugaskan Card (Hanya muncul jika user Role Jaya Matahari 1 yang ditugaskan sebagai Tim Pelatih) */}
          {(() => {
            const userRolesList = [
              ...(Array.isArray(user?.roles) ? user.roles : []),
              user?.role,
              ...(Array.isArray(user?.pelatihan) ? user.pelatihan : [user?.pelatihan]),
              (user as any)?.golonganPelatih,
              (user as any)?.tingkatan
            ].filter(Boolean).map(r => String(r).toLowerCase().trim());

            // Check if user has Jaya Matahari 1 / Pelatih Nasional role
            const isJayaMatahari1 = userRolesList.some(r => 
              r === 'jari1' || r === 'jari 1' || r === 'jaya_matahari_1' || r === 'jaya matahari 1' || 
              r.includes('matahari') || r === 'pelatih_nasional' || r === 'pelatih nasional'
            );

            const userEmail = (user?.email || '').toLowerCase().trim();
            const userName = (user?.namaLengkap || user?.nama || (user as any)?.name || '').toLowerCase().trim();
            const userNbm = ((user as any)?.nbm || (user as any)?.noNbm || (user as any)?.ktaNumber || (user as any)?.nomorKTA || '').toLowerCase().trim();

            const assignedActs = (trainingActivities || []).filter((act: any) => {
              if (!act) return false;
              const parseList = (val: any) => {
                if (Array.isArray(val)) return val;
                if (typeof val === 'string' && val.trim()) return val.split(/[,;]/).map((s: string) => s.trim());
                return [];
              };
              const pelatihList = parseList(act.pelatih);
              const asistenList = parseList(act.asistenPelatih);
              const allTrainers = [...pelatihList, ...asistenList].map((s: string) => String(s).toLowerCase().trim());

              return allTrainers.some(t => {
                if (!t) return false;
                if (userName && (t.includes(userName) || userName.includes(t))) return true;
                if (userNbm && userNbm.length >= 4 && t.includes(userNbm)) return true;
                if (userEmail && userEmail.length >= 4) {
                  const prefix = userEmail.split('@')[0];
                  if (prefix && prefix.length >= 3 && t.includes(prefix)) return true;
                }
                const nameWords = userName.split(/\s+/).filter(w => w.length >= 3);
                if (nameWords.length > 0) {
                  const matchingWords = nameWords.filter(w => t.includes(w) || w.includes(t));
                  if (nameWords.length >= 2 && matchingWords.length >= 2) return true;
                  if (nameWords.length === 1 && matchingWords.length === 1 && nameWords[0].length >= 4) return true;
                }
                return false;
              });
            });

            // Sesuai koreksi: Menu ini hanya muncul di Role Jaya Matahari 1 yang diangkat sebagai Tim Pelatih Pelatihan, bukan di dasbor pelatihan peserta
            const showTrainerCard = isJayaMatahari1 && assignedActs.length > 0;

            if (!showTrainerCard) return null;

            return (
              <div className="bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 text-white rounded-[2rem] p-5 shadow-xl shadow-orange-500/20 border border-amber-300/40 relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-100 font-black text-2xl shadow-inner shrink-0">
                      🎓
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 bg-amber-300 text-amber-950 font-black text-[9px] uppercase tracking-wider rounded-md shadow-xs">
                        Pelatih / Asisten Pelatih
                      </span>
                      <h3 className="text-sm sm:text-base font-black tracking-tight font-display mt-0.5 leading-tight">
                        Pengelolaan Pelatihan Ditugaskan
                      </h3>
                    </div>
                  </div>
                  <Link 
                    to="/admin?tab=pelatihan"
                    className="px-3.5 py-2 bg-white text-amber-900 rounded-xl text-xs font-black hover:bg-amber-50 transition-all shadow-md active:scale-95 flex items-center gap-1 shrink-0"
                  >
                    Buka Kelola <ChevronRight size={14} />
                  </Link>
                </div>

                <p className="text-xs text-amber-100 font-medium leading-relaxed">
                  Sebagai Pelatih/Asisten Pelatih, Anda memiliki akses untuk mengelola peserta, presensi sesi, penugasan, penilaian, dan kelulusan pelatihan yang ditugaskan kepada Anda.
                </p>

                {assignedActs.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-white/20">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-200">Kegiatan Ditugaskan:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {assignedActs.map((act: any, idx: number) => (
                        <span key={idx} className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-xl text-[11px] font-bold border border-white/20 text-white flex items-center gap-1">
                          📍 {act.namaKegiatan || act.jenisPelatihan}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Access Menu Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <Link 
                    to="/admin?tab=pelatihan" 
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-xs border border-white/15 flex flex-col items-center text-center transition-all group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">👥</span>
                    <span className="text-[9px] font-black uppercase tracking-wider mt-1 text-amber-100">1. Data Peserta</span>
                  </Link>
                  <Link 
                    to="/admin?tab=pelatihan" 
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-xs border border-white/15 flex flex-col items-center text-center transition-all group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">📝</span>
                    <span className="text-[9px] font-black uppercase tracking-wider mt-1 text-amber-100">2. Presensi Sesi</span>
                  </Link>
                  <Link 
                    to="/admin?tab=pelatihan" 
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-xs border border-white/15 flex flex-col items-center text-center transition-all group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">📑</span>
                    <span className="text-[9px] font-black uppercase tracking-wider mt-1 text-amber-100">3. Penugasan</span>
                  </Link>
                  <Link 
                    to="/admin?tab=pelatihan" 
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-xs border border-white/15 flex flex-col items-center text-center transition-all group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">⭐</span>
                    <span className="text-[9px] font-black uppercase tracking-wider mt-1 text-amber-100">4. Penilaian</span>
                  </Link>
                </div>
              </div>
            );
          })()}

          {(!selectedActivity || viewOtherTrainings) ? (
            /* --------------------------------------------------------------------- */
            /* MODE A: DAFTAR KEGIATAN PELATIHAN YANG MASIH DIBUKA                   */
            /* --------------------------------------------------------------------- */
            <div className="space-y-5 animate-fade-in">
              {/* Back to Active Training Portal Banner (if registered participant is browsing other trainings) */}
              {approvedUserApps.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-800 via-hw-green to-teal-800 text-white p-4 sm:p-5 rounded-[2rem] shadow-md border border-emerald-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/20 backdrop-blur-md text-amber-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                      <CheckCircle2 size={12} className="text-amber-300" /> PESERTA AKTIF TERDAFTAR
                    </span>
                    <h4 className="font-display font-black text-white text-sm sm:text-base">
                      Anda Terdaftar di: {approvedUserApps.map(a => a.pelatihanAkanDiikuti || 'Pelatihan HW').join(', ')}
                    </h4>
                    <p className="text-[11px] text-emerald-100 font-medium">
                      Akses seluruh panel presensi, materi modul, tugas mandiri, dan piagam kelulusan Anda di Dasbor Pelatihan.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setViewOtherTrainings(false);
                      openApprovedPortal(approvedUserApps[0], 'materi');
                    }}
                    className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md hover:scale-[1.02] cursor-pointer self-start sm:self-center shrink-0 flex items-center gap-1.5"
                  >
                    <span>Buka Dasbor Pelatihan Saya</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}

              <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-hw-green" size={20} />
                      <h3 className="font-display font-black text-gray-800 text-base uppercase tracking-wider">
                        {approvedUserApps.length > 0 ? 'JADWAL PELATIHAN LAIN YANG MASIH DIBUKA' : 'INFORMASI & JADWAL PELATIHAN HW JATENG'}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-medium">
                      {approvedUserApps.length > 0 
                        ? 'Daftar jenis kegiatan pelatihan resmi HW Jawa Tengah yang saat ini membuka pendaftaran peserta baru.'
                        : 'Berikut informasi jenis pelatihan resmi HW Jawa Tengah yang sedang membuka pendaftaran. Silakan pilih kegiatan untuk mendaftar.'}
                    </p>
                  </div>
                  <span className="text-[10px] font-black bg-hw-green/10 text-hw-green px-3 py-1.5 rounded-full uppercase self-start sm:self-center">
                    {trainingActivities.filter(act => act.status !== 'Tutup').length} Pelatihan Dibuka
                  </span>
                </div>

                {/* List of Open Training Activities */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Loader2 className="animate-spin text-hw-green" size={28} />
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Memuat kegiatan pelatihan...</p>
                  </div>
                ) : trainingActivities.filter(act => act.status !== 'Tutup').length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {trainingActivities
                      .filter(act => act.status !== 'Tutup')
                      .map((act) => {
                        const { isVerified, userApplication } = isUserVerifiedForActivity(act.jenisPelatihan);
                        const rawImg = act.gambarUrl || act.imageUrl || act.gambar || act.posterUrl || act.coverImage || act.thumbnailUrl;
                        const img = rawImg ? (getDriveDirectLink(rawImg) || rawImg) : '';

                        return (
                          <div 
                            key={act.id}
                            className={`p-5 rounded-[2rem] border transition-all space-y-3.5 relative overflow-hidden ${
                              isVerified 
                                ? 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 border-emerald-200 shadow-md' 
                                : 'bg-white hover:bg-gray-50/80 border-gray-150/80 shadow-xs'
                            }`}
                          >
                            {/* Thumbnail / Poster (Same size as Kegiatan) */}
                            {img && (
                              <div className="h-44 sm:h-52 w-full rounded-2xl overflow-hidden bg-gray-100 relative -mt-1 shadow-inner">
                                <img 
                                  src={getCorsSafeUrl(img, act.id) || img} 
                                  alt={act.namaKegiatan} 
                                  loading="lazy"
                                  decoding="async"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover" 
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800';
                                  }}
                                />
                                <div className="absolute top-3 left-3 bg-black/65 backdrop-blur-md text-white text-[9.5px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border border-white/20 shadow-xs">
                                  {act.jenisPelatihan || 'Pelatihan HW'}
                                </div>
                                <span className="absolute top-3 right-3 text-[9.5px] font-black uppercase tracking-wider px-3 py-1 rounded-xl shadow-md backdrop-blur-xs bg-emerald-600 text-white">
                                  Pendaftaran Buka
                                </span>
                              </div>
                            )}

                            {/* Card Header Tag (if no thumbnail) */}
                            {!img && (
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-emerald-700 text-white shadow-xs">
                                    {act.jenisPelatihan || 'Pelatihan Jaya Melati'}
                                  </span>
                                  <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                                    Pendaftaran Buka
                                  </span>
                                </div>

                                {isVerified && (
                                  <span className="text-[9.5px] font-black bg-emerald-500 text-white px-3 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1 animate-pulse">
                                    <CheckCircle2 size={12} /> Peserta Terverifikasi
                                  </span>
                                )}
                              </div>
                            )}

                            {img && isVerified && (
                              <div className="flex items-center justify-end">
                                <span className="text-[9.5px] font-black bg-emerald-500 text-white px-3 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1 animate-pulse">
                                  <CheckCircle2 size={12} /> Peserta Terverifikasi
                                </span>
                              </div>
                            )}

                            {/* Activity Title */}
                            <div>
                              <h4 className="font-display font-black text-gray-850 text-base leading-snug">
                                {act.namaKegiatan}
                              </h4>
                              {act.deskripsi && (
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                  {act.deskripsi}
                                </p>
                              )}
                            </div>

                            {/* Location, Date, Cost & Account Metadata */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 font-medium">
                              <div className="flex items-center gap-2 bg-gray-50/80 px-3 py-2 rounded-xl border border-gray-100">
                                <MapPin size={14} className="text-hw-green shrink-0" />
                                <span className="truncate">{act.lokasiPelatihan || 'Lokasi Pusdiklat HW'}</span>
                              </div>
                              <div className="flex items-center gap-2 bg-gray-50/80 px-3 py-2 rounded-xl border border-gray-100">
                                <Calendar size={14} className="text-hw-green shrink-0" />
                                <span className="truncate">{act.tanggalPelatihan || 'Jadwal Reguler Kwarwil HW'}</span>
                              </div>
                              <div className="flex items-center gap-2 bg-emerald-50/60 px-3 py-2 rounded-xl border border-emerald-100 text-emerald-900">
                                <span className="text-xs font-bold">💰 Biaya:</span>
                                <span className="font-extrabold text-emerald-950">{act.biayaPelatihan || 'Rp 50.000'}</span>
                              </div>
                              <div className="flex items-center gap-2 bg-emerald-50/60 px-3 py-2 rounded-xl border border-emerald-100 text-emerald-900">
                                <span className="text-xs font-bold">🏦 Rekening:</span>
                                <span className="truncate text-[11px] font-mono">{act.rekeningPembiayaan || 'Bank BSI 7307427448'}</span>
                              </div>
                            </div>

                            {/* Status & Tagihan Details for Member */}
                            {userApplication && !isVerified && (
                              <div className="bg-amber-50/90 p-4 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-2.5 shadow-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-[10px] uppercase tracking-wider text-amber-800 flex items-center gap-1">
                                    <CreditCard size={13} className="text-amber-700" />
                                    <span>Tagihan & Status Pendaftaran Anda</span>
                                  </span>
                                  <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                    userApplication.status === 'pending' ? 'bg-amber-200 text-amber-900 border border-amber-300' : 'bg-red-200 text-red-900'
                                  }`}>
                                    {userApplication.status === 'pending' ? 'Menunggu Verifikasi Admin' : 'Ditolak'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-amber-800 leading-relaxed">
                                  Pendaftaran dikirim pada <strong>{new Date(userApplication.tanggalAjuan || Date.now()).toLocaleDateString('id-ID')}</strong>. Silahkan lakukan transfer pembiayaan untuk memverifikasi kepesertaan Anda:
                                </p>
                                
                                <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1 text-gray-800">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-gray-500 font-medium">Biaya Pelatihan:</span>
                                    <span className="font-black text-emerald-700">{userApplication.biayaPelatihan || act.biayaPelatihan || 'Rp 50.000'}</span>
                                  </div>
                                  <div className="flex justify-between text-[11px] pt-1 border-t border-gray-100">
                                    <span className="text-gray-500 font-medium">Rekening Tujuan:</span>
                                    <span className="font-bold text-gray-900 text-right">{userApplication.rekeningPembiayaan || act.rekeningPembiayaan || 'Bank BSI 7307427448 a.n. Kwarwil HW Jateng'}</span>
                                  </div>
                                </div>

                                <a
                                  href={`https://wa.me/${String(userApplication.noWhatsappPanitia || act.noWhatsappPanitia || '089688754000').replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Assalamu'alaikum Panitia, saya ${userApplication.nama || user?.namaLengkap} telah mendaftar pelatihan ${act.namaKegiatan}. Berikut bukti konfirmasi transfer pembiayaan (${userApplication.biayaPelatihan || act.biayaPelatihan || 'Rp 50.000'}). Mohon konfirmasinya. Terima kasih.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
                                >
                                  <MessageCircle size={15} />
                                  <span>Konfirmasi Transfer via WhatsApp Panitia ({userApplication.noWhatsappPanitia || act.noWhatsappPanitia || '089688754000'})</span>
                                </a>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
                              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                {isVerified ? 'Akses Kebutuhan Pelatihan Terbuka' : 'Syarat & Formulir Pendaftaran'}
                              </div>

                              <div className="flex gap-2">
                                {isVerified ? (
                                  <button
                                    onClick={() => {
                                      setViewOtherTrainings(false);
                                      setSelectedActivity(act);
                                      if (['Jati 1', 'Jati 2', 'Jari 1'].includes(act.jenisPelatihan)) {
                                        setSelectedLevel(act.jenisPelatihan as any);
                                      }
                                      setActiveTab('beranda');
                                    }}
                                    className="px-5 py-2.5 bg-hw-green hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-2 uppercase tracking-wider transition-all shadow-md hover:scale-[1.02] cursor-pointer"
                                  >
                                    <span>Buka Dasbor Pelatihan Saya</span>
                                    <ChevronRight size={16} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => navigate('/daftar-pelatihan', { state: { activity: act } })}
                                    className="px-4 py-2.5 bg-hw-green hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 uppercase tracking-wider transition-all shadow-xs hover:scale-[1.02] cursor-pointer"
                                  >
                                    <span>Daftar Kegiatan Ini</span>
                                    <ChevronRight size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                    <GraduationCap className="mx-auto text-gray-400" size={32} />
                    <p className="text-xs text-gray-600 font-bold">Saat ini belum ada jadwal pelatihan baru yang sedang dibuka.</p>
                    <p className="text-[10px] text-gray-400">Pengurus HW Jateng akan mengumumkan jadwal kegiatan pelatihan berikutnya di portal ini.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* --------------------------------------------------------------------- */
            /* MODE B: DASBOR PELATIHAN PESERTA AKTIF (PANEL PRESENSI, TUGAS, DLL)  */
            /* --------------------------------------------------------------------- */
            <div className="space-y-6 animate-fade-in">
              {/* Participant Dashboard Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  {approvedUserApps.length > 1 ? (
                    <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
                      {approvedUserApps.map((app: any) => {
                        const isThisSelected = selectedActivity?.jenisPelatihan === app.pelatihanAkanDiikuti || selectedLevel === app.pelatihanAkanDiikuti;
                        return (
                          <button
                            key={app.id}
                            onClick={() => openApprovedPortal(app, activeTab)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                              isThisSelected
                                ? 'bg-hw-green text-white shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            {app.pelatihanAkanDiikuti || 'Pelatihan'}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[10px] font-black bg-emerald-500 text-white px-3 py-1.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                      <CheckCircle2 size={13} /> Peserta Aktif Terverifikasi
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setViewOtherTrainings(true);
                  }}
                  className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer self-start sm:self-center border border-gray-200"
                >
                  <Calendar size={15} className="text-hw-green" />
                  <span>Jadwal Pelatihan Lain yang Dibuka</span>
                </button>
              </div>

              {/* Verified Activity Header Summary */}
              {(() => {
                const rawImg = selectedActivity.gambarUrl || selectedActivity.imageUrl || selectedActivity.gambar || selectedActivity.posterUrl || selectedActivity.coverImage || selectedActivity.thumbnailUrl;
                const img = rawImg ? (getDriveDirectLink(rawImg) || rawImg) : '';

                return (
                  <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-3 text-left overflow-hidden relative">
                    {img && (
                      <div className="h-36 sm:h-44 w-full rounded-2xl overflow-hidden bg-gray-100 relative -mt-1 shadow-inner">
                        <img 
                          src={getCorsSafeUrl(img, selectedActivity.id) || img} 
                          alt={selectedActivity.namaKegiatan} 
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800';
                          }}
                        />
                        <div className="absolute top-3 left-3 bg-black/65 backdrop-blur-md text-white text-[9.5px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border border-white/20 shadow-xs">
                          {selectedActivity.jenisPelatihan || selectedLevel}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-emerald-700 text-white">
                        {selectedActivity.jenisPelatihan || selectedLevel}
                      </span>
                      {userApp?.statusKelulusan === 'Lulus' && (
                        <span className="text-[10px] font-black bg-amber-500 text-white px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
                          <Sparkles size={12} /> LULUS PELATIHAN 🎉
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-black text-gray-800 text-lg sm:text-xl">
                      {selectedActivity.namaKegiatan}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      {selectedActivity.lokasiPelatihan || 'Pusdiklat HW'} • {selectedActivity.tanggalPelatihan || 'Jadwal Pelatihan'}
                    </p>
                  </div>
                );
              })()}

              {/* PARTICIPANT QUICK RECAP BANNER: ATTENDANCE STATUS & PRE/POST TEST SCORES */}
              {(() => {
                const attendanceMap = parseAttendance(userApp);
                const totalCurriculumSessions = program.sessions.length;
                const attendedSessionsCount = program.sessions.filter((ses) => {
                  const st = getAttendanceStatus(attendanceMap, ses.id);
                  return st === 'hadir';
                }).length;
                const izinCount = program.sessions.filter((ses) => getAttendanceStatus(attendanceMap, ses.id) === 'izin').length;
                const absenCount = program.sessions.filter((ses) => getAttendanceStatus(attendanceMap, ses.id) === 'absen').length;
                const recordedSessionsCount = attendedSessionsCount + izinCount + absenCount;
                const unrecordedSessionsCount = Math.max(0, totalCurriculumSessions - recordedSessionsCount);
                const attendancePercentage = totalCurriculumSessions > 0 
                  ? Math.round((attendedSessionsCount / totalCurriculumSessions) * 100) 
                  : 0;

                const hasPreScore = userApp && userApp.preTestScore !== undefined && userApp.preTestScore !== null && userApp.preTestScore !== '';
                const hasPostScore = userApp && userApp.postTestScore !== undefined && userApp.postTestScore !== null && userApp.postTestScore !== '';
                const preScore = hasPreScore ? Number(userApp.preTestScore) : null;
                const postScore = hasPostScore ? Number(userApp.postTestScore) : null;

                return (
                  <div className="bg-white p-4 sm:p-5 md:p-6 rounded-3xl border border-gray-150 shadow-xs space-y-4 text-left w-full overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-850 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Dasbor Rekap Akademik & Kehadiran Peserta
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold">• Real-time Sync</span>
                        </div>
                        <h4 className="text-base sm:text-lg font-black text-gray-850 font-display tracking-tight leading-snug">
                          Ringkasan Status Kehadiran & Rekap Nilai Ujian
                        </h4>
                      </div>
                      {unrecordedSessionsCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-bold self-start sm:self-auto shrink-0 shadow-2xs">
                          <AlertCircle size={14} className="text-amber-600 shrink-0" />
                          <span>{unrecordedSessionsCount} Sesi Belum Presensi</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-full text-xs font-bold self-start sm:self-auto shrink-0 shadow-2xs">
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                          <span>Presensi Lengkap ({totalCurriculumSessions}/{totalCurriculumSessions})</span>
                        </span>
                      )}
                    </div>

                    {/* 4 Responsive Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-3.5">
                      
                      {/* CARD 1: STATUS PRESENSI */}
                      <div 
                        onClick={() => setActiveTab('presensi')}
                        className="bg-gradient-to-br from-emerald-50/90 to-teal-50/70 p-4 rounded-2xl border border-emerald-200/90 hover:border-emerald-400 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group flex flex-col justify-between min-w-0 overflow-hidden min-h-[145px]"
                      >
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                            <span className="text-xs font-black uppercase tracking-wider text-emerald-950 truncate">Kehadiran</span>
                          </div>
                          <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform shrink-0">
                            <CheckCircle2 size={15} />
                          </div>
                        </div>
                        
                        <div className="my-2 min-w-0">
                          <div className="text-xl sm:text-2xl font-black text-emerald-950 font-display tracking-tight leading-none truncate">
                            {attendancePercentage}%
                          </div>
                          <p className="text-[11px] sm:text-xs font-semibold text-emerald-850/90 mt-1 leading-snug truncate">
                            {attendedSessionsCount} Hadir • {recordedSessionsCount}/{totalCurriculumSessions} Sesi
                          </p>
                        </div>

                        <div className="pt-2 mt-auto border-t border-emerald-200/70 flex items-center justify-between gap-1 text-[11px] font-bold min-w-0">
                          <span className={`truncate flex-1 text-left ${unrecordedSessionsCount > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
                            {unrecordedSessionsCount > 0 ? `⚠️ ${unrecordedSessionsCount} Belum Presensi` : '✓ Lengkap'}
                          </span>
                          <span className="text-emerald-900 group-hover:underline shrink-0 flex items-center gap-1 font-extrabold">
                            Buka →
                          </span>
                        </div>
                      </div>

                      {/* CARD 2: HASIL PRE TEST */}
                      <div 
                        onClick={() => setActiveTab('tugas')}
                        className="bg-gradient-to-br from-teal-50/90 to-cyan-50/70 p-4 rounded-2xl border border-teal-200/90 hover:border-teal-400 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group flex flex-col justify-between min-w-0 overflow-hidden min-h-[145px]"
                      >
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                            <span className="text-xs font-black uppercase tracking-wider text-teal-950 truncate">Pre Test</span>
                          </div>
                          <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform shrink-0">
                            <Sparkles size={15} />
                          </div>
                        </div>

                        <div className="my-2 min-w-0">
                          <div className="text-xl sm:text-2xl font-black text-teal-950 font-display tracking-tight leading-none truncate">
                            {hasPreScore ? `${preScore} / 100` : 'Belum Tes'}
                          </div>
                          <p className="text-[11px] sm:text-xs font-semibold text-teal-850/90 mt-1 leading-snug truncate">
                            {hasPreScore ? '✓ Evaluasi Awal Selesai' : 'Evaluasi Awal Kurikulum'}
                          </p>
                        </div>

                        <div className="pt-2 mt-auto border-t border-teal-200/70 flex items-center justify-between gap-1 text-[11px] font-bold min-w-0">
                          <span className={`truncate flex-1 text-left ${hasPreScore ? 'text-teal-800 font-extrabold' : 'text-amber-800'}`}>
                            {hasPreScore ? 'Terekap di Sistem' : 'Belum Selesai'}
                          </span>
                          <span className="text-teal-900 group-hover:underline shrink-0 flex items-center gap-1 font-extrabold">
                            {hasPreScore ? 'Tinjau →' : 'Mulai →'}
                          </span>
                        </div>
                      </div>

                      {/* CARD 3: HASIL POST TEST */}
                      <div 
                        onClick={() => setActiveTab('tugas')}
                        className="bg-gradient-to-br from-blue-50/90 to-indigo-50/70 p-4 rounded-2xl border border-blue-200/90 hover:border-blue-400 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group flex flex-col justify-between min-w-0 overflow-hidden min-h-[145px]"
                      >
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                            <span className="text-xs font-black uppercase tracking-wider text-blue-950 truncate">Post Test</span>
                          </div>
                          <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform shrink-0">
                            <Award size={15} />
                          </div>
                        </div>

                        <div className="my-2 min-w-0">
                          <div className="text-xl sm:text-2xl font-black text-blue-950 font-display tracking-tight leading-none truncate">
                            {hasPostScore ? `${postScore} / 100` : 'Belum Tes'}
                          </div>
                          <p className="text-[11px] sm:text-xs font-semibold text-blue-850/90 mt-1 leading-snug truncate">
                            {hasPostScore ? (postScore! >= 70 ? '✓ Lulus KKM (≥70)' : '⚠️ Di Bawah KKM (≥70)') : 'Syarat Kelulusan Akhir'}
                          </p>
                        </div>

                        <div className="pt-2 mt-auto border-t border-blue-200/70 flex items-center justify-between gap-1 text-[11px] font-bold min-w-0">
                          <span className={`truncate flex-1 text-left ${hasPostScore ? 'text-blue-800 font-extrabold' : 'text-amber-800'}`}>
                            {hasPostScore ? 'Terekap di Sistem' : 'Belum Selesai'}
                          </span>
                          <span className="text-blue-900 group-hover:underline shrink-0 flex items-center gap-1 font-extrabold">
                            {hasPostScore ? 'Tinjau →' : 'Mulai →'}
                          </span>
                        </div>
                      </div>

                      {/* CARD 4: STATUS AKHIR */}
                      <div 
                        onClick={() => setActiveTab('piagam')}
                        className="bg-gradient-to-br from-amber-50/90 to-yellow-50/70 p-4 rounded-2xl border border-amber-200/90 hover:border-amber-400 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group flex flex-col justify-between min-w-0 overflow-hidden min-h-[145px]"
                      >
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">4</span>
                            <span className="text-xs font-black uppercase tracking-wider text-amber-950 truncate">Kelulusan</span>
                          </div>
                          <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform shrink-0">
                            <GraduationCap size={15} />
                          </div>
                        </div>

                        <div className="my-2 min-w-0">
                          <div className="text-base sm:text-lg font-black text-amber-950 font-display tracking-tight leading-tight truncate">
                            {userApp?.statusKelulusan || 'Proses Pelatihan'}
                          </div>
                          <p className="text-[11px] sm:text-xs font-semibold text-amber-900/90 mt-1 leading-snug truncate">
                            {userApp?.nilai ? `Predikat: ${userApp.nilai}` : 'Akumulasi Presensi & Ujian'}
                          </p>
                        </div>

                        <div className="pt-2 mt-auto border-t border-amber-200/70 flex items-center justify-between gap-1 text-[11px] font-bold min-w-0">
                          <span className="text-amber-900 truncate flex-1 text-left">Piagam Pelatihan</span>
                          <span className="text-amber-900 group-hover:underline shrink-0 flex items-center gap-1 font-extrabold">
                            Buka →
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}

              {/* Portal Navigation Tabs: 4 Pure Participant Menus */}
              {(() => {
                const attendanceMap = parseAttendance(userApp);
                const totalCurriculumSessions = program.sessions.length;
                const attendedSessionsCount = program.sessions.filter((ses) => {
                  const st = getAttendanceStatus(attendanceMap, ses.id);
                  return st === 'hadir';
                }).length;
                const attendancePercentage = totalCurriculumSessions > 0 
                  ? Math.round((attendedSessionsCount / totalCurriculumSessions) * 100) 
                  : 0;
                const isPiagamValidated = userApp && (userApp.statusKelulusan === 'Lulus' || userApp.validasiPiagam === true);

                return (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Menu & Fitur Portal Peserta Pelatihan
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                          4 Menu Pelatihan
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { id: 'materi', title: '1. Materi Pelatihan', sub: 'Modul & PDF Ajar', icon: BookOpen, color: 'bg-emerald-600' },
                          { id: 'presensi', title: '2. Presensi', sub: `Kurikulum (${attendancePercentage}%)`, icon: CheckCircle2, color: 'bg-teal-600' },
                          { id: 'tugas', title: '3. Penugasan', sub: 'Pre/Post Test & Pelatih', icon: FileText, color: 'bg-blue-600' },
                          { id: 'piagam', title: '4. Piagam Pelatihan', sub: isPiagamValidated ? 'Sudah Terbit ✓' : 'Menunggu Validasi', icon: Award, color: 'bg-amber-600' }
                        ].map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id as any)}
                              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs flex flex-col justify-between group ${
                                isActive
                                  ? 'bg-gradient-to-br from-emerald-800 via-hw-green to-teal-800 text-white border-emerald-500 ring-2 ring-emerald-400/50 shadow-md scale-[1.02]'
                                  : 'bg-white hover:bg-emerald-50/50 text-gray-800 border-gray-200 hover:border-emerald-300 hover:scale-[1.01]'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black transition-transform group-hover:scale-110 ${
                                  isActive ? 'bg-white text-emerald-950 shadow-xs' : `${tab.color} text-white`
                                }`}>
                                  <Icon size={16} />
                                </div>
                                {isActive && (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-md">
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className={`text-xs font-black uppercase tracking-wider ${isActive ? 'text-white' : 'text-gray-800'}`}>
                                  {tab.title}
                                </div>
                                <div className={`text-[10px] font-medium ${isActive ? 'text-emerald-100' : 'text-gray-400'}`}>
                                  {tab.sub}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* TAB CONTENTS */}
                    <div className="min-h-[300px]">
                      
                      {/* 1. MATERI PELATIHAN TAB */}
                      {activeTab === 'materi' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-left">
                          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">
                                Materi & Modul Pembelajaran {selectedActivity.jenisPelatihan || selectedLevel}
                              </h4>
                              <span className="text-[9px] font-black bg-hw-green/10 text-hw-green px-2.5 py-1 rounded-md uppercase">
                                {materiList.length} Berkas
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">
                              Unduh berkas materi, slide presentasi, dan buku panduan kurikulum resmi yang disediakan oleh Tim Pelatih Hizbul Wathan.
                            </p>
                          </div>

                          {loadingMateri ? (
                            <div className="flex flex-col items-center justify-center py-10 space-y-2 bg-white rounded-3xl border border-gray-100 shadow-sm">
                              <Loader2 className="animate-spin text-hw-green" size={24} />
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest animate-pulse">Memuat berkas materi...</p>
                            </div>
                          ) : materiList.length === 0 ? (
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center text-gray-400 shadow-sm">
                              <FileText size={28} className="mx-auto text-gray-300 mb-2" />
                              <p className="text-xs font-bold">Belum ada berkas materi tambahan yang diunggah untuk tingkat ini.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-3">
                              {materiList.map((item, index) => (
                                <div
                                  key={`materi-item-${item.id}-${index}`}
                                  className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 hover:shadow-sm transition-all flex items-center gap-4 text-left"
                                >
                                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center border border-gray-100">
                                    <img 
                                      src={getCorsSafeUrl(item.coverImage, item.updatedAt || item.id) || 'https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png'} 
                                      alt={item.judul} 
                                      className="w-full h-full object-cover" 
                                    />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-display font-bold text-gray-800 text-xs leading-tight break-words">
                                      {item.judul}
                                    </h5>
                                    <p className="text-gray-400 text-[10px] font-medium mt-1">
                                      Tanggal: {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}
                                    </p>
                                  </div>

                                  <div className="shrink-0 ml-auto">
                                    {item.driveUrl && (
                                      <a 
                                        href={item.driveUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center gap-1.5 px-3 py-2 bg-hw-green/10 text-hw-green hover:bg-hw-green hover:text-white rounded-xl transition-all font-black text-xs uppercase"
                                        title="Unduh Berkas Materi"
                                      >
                                        <Download size={14} />
                                        <span>Unduh</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Ringkasan Informasi & Tata Tertib Pelatihan */}
                          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex items-center gap-2">
                              <ScrollText className="text-hw-green" size={18} />
                              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">
                                Deskripsi & Panduan Pelatihan
                              </h4>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {selectedActivity.deskripsi || program.description}
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* 2. PRESENSI SESUAI MATERI KURIKULUM TAB */}
                      {activeTab === 'presensi' && (() => {
                        const izinCount = program.sessions.filter(ses => getAttendanceStatus(attendanceMap, ses.id) === 'izin').length;
                        const absenCount = program.sessions.filter(ses => getAttendanceStatus(attendanceMap, ses.id) === 'absen').length;
                        const belumCount = totalCurriculumSessions - (attendedSessionsCount + izinCount + absenCount);

                        return (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-left">
                            
                            {/* Rekap Persentase & Otomatisasi Sync Ke Dashboard Admin / Pelatih */}
                            <div className="bg-gradient-to-br from-teal-900 via-emerald-800 to-teal-950 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200 bg-white/10 px-2.5 py-0.5 rounded-full">
                                    Presensi Real-Time Tersinkronisasi
                                  </span>
                                  <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wide mt-1">
                                    Rekap Presensi Materi Kurikulum
                                  </h3>
                                </div>
                                <div className="bg-white/15 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-center sm:text-right shrink-0">
                                  <span className="text-[10px] text-emerald-200 uppercase font-black tracking-wider block">Persentase Kehadiran</span>
                                  <span className="text-2xl font-black text-amber-300 font-display">{attendancePercentage}%</span>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px] font-bold text-emerald-100">
                                  <span>Tingkat Partisipasi Sesi</span>
                                  <span>{attendedSessionsCount} dari {totalCurriculumSessions} Sesi Hadir</span>
                                </div>
                                <div className="w-full bg-black/30 rounded-full h-3.5 p-0.5 border border-white/20 overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
                                    style={{ width: `${Math.min(100, Math.max(0, attendancePercentage))}%` }}
                                  />
                                </div>
                              </div>

                              {/* Grid Stat Presensi */}
                              <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                                <div className="bg-white/10 rounded-xl p-2 border border-white/10">
                                  <span className="text-[9px] font-bold uppercase text-emerald-200 block">Hadir</span>
                                  <span className="text-sm font-black text-white">{attendedSessionsCount}</span>
                                </div>
                                <div className="bg-white/10 rounded-xl p-2 border border-white/10">
                                  <span className="text-[9px] font-bold uppercase text-blue-200 block">Izin</span>
                                  <span className="text-sm font-black text-white">{izinCount}</span>
                                </div>
                                <div className="bg-white/10 rounded-xl p-2 border border-white/10">
                                  <span className="text-[9px] font-bold uppercase text-red-200 block">Tidak Hadir</span>
                                  <span className="text-sm font-black text-white">{absenCount}</span>
                                </div>
                                <div className="bg-white/10 rounded-xl p-2 border border-white/10">
                                  <span className="text-[9px] font-bold uppercase text-gray-300 block">Belum Isi</span>
                                  <span className="text-sm font-black text-white">{belumCount}</span>
                                </div>
                              </div>

                              {/* Highlight Real-time notice */}
                              <div className="bg-black/20 p-3 rounded-2xl border border-white/15 text-[11px] text-emerald-100 flex items-start gap-2 leading-relaxed">
                                <Sparkles size={16} className="text-amber-300 shrink-0 mt-0.5" />
                                <span>
                                  <strong>Otomatis Terekap:</strong> Setiap kali Anda mengisi presensi pada sesi di bawah ini, data presensi dan persentasenya akan <strong>langsung terakumulasi dan muncul di dasbor Admin, Tim Pelatih, dan Asisten Pelatih</strong> untuk evaluasi kelulusan.
                                </span>
                              </div>
                            </div>

                            {/* Daftar Sesi Materi Kurikulum */}
                            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">
                                  Daftar Sesi Materi Kurikulum ({program.sessions.length} Sesi)
                                </h4>
                                <span className="text-[9px] font-black bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md uppercase">
                                  Silabus Lengkap
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">
                                Klik tombol status pada sesi materi yang sedang atau telah Anda ikuti untuk merekam presensi kehadiran mandiri.
                              </p>
                            </div>

                            <div className="space-y-3">
                              {program.sessions.map((ses) => {
                                const status = getAttendanceStatus(attendanceMap, ses.id);
                                const timestamp = getAttendanceTimestamp(attendanceMap, ses.id);
                                const isEditing = activeEditSession === ses.id;
                                
                                return (
                                  <div 
                                    key={ses.id} 
                                    className={`p-4.5 rounded-2xl border transition-all flex flex-col gap-3 text-left ${
                                      status === 'hadir' 
                                        ? 'bg-white border-emerald-200/80 shadow-xs' 
                                        : status === 'izin'
                                          ? 'bg-white border-blue-200/80 shadow-xs'
                                          : status === 'absen'
                                            ? 'bg-white border-rose-200/80 shadow-xs'
                                            : 'bg-amber-50/40 border-amber-200/80 shadow-xs'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[9px] font-black uppercase tracking-widest text-hw-green bg-hw-green/10 px-2 py-0.5 rounded-md">
                                            {ses.id}
                                          </span>
                                          {status === 'belum' && (
                                            <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                              Belum Presensi
                                            </span>
                                          )}
                                        </div>
                                        <h5 className="text-xs font-black text-gray-800 mt-1">{ses.title}</h5>
                                        <p className="text-[11px] text-gray-500 leading-normal">{ses.description}</p>
                                      </div>
                                      
                                      <div className="shrink-0 pt-1 flex items-center gap-1.5">
                                        {status === 'hadir' ? (
                                          <span className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-emerald-600 text-white uppercase flex items-center gap-1.5 shadow-xs">
                                            <Check size={13} /> HADIR (Tercatat)
                                          </span>
                                        ) : status === 'izin' ? (
                                          <span className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-blue-600 text-white uppercase flex items-center gap-1.5 shadow-xs">
                                            <Info size={13} /> IZIN
                                          </span>
                                        ) : status === 'absen' ? (
                                          <span className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-rose-600 text-white uppercase flex items-center gap-1.5 shadow-xs">
                                            <X size={13} /> TIDAK HADIR
                                          </span>
                                        ) : (
                                          <button
                                            onClick={() => setActiveEditSession(ses.id)}
                                            className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white uppercase flex items-center gap-1.5 shadow-xs transition-all cursor-pointer hover:scale-105"
                                          >
                                            <AlertCircle size={13} /> Isi Presensi Sesi Ini
                                          </button>
                                        )}

                                        {!isEditing && status !== 'belum' && (
                                          <button
                                            onClick={() => setActiveEditSession(ses.id)}
                                            className="p-1.5 text-gray-400 hover:text-hw-green hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                                            title="Ubah Presensi"
                                          >
                                            <Pencil size={12} />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {timestamp && (
                                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg w-max font-bold border border-emerald-100">
                                        <Clock size={11} className="text-emerald-600" />
                                        <span>Presensi Tercatat Pada: {timestamp}</span>
                                      </div>
                                    )}

                                    {isEditing && (
                                      <div className="mt-1 pt-3 border-t border-dashed border-gray-200 flex flex-col gap-2">
                                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider">
                                          Pilih Status Kehadiran untuk {ses.id}:
                                        </span>
                                        <div className="grid grid-cols-4 gap-2">
                                          <button
                                            disabled={savingAttendance[ses.id]}
                                            onClick={() => handleUserSubmitAttendance(ses.id, 'hadir')}
                                            className="py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                          >
                                            {savingAttendance[ses.id] ? <Loader2 size={13} className="animate-spin" /> : <><Check size={13} /> Hadir</>}
                                          </button>

                                          <button
                                            disabled={savingAttendance[ses.id]}
                                            onClick={() => handleUserSubmitAttendance(ses.id, 'izin')}
                                            className="py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                          >
                                            <Info size={13} /> Izin
                                          </button>

                                          <button
                                            disabled={savingAttendance[ses.id]}
                                            onClick={() => handleUserSubmitAttendance(ses.id, 'absen')}
                                            className="py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                          >
                                            <X size={13} /> Tidak Hadir
                                          </button>

                                          <button
                                            onClick={() => setActiveEditSession(null)}
                                            className="py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                                          >
                                            Batal
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        );
                      })()}

                      {/* 3. PENUGASAN (PRE-TEST, POST-TEST & TUGAS TAMBAHAN DARI PELATIH) TAB */}
                      {activeTab === 'tugas' && (() => {
                        const myTasks = assignedTasks.filter(t => 
                          t.level === selectedLevel || 
                          normalizeLevelCode(t.level) === normalizeLevelCode(selectedActivity?.jenisPelatihan || selectedLevel) ||
                          (userApp?.pelatihanAkanDiikuti && normalizeLevelCode(t.level) === normalizeLevelCode(userApp.pelatihanAkanDiikuti))
                        );
                        const preSettings = parseTestScheduleSettings(trainingSettings?.preTestSettings, DEFAULT_PRE_TEST_SETTINGS);
                        const postSettings = parseTestScheduleSettings(trainingSettings?.postTestSettings, DEFAULT_POST_TEST_SETTINGS);

                        const preTestStatus = isTestCurrentlyOpen(preSettings, DEFAULT_PRE_TEST_SETTINGS);
                        const postTestStatus = isTestCurrentlyOpen(postSettings, DEFAULT_POST_TEST_SETTINGS);

                        const isPreOpen = !!preTestStatus.isOpen;
                        const isPostOpen = !!postTestStatus.isOpen;

                        const displayPreScore = (() => {
                          if (userApp?.preTestScore !== undefined && userApp?.preTestScore !== null && userApp?.preTestScore !== '') {
                            return Number(userApp.preTestScore);
                          }
                          if (userApp?.preTestData) {
                            try {
                              const p = typeof userApp.preTestData === 'string' ? JSON.parse(userApp.preTestData) : userApp.preTestData;
                              if (p && p.score !== undefined && p.score !== null && p.score !== '') return Number(p.score);
                            } catch(e) {}
                          }
                          return null;
                        })();

                        const displayPostScore = (() => {
                          if (userApp?.postTestScore !== undefined && userApp?.postTestScore !== null && userApp?.postTestScore !== '') {
                            return Number(userApp.postTestScore);
                          }
                          if (userApp?.postTestData) {
                            try {
                              const p = typeof userApp.postTestData === 'string' ? JSON.parse(userApp.postTestData) : userApp.postTestData;
                              if (p && p.score !== undefined && p.score !== null && p.score !== '') return Number(p.score);
                            } catch(e) {}
                          }
                          return null;
                        })();

                        const hasDonePre = displayPreScore !== null;
                        const hasDonePost = displayPostScore !== null;

                        return (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 text-left">
                            
                            {/* PENUGASAN UTAMA: PRE TEST & POST TEST */}
                            <div className="bg-gradient-to-br from-emerald-800 via-hw-green to-teal-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                                    <Sparkles size={20} className="text-amber-300" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200 bg-white/10 px-2 py-0.5 rounded-full">
                                      Evaluasi Akademik & Kemuhammadiyahan
                                    </span>
                                    <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                                      Penugasan Wajib: Pre Test & Post Test
                                    </h3>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                
                                {/* PRE TEST CARD */}
                                <div className="bg-white text-gray-800 p-5 rounded-2xl shadow-md border border-emerald-100 flex flex-col justify-between space-y-4">
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                                        1. Pre Test (Awal)
                                      </span>
                                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                        hasDonePre 
                                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                          : isPreOpen 
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' 
                                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                                      }`}>
                                        {hasDonePre ? 'Selesai (Akses Ditutup) ✓' : isPreOpen ? 'Sedang Dibuka' : 'Akses Ditutup Panitia'}
                                      </span>
                                    </div>

                                    <h4 className="text-sm font-black text-gray-800">
                                      {preSettings.title || 'Pre Test Kepanduan Hizbul Wathan'}
                                    </h4>
                                    <p className="text-[11px] text-gray-500 line-clamp-2">
                                      {preSettings.description || 'Tes awal untuk mengukur pemahaman materi dasar Kepanduan Hizbul Wathan dan Kemuhammadiyahan.'}
                                    </p>

                                    <div className="bg-gray-50 p-2.5 rounded-xl text-[11px] text-gray-600 space-y-1 font-medium border border-gray-150">
                                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                                        <Clock size={12} /> Durasi: {preSettings.durationMinutes || 60} Menit • 50 Butir Soal
                                      </div>
                                      <div className="flex items-center gap-1.5 text-gray-500 text-[10px]">
                                        <Calendar size={11} /> 
                                        {preSettings.mode === 'manual' ? (
                                          <span>Status: {preSettings.isOpen ? 'Dibuka oleh Panitia' : 'Ditutup oleh Panitia'}</span>
                                        ) : (
                                          <span>Jadwal: {preSettings.startDate || '-'} ({preSettings.startTime || '08:00'}) s/d {preSettings.endDate || '-'} ({preSettings.endTime || '23:59'})</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* STATUS NOTICE BOX */}
                                    {hasDonePre ? (
                                      <div className="bg-emerald-50/80 p-2.5 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2 border border-emerald-200 font-medium">
                                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                        <span>Pre Test telah selesai dikerjakan. Akses pengerjaan ulang otomatis ditutup.</span>
                                      </div>
                                    ) : !isPreOpen ? (
                                      <div className="bg-rose-50/80 p-2.5 rounded-xl text-[11px] text-rose-800 flex items-center gap-2 border border-rose-200 font-medium">
                                        <AlertCircle size={14} className="text-rose-600 shrink-0" />
                                        <span>{preTestStatus.statusMessage || 'Akses Pre Test sedang ditutup oleh Panitia / Tim Pelatih.'}</span>
                                      </div>
                                    ) : null}
                                  </div>

                                  {/* PRE TEST ACTION & SCORE */}
                                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                                    {hasDonePre ? (
                                      <>
                                        <div>
                                          <span className="text-[10px] font-bold text-gray-400 uppercase">Nilai Pre Test:</span>
                                          <div className="text-xl font-black text-emerald-700 font-display">
                                            {displayPreScore} / 100
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setActiveTestModal('pre_test')}
                                          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                                        >
                                          <FileText size={14} /> Tinjau Lembar Hasil
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!isPreOpen) {
                                            alert(preTestStatus.statusMessage || 'Akses Pre Test sedang ditutup oleh Panitia / Tim Pelatih.');
                                            return;
                                          }
                                          setActiveTestModal('pre_test');
                                        }}
                                        disabled={!isPreOpen}
                                        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                          isPreOpen
                                            ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md hover:scale-[1.01] cursor-pointer font-black'
                                            : 'bg-gray-150 text-gray-400 border border-gray-200 cursor-not-allowed font-bold'
                                        }`}
                                      >
                                        <ClipboardList size={15} />
                                        {isPreOpen ? 'Mulai Kerjakan Pre Test' : (preTestStatus.statusMessage || 'Akses Pre Test Ditutup')}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* POST TEST CARD */}
                                <div className="bg-white text-gray-800 p-5 rounded-2xl shadow-md border border-teal-100 flex flex-col justify-between space-y-4">
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full">
                                        2. Post Test (Akhir)
                                      </span>
                                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                        hasDonePost 
                                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                          : isPostOpen 
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' 
                                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                                      }`}>
                                        {hasDonePost ? 'Selesai (Akses Ditutup) ✓' : isPostOpen ? 'Sedang Dibuka' : 'Akses Ditutup Panitia'}
                                      </span>
                                    </div>

                                    <h4 className="text-sm font-black text-gray-800">
                                      {postSettings.title || 'Post Test Kelulusan Pelatihan HW'}
                                    </h4>
                                    <p className="text-[11px] text-gray-500 line-clamp-2">
                                      {postSettings.description || 'Evaluasi akhir materi pelatihan Jaya Melati untuk syarat kelulusan dan penerbitan sertifikat piagam.'}
                                    </p>

                                    <div className="bg-gray-50 p-2.5 rounded-xl text-[11px] text-gray-600 space-y-1 font-medium border border-gray-150">
                                      <div className="flex items-center gap-1.5 text-teal-800 font-bold">
                                        <Clock size={12} /> Durasi: {postSettings.durationMinutes || 60} Menit • 50 Butir Soal
                                      </div>
                                      <div className="flex items-center gap-1.5 text-gray-500 text-[10px]">
                                        <Calendar size={11} /> 
                                        {postSettings.mode === 'manual' ? (
                                          <span>Status: {postSettings.isOpen ? 'Dibuka oleh Panitia' : 'Ditutup oleh Panitia'}</span>
                                        ) : (
                                          <span>Jadwal: {postSettings.startDate || '-'} ({postSettings.startTime || '08:00'}) s/d {postSettings.endDate || '-'} ({postSettings.endTime || '23:59'})</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* STATUS NOTICE BOX */}
                                    {hasDonePost ? (
                                      <div className="bg-emerald-50/80 p-2.5 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2 border border-emerald-200 font-medium">
                                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                        <span>Post Test telah selesai dikerjakan. Akses pengerjaan ulang otomatis ditutup.</span>
                                      </div>
                                    ) : !isPostOpen ? (
                                      <div className="bg-rose-50/80 p-2.5 rounded-xl text-[11px] text-rose-800 flex items-center gap-2 border border-rose-200 font-medium">
                                        <AlertCircle size={14} className="text-rose-600 shrink-0" />
                                        <span>{postTestStatus.statusMessage || 'Akses Post Test sedang ditutup oleh Panitia / Tim Pelatih.'}</span>
                                      </div>
                                    ) : null}
                                  </div>

                                  {/* POST TEST ACTION & SCORE */}
                                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                                    {hasDonePost ? (
                                      <>
                                        <div>
                                          <span className="text-[10px] font-bold text-gray-400 uppercase">Nilai Post Test:</span>
                                          <div className="text-xl font-black text-teal-700 font-display">
                                            {displayPostScore} / 100
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setActiveTestModal('post_test')}
                                          className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-black uppercase tracking-wider border border-teal-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                                        >
                                          <FileText size={14} /> Tinjau Lembar Hasil
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!isPostOpen) {
                                            alert(postTestStatus.statusMessage || 'Akses Post Test sedang ditutup oleh Panitia / Tim Pelatih.');
                                            return;
                                          }
                                          setActiveTestModal('post_test');
                                        }}
                                        disabled={!isPostOpen}
                                        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                          isPostOpen
                                            ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-md hover:scale-[1.01] cursor-pointer font-black'
                                            : 'bg-gray-150 text-gray-400 border border-gray-200 cursor-not-allowed font-bold'
                                        }`}
                                      >
                                        <ClipboardList size={15} />
                                        {isPostOpen ? 'Mulai Kerjakan Post Test' : (postTestStatus.statusMessage || 'Akses Post Test Ditutup')}
                                      </button>
                                    )}
                                  </div>
                                </div>

                              </div>
                            </div>

                            {/* TUGAS TAMBAHAN DARI TIM PELATIH */}
                            {myTasks.length > 0 && (
                              <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider font-display">
                                    Tugas Tambahan dari Tim Pelatih
                                  </h4>
                                  <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md uppercase">
                                    {myTasks.length} Tugas Diberikan
                                  </span>
                                </div>
                                <div className="space-y-3">
                                  {myTasks.map((t) => {
                                    const tasksList = parseTasks(userApp);
                                    const submittedItem = tasksList.find((sub: any) => 
                                      String(sub.materiId) === String(t.materiId) || 
                                      sub.title === `Tugas: ${t.materiJudul}` ||
                                      (t.materiJudul && sub.title?.includes(t.materiJudul))
                                    );
                                    const isSubmitted = !!submittedItem;

                                    return (
                                      <div key={t.materiId} className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-150 space-y-2.5">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                            Instruksi Khusus Pelatih
                                          </span>
                                          <div className="flex items-center gap-2">
                                            {t.deadline && (
                                              <span className="text-[9px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200 flex items-center gap-1">
                                                <Clock size={10} /> Batas: {t.deadline}
                                              </span>
                                            )}
                                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md ${
                                              isSubmitted ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-800 border border-amber-200'
                                            }`}>
                                              {isSubmitted ? 'Sudah Dikirim ✓' : 'Belum Dikirim'}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <h5 className="text-xs font-black text-gray-800">{t.materiJudul}</h5>
                                          <p className="text-[11px] text-gray-600 bg-white p-3 rounded-xl border border-emerald-100 mt-1 whitespace-pre-line leading-relaxed">
                                            {t.instruksi || 'Silakan kerjakan tugas sesuai arahan materi pelatih.'}
                                          </p>
                                        </div>

                                        <div className="flex items-center justify-between gap-2 pt-1">
                                          {isSubmitted ? (
                                            <div className="flex items-center gap-2">
                                              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Tugas telah Anda kirimkan
                                              </span>
                                              {submittedItem.link && (
                                                <a 
                                                  href={submittedItem.link} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer" 
                                                  className="text-[10px] text-hw-green hover:underline font-bold flex items-center gap-1"
                                                >
                                                  Buka Tautan <ExternalLink size={10} />
                                                </a>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="text-[10px] text-amber-700 italic">
                                              Belum ada berkas tugas yang diunggah
                                            </div>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTaskTitle(`Tugas: ${t.materiJudul}`);
                                              setTaskMateriId(t.materiId);
                                              if (submittedItem) {
                                                setTaskLink(submittedItem.link || '');
                                                setTaskMessage(submittedItem.pesan || submittedItem.message || '');
                                              }
                                              const formEl = document.getElementById('assignment-submission-form');
                                              if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className="px-3 py-1.5 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                                          >
                                            <Upload size={12} />
                                            {isSubmitted ? 'Perbarui Berkas' : 'Kumpulkan Tugas Ini'}
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Standard Syllabus Assignments */}
                            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">
                                Penugasan Silabus Kurikulum
                              </h4>
                              <div className="space-y-2.5">
                                {program.assignments.map((asg) => (
                                  <div key={asg.id} className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-1">
                                    <h5 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                                      <FileText size={14} className="text-hw-green" /> {asg.title}
                                    </h5>
                                    <p className="text-[11px] text-gray-500 leading-normal">{asg.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Submission Form */}
                            <div id="assignment-submission-form" className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <div>
                                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">
                                    Formulir Pengumpulan Tugas Peserta
                                  </h4>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                    Kirim link Google Drive, berkas online, atau catatan tugas
                                  </p>
                                </div>
                              </div>

                              <form onSubmit={handleUserSubmitTask} className="space-y-3.5">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-500 ml-1">Pilih Tugas yang Dikumpulkan</label>
                                  <select 
                                    value={taskMateriId ? `materi_${taskMateriId}` : (taskTitle || '')}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val.startsWith('materi_')) {
                                        const matId = val.replace('materi_', '');
                                        const found = myTasks.find(t => String(t.materiId) === String(matId));
                                        setTaskMateriId(matId);
                                        setTaskTitle(found ? `Tugas: ${found.materiJudul}` : val);
                                      } else {
                                        setTaskMateriId('');
                                        setTaskTitle(val);
                                      }
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 focus:ring-hw-green/20 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 outline-none"
                                    required
                                  >
                                    <option value="">-- Pilih Penugasan --</option>
                                    {myTasks.length > 0 && (
                                      <optgroup label="Tugas Khusus dari Pelatih">
                                        {myTasks.map(t => (
                                          <option key={t.materiId} value={`materi_${t.materiId}`}>
                                            [PELATIH] {t.materiJudul}
                                          </option>
                                        ))}
                                      </optgroup>
                                    )}
                                    <optgroup label="Tugas Wajib Silabus">
                                      {program.assignments.map(asg => (
                                        <option key={asg.id} value={asg.title}>{asg.title}</option>
                                      ))}
                                    </optgroup>
                                    <optgroup label="Lainnya">
                                      <option value="Tugas Proyek Lapangan Qabilah">Tugas Proyek Lapangan Qabilah</option>
                                      <option value="Tugas Rencana Tindak Lanjut (RTL)">Tugas Rencana Tindak Lanjut (RTL)</option>
                                    </optgroup>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-500 ml-1">Tautan Berkas / Link Google Drive Tugas</label>
                                  <input 
                                    type="url" 
                                    placeholder="https://drive.google.com/file/d/... atau link tugas lainnya"
                                    value={taskLink || ''}
                                    onChange={(e) => setTaskLink(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 focus:ring-hw-green/20 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 font-medium outline-none"
                                    required
                                  />
                                  <p className="text-[9px] text-gray-400 font-medium ml-1">
                                    *Pastikan link Google Drive atau berkas Anda diset ke <strong>Siapa saja yang memiliki link (Viewer/Editor)</strong> agar dapat dibuka oleh Tim Pelatih.
                                  </p>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-500 ml-1">Pesan / Ringkasan untuk Tim Pelatih (Opsional)</label>
                                  <textarea 
                                    rows={3}
                                    placeholder="Tuliskan catatan, penjelasan tugas, atau pesan Anda..."
                                    value={taskMessage || ''}
                                    onChange={(e) => setTaskMessage(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 focus:ring-hw-green/20 rounded-xl p-3 text-xs text-gray-800 font-medium resize-none outline-none"
                                  />
                                </div>

                                <button
                                  type="submit"
                                  disabled={submittingTask}
                                  className="w-full bg-hw-green hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  {submittingTask ? (
                                    <>
                                      <Loader2 size={14} className="animate-spin" /> Mengirim Tugas...
                                    </>
                                  ) : (
                                    <>
                                      <Upload size={14} /> Simpan & Kumpulkan Penugasan
                                    </>
                                  )}
                                </button>
                              </form>
                            </div>

                            {/* Submitted Assignment History */}
                            {userApp && (
                              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">
                                    Riwayat Penugasan Terkirim ({parseTasks(userApp).length})
                                  </h4>
                                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                                    {parseTasks(userApp).length} Dokumen
                                  </span>
                                </div>

                                {parseTasks(userApp).length === 0 ? (
                                  <p className="text-xs text-gray-400 italic py-3 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    Belum ada tugas yang dikumpulkan.
                                  </p>
                                ) : (
                                  <div className="space-y-2.5">
                                    {parseTasks(userApp).map((t: any, idx: number) => (
                                      <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-150 flex flex-col gap-2.5">
                                        <div className="flex items-start justify-between gap-2 flex-wrap">
                                          <div>
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                                Tugas #{idx + 1}
                                              </span>
                                              <h6 className="text-xs font-black text-gray-800">{t.title}</h6>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                              Terkirim: {t.submittedAt ? new Date(t.submittedAt).toLocaleString('id-ID') : '-'}
                                            </p>
                                          </div>

                                          <div className="flex items-center gap-1.5">
                                            {t.link && (
                                              <a 
                                                href={t.link} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-hw-green hover:text-emerald-700 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 shrink-0"
                                              >
                                                Buka Berkas <ExternalLink size={11} />
                                              </a>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setTaskTitle(t.title || '');
                                                setTaskMateriId(t.materiId || '');
                                                setTaskLink(t.link || '');
                                                setTaskMessage(t.pesan || t.message || '');
                                                const formEl = document.getElementById('assignment-submission-form');
                                                if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                                              }}
                                              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[10px] font-bold transition-all"
                                              title="Edit pengumpulan tugas ini"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleUserDeleteTask(idx)}
                                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                              title="Hapus pengumpulan tugas ini"
                                            >
                                              <Trash2 size={13} />
                                            </button>
                                          </div>
                                        </div>

                                        {(t.pesan || t.message) && (
                                          <div className="bg-white p-2.5 rounded-xl border border-gray-200 text-[11px] text-gray-600 font-medium">
                                            <span className="font-extrabold text-hw-green text-[9px] uppercase tracking-wider block mb-0.5">Catatan Peserta:</span>
                                            "{t.pesan || t.message}"
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Trainer Review & Grade Card */}
                            {userApp && (userApp.nilai || userApp.remark || userApp.statusKelulusan) && (
                              <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 rounded-3xl border border-amber-200/80 shadow-sm space-y-3">
                                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                                  <div className="flex items-center gap-2">
                                    <Award className="text-amber-600" size={18} />
                                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider font-display">
                                      Hasil Penilaian & Ulasan Tim Pelatih
                                    </h4>
                                  </div>
                                  {userApp.statusKelulusan && (
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                      userApp.statusKelulusan === 'Lulus' 
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                        : userApp.statusKelulusan === 'Lulus Bersyarat'
                                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                                          : 'bg-rose-100 text-rose-800 border-rose-300'
                                    }`}>
                                      {userApp.statusKelulusan}
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  {userApp.nilai && (
                                    <div className="bg-white/80 p-3 rounded-2xl border border-amber-100">
                                      <span className="text-[9px] font-extrabold text-amber-700 uppercase tracking-wider block">Nilai Akhir / Predikat:</span>
                                      <span className="text-base font-black text-amber-950">{userApp.nilai}</span>
                                    </div>
                                  )}
                                  {userApp.remark && (
                                    <div className="bg-white/80 p-3 rounded-2xl border border-amber-100 sm:col-span-2">
                                      <span className="text-[9px] font-extrabold text-amber-700 uppercase tracking-wider block mb-1">Catatan & Ulasan Tim Pelatih:</span>
                                      <p className="text-xs text-gray-800 font-medium italic leading-relaxed">
                                        "{userApp.remark}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })()}

                      {/* 4. PIAGAM PELATIHAN (JIKA SUDAH DIVALIDASI OLEH ADMIN) TAB */}
                      {activeTab === 'piagam' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                          {isPiagamValidated ? (
                            /* ACTIVE CERTIFICATE FOR VALIDATED PARTICIPANTS */
                            <div className="space-y-4">
                              <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm text-left">
                                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                  <Sparkles size={18} />
                                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">
                                    Piagam Keikutsertaan & Kelulusan Resmi Terverifikasi
                                  </h4>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                  Selamat! Status kepesertaan Anda telah divalidasi dan dinyatakan <strong>LULUS</strong> oleh Tim Pelatih & Admin Kwartir Wilayah Gerakan Kepanduan Hizbul Wathan Jawa Tengah.
                                </p>
                              </div>

                              {/* Certificate View Graphic */}
                              <div className="bg-amber-50/80 border-2 border-amber-300 rounded-3xl p-6 relative overflow-hidden shadow-lg flex flex-col items-center justify-center text-center space-y-4 font-serif">
                                <div className="absolute inset-2 border-2 border-dashed border-amber-400/40 rounded-[1.2rem] pointer-events-none" />

                                <img 
                                  src="https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png" 
                                  alt="Logo HW" 
                                  className="h-16 w-auto drop-shadow-md relative z-10" 
                                />

                                <div className="space-y-1 relative z-10 font-sans">
                                  <h3 className="text-sm font-black uppercase tracking-widest text-amber-900">
                                    PIAGAM PENGHARGAAN
                                  </h3>
                                  <p className="text-[9px] text-amber-800 font-bold tracking-wider">
                                    Nomor: HW-JATENG/{selectedLevel.toUpperCase()}/{userApp.id.toUpperCase()}/{new Date().getFullYear()}
                                  </p>
                                </div>

                                <div className="space-y-1 relative z-10">
                                  <p className="text-xs text-gray-600 italic">Diberikan Kepada Peserta:</p>
                                  <h4 className="text-lg font-black text-gray-900 uppercase tracking-wide border-b-2 border-amber-400 pb-1 px-8 inline-block font-sans">
                                    {userApp.nama || user?.namaLengkap}
                                  </h4>
                                </div>

                                <p className="text-xs text-gray-700 leading-relaxed max-w-md px-2 italic font-sans">
                                  Atas ketekunan, partisipasi aktif, dan kelulusan pada kegiatan pelatihan resmi <strong className="not-italic text-amber-900">{selectedActivity.namaKegiatan}</strong> yang diselenggarakan oleh Kwartir Wilayah Gerakan Kepanduan Hizbul Wathan Jawa Tengah dengan Nilai Evaluasi: <strong className="not-italic text-amber-900">{userApp.nilai || 'A'}</strong>.
                                </p>

                                <div className="grid grid-cols-2 gap-8 pt-4 w-full text-[9px] font-sans text-gray-700 relative z-10">
                                  <div className="space-y-3">
                                    <p className="leading-none">Ketua Kwarwil HW Jateng,</p>
                                    <div className="h-6 flex items-center justify-center">
                                      <span className="text-[9px] text-emerald-700 font-black tracking-widest border border-emerald-500/30 px-2 py-0.5 rounded uppercase">Taufiq ✓</span>
                                    </div>
                                    <p className="font-bold underline uppercase">Taufiq</p>
                                  </div>
                                  <div className="space-y-3">
                                    <p className="leading-none">Sekretaris Kwarwil HW Jateng,</p>
                                    <div className="h-6 flex items-center justify-center">
                                      <span className="text-[9px] text-emerald-700 font-black tracking-widest border border-emerald-500/30 px-2 py-0.5 rounded uppercase font-mono">Dzikron ✓</span>
                                    </div>
                                    <p className="font-bold underline uppercase">M. Dzikron</p>
                                  </div>
                                </div>
                              </div>

                              {/* Download Certificate Action */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => window.print()}
                                  className="bg-hw-green hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider py-3.5 px-6 rounded-2xl flex-1 shadow-md hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <Download size={16} /> Cetak / Unduh Piagam Digital
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* LOCKED PIAGAM NOTICE IF NOT VALIDATED BY ADMIN YET */
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center space-y-4 py-10">
                              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
                                <Lock size={28} className="text-amber-600" />
                              </div>
                              <div className="space-y-1 max-w-md mx-auto">
                                <h5 className="text-sm font-black text-gray-800">
                                  Piagam Pelatihan Menunggu Validasi Admin
                                </h5>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                  Piagam kelulusan resmi hanya dapat diunduh jika status kepesertaan Anda telah <strong>divalidasi dan dinyatakan LULUS</strong> oleh Tim Pelatih & Admin Kwartir Wilayah HW Jawa Tengah setelah menyelesaikan seluruh rangkaian materi kurikulum, presensi, pre-test, post-test, dan penugasan.
                                </p>
                              </div>

                              {/* Checklist Persyaratan Kelulusan */}
                              <div className="max-w-md mx-auto bg-gray-50 rounded-2xl p-4 border border-gray-150 text-left space-y-2.5 text-xs">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
                                  Status Persyaratan Kelulusan:
                                </span>
                                
                                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-100">
                                  <span className="text-gray-700 font-medium">1. Presensi Kurikulum ({attendancePercentage}%)</span>
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                    attendancePercentage >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {attendedSessionsCount}/{totalCurriculumSessions} Sesi
                                  </span>
                                </div>

                                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-100">
                                  <span className="text-gray-700 font-medium">2. Penugasan Pre Test</span>
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                    userApp?.preTestScore !== undefined && userApp?.preTestScore !== null && userApp?.preTestScore !== ''
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {userApp?.preTestScore !== undefined && userApp?.preTestScore !== null && userApp?.preTestScore !== ''
                                      ? `Selesai (${userApp.preTestScore})`
                                      : 'Belum Selesai'}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-100">
                                  <span className="text-gray-700 font-medium">3. Penugasan Post Test</span>
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                    userApp?.postTestScore !== undefined && userApp?.postTestScore !== null && userApp?.postTestScore !== ''
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {userApp?.postTestScore !== undefined && userApp?.postTestScore !== null && userApp?.postTestScore !== ''
                                      ? `Selesai (${userApp.postTestScore})`
                                      : 'Belum Selesai'}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-100">
                                  <span className="text-gray-700 font-medium">4. Validasi Kelulusan Admin</span>
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                    userApp?.statusKelulusan === 'Lulus'
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {userApp?.statusKelulusan || 'Sedang Proses'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE ADMIN: KELOLA DATABASE PELATIHAN & GRADING                          */
        /* ========================================================================= */
        <div className="space-y-6 animate-fade-in">
          {/* Admin Stats Header */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Total Pendaftar</span>
              <p className="text-xl font-black text-gray-800 mt-0.5">{filteredApps.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left">
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider">Pending</span>
              <p className="text-xl font-black text-amber-500 mt-0.5">{filteredApps.filter(a => a.status === 'pending').length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Lulus Pelatihan</span>
              <p className="text-xl font-black text-emerald-500 mt-0.5">{filteredApps.filter(a => a.statusKelulusan === 'Lulus').length}</p>
            </div>
          </div>

          {/* Search Bar Peserta Pelatihan */}
          <div className="relative w-full box-border">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Cari data peserta pelatihan berdasarkan nama, email, kwarda, jenis pelatihan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 rounded-2xl pl-12 pr-12 py-3.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 shadow-xs transition-all outline-none font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-colors cursor-pointer"
                title="Hapus pencarian"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Applicant List for Admin */}
          {filteredApps.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center text-gray-400">
              <Users size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-bold">Tidak ada data pendaftar yang cocok.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApps.map((app) => {
                const attendanceMap = parseAttendance(app);
                const tasks = parseTasks(app);

                return (
                  <div key={app.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs text-left space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">
                          ID: {app.id.substring(0, 8)}
                        </span>
                        <h5 className="text-xs font-black text-gray-800">{app.nama || app.namaLengkap}</h5>
                        <p className="text-[10px] text-gray-400">
                          {app.email} • {app.asalDaerah || 'Jawa Tengah'}
                        </p>
                      </div>

                      <div>
                        {app.status === 'pending' ? (
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => handleUpdateStatus(app.id, 'approved')}
                              disabled={actionLoading}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                            >
                              Setuju
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(app.id, 'rejected')}
                              disabled={actionLoading}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : app.status === 'rejected' ? (
                          <span className="text-[9px] font-black text-red-600 bg-red-100 px-2.5 py-1 rounded-md uppercase">Ditolak</span>
                        ) : app.statusKelulusan === 'Lulus' ? (
                          <span className="text-[9px] font-black text-white bg-emerald-600 px-2.5 py-1 rounded-md uppercase">LULUS</span>
                        ) : (
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-md uppercase">TERVERIFIKASI</span>
                        )}
                      </div>
                    </div>

                    {app.status === 'approved' && (
                      <>
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kehadiran Sesi</span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {['Sesi 1', 'Sesi 2', 'Sesi 3', 'Sesi 4'].map((sesId) => {
                              const attStatus = getAttendanceStatus(attendanceMap, sesId);
                              return (
                                <div key={sesId} className="bg-gray-50 p-2 rounded-xl border border-gray-100 flex flex-col gap-1 items-center justify-between">
                                  <span className="text-[8px] font-bold text-gray-500">{sesId}</span>
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={() => handleToggleAttendance(app, sesId, 'hadir')}
                                      className={`w-5 h-5 rounded text-[8px] font-bold ${attStatus === 'hadir' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                                      title="Hadir"
                                    >
                                      H
                                    </button>
                                    <button 
                                      onClick={() => handleToggleAttendance(app, sesId, 'izin')}
                                      className={`w-5 h-5 rounded text-[8px] font-bold ${attStatus === 'izin' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                                      title="Izin"
                                    >
                                      I
                                    </button>
                                    <button 
                                      onClick={() => handleToggleAttendance(app, sesId, 'absen')}
                                      className={`w-5 h-5 rounded text-[8px] font-bold ${attStatus === 'absen' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                                      title="Absen"
                                    >
                                      A
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                          <div>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Nilai & Status</span>
                            <span className="text-xs font-black text-emerald-700">
                              {app.nilai ? `Nilai: ${app.nilai} (${app.statusKelulusan || 'Lulus'})` : 'Belum Dinilai'}
                            </span>
                          </div>
                          <button
                            onClick={() => openGradingDialog(app)}
                            className="bg-hw-green hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                          >
                            <Award size={14} /> Penilaian & Piagam
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Admin Grading Modal Popup */}
      {gradingApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-left border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">Penilaian & Status Kelulusan</h4>
              <button onClick={() => setGradingApp(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={16} />
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <h5 className="text-xs font-black text-gray-800">{gradingApp.nama}</h5>
              <p className="text-[10px] text-gray-400">{gradingApp.email} • {gradingApp.pelatihanAkanDiikuti}</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Grade Nilai (Contoh: A, B+, Sangat Memuaskan)</label>
                <input 
                  type="text" 
                  value={gradeInput || ''}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder="Masukkan grade"
                  className="w-full bg-gray-50 border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Status Kelulusan</label>
                <select 
                  value={passingStatus || 'Lulus'}
                  onChange={(e) => setPassingStatus(e.target.value)}
                  className="w-full bg-gray-50 border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800"
                >
                  <option value="Lulus">Lulus (Piagam Aktif & Dapat Didownload)</option>
                  <option value="Belum Lulus">Belum Lulus / Dalam Proses</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Catatan Tim Pelatih</label>
                <textarea 
                  value={remarkInput || ''}
                  onChange={(e) => setRemarkInput(e.target.value)}
                  placeholder="Catatan tambahan..."
                  rows={2}
                  className="w-full bg-gray-50 border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setGradingApp(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black uppercase tracking-wider py-3 rounded-xl flex-1 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveGrade}
                  disabled={actionLoading}
                  className="bg-hw-green hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl flex-1 shadow-md cursor-pointer"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Nilai'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* PARTICIPANT PRE TEST / POST TEST MODAL */}
      {activeTestModal && (() => {
        const testSettings = activeTestModal === 'pre_test'
          ? parseTestScheduleSettings(trainingSettings?.preTestSettings, DEFAULT_PRE_TEST_SETTINGS)
          : parseTestScheduleSettings(trainingSettings?.postTestSettings, DEFAULT_POST_TEST_SETTINGS);

        const testQuestions = Array.isArray(trainingSettings?.trainingQuestions) && trainingSettings.trainingQuestions.length > 0
          ? trainingSettings.trainingQuestions
          : (typeof trainingSettings?.trainingQuestions === 'string' ? (() => { try { return JSON.parse(trainingSettings.trainingQuestions); } catch(e) { return DEFAULT_50_QUESTIONS; } })() : DEFAULT_50_QUESTIONS);

        const participantData = {
          id: userApp?.id || `app-${user?.id || Date.now()}`,
          nama: userApp?.nama || user?.namaLengkap || user?.nama || 'Peserta Pelatihan',
          email: userApp?.email || user?.email || '',
          tingkatan: userApp?.pelatihanAkanDiikuti || selectedActivity?.jenisPelatihan || selectedLevel || 'Jati 1',
          asalDaerah: userApp?.asalDaerah || user?.asalKwarda || 'Jawa Tengah'
        };

        let existingSubmission = undefined;
        if (activeTestModal === 'pre_test') {
          if (userApp?.preTestData) {
            try {
              existingSubmission = typeof userApp.preTestData === 'string' ? JSON.parse(userApp.preTestData) : userApp.preTestData;
            } catch (e) {
              existingSubmission = undefined;
            }
          }
          if (!existingSubmission && userApp && userApp.preTestScore !== undefined && userApp.preTestScore !== null && userApp.preTestScore !== '') {
            existingSubmission = {
              testType: 'pre_test',
              score: Number(userApp.preTestScore) || 0,
              answers: {},
              submittedAt: userApp.preTestSubmittedAt || 'Selesai'
            };
          }
        } else if (activeTestModal === 'post_test') {
          if (userApp?.postTestData) {
            try {
              existingSubmission = typeof userApp.postTestData === 'string' ? JSON.parse(userApp.postTestData) : userApp.postTestData;
            } catch (e) {
              existingSubmission = undefined;
            }
          }
          if (!existingSubmission && userApp && userApp.postTestScore !== undefined && userApp.postTestScore !== null && userApp.postTestScore !== '') {
            existingSubmission = {
              testType: 'post_test',
              score: Number(userApp.postTestScore) || 0,
              answers: {},
              submittedAt: userApp.postTestSubmittedAt || 'Selesai'
            };
          }
        }

        return (
          <ParticipantTestModal
            isOpen={activeTestModal !== null}
            onClose={() => setActiveTestModal(null)}
            testType={activeTestModal}
            testSettings={testSettings}
            questions={testQuestions}
            participantData={participantData}
            existingSubmission={existingSubmission}
            onSubmitTest={async (submission) => {
              let targetApp = userApp;
              if (!targetApp) {
                targetApp = approvedUserApps.find(a => normalizeLevelCode(a.pelatihanAkanDiikuti) === normalizeLevelCode(selectedActivity?.jenisPelatihan || selectedLevel))
                  || applications.find(a => isUserAppMatch(a, user))
                  || approvedUserApps[0];
              }

              if (!targetApp && user) {
                const newAppId = `train-app-${Date.now()}`;
                targetApp = {
                  id: newAppId,
                  userId: user.id || `user-${Date.now()}`,
                  nama: user.namaLengkap || user.nama || 'Peserta Pelatihan',
                  email: user.email || '',
                  noWa: user.noHp || '',
                  nbm: (user as any)?.nbm || user.ktaNumber || user.nomorKTA || '',
                  ktaNumber: (user as any)?.nbm || user.ktaNumber || user.nomorKTA || '',
                  nomorKTA: (user as any)?.nbm || user.ktaNumber || user.nomorKTA || '',
                  asalDaerah: user.asalKwarda || 'Jawa Tengah',
                  pelatihanAkanDiikuti: selectedActivity?.jenisPelatihan || selectedLevel || 'Jati 1',
                  status: 'approved',
                  statusPembayaran: 'Lunas',
                  statusKelulusan: 'Proses Pelatihan'
                };
                await Promise.all([
                  sheetsService.applyTraining(targetApp).catch(e => console.warn(e)),
                  firestoreService.createTrainingApplication(targetApp).catch(e => console.warn(e))
                ]);
                setApplications(prev => [targetApp, ...prev]);
                setUserApp(targetApp);
              }

              if (targetApp) {
                await Promise.all([
                  sheetsService.submitTestSubmission(targetApp.id, submission),
                  firestoreService.submitTestSubmission(targetApp.id, submission, targetApp)
                ]);

                const updatedApp = {
                  ...targetApp,
                  [`${submission.testType === 'pre_test' ? 'preTest' : 'postTest'}Score`]: submission.score,
                  [`${submission.testType === 'pre_test' ? 'preTest' : 'postTest'}Data`]: JSON.stringify(submission),
                  [`${submission.testType === 'pre_test' ? 'preTest' : 'postTest'}SubmittedAt`]: submission.submittedAt
                };
                setUserApp(updatedApp);
                setApplications(prev => prev.map(a => a.id === targetApp.id ? updatedApp : a));
                window.dispatchEvent(new Event('training_applications_updated'));
              }
              await loadData();
            }}
          />
        );
      })()}
    </div>
  );
}
