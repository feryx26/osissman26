import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import {
  Search,
  CheckCircle2,
  Clock,
  Vote,
  Users,
  FileSpreadsheet,
  Download,
  KeyRound,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { playSound, regenerateAllTokens, getSettings } from '../services/storageService';
import { downloadDptCsv } from '../services/exportService';
import { ExcelImportModal } from './ExcelImportModal';

interface DptListProps {
  students: Student[];
  onSelectStudentToVote: (student: Student) => void;
}

export const DptList: React.FC<DptListProps> = ({
  students,
  onSelectStudentToVote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [copiedTokenNis, setCopiedTokenNis] = useState<string | null>(null);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return students.filter((s) => {
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.nis.includes(q) ||
        (s.nisn && s.nisn.includes(q)) ||
        (s.token && s.token.includes(q));

      const matchesGrade =
        gradeFilter === 'ALL' || s.grade.startsWith(gradeFilter);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'VOTED' && s.hasVoted) ||
        (statusFilter === 'NOT_VOTED' && !s.hasVoted);

      return matchesSearch && matchesGrade && matchesStatus;
    });
  }, [students, searchQuery, gradeFilter, statusFilter]);

  const totalVoted = students.filter((s) => s.hasVoted).length;
  const totalNotVoted = students.length - totalVoted;

  const handleCopyToken = (nis: string, token: string) => {
    try {
      navigator.clipboard.writeText(token);
      setCopiedTokenNis(nis);
      playSound('click');
      setTimeout(() => setCopiedTokenNis(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleExportDpt = async () => {
    playSound('click');
    const settings = await getSettings();
    if (settings) downloadDptCsv(students, settings);
  };

  const handleRegenerateTokens = async () => {
    if (confirm('Apakah Anda yakin ingin mengacak ulang semua token pemilih? Siswa harus menggunakan token yang baru dibuat untuk login.')) {
      await regenerateAllTokens();
      alert('Semua token pemilihan siswa berhasil diacak ulang!');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <Users className="w-4 h-4" />
            <span>Data Pemilih Resmi KPU Sekolah</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Daftar Pemilih Tetap (DPT) & Token Pemilihan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Setiap siswa wajib memasukkan <strong>Nomor Induk (NIS)</strong> dan <strong>Token 6 Digit Acak</strong> untuk masuk ke bilik suara.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl text-center">
            <div className="font-bold text-base tabular-nums">{totalVoted}</div>
            <div className="text-[10px] text-emerald-700">Sudah Memilih</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl text-center">
            <div className="font-bold text-base tabular-nums">{totalNotVoted}</div>
            <div className="text-[10px] text-amber-700">Belum Memilih</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 text-slate-800 px-3 py-2 rounded-xl text-center">
            <div className="font-bold text-base tabular-nums">{students.length}</div>
            <div className="text-[10px] text-slate-500">Total DPT</div>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIS, NISN, atau token..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Tabs & Import/Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Grade filter */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Semua Tingkat</option>
            <option value="X">Kelas X</option>
            <option value="XI">Kelas XI</option>
            <option value="XII">Kelas XII</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="VOTED">Sudah Memilih</option>
            <option value="NOT_VOTED">Belum Memilih</option>
          </select>

          <button
            type="button"
            onClick={handleExportDpt}
            title="Download seluruh data DPT beserta token dalam format CSV"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export DPT & Token (.csv)</span>
          </button>

          <button
            type="button"
            onClick={handleRegenerateTokens}
            title="Acak ulang semua 6 digit angka token pemilih"
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Acak Token</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import Excel (NO INDUK, NAMA, JK, NISN)</span>
          </button>
        </div>
      </div>

      {/* DPT Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3">NO INDUK</th>
                <th className="py-3 px-3">NISN</th>
                <th className="py-3 px-4">NAMA SISWA</th>
                <th className="py-3 px-3">KELAS</th>
                <th className="py-3 px-2 text-center">JK</th>
                <th className="py-3 px-3 text-center bg-blue-50/60 text-blue-800">
                  <div className="flex items-center justify-center gap-1">
                    <KeyRound className="w-3 h-3 text-blue-600" />
                    <span>TOKEN / CAPTCHA</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Status Suara</th>
                <th className="py-3 px-3">Waktu Rekam</th>
                <th className="py-3 px-3 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada data siswa yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => (
                  <tr
                    key={st.nis}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                      {st.nis}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {st.nisn || '-'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {st.name}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">
                      {st.grade}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-slate-600 font-semibold">
                      {st.gender}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-blue-50/80 border border-blue-200/80 rounded-md px-2 py-0.5">
                        <span className="font-mono font-bold text-blue-700 tracking-wider text-xs">
                          {st.token}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyToken(st.nis, st.token)}
                          title="Salin Token"
                          className="text-blue-500 hover:text-blue-800 transition-colors cursor-pointer"
                        >
                          {copiedTokenNis === st.nis ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {st.hasVoted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Sudah Memilih</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm">
                          <Clock className="w-3 h-3" />
                          <span>Belum Memilih</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {st.votedAt || '-'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {!st.hasVoted ? (
                        <button
                          onClick={() => {
                            playSound('click');
                            onSelectStudentToVote(st);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Vote className="w-3 h-3" />
                          <span>Pilih Sebagai Siswa Ini</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            playSound('click');
                            onSelectStudentToVote(st);
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                        >
                          Lihat Bukti
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
};
