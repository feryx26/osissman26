import React from 'react';
import { ActiveTab, Student } from '../types';
import { OSIS_EMBLEM_URL } from '../data/initialData';
import { Vote, LogOut, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentStudent: Student | null;
  onLogout: () => void;
  isElectionOpen: boolean;
  schoolName?: string;
  logoUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentStudent,
  onLogout,
  isElectionOpen,
  schoolName = 'SMA NEGERI 26 GARUT',
  logoUrl = OSIS_EMBLEM_URL,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Wordmark & School Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg p-1 transition-opacity hover:opacity-90"
            >
              <img
                src={logoUrl || OSIS_EMBLEM_URL}
                alt={`Logo ${schoolName}`}
                className="w-10 h-10 object-contain rounded-md shadow-xs bg-white border border-slate-200/80 p-0.5"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                  E-Pilketos OSIS
                </span>
                <span className="text-[11px] font-semibold text-blue-700 whitespace-nowrap">
                  {schoolName}
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Single-Line, Anti-Slop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'dashboard'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : ''
              }`}
            >
              Real Count
            </button>
            <button
              onClick={() => setActiveTab('bilik-suara')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
                activeTab === 'bilik-suara'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : ''
              }`}
            >
              <span>Bilik Suara</span>
              {currentStudent?.hasVoted && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('kandidat')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'kandidat'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : ''
              }`}
            >
              Profil Paslon
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : ''
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Panitia KPU</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action / User State */}
          <div className="flex items-center gap-3 shrink-0">
            {currentStudent ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
                    {currentStudent.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    NIS: {currentStudent.nis} · {currentStudent.grade}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Keluar / Ganti Siswa"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ganti Akun</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('bilik-suara')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all shadow-xs whitespace-nowrap shrink-0 ${
                  isElectionOpen
                    ? 'text-white bg-blue-600 hover:bg-blue-700 active:scale-98'
                    : 'text-slate-500 bg-slate-200 cursor-not-allowed'
                }`}
              >
                <Vote className="w-4 h-4" />
                <span>Masuk Bilik Suara</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 bg-slate-50/90 px-2 py-2 text-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-2.5 py-1 rounded-md font-medium ${
            activeTab === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-slate-600'
          }`}
        >
          Real Count
        </button>
        <button
          onClick={() => setActiveTab('bilik-suara')}
          className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 ${
            activeTab === 'bilik-suara' ? 'bg-blue-100 text-blue-700' : 'text-slate-600'
          }`}
        >
          <span>Bilik Suara</span>
          {currentStudent?.hasVoted && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('kandidat')}
          className={`px-2.5 py-1 rounded-md font-medium ${
            activeTab === 'kandidat' ? 'bg-blue-100 text-blue-700' : 'text-slate-600'
          }`}
        >
          Paslon
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`px-2.5 py-1 rounded-md font-medium ${
            activeTab === 'admin' ? 'bg-blue-100 text-blue-700' : 'text-slate-600'
          }`}
        >
          Panitia KPU
        </button>
      </div>
    </header>
  );
};
