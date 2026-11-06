import React from 'react';
import { Student, ElectionSettings } from '../types';
import { OSIS_EMBLEM_URL } from '../data/initialData';
import { X, Printer, CheckCircle, Fingerprint, ShieldCheck } from 'lucide-react';

interface BuktiMemilihModalProps {
  student: Student | null;
  settings: ElectionSettings;
  onClose: () => void;
}

export const BuktiMemilihModal: React.FC<BuktiMemilihModalProps> = ({
  student,
  settings,
  onClose,
}) => {
  if (!student) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 my-8 print:shadow-none print:border-none">
        {/* Modal Actions */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tanda Terima Resmi e-Voting</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
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

        {/* Printable Certificate Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white">
          {/* Header */}
          <div className="text-center pb-4 border-b-2 border-slate-800">
            <img
              src={settings.logoUrl || OSIS_EMBLEM_URL}
              alt={`Logo ${settings.schoolName}`}
              className="w-14 h-14 object-contain mx-auto mb-2"
              referrerPolicy="no-referrer"
            />
            <h3 className="text-sm font-extrabold tracking-wide uppercase text-slate-900">
              KOMISI PEMILIHAN KETUA OSIS (KPU SEKOLAH)
            </h3>
            <h2 className="text-base font-bold text-slate-900">
              {settings.schoolName}
            </h2>
            <p className="text-[11px] text-slate-500">
              {settings.schoolAddress} · Tahun Ajaran {settings.schoolYear}
            </p>
          </div>

          <div className="text-center space-y-1">
            <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
              Surat Bukti Penggunaan Hak Suara
            </div>
            <p className="text-xs text-slate-500">
              Menyatakan dengan sesungguhnya bahwa siswa berikut telah menggunakan hak pilih secara sah:
            </p>
          </div>

          {/* Student Info Box */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2.5">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500">Nama Siswa</span>
              <span className="col-span-2 font-bold text-slate-900">: {student.name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500">NIS (Nomor Induk)</span>
              <span className="col-span-2 font-mono font-semibold text-slate-900">: {student.nis}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500">Kelas / Jurusan</span>
              <span className="col-span-2 font-semibold text-slate-900">: {student.grade}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500">Waktu Memilih</span>
              <span className="col-span-2 font-mono font-semibold text-emerald-700">: {student.votedAt || 'Hari Ini'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500">Kode Verifikasi</span>
              <span className="col-span-2 font-mono font-bold text-blue-700">: {student.receiptId || 'REC-VERIFIED'}</span>
            </div>
          </div>

          {/* Stamped Purple Ink & Security Seal */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-purple-100 border border-purple-300 text-purple-700 flex items-center justify-center font-bold">
                <Fingerprint className="w-7 h-7" />
              </div>
              <div className="text-[11px]">
                <div className="font-bold text-purple-900">TINTA DIGITAL OSIS</div>
                <div className="text-purple-700">Terverifikasi 1 Suara Sah</div>
              </div>
            </div>

            {/* Simulated QR Code Stamp */}
            <div className="text-right">
              <div className="inline-block p-1.5 border border-slate-300 rounded-md bg-white">
                <svg className="w-14 h-14" viewBox="0 0 40 40" fill="currentColor">
                  {/* Outer corner marks */}
                  <rect x="2" y="2" width="10" height="10" fill="#0f172a" />
                  <rect x="4" y="4" width="6" height="6" fill="#ffffff" />
                  <rect x="5" y="5" width="4" height="4" fill="#0f172a" />

                  <rect x="28" y="2" width="10" height="10" fill="#0f172a" />
                  <rect x="30" y="4" width="6" height="6" fill="#ffffff" />
                  <rect x="31" y="5" width="4" height="4" fill="#0f172a" />

                  <rect x="2" y="28" width="10" height="10" fill="#0f172a" />
                  <rect x="4" y="30" width="6" height="6" fill="#ffffff" />
                  <rect x="5" y="31" width="4" height="4" fill="#0f172a" />

                  {/* Internal mock data blocks */}
                  <rect x="15" y="4" width="3" height="3" fill="#0f172a" />
                  <rect x="21" y="4" width="3" height="3" fill="#0f172a" />
                  <rect x="15" y="10" width="3" height="3" fill="#0f172a" />
                  <rect x="18" y="15" width="4" height="4" fill="#0f172a" />
                  <rect x="25" y="16" width="3" height="3" fill="#0f172a" />
                  <rect x="14" y="22" width="4" height="3" fill="#0f172a" />
                  <rect x="22" y="25" width="4" height="4" fill="#0f172a" />
                  <rect x="30" y="28" width="3" height="3" fill="#0f172a" />
                  <rect x="34" y="34" width="4" height="4" fill="#0f172a" />
                  <rect x="16" y="32" width="3" height="3" fill="#0f172a" />
                </svg>
              </div>
              <p className="text-[9px] text-slate-400 font-mono mt-0.5">Scan Verifikasi</p>
            </div>
          </div>

          {/* Footer Official Seal Text */}
          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-1">
            <p>Dokumen ini diterbitkan secara otomatis oleh Sistem E-Pilketos Terpadu.</p>
            <p>Pilihan bersifat rahasia dan dilindungi oleh Undang-Undang Pemilihan Siswa.</p>
          </div>
        </div>

        {/* Modal Close Button (Screen Only) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center print:hidden">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Selesai / Kembali
          </button>
        </div>
      </div>
    </div>
  );
};
