import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Database,
  X,
  LogOut,
  AlertCircle,
  Lock,
} from 'lucide-react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  firebaseConfig,
  User,
} from '../firebase';
import { DatabaseService } from '../services/databaseService';
import { formatDateTimeID } from '../utils/formatters';

interface FirebaseCloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  firebaseUser: User | null;
  onDataSynced: () => void;
  onShowToast: (type: 'success' | 'error', text: string) => void;
}

export const FirebaseCloudSyncModal: React.FC<FirebaseCloudSyncModalProps> = ({
  isOpen,
  onClose,
  firebaseUser,
  onDataSynced,
  onShowToast,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  if (!isOpen) return null;

  const lastSyncIso = DatabaseService.getLastSyncTimestamp();
  const periodesCount = DatabaseService.getPeriodeList().length;
  const opdsCount = DatabaseService.getOpdList().length;
  const usersCount = DatabaseService.getUsersList().length;
  const matricesCount = DatabaseService.getMatrixDataList().length;
  const realisasisCount = DatabaseService.getRealisasiList().length;

  const handleConnectAndSync = async () => {
    setSyncError(null);
    setIsConnecting(true);
    try {
      if (!auth.currentUser) {
        await signInWithPopup(auth, googleProvider);
      }
      setIsConnecting(false);
      setIsSyncing(true);
      const res = await DatabaseService.syncAllLocalToFirestore();
      setIsSyncing(false);
      if (res.success) {
        onDataSynced();
        onShowToast('success', res.message);
      } else {
        setSyncError(res.message);
      }
    } catch (err) {
      setIsConnecting(false);
      setIsSyncing(false);
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal menghubungkan atau menyinkronkan ke Firebase Cloud.';
      setSyncError(msg);
      onShowToast('error', 'Sinkronisasi tertunda: ' + msg);
    }
  };

  const handleDisconnectFirebase = async () => {
    try {
      await signOut(auth);
      onShowToast('success', 'Sesi otorisasi Cloud Firebase telah diputus.');
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
        >
          {/* Header Modal */}
          <div className="px-6 py-5 bg-gradient-to-r from-[#1E40AF] to-[#2563EB] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/25">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight">
                  Sinkronisasi Database Firebase (Cloud Firestore)
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  E-Lamis Blora terhubung otomatis dengan proyek Firebase resmi
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Modal */}
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Status Konfigurasi Provisioned Firebase */}
            <div className="p-4 rounded-2xl bg-[#F8FAFF] border border-blue-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-xs font-bold text-slate-900">
                    Konfigurasi Database Firebase Terpasang
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Provisioned & Aktif
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">
                    Project ID
                  </p>
                  <p className="font-mono font-bold text-slate-800 truncate mt-0.5">
                    {firebaseConfig.projectId}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">
                    Auth Domain
                  </p>
                  <p className="font-mono font-semibold text-slate-700 truncate mt-0.5">
                    {firebaseConfig.authDomain}
                  </p>
                </div>
                <div className="sm:col-span-2 p-2.5 rounded-xl bg-white border border-slate-200/80">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">
                    Firestore Database ID
                  </p>
                  <p className="font-mono font-semibold text-[#1D4ED8] truncate mt-0.5">
                    {firebaseConfig.firestoreDatabaseId}
                  </p>
                </div>
              </div>
            </div>

            {/* Ringkasan Tabel yang Disinkronkan */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-800">
                Koleksi Tabel E-Lamis Blora yang Disinkronkan:
              </p>
              <div className="grid grid-cols-5 gap-2 text-center">
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <p className="text-base font-extrabold text-slate-900">{periodesCount}</p>
                  <p className="text-[10px] font-semibold text-slate-500">Periode</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <p className="text-base font-extrabold text-slate-900">{opdsCount}</p>
                  <p className="text-[10px] font-semibold text-slate-500">Instansi</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <p className="text-base font-extrabold text-slate-900">{usersCount}</p>
                  <p className="text-[10px] font-semibold text-slate-500">User</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <p className="text-base font-extrabold text-[#2563EB]">{matricesCount}</p>
                  <p className="text-[10px] font-semibold text-slate-500">Matriks</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <p className="text-base font-extrabold text-emerald-700">{realisasisCount}</p>
                  <p className="text-[10px] font-semibold text-slate-500">Realisasi</p>
                </div>
              </div>
            </div>

            {/* Status Sesi Otorisasi Keamanan Firestore */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Otorisasi Keamanan Cloud Firestore
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                      Sesuai aturan keamanan Firestore (Security Rules), koneksi tulis/baca ke Cloud
                      diamankan menggunakan sesi terverifikasi Anda.
                    </p>
                  </div>
                </div>
              </div>

              {firebaseUser ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/90 border border-emerald-200">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-900 truncate">
                      Terhubung: {firebaseUser.email || firebaseUser.displayName}
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      {lastSyncIso
                        ? `Sinkronisasi terakhir: ${formatDateTimeID(lastSyncIso)}`
                        : 'Sinkronisasi real-time (onSnapshot) aktif'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDisconnectFirebase}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Putuskan</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Klik tombol <strong>Hubungkan & Sinkronkan Sekarang</strong> di bawah untuk
                    mengaktifkan sinkronisasi otomatis ke Cloud Firestore.
                  </span>
                </div>
              )}
            </div>

            {syncError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="break-all">{syncError}</span>
              </div>
            )}
          </div>

          {/* Footer Modal */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              disabled={isSyncing || isConnecting}
              onClick={handleConnectAndSync}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw
                className={`w-4 h-4 ${isSyncing || isConnecting ? 'animate-spin' : ''}`}
              />
              <span>
                {isConnecting
                  ? 'Menghubungkan Akun Cloud...'
                  : isSyncing
                  ? 'Menyinkronkan ke Firestore...'
                  : firebaseUser
                  ? 'Sinkronkan Semua Data ke Firestore'
                  : 'Hubungkan & Sinkronkan Sekarang'}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
