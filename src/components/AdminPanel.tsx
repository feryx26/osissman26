import React, { useState, useEffect } from 'react';
import { Candidate, ElectionSettings, Student } from '../types';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  LogOut,
  UserPlus,
  FileSpreadsheet,
  Download,
  Printer,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  BarChart3,
  Users,
  UserCog,
  Target,
  Award
} from 'lucide-react';
import {
  isAdminLoggedIn,
  loginAdmin,
  logoutAdmin,
  toggleElectionOpen,
  resetAllData,
  addStudent,
  deleteCandidate,
  simulateRandomVote,
  generateRandomToken,
  playSound
} from '../services/storageService';
import { downloadBeritaAcaraHtml, downloadRekapitulasiCsv } from '../services/exportService';
import { ExcelImportModal } from './ExcelImportModal';
import { CandidateFormModal } from './CandidateFormModal';
import { DptList } from './DptList';
import { AdminUserManager } from './AdminUserManager';

interface AdminPanelProps {
  candidates: Candidate[];
  students: Student[];
  settings: ElectionSettings;
  onOpenBeritaAcara: () => void;
  onSelectStudentToVote?: (student: Student) => void;
  initialTab?: 'rekap' | 'kandidat' | 'dpt' | 'pengguna' | 'pengaturan';
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  candidates,
  students,
  settings,
  onOpenBeritaAcara,
  onSelectStudentToVote,
  initialTab = 'rekap',
}) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(isAdminLoggedIn());
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Panitia sub-tab
  const [adminTab, setAdminTab] = useState<'rekap' | 'kandidat' | 'dpt' | 'pengguna' | 'pengaturan'>(initialTab);

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);

  // Notifications
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  // Single student input
  const [newNis, setNewNis] = useState('');
  const [newNisn, setNewNisn] = useState('');
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState('X MIPA 1');
  const [newGender, setNewGender] = useState<'L' | 'P'>('L');

  // Reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(isAdminLoggedIn());
    };
    window.addEventListener('pilketos_admin_change', handleAuthChange);
    return () => {
      window.removeEventListener('pilketos_admin_change', handleAuthChange);
    };
  }, []);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const res = await loginAdmin(usernameInput, passwordInput);
    if (res.success) {
      setIsAuthenticated(true);
      setUsernameInput('');
      setPasswordInput('');
    } else {
      setLoginError(res.message);
    }
  };

  const handleQuickDemoLogin = async () => {
    setUsernameInput('admin');
    setPasswordInput('osis2026');
    const res = await loginAdmin('admin', 'osis2026');
    if (res.success) {
      setIsAuthenticated(true);
    }
  };

  const handleAdminLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
  };

  const handleDownloadBeritaAcara = () => {
    playSound('click');
    downloadBeritaAcaraHtml(candidates, students, settings);
    setDownloadSuccess('Dokumen Berita Acara resmi (.html) berhasil diunduh!');
    setTimeout(() => setDownloadSuccess(null), 5000);
  };

  const handleDownloadCsv = () => {
    playSound('click');
    downloadRekapitulasiCsv(candidates, students, settings);
    setDownloadSuccess('File rekapitulasi data (.csv / Excel) berhasil diunduh!');
    setTimeout(() => setDownloadSuccess(null), 5000);
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNis.trim() || !newName.trim()) {
      alert('NIS dan Nama Siswa wajib diisi.');
      return;
    }

    const token = generateRandomToken();
    const success = await addStudent({
      nis: newNis.trim(),
      name: newName.trim(),
      grade: newGrade,
      gender: newGender,
      token,
      nisn: newNisn.trim() || undefined,
    });

    if (success) {
      playSound('vote-success');
      setSuccessNote(`Siswa ${newName} berhasil ditambahkan ke DPT!`);
      setNewNis('');
      setNewNisn('');
      setNewName('');
      setTimeout(() => setSuccessNote(null), 4000);
    } else {
      playSound('alert');
      alert(`Gagal menambahkan siswa. Pastikan NIS ${newNis} belum terdaftar dalam DPT.`);
    }
  };

  const handleDeleteCandidate = async (cand: Candidate) => {
    if (confirm(`Apakah Anda yakin ingin menghapus Paslon No. 0${cand.number} (${cand.chairmanName} & ${cand.viceChairmanName})?`)) {
      const res = await deleteCandidate(cand.id);
      if (!res.success) {
        alert(res.message);
      } else {
        setSuccessNote(res.message);
        setTimeout(() => setSuccessNote(null), 4000);
      }
    }
  };

  const handleSimulateOne = async () => {
    playSound('click');
    const res = await simulateRandomVote();
    if (res.success) {
      setSimMessage(`Simulasi 1 suara: ${res.studentName} memilih Paslon 0${res.candidateNumber}`);
      setTimeout(() => setSimMessage(null), 4000);
    } else {
      setSimMessage(res.message);
      setTimeout(() => setSimMessage(null), 4000);
    }
  };

  // Calculations for Rekapitulasi
  const totalVotes = candidates.reduce((s, c) => s + c.votes, 0);
  const totalDpt = students.length;
  const nonVoters = totalDpt - totalVotes;
  const turnout = totalDpt > 0 ? ((totalVotes / totalDpt) * 100).toFixed(1) : '0';

  const maleVoted = students.filter((s) => s.gender === 'L' && s.hasVoted).length;
  const maleTotal = students.filter((s) => s.gender === 'L').length;
  const femaleVoted = students.filter((s) => s.gender === 'P' && s.hasVoted).length;
  const femaleTotal = students.filter((s) => s.gender === 'P').length;

  const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes);

  // 1. IF NOT LOGGED IN AS ADMIN: RENDER SECURE PANITIA LOGIN
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-8">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600">
              Area Khusus Panitia KPU Sekolah
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Login Pengurus & Panitia
            </h2>
            <p className="text-xs text-slate-500">
              Masuk untuk menginput data calon ketua OSIS, mengelola DPT, dan melihat rekapitulasi hasil suara.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username Panitia
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="admin / kpu_osis"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi (Password)
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Masuk Sebagai Panitia</span>
            </button>
          </form>

          {/* Quick Demo Login Helper */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <span className="text-[11px] text-slate-400 block">
              Akun Panitia Default: <strong>admin</strong> / sandi: <strong>osis2026</strong>
            </span>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Klik di Sini untuk Login Cepat (Demo)
            </button>
          </div>
        </div>

        {/* Notice that DPT is protected under Panitia Login */}
        <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-xs text-slate-600 space-y-2">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Daftar Pemilih Tetap (DPT)</span>
            </span>
            <span className="font-mono text-blue-700 font-bold">{students.length} Siswa Terdaftar</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Data pemilih siswa, status pemungutan suara, dan fitur import Excel (NO INDUK, NAMA, JK, NISN) terintegrasi secara aman di panel Panitia KPU Sekolah. Silakan login untuk mengelola atau mengimpor data.
          </p>
        </div>
      </div>
    );
  }

  // 2. IF LOGGED IN: RENDER FULL PANITIA DASHBOARD
  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Panitia Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Terautentikasi: Panitia KPU OSIS</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Pusat Manajemen Panitia Pemilihan OSIS
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {settings.schoolName} · Kelola calon paslon, import DPT, dan unduh rekapitulasi hasil suara.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadBeritaAcara}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Berita Acara</span>
          </button>
          <button
            onClick={handleAdminLogout}
            title="Keluar dari sesi panitia"
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {downloadSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
          <button
            onClick={() => setDownloadSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {successNote && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{successNote}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setAdminTab('rekap')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'rekap'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Rekap Hasil Suara</span>
        </button>

        <button
          onClick={() => setAdminTab('kandidat')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'kandidat'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Input & Edit Data Calon ({candidates.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('dpt')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'dpt'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Kelola DPT & Import Excel</span>
        </button>

        <button
          onClick={() => setAdminTab('pengguna')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'pengguna'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCog className="w-4 h-4" />
          <span>Kelola Pengguna Panitia</span>
        </button>

        <button
          onClick={() => setAdminTab('pengaturan')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'pengaturan'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Sesi Pemilihan & Simulasi</span>
        </button>
      </div>

      {/* SUB-TAB 1: REKAP HASIL SUARA */}
      {adminTab === 'rekap' && (
        <div className="space-y-6">
          {/* Quick Download Card */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-300">
                Arsip Rekapitulasi Pemilihan
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                Unduh Rekapitulasi & Berita Acara Resmi
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Total Suara Sah: {totalVotes} dari {totalDpt} DPT ({turnout}%)
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDownloadBeritaAcara}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Berita Acara (.html)</span>
              </button>
              <button
                onClick={handleDownloadCsv}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Unduh Excel (.csv)</span>
              </button>
            </div>
          </div>

          {/* Rekapitulasi Perolehan Suara Paslon Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">
                Tabel Rekapitulasi Perolehan Suara Pasangan Calon
              </h4>
              <span className="text-xs text-slate-500 font-mono">
                {candidates.length} Paslon Terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 text-center w-14">No</th>
                    <th className="py-3 px-4">Paslon</th>
                    <th className="py-3 px-4">Calon Ketua & Wakil Ketua</th>
                    <th className="py-3 px-4 text-right">Perolehan Suara</th>
                    <th className="py-3 px-4 text-right">Persentase</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedCandidates.map((cand, idx) => {
                    const pct = totalVotes > 0 ? ((cand.votes / totalVotes) * 100).toFixed(1) : '0.0';
                    const isWinner = idx === 0 && cand.votes > 0;
                    return (
                      <tr key={cand.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                          0{cand.number}
                        </td>
                        <td className="py-3 px-4">
                          <img
                            src={cand.photoUrl}
                            alt={cand.chairmanName}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {cand.chairmanName} & {cand.viceChairmanName}
                          </div>
                          <div className="text-[11px] text-slate-500 italic">
                            &ldquo;{cand.slogan}&rdquo;
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                          {cand.votes} Suara
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-blue-700 text-sm">
                          {pct}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isWinner ? (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
                              Unggul (Peringkat 1)
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              Peringkat {idx + 1}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Demografi & Partisipasi Suara */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kehadiran Gender */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Partisipasi Berdasarkan Jenis Kelamin
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-slate-700">Laki-laki (L)</span>
                    <span className="font-mono text-slate-500">
                      {maleVoted} / {maleTotal} ({maleTotal > 0 ? ((maleVoted / maleTotal) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${maleTotal > 0 ? (maleVoted / maleTotal) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-slate-700">Perempuan (P)</span>
                    <span className="font-mono text-slate-500">
                      {femaleVoted} / {femaleTotal} ({femaleTotal > 0 ? ((femaleVoted / femaleTotal) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${femaleTotal > 0 ? (femaleVoted / femaleTotal) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Suara Masuk vs Sisa */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Ringkasan Partisipasi Suara
              </h4>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <div className="text-2xl font-black text-emerald-700 tabular-nums">{totalVotes}</div>
                  <div className="text-[11px] text-emerald-800 font-semibold">Suara Sah Masuk</div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="text-2xl font-black text-amber-700 tabular-nums">{nonVoters}</div>
                  <div className="text-[11px] text-amber-800 font-semibold">Belum Memilih</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: INPUT & EDIT DATA CALON */}
      {adminTab === 'kandidat' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Manajemen Pasangan Calon (Kandidat OSIS)
              </h3>
              <p className="text-xs text-slate-500">
                Input, perbarui data visi-misi, atau tambahkan pasangan calon baru
              </p>
            </div>
            <button
              onClick={() => {
                setCandidateToEdit(null);
                setIsCandidateModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Input Calon Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {candidates.map((cand) => (
              <div
                key={cand.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="px-2.5 py-0.5 rounded-md text-xs font-bold text-white shadow-xs"
                      style={{ backgroundColor: cand.color.primary }}
                    >
                      Nomor Urut 0{cand.number}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {cand.votes} Suara
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={cand.photoUrl}
                      alt={cand.chairmanName}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {cand.chairmanName}
                      </h4>
                      <p className="text-xs text-slate-600">& {cand.viceChairmanName}</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 italic line-clamp-2 mb-2">
                    &ldquo;{cand.slogan}&rdquo;
                  </p>

                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-3">
                    <strong>Visi:</strong> {cand.vision}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setCandidateToEdit(cand);
                      setIsCandidateModalOpen(true);
                    }}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Data</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCandidate(cand)}
                    className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: KELOLA DPT & IMPORT EXCEL */}
      {adminTab === 'dpt' && (
        <div className="space-y-6">
          {/* Form Tambah Siswa Manual */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              Input Cepat Siswa Baru (Manual):
            </span>
            <form onSubmit={handleAddStudentSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  NO INDUK (NIS) *
                </label>
                <input
                  type="text"
                  value={newNis}
                  onChange={(e) => setNewNis(e.target.value)}
                  placeholder="2026099"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  NISN (10 Digit)
                </label>
                <input
                  type="text"
                  value={newNisn}
                  onChange={(e) => setNewNisn(e.target.value)}
                  placeholder="0081234567"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  NAMA SISWA *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  KELAS
                </label>
                <select
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="X MIPA 1">X MIPA 1</option>
                  <option value="X MIPA 2">X MIPA 2</option>
                  <option value="X IPS 1">X IPS 1</option>
                  <option value="XI MIPA 1">XI MIPA 1</option>
                  <option value="XI MIPA 2">XI MIPA 2</option>
                  <option value="XI IPS 1">XI IPS 1</option>
                  <option value="XII MIPA 1">XII MIPA 1</option>
                  <option value="XII MIPA 2">XII MIPA 2</option>
                  <option value="XII IPS 1">XII IPS 1</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  JK
                </label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value as 'L' | 'P')}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Simpan Siswa</span>
                </button>
              </div>
            </form>
          </div>

          {/* Full DPT Table with Search, Filter & Excel Import */}
          <DptList
            students={students}
            onSelectStudentToVote={onSelectStudentToVote || (() => {})}
          />
        </div>
      )}

      {/* SUB-TAB 4: PENGATURAN SESI & SIMULASI */}
      {adminTab === 'pengaturan' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Buka Tutup Pemilihan */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Status Pemungutan Suara</h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  settings.isOpen
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {settings.isOpen ? 'Dibuka (Aktif)' : 'Ditutup'}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Jika pemilihan ditutup, siswa tidak dapat memilih di bilik suara.
            </p>

            <button
              onClick={() => {
                playSound('click');
                void toggleElectionOpen(!settings.isOpen);
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                settings.isOpen
                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
              }`}
            >
              {settings.isOpen ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Tutup Sesi Pemilihan Sekarang</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Buka Kembali Sesi Pemilihan</span>
                </>
              )}
            </button>
          </div>

          {/* Card 2: Uji Coba Cepat */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Simulasi Pemilih Cepat</h3>
              <Zap className="w-4 h-4 text-amber-600" />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Kirim suara acak untuk mengamati pergerakan grafik persentase suara real count.
            </p>

            <div className="pt-2">
              <button
                onClick={handleSimulateOne}
                className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                +1 Suara Simulasi Acak
              </button>
            </div>
            {simMessage && (
              <p className="text-[11px] text-blue-700 font-medium">{simMessage}</p>
            )}
          </div>

          {/* Reset Data Danger Zone */}
          <div className="col-span-full bg-white rounded-xl p-5 border border-rose-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Reset Seluruh Data ke Semula</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mengembalikan data paslon, status suara siswa, dan DPT ke data awal.
              </p>
            </div>

            {showResetConfirm ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    void resetAllData();
                    setShowResetConfirm(false);
                    playSound('click');
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Ya, Reset Sekarang
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Data Pemilihan</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: KELOLA PENGGUNA PANITIA */}
      {adminTab === 'pengguna' && <AdminUserManager />}

      {/* Modals */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setSuccessNote('Data siswa dari Excel berhasil diimpor ke DPT!');
          setTimeout(() => setSuccessNote(null), 4000);
        }}
      />

      <CandidateFormModal
        isOpen={isCandidateModalOpen}
        onClose={() => setIsCandidateModalOpen(false)}
        candidateToEdit={candidateToEdit}
        existingCount={candidates.length}
      />
    </div>
  );
};
