import React, { useState, useEffect } from 'react';
import { Candidate, WorkProgram } from '../types';
import { saveCandidate, addCandidate, playSound } from '../services/storageService';
import { X, CheckCircle2, User, Sparkles, Target, Award, Image, Palette, Upload } from 'lucide-react';

interface CandidateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateToEdit: Candidate | null;
  existingCount: number;
}

const COLOR_THEMES = [
  {
    name: 'Biru Nusantara',
    primary: '#2563eb',
    light: '#eff6ff',
    border: '#bfdbfe',
    ring: 'ring-blue-500',
    bgHover: 'hover:bg-blue-50',
    badge: 'bg-blue-600 text-white',
    text: 'text-blue-700',
  },
  {
    name: 'Hijau Integritas',
    primary: '#059669',
    light: '#ecfdf5',
    border: '#a7f3d0',
    ring: 'ring-emerald-500',
    bgHover: 'hover:bg-emerald-50',
    badge: 'bg-emerald-600 text-white',
    text: 'text-emerald-700',
  },
  {
    name: 'Marun Semangat',
    primary: '#b91c1c',
    light: '#fef2f2',
    border: '#fecaca',
    ring: 'ring-rose-500',
    bgHover: 'hover:bg-rose-50',
    badge: 'bg-rose-600 text-white',
    text: 'text-rose-700',
  },
  {
    name: 'Ungu Kreatif',
    primary: '#7c3aed',
    light: '#f5f3ff',
    border: '#ddd6fe',
    ring: 'ring-purple-500',
    bgHover: 'hover:bg-purple-50',
    badge: 'bg-purple-600 text-white',
    text: 'text-purple-700',
  },
  {
    name: 'Emas Visioner',
    primary: '#d97706',
    light: '#fffbeb',
    border: '#fde68a',
    ring: 'ring-amber-500',
    bgHover: 'hover:bg-amber-50',
    badge: 'bg-amber-600 text-white',
    text: 'text-amber-700',
  },
];

/**
 * Membaca berkas gambar dari perangkat, mengecilkan ukurannya lewat canvas,
 * lalu mengembalikannya sebagai data URL (base64) agar bisa disimpan
 * langsung di kolom photo_url tanpa perlu storage bucket.
 */
