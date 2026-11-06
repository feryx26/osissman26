import React from 'react';
import { Candidate, ElectionSettings, Student } from '../types';
import { OSIS_EMBLEM_URL } from '../data/initialData';
import { X, Printer, ShieldCheck, Download } from 'lucide-react';
import { downloadBeritaAcaraHtml } from '../services/exportService';

interface BeritaAcaraModalProps {
  candidates: Candidate[];
  students: Student[];
  settings: ElectionSettings;
  onClose: () => void;
}

export const BeritaAcaraModal: React.FC<BeritaAcaraModalProps> = ({
  candidates,
  students,
  settings,
  onClose,
}) => {
  const totalVotes = candidates.reduce((s, c) => s + c.votes, 0);
  const totalDpt = students.length;
  const nonVoters = totalDpt - totalVotes;
  const turnout = totalDpt > 0 ? ((totalVotes / totalDpt) * 100).toFixed(1) : '0';

  const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes);
  const winner = sortedCandidates[0];

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    downloadBeritaAcaraHtml(candidates, students, settings);
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 overflow-hidden shadow-2xl border border-slate-200 print:shadow-none print:border-none">
        {/* Modal Bar (Screen Only) */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Dokumen Resmi: Berita Acara Rekapitulasi</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File (.html)</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document */}
        <div className="p-8 sm:p-10 space-y-6 text-slate-900 bg-white font-serif">
          {/* Official Letterhead (Kop Surat) */}
          <div className="text-center pb-4 border-b-2 border-slate-900 relative">
            <div className="flex items-center justify-center gap-4">
              <img
                src={settings.logoUrl || OSIS_EMBLEM_URL}
                alt={`Logo ${settings.schoolName}`}
                className="w-16 h-16 object-contain"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  PEMERINTAH DAERAH PROVINSI JAWA BARAT
                </h3>
                <h2 className="text-base font-extrabold uppercase">
                  DINAS PENDIDIKAN
                </h2>
                <h1 className="text-lg font-black uppercase tracking-tight">
                  {settings.schoolName}
                </h1>
                <p className="text-xs font-sans text-slate-600">
                  {settings.schoolAddress} · Tahun Ajaran {settings.schoolYear}
                </p>
              </div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center space-y-1">
            <h3 className="text-sm font-bold uppercase underline tracking-wide">
              BERITA ACARA REKAPITULASI HASIL PENGHITUNGAN SUARA
            </h3>
            <p className="text-xs font-sans text-slate-600">
              Nomor: 042/BA-KPU/PILKETOS/{settings.schoolYear.replace('/', '-')}
            </p>
          </div>

          {/* Body Text */}
          <div className="text-xs font-sans leading-relaxed text-slate-700 space-y-3">
            <p>
              Pada hari ini, <strong>{currentDate}</strong>, Panitia Pemilihan Ketua dan Wakil Ketua OSIS {settings.schoolName} telah menyelenggarakan pemungutan dan penghitungan suara secara elektronik (e-Voting) dengan hasil rekapitulasi sebagai berikut:
            </p>

            {/* DPT Summary Table */}
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>1. Jumlah Pemilih Terdaftar (DPT)</span>
                <span className="font-bold font-mono">{totalDpt} Siswa</span>
              </div>
              <div className="flex justify-between">
                <span>2. Jumlah Suara Masuk (Sah)</span>
                <span className="font-bold font-mono text-emerald-700">{totalVotes} Suara</span>
              </div>
              <div className="flex justify-between">
                <span>3. Jumlah Pemilih Tidak Memilih (Belum/Golput)</span>
                <span className="font-bold font-mono text-amber-700">{nonVoters} Siswa</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1">
                <span>4. Tingkat Partisipasi Siswa</span>
                <span className="font-bold font-mono text-blue-700">{turnout}%</span>
              </div>
            </div>

            {/* Candidate Breakdown Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                  <tr>
                    <th className="py-2 px-3 text-center w-12">No</th>
                    <th className="py-2 px-3">Nama Pasangan Calon</th>
                    <th className="py-2 px-3 text-right">Perolehan Suara</th>
                    <th className="py-2 px-3 text-right">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {candidates.map((cand) => {
                    const pct = totalVotes > 0 ? ((cand.votes / totalVotes) * 100).toFixed(1) : '0';
                    return (
                      <tr key={cand.id}>
                        <td className="py-2 px-3 text-center font-bold">0{cand.number}</td>
                        <td className="py-2 px-3">
                          <span className="font-bold">{cand.chairmanName}</span> & {cand.viceChairmanName}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">{cand.votes}</td>
                        <td className="py-2 px-3 text-right font-mono">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Determination */}
            <p className="bg-blue-50/80 p-3 rounded-lg border border-blue-200 text-blue-950">
              Berdasarkan hasil penghitungan sistem Real Count di atas, pasangan calon yang memperoleh suara terbanyak adalah <strong>Pasangan Calon No. 0{winner.number} ({winner.chairmanName} & {winner.viceChairmanName})</strong> dengan total <strong>{winner.votes} suara</strong> ({totalVotes > 0 ? ((winner.votes / totalVotes) * 100).toFixed(1) : 0}%).
            </p>

            <p>
              Demikian Berita Acara ini dibuat dan disahkan dengan sebenar-benarnya untuk dipergunakan sebagaimana mestinya.
            </p>
          </div>

          {/* Signature Grid */}
          <div className="pt-6 font-sans text-xs">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-12">
                <p>Ketua Panitia KPU,</p>
                <div>
                  <p className="font-bold underline">Fajar Maulana, S.Pd.</p>
                  <p className="text-[10px] text-slate-500">NIP. 19850412 201001 1 012</p>
                </div>
              </div>

              <div className="space-y-12">
                <p>Pembina OSIS,</p>
                <div>
                  <p className="font-bold underline">Dra. Hj. Nurjanah, M.Pd.</p>
                  <p className="text-[10px] text-slate-500">NIP. 19720815 199802 2 001</p>
                </div>
              </div>

              <div className="space-y-12">
                <p>Kepala Sekolah,</p>
                <div>
                  <p className="font-bold underline">Dr. H. Bambang Subagyo, M.M.</p>
                  <p className="text-[10px] text-slate-500">NIP. 19681120 199403 1 004</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Close Button (Screen Only) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center print:hidden">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Tutup Berita Acara
          </button>
        </div>
      </div>
    </div>
  );
};
