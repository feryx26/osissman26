import React, { useState } from 'react';
import { Candidate, Student, ElectionSettings } from '../types';
import {
  Vote,
  Lock,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Eye,
  FileCheck,
  ArrowRight,
  Fingerprint,
  RefreshCw,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { loginStudent, submitVote, playSound } from '../services/storageService';
import { CaptchaTokenBox } from './CaptchaTokenBox';

interface VotingBoothProps {
  candidates: Candidate[];
  students: Student[];
  settings: ElectionSettings;
  currentStudent: Student | null;
  onStudentLogin: (student: Student) => void;
  onLogout: () => void;
  onViewRealCount: () => void;
  onOpenCandidateModal: (candidate: Candidate) => void;
  onOpenReceiptModal: (student: Student) => void;
}

export const VotingBooth: React.FC<VotingBoothProps> = ({
  candidates,
  students,
  settings,
  currentStudent,
  onStudentLogin,
  onLogout,
  onViewRealCount,
  onOpenCandidateModal,
  onOpenReceiptModal,
}) => {
  // Login form state
  const [nisInput, setNisInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentCaptcha, setCurrentCaptcha] = useState(() =>
    Math.floor(100000 + Math.random() * 900000).toString()
  );

  const handleRefreshCaptcha = () => {
    setCurrentCaptcha(Math.floor(100000 + Math.random() * 900000).toString());
  };

  // Voting state
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justVotedSuccess, setJustVotedSuccess] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    playSound('click');

    if (!nisInput.trim()) {
      setErrorMessage('Silakan masukkan Nomor Induk Siswa (NIS) Anda.');
      return;
    }

    if (!/^\d{6}$/.test(tokenInput.trim())) {
      playSound('alert');
      setErrorMessage('Token Pemilihan wajib berupa 6 digit angka sesuai yang diberikan panitia.');
      return;
    }

    if (captchaInput.trim() !== currentCaptcha) {
      playSound('alert');
      setErrorMessage('Kode CAPTCHA tidak sesuai. Silakan periksa kembali gambar verifikasi.');
      setCaptchaInput('');
      handleRefreshCaptcha();
      return;
    }

    setIsVerifying(true);
    const res = await loginStudent(nisInput, tokenInput);
    setIsVerifying(false);

    if (!res.success || !res.student) {
      playSound('alert');
      setErrorMessage(res.message);
      // Auto-refresh captcha on failed attempt
      setCaptchaInput('');
      handleRefreshCaptcha();
      return;
    }

    onStudentLogin(res.student);
    setNisInput('');
    setTokenInput('');
    setCaptchaInput('');
  };

  const handleInitiateVote = (candidate: Candidate) => {
    playSound('click');
    setSelectedCandidate(candidate);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmVote = async () => {
    if (!currentStudent || !selectedCandidate) return;

    setIsSubmitting(true);
    const result = await submitVote(currentStudent.nis, selectedCandidate.id);

    if (result.success) {
      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'],
        });
      } catch {
        // Fallback gracefully if canvas-confetti issues
      }

      setJustVotedSuccess(true);
      setIsConfirmModalOpen(false);
    } else {
      playSound('alert');
      alert(result.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* 1. NOT LOGGED IN STATE */}
      {!currentStudent ? (
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Vote className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Masuk ke Bilik Suara Digital
              </h2>
              <p className="text-sm text-slate-500">
                Masukkan NIS (Nomor Induk Siswa), Token Pemilihan 6 digit dari panitia, dan kode CAPTCHA untuk memverifikasi hak suara Anda.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nomor Induk (NIS) atau NISN *
                </label>
                <input
                  type="text"
                  value={nisInput}
                  onChange={(e) => setNisInput(e.target.value)}
                  placeholder="Contoh: 2026003 atau 0081234561"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  required
                />
              </div>

              {/* Token Display as CAPTCHA */}
              <div className="pt-1">
                <CaptchaTokenBox
                  captchaCode={currentCaptcha}
                  onRefresh={handleRefreshCaptcha}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Token Pemilihan * <span className="text-rose-600 font-semibold">(Wajib)</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">6 Digit Angka</span>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Token 6 digit dari panitia..."
                  className="w-full px-4 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono tracking-[0.25em] font-extrabold text-slate-900 text-center placeholder:tracking-normal placeholder:font-normal placeholder:text-xs"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Gunakan Token Pemilihan unik yang dibagikan panitia KPU kepada Anda.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Masukkan Kode CAPTCHA * <span className="text-rose-600 font-semibold">(Wajib)</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">6 Digit Angka</span>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Ketik 6 angka di atas..."
                  className="w-full px-4 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono tracking-[0.25em] font-extrabold text-slate-900 text-center placeholder:tracking-normal placeholder:font-normal placeholder:text-xs"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Ketik 6 digit angka yang terlihat pada gambar verifikasi CAPTCHA di atas.
                </p>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Vote className="w-4 h-4" />
                )}
                <span>{isVerifying ? 'Memverifikasi...' : 'Verifikasi Identitas & Buka Bilik Suara'}</span>
              </button>
            </form>

            {/* Principles of Luber Jurdil */}
            <div className="mt-6 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 text-center">
              Asas Pemilihan OSIS: <strong>LUBER JURDIL</strong> (Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil).
            </div>
          </div>
        </div>
      ) : currentStudent.hasVoted ? (
        /* 2. ALREADY VOTED / POST-VOTE CELEBRATION STATE */
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 text-center space-y-6">
            {/* Tinta Ungu Digital (Purple Ink Stamp) */}
            <div className="relative inline-block mx-auto">
              <div className="w-20 h-20 rounded-2xl bg-purple-100 border-2 border-purple-300 flex items-center justify-center text-purple-700 shadow-inner">
                <Fingerprint className="w-10 h-10" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-purple-700 text-white p-1 rounded-full shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                <span>Tinta Ungu Digital Terverifikasi</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Terima Kasih, Suara Anda Telah Sah Dicatat!
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Partisipasi Anda sangat berarti untuk kemajuan OSIS {settings.schoolName}.
              </p>
            </div>

            {/* Voter Verification Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Nama Siswa:</span>
                <span className="font-bold text-slate-900">{currentStudent.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Nomor Induk Siswa:</span>
                <span className="font-mono font-semibold text-slate-900">{currentStudent.nis}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Kelas / Angkatan:</span>
                <span className="font-semibold text-slate-900">{currentStudent.grade}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Waktu Pencoblosan:</span>
                <span className="font-mono font-semibold text-emerald-700">{currentStudent.votedAt || 'Hari ini'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ID Tanda Terima:</span>
                <span className="font-mono font-bold text-blue-700">{currentStudent.receiptId || 'REC-VERIFIED'}</span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={onViewRealCount}
                className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Vote className="w-4 h-4" />
                <span>Lihat Pergerakan Real Count</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenReceiptModal(currentStudent)}
                className="py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileCheck className="w-4 h-4 text-purple-600" />
                <span>Lihat & Simpan Bukti Coblos</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={onLogout}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar / Masuk Sebagai Siswa Lain</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 3. READY TO VOTE: SURAT SUARA DIGITAL */
        <div className="space-y-6">
          {/* Student Status Header */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                {currentStudent.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {currentStudent.name}
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
                    Hak Suara Tersedia
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  NIS: {currentStudent.nis} · {currentStudent.grade}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onLogout}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Ganti Siswa
              </button>
            </div>
          </div>

          {/* Surat Suara Banner */}
          <div className="text-center space-y-1">
            <span className="text-xs font-bold tracking-wider uppercase text-blue-600">
              Surat Suara Elektronik Resmi
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Pilih Pasangan Calon Ketua & Wakil Ketua OSIS
            </h2>
            <p className="text-xs text-slate-500">
              Pilihlah berdasarkan visi, misi, dan program kerja yang terbaik. Pilihan Anda bersifat rahasia dan tidak dapat diubah setelah dikonfirmasi.
            </p>
          </div>

          {/* 3 Candidate Cards Ballot Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {candidates.map((cand) => (
              <div
                key={cand.id}
                className="bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col overflow-hidden group"
              >
                {/* Ballot Header Number */}
                <div
                  className="py-3 px-4 text-center text-white font-extrabold text-xl shadow-xs"
                  style={{ backgroundColor: cand.color.primary }}
                >
                  <span className="text-xs uppercase tracking-widest block font-medium opacity-90">
                    Nomor Urut
                  </span>
                  0{cand.number}
                </div>

                {/* Candidate Photo */}
                <div className="p-4 pb-2 text-center">
                  <div className="relative inline-block w-full aspect-square rounded-xl overflow-hidden border border-slate-100 shadow-xs bg-slate-50">
                    <img
                      src={cand.photoUrl}
                      alt={`Paslon ${cand.number}`}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="p-4 pt-1 flex-1 flex flex-col justify-between space-y-4">
                  <div className="text-center space-y-1">
                    <h4 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                      {cand.chairmanName}
                    </h4>
                    <p className="text-xs font-medium text-slate-500">
                      & {cand.viceChairmanName}
                    </p>
                    <p className="text-[11px] text-slate-600 italic line-clamp-2 pt-1 border-t border-slate-100 mt-2">
                      &ldquo;{cand.slogan}&rdquo;
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onOpenCandidateModal(cand)}
                      className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      <span>Lihat Visi & Misi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInitiateVote(cand)}
                      className="w-full py-3 px-4 text-white text-xs font-extrabold uppercase tracking-wide rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      style={{ backgroundColor: cand.color.primary }}
                    >
                      <Vote className="w-4 h-4" />
                      <span>Coblos Paslon 0{cand.number}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {isConfirmModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-5">
            <div className="text-center space-y-2">
              <div
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white font-bold text-lg shadow-sm"
                style={{ backgroundColor: selectedCandidate.color.primary }}
              >
                0{selectedCandidate.number}
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Konfirmasi Pilihan Suara
              </h3>
              <p className="text-xs text-slate-600">
                Apakah Anda yakin ingin memberikan suara Anda kepada:
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-3">
              <img
                src={selectedCandidate.photoUrl}
                alt={selectedCandidate.chairmanName}
                className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Paslon Nomor Urut 0{selectedCandidate.number}
                </span>
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {selectedCandidate.chairmanName} & {selectedCandidate.viceChairmanName}
                </h4>
                <p className="text-[11px] text-slate-500 italic truncate">
                  {selectedCandidate.slogan}
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
              <strong>Peringatan:</strong> Suara yang telah dikirim bersifat <strong>FINAL</strong> dan tidak dapat diulang atau dibatalkan.
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
                className="py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Periksa Lagi
              </button>
              <button
                type="button"
                onClick={handleConfirmVote}
                disabled={isSubmitting}
                className="py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Ya, Kirim Suara!</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
