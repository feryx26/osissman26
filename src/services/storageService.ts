import { Candidate, Student, ElectionSettings, VoteLog, AdminUser } from '../types';
import { supabase, isSupabaseConfigured, adminEmailFor } from './supabaseClient';

// ---------------------------------------------------------------------------
// SOUND (tetap sinkron, tidak berhubungan dengan database)
// ---------------------------------------------------------------------------
export const playSound = (type: 'vote-success' | 'click' | 'alert' | 'fanfare') => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'vote-success') {
      const now = ctx.currentTime;
      // Melodic chime: C5 -> E5 -> G5 -> C6
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.45);
      });
    } else if (type === 'click') {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'alert') {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch {
    // Ignore audio failures if browser blocks autoplay or unsupported
  }
};

export const generateRandomToken = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ---------------------------------------------------------------------------
// EVENT BUS (reaktivitas UI)
// ---------------------------------------------------------------------------
const emitDataChange = () => window.dispatchEvent(new Event('pilketos_data_change'));
const emitUserChange = () => window.dispatchEvent(new Event('pilketos_user_change'));
const emitAdminChange = () => window.dispatchEvent(new Event('pilketos_admin_change'));

// ---------------------------------------------------------------------------
// SESI AUTH (cache agar helper sinkron dapat dipakai komponen)
// ---------------------------------------------------------------------------
let cachedIsAdmin = false;
let cachedStudent: Student | null = null;

let resolveAuthReady: () => void = () => {};
const authReady: Promise<void> = new Promise((resolve) => {
  resolveAuthReady = resolve;
});

const applySession = (session: { user?: { app_metadata?: Record<string, unknown> } } | null) => {
  const role = session?.user?.app_metadata?.role;
  cachedIsAdmin = role === 'admin';
  if (!session) cachedStudent = null;
};

if (isSupabaseConfigured) {
  supabase.auth
    .getSession()
    .then(({ data }) => applySession(data.session))
    .finally(() => resolveAuthReady());

  supabase.auth.onAuthStateChange((_event, session) => {
    applySession(session);
    emitAdminChange();
  });
} else {
  resolveAuthReady();
}

// ---------------------------------------------------------------------------
// MAPPER (snake_case DB -> camelCase aplikasi)
// ---------------------------------------------------------------------------
const mapCandidate = (row: Record<string, unknown>): Candidate => ({
  id: Number(row.id),
  number: Number(row.number),
  chairmanName: String(row.chairman_name ?? ''),
  viceChairmanName: String(row.vice_chairman_name ?? ''),
  photoUrl: String(row.photo_url ?? ''),
  slogan: String(row.slogan ?? ''),
  vision: String(row.vision ?? ''),
  mission: (row.mission as string[]) ?? [],
  workPrograms: (row.work_programs as Candidate['workPrograms']) ?? [],
  votes: Number(row.votes ?? 0),
  color: (row.color as Candidate['color']) ?? {
    primary: '#2563eb',
    light: '#eff6ff',
    border: '#bfdbfe',
    ring: 'ring-blue-500',
    bgHover: 'hover:bg-blue-50',
    badge: 'bg-blue-600 text-white',
    text: 'text-blue-700',
  },
});

const candidateRow = (c: Candidate) => ({
  id: c.id,
  number: c.number,
  chairman_name: c.chairmanName,
  vice_chairman_name: c.viceChairmanName,
  photo_url: c.photoUrl,
  slogan: c.slogan,
  vision: c.vision,
  mission: c.mission,
  work_programs: c.workPrograms,
  votes: c.votes,
  color: c.color,
});

const mapStudent = (row: Record<string, unknown>): Student => ({
  nis: String(row.nis),
  nisn: row.nisn ? String(row.nisn) : undefined,
  name: String(row.name ?? ''),
  grade: String(row.grade ?? ''),
  gender: (row.gender === 'P' ? 'P' : 'L') as 'L' | 'P',
  hasVoted: Boolean(row.has_voted),
  votedAt: (row.voted_at as string | null) ?? null,
  token: row.token ? String(row.token) : '',
  receiptId: (row.receipt_id as string | null) ?? undefined,
  candidateChosen: row.candidate_chosen != null ? Number(row.candidate_chosen) : undefined,
});

const mapSettings = (row: Record<string, unknown>): ElectionSettings => ({
  schoolName: String(row.school_name ?? ''),
  schoolAddress: String(row.school_address ?? ''),
  logoUrl: String(row.logo_url ?? ''),
  schoolYear: String(row.school_year ?? ''),
  electionTitle: String(row.election_title ?? ''),
  isOpen: Boolean(row.is_open),
  totalVoters: Number(row.total_voters ?? 0),
  lastUpdated: String(row.last_updated ?? ''),
  scheduledEnd: String(row.scheduled_end ?? ''),
});

