import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True hanya jika VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY sudah diisi. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Klien Supabase tunggal untuk seluruh aplikasi.
 * Jika env belum diisi, klien tetap dibuat dengan nilai placeholder agar
 * modul tidak crash saat import; pemakaian dilindungi oleh isSupabaseConfigured.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'http://127.0.0.1:54321',
  supabaseAnonKey || 'public-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);

/** Domain email internal untuk akun siswa & panitia. */
export const AUTH_EMAIL_DOMAIN = 'smus26garut.local';

export const adminEmailFor = (username: string): string =>
  `${username.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;

export const studentEmailFor = (nis: string): string =>
  `${nis.trim()}@${AUTH_EMAIL_DOMAIN}`;