const fileToCompressedDataUrl = (file: File, maxSize = 800, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Berkas bukan gambar yang valid.'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Peramban ini tidak mendukung pemrosesan gambar.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const CandidateFormModal: React.FC<CandidateFormModalProps> = ({
  isOpen,
  onClose,
  candidateToEdit,
  existingCount,
}) => {
  const [number, setNumber] = useState<number>(existingCount + 1);
  const [chairmanName, setChairmanName] = useState('');
  const [viceChairmanName, setViceChairmanName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [slogan, setSlogan] = useState('');
  const [vision, setVision] = useState('');
  const [missionsText, setMissionsText] = useState('');
  const [program1Title, setProgram1Title] = useState('');
  const [program1Desc, setProgram1Desc] = useState('');
  const [program2Title, setProgram2Title] = useState('');
  const [program2Desc, setProgram2Desc] = useState('');
  const [program3Title, setProgram3Title] = useState('');
  const [program3Desc, setProgram3Desc] = useState('');
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  useEffect(() => {
    setPhotoError(null);
    if (candidateToEdit) {
      setNumber(candidateToEdit.number);
      setChairmanName(candidateToEdit.chairmanName);
      setViceChairmanName(candidateToEdit.viceChairmanName);
      setPhotoUrl(candidateToEdit.photoUrl);
      setSlogan(candidateToEdit.slogan);
      setVision(candidateToEdit.vision);
      setMissionsText(candidateToEdit.mission.join('\n'));
      setProgram1Title(candidateToEdit.workPrograms[0]?.title || '');
      setProgram1Desc(candidateToEdit.workPrograms[0]?.description || '');
      setProgram2Title(candidateToEdit.workPrograms[1]?.title || '');
      setProgram2Desc(candidateToEdit.workPrograms[1]?.description || '');
      setProgram3Title(candidateToEdit.workPrograms[2]?.title || '');
      setProgram3Desc(candidateToEdit.workPrograms[2]?.description || '');
    } else {
      setNumber(existingCount + 1);
      setChairmanName('');
      setViceChairmanName('');
      setPhotoUrl('');
      setSlogan('');
      setVision('');
      setMissionsText('1. Mengembangkan potensi siswa di bidang akademik dan ekstrakurikuler.\n2. Mewujudkan lingkungan sekolah yang bersih, asri, dan berkarakter.\n3. Mempererat kolaborasi antar-organisasi di sekolah.');
      setProgram1Title('Pekan Kreativitas Siswa');
      setProgram1Desc('Pameran seni dan kompetisi minat bakat antar-kelas.');
      setProgram2Title('Kotak Aspirasi Digital');
      setProgram2Desc('Kanal aspirasi terbuka untuk saran dan kritik membangun.');
      setProgram3Title('Peduli Lingkungan');
      setProgram3Desc('Program kebersihan dan pemilahan daur ulang.');
    }
  }, [candidateToEdit, existingCount, isOpen]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset nilai input agar berkas yang sama bisa dipilih ulang.
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Berkas harus berupa gambar (JPG, PNG, atau WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Ukuran gambar maksimal 5 MB.');
      return;
    }

    setPhotoError(null);
    setIsProcessingPhoto(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setPhotoUrl(dataUrl);
      playSound('click');
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Gagal memproses gambar.');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chairmanName.trim() || !viceChairmanName.trim() || !vision.trim()) {
      alert('Nama Calon Ketua, Wakil Ketua, dan Visi wajib diisi.');
      return;
    }

    if (!photoUrl.trim()) {
      alert('Silakan unggah foto pasangan calon terlebih dahulu.');
      return;
    }

    const missions = missionsText
      .split('\n')
      .map((m) => m.replace(/^[0-9]+[.)]\s*/, '').trim())
      .filter((m) => m.length > 0);

    const workPrograms: WorkProgram[] = [
      {
        title: program1Title.trim() || 'Program Utama 1',
        description: program1Desc.trim() || 'Deskripsi program kerja.',
      },
      {
        title: program2Title.trim() || 'Program Utama 2',
        description: program2Desc.trim() || 'Deskripsi program kerja.',
      },
      {
        title: program3Title.trim() || 'Program Utama 3',
        description: program3Desc.trim() || 'Deskripsi program kerja.',
      },
    ];

    const theme = COLOR_THEMES[selectedThemeIndex] || COLOR_THEMES[0];

    if (candidateToEdit) {
      const updated: Candidate = {
        ...candidateToEdit,
        number,
        chairmanName: chairmanName.trim(),
        viceChairmanName: viceChairmanName.trim(),
        photoUrl: photoUrl.trim(),
        slogan: slogan.trim(),
        vision: vision.trim(),
        mission: missions.length > 0 ? missions : candidateToEdit.mission,
        workPrograms,
        color: theme,
      };
      await saveCandidate(updated);
    } else {
      const res = await addCandidate({
        number,
        chairmanName: chairmanName.trim(),
        viceChairmanName: viceChairmanName.trim(),
        photoUrl: photoUrl.trim(),
        slogan: slogan.trim(),
        vision: vision.trim(),
        mission: missions,
        workPrograms,
        color: theme,
      });
      if (!res.success) {
        alert(res.message);
        return;
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 overflow-hidden shadow-2xl border border-slate-200 animate-scale-up">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {candidateToEdit ? `Edit Data Paslon No. 0${candidateToEdit.number}` : 'Tambah Pasangan Calon Baru'}
            </h3>
            <p className="text-xs text-blue-200">
              Input data calon ketua, wakil ketua, visi, misi, dan program kerja
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
          {/* Nomor Urut & Warna Tema */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Nomor Urut Paslon *
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={number}
                onChange={(e) => setNumber(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Warna Tema Paslon
              </label>
              <div className="flex items-center gap-2 pt-1">
                {COLOR_THEMES.map((theme, idx) => (
                  <button
                    key={theme.name}
                    type="button"
                    onClick={() => setSelectedThemeIndex(idx)}
                    title={theme.name}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      selectedThemeIndex === idx ? 'scale-115 border-slate-900 shadow-sm' : 'border-white'
                    }`}
                    style={{ backgroundColor: theme.primary }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Nama Calon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Nama Calon Ketua OSIS *
              </label>
              <input
                type="text"
                value={chairmanName}
                onChange={(e) => setChairmanName(e.target.value)}
                placeholder="Contoh: Raditya Pratama"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Nama Calon Wakil Ketua OSIS *
              </label>
              <input
                type="text"
                value={viceChairmanName}
                onChange={(e) => setViceChairmanName(e.target.value)}
                placeholder="Contoh: Annisa Rahmawati"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Slogan */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Slogan / Tagline Paslon
            </label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="Contoh: OSIS Proaktif, Kolaboratif, dan Berkarakter Juara"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Foto Paslon */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Foto Pasangan Calon *
            </label>
            <div className="flex items-start gap-4">
              <div className="w-28 h-28 shrink-0 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Pratinjau foto paslon"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Image className="w-8 h-8 text-slate-300" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <label
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                    isProcessingPhoto
                      ? 'bg-slate-100 text-slate-400 cursor-wait'
                      : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isProcessingPhoto ? 'Memproses gambar...' : 'Pilih Gambar dari Perangkat'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={isProcessingPhoto}
                  />
                </label>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Format JPG, PNG, atau WEBP (maks. 5 MB). Gambar dikompres otomatis lalu
                  disimpan langsung di database.
                </p>

                {photoError && (
                  <p className="text-[11px] font-semibold text-rose-600">{photoError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Visi */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Visi Paslon *
            </label>
            <textarea
              rows={2}
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="Tuliskan visi kepemimpinan..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Misi */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-800">
                Misi Paslon (Pisahkan tiap poin dengan baris baru)
              </label>
              <span className="text-[11px] text-slate-400">1 baris = 1 butir misi</span>
            </div>
            <textarea
              rows={3}
              value={missionsText}
              onChange={(e) => setMissionsText(e.target.value)}
              placeholder="1. Meningkatkan kegiatan akademik dan non akademik&#10;2. Mewujudkan keterbukaan aspirasi siswa"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 3 Program Kerja Unggulan */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-900 block">
              3 Program Kerja Unggulan:
            </span>

            {/* Prog 1 */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <input
                type="text"
                value={program1Title}
                onChange={(e) => setProgram1Title(e.target.value)}
                placeholder="Judul Program Unggulan 1"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
              />
              <input
                type="text"
                value={program1Desc}
                onChange={(e) => setProgram1Desc(e.target.value)}
                placeholder="Deskripsi singkat program 1"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600"
              />
            </div>

            {/* Prog 2 */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <input
                type="text"
                value={program2Title}
                onChange={(e) => setProgram2Title(e.target.value)}
                placeholder="Judul Program Unggulan 2"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
              />
              <input
                type="text"
                value={program2Desc}
                onChange={(e) => setProgram2Desc(e.target.value)}
                placeholder="Deskripsi singkat program 2"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600"
              />
            </div>

            {/* Prog 3 */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <input
                type="text"
                value={program3Title}
                onChange={(e) => setProgram3Title(e.target.value)}
                placeholder="Judul Program Unggulan 3"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
              />
              <input
                type="text"
                value={program3Desc}
                onChange={(e) => setProgram3Desc(e.target.value)}
                placeholder="Deskripsi singkat program 3"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{candidateToEdit ? 'Simpan Perubahan Paslon' : 'Tambah Paslon Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