const mapLog = (row: Record<string, unknown>): VoteLog => ({
  id: String(row.id),
  timestamp: String(row.timestamp ?? ''),
  grade: String(row.grade ?? ''),
  maskedNis: String(row.masked_nis ?? ''),
  candidateNumber: Number(row.candidate_number ?? 0),
});

// ---------------------------------------------------------------------------
// BACA DATA
// ---------------------------------------------------------------------------
export const getCandidates = async (): Promise<Candidate[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('candidates').select('*').order('number');
  if (error || !data) return [];
  return data.map(mapCandidate);
};

export const getStudents = async (): Promise<Student[]> => {
  if (!isSupabaseConfigured) return [];
  await authReady;

  // Panitia dapat membaca token lengkap; publik hanya view tanpa token.
  if (cachedIsAdmin) {
    const { data, error } = await supabase.from('students').select('*').order('nis');
    if (!error && data) return data.map(mapStudent);
  }

  const { data, error } = await supabase.from('students_public').select('*').order('nis');
  if (error || !data) return [];
  return data.map(mapStudent);
};

export const getSettings = async (): Promise<ElectionSettings | null> => {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
  if (error || !data) return null;
  return mapSettings(data);
};

export const getVoteLogs = async (): Promise<VoteLog[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('vote_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);
  if (error || !data) return [];
  return data.map(mapLog);
};

export const getCurrentStudent = async (): Promise<Student | null> => {
  if (!isSupabaseConfigured) return null;
  if (cachedStudent) return cachedStudent;

  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  const role = user?.app_metadata?.role;
  const nis = user?.app_metadata?.nis;

  if (role === 'student' && nis) {
    const { data: row } = await supabase
      .from('students')
      .select('*')
      .eq('nis', nis)
      .maybeSingle();
    if (row) {
      cachedStudent = mapStudent(row);
      return cachedStudent;
    }
  }
  return null;
};

export const setCurrentStudent = async (student: Student | null): Promise<void> => {
  if (student) {
    cachedStudent = student;
  } else {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user?.app_metadata?.role === 'student') {
      await supabase.auth.signOut();
    }
    cachedStudent = null;
  }
  emitUserChange();
};

// ---------------------------------------------------------------------------
// LOGIN SISWA (NIS -> email, token -> password)
// ---------------------------------------------------------------------------
export const loginStudent = async (
  identifier: string,
  token?: string
): Promise<{ success: boolean; student?: Student; message: string }> => {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Sistem belum terhubung ke database Supabase. Hubungi panitia.' };
  }

  const cleanId = identifier.trim();
  const cleanToken = (token ?? '').trim();

  if (!cleanId) {
    return { success: false, message: 'Silakan masukkan Nomor Induk Siswa (NIS) Anda.' };
  }
  if (!cleanToken) {
    return {
      success: false,
      message: 'Kode Token wajib dimasukkan! Silakan ketik 6 digit angka token pemilihan Anda.',
    };
  }

  const { data: email, error: resolveError } = await supabase.rpc('resolve_login_email', {
    p_identifier: cleanId,
  });

  if (resolveError || !email) {
    return {
      success: false,
      message:
        'No Induk (NIS) atau NISN tidak ditemukan dalam Daftar Pemilih Tetap (DPT). Silakan periksa kembali atau hubungi panitia.',
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email as string,
    password: cleanToken,
  });

  if (error || !data.user) {
    return {
      success: false,
      message:
        'Kode Token tidak sesuai. Silakan periksa kembali token 6 digit yang diberikan panitia.',
    };
  }

  if (data.user.app_metadata?.role && data.user.app_metadata.role !== 'student') {
    await supabase.auth.signOut();
    return { success: false, message: 'Akun ini bukan akun pemilih siswa.' };
  }

  const nis = (data.user.app_metadata?.nis as string) || cleanId;
  const { data: row } = await supabase.from('students').select('*').eq('nis', nis).maybeSingle();
  if (!row) {
    await supabase.auth.signOut();
    return { success: false, message: 'Data siswa pemilih tidak ditemukan di server.' };
  }

  cachedStudent = mapStudent(row);
  emitUserChange();

  return {
    success: true,
    student: cachedStudent,
    message: 'Verifikasi identitas dan token berhasil. Selamat menggunakan hak suara!',
  };
};

