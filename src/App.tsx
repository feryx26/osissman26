import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, Candidate, Student, ElectionSettings, VoteLog } from './types';
import {
  getCandidates,
  getStudents,
  getSettings,
  getVoteLogs,
  getCurrentStudent,
  setCurrentStudent,
  playSound,
} from './services/storageService';
import { isSupabaseConfigured } from './services/supabaseClient';
import { Header } from './components/Header';
import { RealCountDashboard } from './components/RealCountDashboard';
import { VotingBooth } from './components/VotingBooth';
import { CandidateList } from './components/CandidateList';
import { DptList } from './components/DptList';
import { AdminPanel } from './components/AdminPanel';
import { CandidateModal } from './components/CandidateModal';
import { BuktiMemilihModal } from './components/BuktiMemilihModal';
import { BeritaAcaraModal } from './components/BeritaAcaraModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [logs, setLogs] = useState<VoteLog[]>([]);
  const [currentStudent, setCurrentStudentState] = useState<Student | null>(null);

  // Modals
  const [activeCandidateModal, setActiveCandidateModal] = useState<Candidate | null>(null);
  const [receiptStudentModal, setReceiptStudentModal] = useState<Student | null>(null);
  const [isBeritaAcaraOpen, setIsBeritaAcaraOpen] = useState(false);

  // Load all data from Supabase
  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const [cands, stds, stgs, logList, currStudent] = await Promise.all([
      getCandidates(),
      getStudents(),
      getSettings(),
      getVoteLogs(),
      getCurrentStudent(),
    ]);
    setCandidates(cands);
    setStudents(stds);
    setSettings(stgs);
    setLogs(logList);
    setCurrentStudentState(currStudent);
  }, []);

  useEffect(() => {
    void loadData();

    const handleDataChange = () => {
      void loadData();
    };

    window.addEventListener('pilketos_data_change', handleDataChange);
    window.addEventListener('pilketos_user_change', handleDataChange);

    return () => {
      window.removeEventListener('pilketos_data_change', handleDataChange);
      window.removeEventListener('pilketos_user_change', handleDataChange);
    };
  }, [loadData]);

  const handleStudentLogin = (student: Student) => {
    setCurrentStudentState(student);
    setActiveTab('bilik-suara');
  };

  const handleLogout = () => {
    playSound('click');
    void setCurrentStudent(null);
    setCurrentStudentState(null);
  };

  const handleSelectStudentToVote = (student: Student) => {
    void setCurrentStudent(student);
    setCurrentStudentState(student);
    setActiveTab('bilik-suara');
  };

  const handleVoteForCandidate = (candidate: Candidate) => {
    setActiveTab('bilik-suara');
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl p-6 text-center space-y-3 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">Konfigurasi Supabase Belum Lengkap</h1>
          <p className="text-sm text-slate-600">
            Tambahkan <code className="font-mono text-xs bg-slate-100 px-1 rounded">VITE_SUPABASE_URL</code> dan{' '}
            <code className="font-mono text-xs bg-slate-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> pada file{' '}
            <code className="font-mono text-xs bg-slate-100 px-1 rounded">.env</code>, lalu jalankan ulang aplikasi.
          </p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Memuat Sistem E-Pilketos...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-900">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          playSound('click');
          setActiveTab(tab);
        }}
        currentStudent={currentStudent}
        onLogout={handleLogout}
        isElectionOpen={settings.isOpen}
        schoolName={settings.schoolName}
        logoUrl={settings.logoUrl}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'dashboard' && (
          <RealCountDashboard
            candidates={candidates}
            students={students}
            settings={settings}
            logs={logs}
            onOpenCandidateModal={(cand) => setActiveCandidateModal(cand)}
            onGoToVotingBooth={() => {
              playSound('click');
              setActiveTab('bilik-suara');
            }}
            currentStudent={currentStudent}
          />
        )}

        {activeTab === 'bilik-suara' && (
          <VotingBooth
            candidates={candidates}
            students={students}
            settings={settings}
            currentStudent={currentStudent}
            onStudentLogin={handleStudentLogin}
            onLogout={handleLogout}
            onViewRealCount={() => {
              playSound('click');
              setActiveTab('dashboard');
            }}
            onOpenCandidateModal={(cand) => setActiveCandidateModal(cand)}
            onOpenReceiptModal={(st) => setReceiptStudentModal(st)}
          />
        )}

        {activeTab === 'kandidat' && (
          <CandidateList
            candidates={candidates}
            onOpenCandidateModal={(cand) => setActiveCandidateModal(cand)}
            onVoteForCandidate={handleVoteForCandidate}
            isElectionOpen={settings.isOpen}
          />
        )}

        {activeTab === 'dpt' && (
          <AdminPanel
            candidates={candidates}
            students={students}
            settings={settings}
            onOpenBeritaAcara={() => setIsBeritaAcaraOpen(true)}
            onSelectStudentToVote={handleSelectStudentToVote}
            initialTab="dpt"
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            candidates={candidates}
            students={students}
            settings={settings}
            onOpenBeritaAcara={() => setIsBeritaAcaraOpen(true)}
            onSelectStudentToVote={handleSelectStudentToVote}
          />
        )}
      </main>

      {/* Modals */}
      <CandidateModal
        candidate={activeCandidateModal}
        onClose={() => setActiveCandidateModal(null)}
        onVoteForCandidate={handleVoteForCandidate}
        isElectionOpen={settings.isOpen}
      />

      <BuktiMemilihModal
        student={receiptStudentModal}
        settings={settings}
        onClose={() => setReceiptStudentModal(null)}
      />

      {isBeritaAcaraOpen && (
        <BeritaAcaraModal
          candidates={candidates}
          students={students}
          settings={settings}
          onClose={() => setIsBeritaAcaraOpen(false)}
        />
      )}

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-700">
              {settings.schoolName} · Pemilihan Ketua & Wakil Ketua OSIS
            </p>
            <p className="text-[11px] text-slate-400">
              Sistem e-Voting & Real Count Terbuka · Asas LUBER JURDIL
            </p>
          </div>
          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="hover:text-slate-800 transition-colors"
            >
              Real Count
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('bilik-suara')}
              className="hover:text-slate-800 transition-colors"
            >
              Bilik Suara
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('admin')}
              className="hover:text-slate-800 transition-colors"
            >
              KPU Sekolah
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
