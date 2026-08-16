import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X, CheckCircle2, MessageCircle } from 'lucide-react';
import { CopyAccountButton } from './CopyAccountButton';
import { useAuthStore } from '../store/useAuthStore';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export const ActivationModal: React.FC<ActivationModalProps> = ({
  isOpen,
  onClose,
  featureName = 'Fitur Premium'
}) => {
  const { user } = useAuthStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="activation-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 pt-3 pb-20 sm:pt-6 sm:pb-6 bg-black/75 backdrop-blur-xs overflow-y-auto"
        >
          <div className="absolute inset-0" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl sm:rounded-[2rem] max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 relative overflow-hidden space-y-4 z-10 my-auto max-h-[calc(100dvh-5.5rem)] sm:max-h-[calc(100dvh-4rem)] flex flex-col"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer touch-manipulation active:scale-95 z-20"
              title="Tutup"
            >
              <X size={18} />
            </button>

            {/* Lock Icon Header */}
            <div className="flex flex-col items-center text-center pt-2 space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner border border-amber-200/60">
                <Lock size={32} />
              </div>
              <h3 className="text-lg font-black font-display text-gray-800">Aktivasi Akun Diperlukan</h3>
              <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200 uppercase tracking-wider">
                {featureName}
              </span>
            </div>

            <p className="text-xs text-gray-600 text-center leading-relaxed font-medium">
              Akun Anda belum diaktifkan oleh Admin. Silakan melakukan pembayaran biaya aktivasi senilai <strong>Rp 10.000</strong> ke rekening atas nama <strong>Kwarwil HW Jateng</strong> agar admin dapat segera mengaktifkan akun Anda.
            </p>

            <p className="text-[11px] text-amber-800 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/80 text-center font-medium leading-relaxed">
              Biaya aktivasi termasuk biaya KTA Digital.
            </p>

            {/* Account Transfer Box */}
            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80 space-y-1 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Transfer ke Rekening (BSI)</p>
              <CopyAccountButton accountNumber="7307427448" showNumber={true} textClassName="text-base font-black text-emerald-800 font-mono" />
              <p className="text-[10.5px] font-semibold text-gray-700">a.n. Kwarwil HW Jateng</p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  const text = encodeURIComponent(`Assalamu'alaikum Admin HW Jateng, saya ingin melakukan pembayaran aktivasi akun.\n\nNama: ${user?.namaLengkap || ''}\nEmail: ${user?.email || ''}\nFitur: ${featureName}\nMohon bantuannya untuk verifikasi dan aktivasi akun. Terima kasih.`);
                  window.open(`https://wa.me/6289688754000?text=${text}`, '_blank');
                }}
                className="w-full bg-hw-green text-white font-black py-3.5 px-4 rounded-xl shadow-lg shadow-hw-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
              >
                <CheckCircle2 size={16} />
                Konfirmasi Pembayaran (WhatsApp)
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors text-xs uppercase tracking-wider cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