// ---------------------------------------------------------------------------
// KONFIRMASI SUARA (RPC atomik di server)
// ---------------------------------------------------------------------------
export const submitVote = async (
  nis: string,
  candidateId: number
): Promise<{ success: boolean; message: string; receiptId?: string }> => {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Sistem belum terhubung ke database Supabase.' };
  }

  const { data, error } = await supabase.rpc('cast_vote', {
    p_nis: nis,
    p_candidate_id: candidateId,
  });

  if (error || !data) {
    return { success: false, message: 'Gagal mengirim suara ke server. Silakan coba lagi.' };
  }

  const result = data as { success: boolean; message: string; receiptId?: string };

  if (result.success) {
    if (cachedStudent && cachedStudent.nis === nis) {
      cachedStudent = {
        ...cachedStudent,
        hasVoted: true,
        votedAt: new Date().toISOString(),
        receiptId: result.receiptId,
        candidateChosen: candidateId,
      };
    }
    playSound('vote-success');
    emitDataChange();
    emitUserChange();
  }

  return result;
};

export const simulateRandomVote = async (): Promise<{
  success: boolean;
  message: string;
  studentName?: string;
  candidateNumber?: number;
}> => {
  const settings = await getSettings();
  if (!settings || !settings.isOpen) {
    return { success: false, message: 'Pemilihan sedang ditutup.' };
  }

  const students = await getStudents();
  const nonVoters = students.filter((s) => !s.hasVoted);
  if (nonVoters.length === 0) {
    return { success: false, message: 'Semua siswa di DPT sudah menggunakan hak suara (100% partisipasi).' };
  }

  const randomStudent = nonVoters[Math.floor(Math.random() * nonVoters.length)];
  const candidates = await getCandidates();
  if (candidates.length === 0) {
    return { success: false, message: 'Belum ada pasangan calon yang terdaftar.' };
  }
  const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];

  const res = await submitVote(randomStudent.nis, randomCandidate.id);
  return {
    success: res.success,
    message: res.message,
    studentName: randomStudent.name,
    candidateNumber: randomCandidate.number,
  };
};

// ---------------------------------------------------------------------------
// OPERASI PANITIA
// ---------------------------------------------------------------------------
export const toggleElectionOpen = async (isOpen: boolean): Promise<void> => {
  if (!isSupabaseConfigured) return;
  await supabase
    .from('settings')
    .update({ is_open: isOpen, last_updated: new Date().toISOString() })
    .eq('id', 1);
  emitDataChange();
};

export const addStudent = async (
  studentData: Omit<Student, 'hasVoted' | 'votedAt' | 'receiptId'>
): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;

  const { data, error } = await supabase.rpc('admin_create_student', {
    p_nis: studentData.nis,
    p_nisn: studentData.nisn ?? '',
    p_name: studentData.name,
    p_grade: studentData.grade,
    p_gender: studentData.gender,
  });

  if (error || !data) return false;
  const result = data as { success: boolean };
  if (result.success) emitDataChange();
  return result.success;
};

export const importStudentsBatch = async (
  newStudentsList: Partial<Student>[]
): Promise<{ success: boolean; imported: number; updated: number; message: string }> => {
  if (!isSupabaseConfigured) {
    return { success: false, imported: 0, updated: 0, message: 'Sistem belum terhubung ke database Supabase.' };
  }

  const rows = newStudentsList
    .filter((s) => s.nis && s.name)
    .map((s) => ({
      nis: String(s.nis).trim(),
      name: String(s.name).trim(),
      gender: s.gender,
      nisn: s.nisn ?? '',
      grade: s.grade ?? '',
    }));

  const { data, error } = await supabase.rpc('admin_import_students', { p_rows: rows });

  if (error || !data) {
    return { success: false, imported: 0, updated: 0, message: 'Gagal mengimpor data siswa ke server.' };
  }

  const result = data as { success: boolean; imported: number; updated: number; message: string };
  if (result.success) {
    emitDataChange();
    playSound('vote-success');
  }
  return result;
};

export const regenerateAllTokens = async (): Promise<void> => {
  if (!isSupabaseConfigured) return;
  const { data } = await supabase.rpc('admin_regenerate_tokens');
  const result = data as { success: boolean } | null;
  if (result?.success) {
    emitDataChange();
    playSound('vote-success');
  }
};

export const resetAllData = async (): Promise<void> => {
  if (!isSupabaseConfigured) return;
  const { data } = await supabase.rpc('admin_reset_data');
  const result = data as { success: boolean } | null;
  if (result?.success) {
    cachedStudent = null;
    emitDataChange();
    emitUserChange();
  }
};

// ---------------------------------------------------------------------------
// AUTH PANITIA
// ---------------------------------------------------------------------------
export const isAdminLoggedIn = (): boolean => cachedIsAdmin;

