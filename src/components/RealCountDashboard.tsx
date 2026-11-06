import React, { useState } from 'react';
import { Candidate, ElectionSettings, Student, VoteLog } from '../types';
import {
  Users,
  Vote,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Award,
  Zap,
  Info
} from 'lucide-react';
import { simulateRandomVote, playSound } from '../services/storageService';

interface RealCountDashboardProps {
  candidates: Candidate[];
  students: Student[];
  settings: ElectionSettings;
  logs?: VoteLog[];
  onOpenCandidateModal: (candidate: Candidate) => void;
  onGoToVotingBooth: () => void;
  currentStudent: Student | null;
}

export const RealCountDashboard: React.FC<RealCountDashboardProps> = ({
  candidates,
  students,
  settings,
  onOpenCandidateModal,
  onGoToVotingBooth,
  currentStudent,
}) => {
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationNote, setSimulationNote] = useState<string | null>(null);

  // Vote calculations
  const totalVotesCast = candidates.reduce((sum, c) => sum + c.votes, 0);
  const totalDpt = students.length;
  const remainingVoters = Math.max(0, totalDpt - totalVotesCast);
  const turnoutPercentage = totalDpt > 0 ? ((totalVotesCast / totalDpt) * 100).toFixed(1) : '0.0';

  // Find leader
  const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes);
  const leaderCandidate = sortedCandidates[0]?.votes > 0 ? sortedCandidates[0] : null;

  // Grade breakdown stats
  const gradeStats = [
    { grade: 'Kelas X', filter: 'X' },
    { grade: 'Kelas XI', filter: 'XI' },
    { grade: 'Kelas XII', filter: 'XII' },
  ].map((item) => {
    const totalInGrade = students.filter((s) => s.grade.startsWith(item.filter)).length;
    const votedInGrade = students.filter((s) => s.grade.startsWith(item.filter) && s.hasVoted).length;
    const percentage = totalInGrade > 0 ? ((votedInGrade / totalInGrade) * 100).toFixed(1) : '0.0';
    return {
      label: item.grade,
      voted: votedInGrade,
      total: totalInGrade,
      percentage,
    };
  });

  const handleSimulateOneVote = async () => {
    setIsSimulating(true);
    playSound('click');
    const result = await simulateRandomVote();
    if (result.success && result.studentName) {
      setSimulationNote(`Suara simulasi berhasil: ${result.studentName} memilih Paslon No. ${result.candidateNumber}`);
      setTimeout(() => setSimulationNote(null), 4000);
    } else {
      setSimulationNote(result.message);
      setTimeout(() => setSimulationNote(null), 3000);
    }
    setIsSimulating(false);
  };

  const handleSimulateBatchVotes = async () => {
    setIsSimulating(true);
    for (let i = 0; i < 4; i++) {
      await simulateRandomVote();
      await new Promise((resolve) => setTimeout(resolve, 280));
    }
    setIsSimulating(false);
    setSimulationNote('4 Suara simulasi baru berhasil dimasukkan ke sistem!');
    setTimeout(() => setSimulationNote(null), 4000);
  };

  // Compute SVG Donut Chart Coordinates
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header Strip */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl text-white p-6 sm:p-8 shadow-md border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-blue-200">
              <span className="font-semibold tracking-wide uppercase text-blue-300">
                {settings.schoolName}
              </span>
              <span aria-hidden="true">·</span>
              <span>Tahun Ajaran {settings.schoolYear}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${settings.isOpen ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                <span className="font-semibold text-white">
                  {settings.isOpen ? 'PEMILIHAN SEDANG BERLANGSUNG' : 'PEMILIHAN SELESAI / DITUTUP'}
                </span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white text-balance">
              {settings.electionTitle}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Pantau perolehan suara calon Ketua & Wakil Ketua OSIS secara langsung, transparan, dan terverifikasi otomatis.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              onClick={onGoToVotingBooth}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 whitespace-nowrap ${
                currentStudent?.hasVoted
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Vote className="w-4 h-4" />
              <span>
                {currentStudent?.hasVoted ? 'Lihat Bukti Coblos Anda' : 'Buka Bilik Suara Siswa'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtle background glow effect */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI 4-Card Grid Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Suara Masuk */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-medium">Total Suara Masuk</span>
            <Vote className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {totalVotesCast}
            </span>
            <span className="text-xs font-semibold text-blue-600 tabular-nums">
              {turnoutPercentage}%
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(100, Number(turnoutPercentage))}%` }}
            />
          </div>
        </div>

        {/* Total DPT */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-medium">Total DPT Terdaftar</span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {totalDpt}
            </span>
            <span className="text-xs text-slate-500">Siswa Aktif</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            Dari Kelas X, XI, & XII
          </p>
        </div>

        {/* Belum Memilih */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-medium">Belum Memilih</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {remainingVoters}
            </span>
            <span className="text-xs text-amber-700 font-medium tabular-nums">
              {totalDpt > 0 ? ((remainingVoters / totalDpt) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            Menunggu penyaluran suara
          </p>
        </div>

        {/* Paslon Terunggul */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-medium">Suara Terbanyak</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 truncate">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {leaderCandidate ? `No. ${leaderCandidate.number}` : '-'}
            </span>
            <span className="text-xs font-semibold text-emerald-600 truncate tabular-nums">
              {leaderCandidate ? `${leaderCandidate.votes} Suara` : '0 Suara'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 truncate">
            {leaderCandidate ? `${leaderCandidate.chairmanName} & ${leaderCandidate.viceChairmanName}` : 'Belum ada suara masuk'}
          </p>
        </div>
      </div>

      {/* Main Real Count Split: Detailed Paslon Bars + Interactive Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Candidate Detailed Vote Bars (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Perolehan Suara Pasangan Calon
              </h2>
              <p className="text-xs text-slate-500">
                Pembaruan otomatis tiap kali siswa menuntaskan coblosan di bilik suara
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Real Count</span>
            </div>
          </div>

          <div className="space-y-4">
            {candidates.map((cand) => {
              const percentage = totalVotesCast > 0 ? ((cand.votes / totalVotesCast) * 100).toFixed(1) : '0.0';
              const isLeader = leaderCandidate?.id === cand.id && cand.votes > 0;

              return (
                <div
                  key={cand.id}
                  className={`bg-white rounded-xl p-5 border transition-all duration-300 ${
                    isLeader
                      ? 'border-blue-300 shadow-sm ring-1 ring-blue-100'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Candidate Photo & Number */}
                    <div className="relative shrink-0">
                      <img
                        src={cand.photoUrl}
                        alt={`Paslon ${cand.number}`}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 shadow-xs"
                        referrerPolicy="no-referrer"
                      />
                      <div
                        className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-xs text-white ${
                          cand.number === 1 ? 'bg-blue-600' : cand.number === 2 ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      >
                        {cand.number}
                      </div>
                    </div>

                    {/* Candidate Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">
                              {cand.chairmanName} & {cand.viceChairmanName}
                            </h3>
                            {isLeader && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-sm">
                                Unggul Sementara
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 italic mt-0.5 truncate">
                            &ldquo;{cand.slogan}&rdquo;
                          </p>
                        </div>

                        {/* Votes & Percentage Badge */}
                        <div className="text-right shrink-0">
                          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums">
                            {percentage}%
                          </span>
                          <span className="block text-[11px] text-slate-500 font-medium tabular-nums">
                            {cand.votes} Suara
                          </span>
                        </div>
                      </div>

                      {/* Animated Progress Bar */}
                      <div className="mt-3 w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${Math.max(3, Number(percentage))}%`,
                            backgroundColor: cand.color.primary,
                          }}
                        />
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <button
                          onClick={() => onOpenCandidateModal(cand)}
                          className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>Visi, Misi & Program Kerja</span>
                        </button>
                        <span className="text-[11px] text-slate-400">
                          Paslon No. {cand.number}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Real Count Simulation Bar for User Testing */}
          <div className="bg-slate-100/90 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Mode Pengujian Cepat:</strong> Masukkan suara simulasi untuk menguji pembaruan grafik secara instan.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSimulateOneVote}
                disabled={isSimulating}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-lg border border-slate-300 shadow-2xs transition-colors disabled:opacity-50"
              >
                +1 Suara Simulasi
              </button>
              <button
                onClick={handleSimulateBatchVotes}
                disabled={isSimulating}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50"
              >
                +4 Suara Beruntun
              </button>
            </div>
          </div>
          {simulationNote && (
            <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 p-2.5 rounded-lg animate-fade-in font-medium">
              {simulationNote}
            </div>
          )}
        </div>

        {/* Right Column: Donut Visualizer & Live Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Circular Donut Visualizer */}
          <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Diagram Komposisi Suara
              </h3>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {totalVotesCast} / {totalDpt} Suara
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
                  {/* Background Track */}
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    stroke="#f1f5f9"
                    strokeWidth="18"
                    fill="transparent"
                  />

                  {/* Candidate Segments */}
                  {candidates.map((cand) => {
                    const pct = totalVotesCast > 0 ? cand.votes / totalVotesCast : 0;
                    const strokeDash = pct * circumference;
                    const strokeDashoffset = -accumulatedOffset;
                    accumulatedOffset += strokeDash;

                    return (
                      <circle
                        key={cand.id}
                        cx="90"
                        cy="90"
                        r={radius}
                        stroke={cand.color.primary}
                        strokeWidth="18"
                        strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="butt"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />
                    );
                  })}
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {turnoutPercentage}%
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    Partisipasi DPT
                  </span>
                </div>
              </div>

              {/* Custom Legend */}
              <div className="mt-5 grid grid-cols-3 gap-2 w-full pt-4 border-t border-slate-100 text-center">
                {candidates.map((cand) => {
                  const pct = totalVotesCast > 0 ? ((cand.votes / totalVotesCast) * 100).toFixed(1) : '0';
                  return (
                    <div key={cand.id} className="p-2 rounded-lg bg-slate-50">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cand.color.primary }}
                        />
                        <span className="text-xs font-bold text-slate-800">
                          Paslon {cand.number}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-900 tabular-nums">
                        {pct}%
                      </div>
                      <div className="text-[10px] text-slate-500 tabular-nums">
                        {cand.votes} suara
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Partisipasi Berdasarkan Jenjang Kelas */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-3">
              Tingkat Kehadiran per Tingkat Kelas
            </h3>
            <div className="space-y-3">
              {gradeStats.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <span className="text-slate-500 font-mono tabular-nums">
                      {item.voted} / {item.total} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-slate-700 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, Number(item.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
