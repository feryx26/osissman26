import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Student } from '../types';
import { importStudentsBatch, playSound } from '../services/storageService';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  ClipboardPaste,
  HelpCircle,
  FileCheck2
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedStudentRow {
  nis: string;
  name: string;
  gender: 'L' | 'P';
  nisn: string;
  grade: string;
  isValid: boolean;
  error?: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [defaultGrade, setDefaultGrade] = useState('X MIPA 1');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Flexible column mapper that detects variations of column names
  const normalizeKeys = (row: Record<string, unknown>): Record<string, string> => {
    const normalized: Record<string, string> = {};
    Object.keys(row).forEach((k) => {
      const cleanKey = k.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      normalized[cleanKey] = String(row[k] ?? '').trim();
    });
    return normalized;
  };

  const processRawData = (rows: Record<string, unknown>[]) => {
    setErrorMessage(null);
    if (!rows || rows.length === 0) {
      setErrorMessage('File atau data tidak mengandung baris data siswa.');
      return;
    }

    const parsed: ParsedStudentRow[] = [];

    rows.forEach((row, idx) => {
      const norm = normalizeKeys(row);

      // Match NO INDUK (NIS)
      const rawNis =
        norm['NOINDUK'] ||
        norm['INDUK'] ||
        norm['NIS'] ||
        norm['NOMORINDUK'] ||
        norm['ID'] ||
        norm['NISN'] || // fallback
        '';

      // Match NAMA
      const rawName =
        norm['NAMA'] ||
        norm['NAMASISWA'] ||
        norm['NAMALENGKAP'] ||
        norm['NAME'] ||
        '';

      // Match JK
      const rawJk =
        norm['JK'] ||
        norm['JENISKELAMIN'] ||
        norm['GENDER'] ||
        norm['LP'] ||
        'L';

      // Match NISN
      const rawNisn =
        norm['NISN'] ||
        norm['NONISN'] ||
        norm['NOMORNISN'] ||
        '';

      // Match KELAS (optional)
      const rawGrade =
        norm['KELAS'] ||
        norm['TINGKAT'] ||
        norm['ROMBEL'] ||
        norm['JURUSAN'] ||
        defaultGrade;

      const cleanNis = String(rawNis).trim();
      const cleanName = String(rawName).trim();
      const cleanNisn = String(rawNisn).trim();
      const upperJk = String(rawJk).toUpperCase().trim();
      const cleanGender: 'L' | 'P' = upperJk === 'P' || upperJk.startsWith('PEREMPUAN') ? 'P' : 'L';

      const isValid = cleanNis.length > 0 && cleanName.length > 0;
      let error: string | undefined;
      if (!cleanNis) error = 'No Induk (NIS) kosong';
      else if (!cleanName) error = 'Nama Siswa kosong';

      parsed.push({
        nis: cleanNis,
        name: cleanName,
        gender: cleanGender,
        nisn: cleanNisn,
        grade: rawGrade || defaultGrade,
        isValid,
        error,
      });
    });

    if (parsed.length === 0) {
      setErrorMessage('Tidak ada data siswa yang berhasil terbaca.');
      return;
    }

    setParsedRows(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
        processRawData(data);
      } catch (err) {
        setErrorMessage('Gagal membaca file Excel/CSV. Pastikan format file valid (.xlsx, .xls, .csv).');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleProcessPastedText = () => {
    if (!pasteText.trim()) {
      setErrorMessage('Silakan tempel (paste) data dari Excel terlebih dahulu.');
      return;
    }

    const lines = pasteText.trim().split('\n');
    if (lines.length === 0) return;

    // Detect delimiter: tab or comma or semicolon
    const firstLine = lines[0];
    let delimiter = '\t';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';')) delimiter = ';';
    else if (firstLine.includes(',')) delimiter = ',';

    const headerParts = firstLine.split(delimiter).map((h) => h.trim());
    const hasHeader =
      headerParts.some((h) => h.toUpperCase().includes('INDUK') || h.toUpperCase().includes('NIS')) &&
      headerParts.some((h) => h.toUpperCase().includes('NAMA'));

    const startLineIndex = hasHeader ? 1 : 0;
    const headers = hasHeader
      ? headerParts
      : ['NO INDUK', 'NAMA', 'JK', 'NISN', 'KELAS'];

    const rows: Record<string, unknown>[] = [];

    for (let i = startLineIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cells = line.split(delimiter).map((c) => c.trim());
      const rowObj: Record<string, unknown> = {};

      headers.forEach((h, idx) => {
        rowObj[h] = cells[idx] || '';
      });

      // If no header, map standard order: [0] No Induk, [1] Nama, [2] JK, [3] NISN, [4] Kelas
      if (!hasHeader) {
        rowObj['NO INDUK'] = cells[0] || '';
        rowObj['NAMA'] = cells[1] || '';
        rowObj['JK'] = cells[2] || '';
        rowObj['NISN'] = cells[3] || '';
        rowObj['KELAS'] = cells[4] || defaultGrade;
      }

      rows.push(rowObj);
    }

    processRawData(rows);
  };

  const handleDownloadSampleExcel = () => {
    playSound('click');
    const sampleData = [
      {
        'NO INDUK': '2026101',
        'NAMA': 'Bagus Prasetyo',
        'JK': 'L',
        'NISN': '0081234561',
        'KELAS': 'X MIPA 1',
      },
      {
        'NO INDUK': '2026102',
        'NAMA': 'Cahaya Lestari',
        'JK': 'P',
        'NISN': '0081234562',
        'KELAS': 'X MIPA 1',
      },
      {
        'NO INDUK': '2026103',
        'NAMA': 'Davin Pratama',
        'JK': 'L',
        'NISN': '0081234563',
        'KELAS': 'XI MIPA 2',
      },
      {
        'NO INDUK': '2026104',
        'NAMA': 'Elsa Febrianti',
        'JK': 'P',
        'NISN': '0081234564',
        'KELAS': 'XII IPS 1',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
    XLSX.writeFile(wb, 'Template_Import_Siswa_Pilketos.xlsx');
  };

  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setErrorMessage('Tidak ada baris data yang valid untuk diimpor.');
      return;
    }

    const payload: Partial<Student>[] = validRows.map((r) => ({
      nis: r.nis,
      name: r.name,
      gender: r.gender,
      nisn: r.nisn || undefined,
      grade: r.grade || defaultGrade,
    }));

    setIsProcessing(true);
    const result = await importStudentsBatch(payload);
    setIsProcessing(false);
    setImportStatus(result.message);
    if (result.success) onSuccess();

    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8 overflow-hidden shadow-2xl border border-slate-200 animate-scale-up space-y-0">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Import Data Siswa (DPT) dari Excel / CSV
              </h3>
              <p className="text-xs text-blue-200">
                Format kolom: <strong>NO INDUK, NAMA, JK, NISN</strong> (dan opsional KELAS)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Method Tabs & Template Download */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File Excel (.xlsx / .csv)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Salin-Tempel (Copy-Paste)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadSampleExcel}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template Excel (.xlsx)</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {importStatus && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Tab 1: Upload File */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  {fileName ? fileName : 'Pilih atau Tarik File Excel ke Sini'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Mendukung format Microsoft Excel (.xlsx, .xls) dan CSV (.csv)
                </p>
                <div className="mt-3 inline-block px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs">
                  Pilih File Dari Komputer
                </div>
              </div>

              {/* Default Grade Selector if grade is missing in Excel */}
              <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-600">
                  Tingkat Kelas Bawaan (jika kolom KELAS kosong di Excel):
                </span>
                <select
                  value={defaultGrade}
                  onChange={(e) => setDefaultGrade(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
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
            </div>
          )}

          {/* Tab 2: Copy-Paste Direct */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold">
                  Tempel (Paste) baris sel dari Excel Anda langsung di sini:
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Urutan: NO INDUK [Tab] NAMA [Tab] JK [Tab] NISN
                </span>
              </div>
              <textarea
                rows={5}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="2026101	Bagus Prasetyo	L	0081234561	X MIPA 1&#10;2026102	Cahaya Lestari	P	0081234562	X MIPA 1"
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleProcessPastedText}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Proses Teks Hasil Paste
                </button>
              </div>
            </div>
          )}

          {/* Data Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Pratinjau Data yang Terbaca ({parsedRows.length} baris)
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
                    {validCount} Valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-sm">
                      {invalidCount} Tidak Lengkap
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 sticky top-0 uppercase">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">No</th>
                      <th className="py-2 px-3">NO INDUK (NIS)</th>
                      <th className="py-2 px-3">NAMA SISWA</th>
                      <th className="py-2 px-3 text-center">JK</th>
                      <th className="py-2 px-3 font-mono">NISN</th>
                      <th className="py-2 px-3">KELAS</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {parsedRows.slice(0, 50).map((r, idx) => (
                      <tr
                        key={idx}
                        className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}
                      >
                        <td className="py-2 px-3 text-center font-mono text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                          {r.nis || '-'}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {r.name || '-'}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-medium">
                          {r.gender}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {r.nisn || '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {r.grade}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {r.isValid ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                              OK
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-sm">
                              {r.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedRows.length > 50 && (
                <p className="text-[11px] text-slate-400 italic text-center">
                  Menampilkan 50 baris pertama dari total {parsedRows.length} data.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={validCount === 0 || isProcessing}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simpan & Impor {validCount} Siswa ke DPT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