export const loginAdmin = async (
  username: string,
  pass: string
): Promise<{ success: boolean; message: string; adminName?: string }> => {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Sistem belum terhubung ke database Supabase.' };
  }

  const email = adminEmailFor(username);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass.trim(),
  });

  if (error || !data.user) {
    playSound('alert');
    return {
      success: false,
      message: 'Username atau Password Panitia salah. (Gunakan: admin / osis2026)',
    };
  }

  if (data.user.app_metadata?.role !== 'admin') {
    await supabase.auth.signOut();
    playSound('alert');
    return { success: false, message: 'Akun ini tidak memiliki hak akses panitia.' };
  }

  cachedIsAdmin = true;
  cachedStudent = null;
  emitAdminChange();
  emitDataChange();
  playSound('vote-success');
  return { success: true, message: 'Login Panitia KPU berhasil.', adminName: 'Panitia KPU Sekolah' };
};

export const logoutAdmin = async (): Promise<void> => {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
  cachedIsAdmin = false;
  emitAdminChange();
  emitDataChange();
  playSound('click');
};

// ---------------------------------------------------------------------------
// MANAJEMEN PENGGUNA PANITIA (role=admin)
// ---------------------------------------------------------------------------
export const getAdminUsers = async (): Promise<AdminUser[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc('admin_list_users');
  if (error || !data) return [];
  return data as AdminUser[];
};

export const createAdminUser = async (
  username: string,
  name: string,
  password: string
): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Sistem belum terhubung ke database Supabase.' };
  }

  const { data, error } = await supabase.rpc('admin_create_user', {
    p_username: username,
    p_name: name,
    p_password: password,
  });

  if (error || !data) {
    return { success: false, message: 'Gagal menambahkan pengguna panitia ke server.' };
  }

  const result = data as { success: boolean; message: string };
  if (result.success) {
    playSound('vote-success');
    emitAdminChange();
    emitDataChange();
  } else {
    playSound('alert');
  }
  return result;
};

export const updateAdminUser = async (
  userId: string,
  username: string,
  name: string,
  password?: string
): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Sistem belum terhubung ke database Supabase.' };
  }

  const { data, error } = await supabase.rpc('admin_update_user', {
    p_user_id: userId,
    p_username: username,
    p_name: name,
    p_password: password ?? '',
  });

  if (error || !data) {
    return { success: false, message: 'Gagal memperbarui pengguna panitia di server.' };
  }

  const result = data as { success: boolean; message: string };
  if (result.success) {
    playSound('vote-success');
    emitAdminChange();
  } else {
    playSound('alert');
  }
  return result;
};

export const deleteAdminUser = async (
  userId: string
): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Sistem belum terhubung ke database Supabase.' };
  }

  const { data, error } = await supabase.rpc('admin_delete_user', { p_user_id: userId });

  if (error || !data) {
    return { success: false, message: 'Gagal menghapus pengguna panitia dari server.' };
  }

  const result = data as { success: boolean; message: string };
  if (result.success) {
    playSound('click');
    emitAdminChange();
  } else {
    playSound('alert');
  }
  return result;
};

// ---------------------------------------------------------------------------
// MANAJEMEN PASLON
// ---------------------------------------------------------------------------
export const saveCandidate = async (candidate: Candidate): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from('candidates').upsert(candidateRow(candidate));
  if (error) return false;
  emitDataChange();
  playSound('vote-success');
  return true;
};

export const addCandidate = async (
  newCandData: Omit<Candidate, 'id' | 'votes'>
): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Sistem belum terhubung ke database Supabase.' };
  }

  const candidates = await getCandidates();
  const nextId = candidates.length > 0 ? Math.max(...candidates.map((c) => c.id)) + 1 : 1;

  const { error } = await supabase.from('candidates').insert({
    ...candidateRow({ ...newCandData, id: nextId, votes: 0 }),
  });

  if (error) {
    return { success: false, message: 'Gagal menambahkan pasangan calon ke server.' };
  }

  emitDataChange();
  playSound('vote-success');
  return { success: true, message: `Pasangan Calon No. ${newCandData.number} berhasil ditambahkan!` };
};

export const deleteCandidate = async (id: number): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Sistem belum terhubung ke database Supabase.' };
  }

  const candidates = await getCandidates();
  if (candidates.length - 1 < 2) {
    return { success: false, message: 'Minimal harus ada 2 pasangan calon dalam pemilihan.' };
  }

  const { error } = await supabase.from('candidates').delete().eq('id', id);
  if (error) {
    return { success: false, message: 'Gagal menghapus pasangan calon.' };
  }

  emitDataChange();
  playSound('click');
  return { success: true, message: 'Pasangan calon berhasil dihapus.' };
};
