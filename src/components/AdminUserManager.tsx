import React, { useEffect, useState } from 'react';
import {
  UserPlus,
  Users,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { AdminUser } from '../types';
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  playSound,
} from '../services/storageService';

interface FormState {
  username: string;
  name: string;
  password: string;
}

const emptyForm: FormState = { username: '', name: '', password: '' };

const formatDate = (value: string | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const AdminUserManager: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await getAdminUsers();
    setUsers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleStartEdit = (user: AdminUser) => {
    playSound('click');
    setEditingId(user.id);
    setForm({ username: user.username, name: user.name, password: '' });
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const username = form.username.trim().toLowerCase();
    const name = form.name.trim();
    const password = form.password.trim();

    if (!username || !name) {
      setMessage({ type: 'error', text: 'Username dan Nama wajib diisi.' });
      return;
    }
    if (!editingId && password.length < 6) {
      setMessage({ type: 'error', text: 'Kata sandi minimal 6 karakter.' });
      return;
    }
    if (editingId && password.length > 0 && password.length < 6) {
      setMessage({ type: 'error', text: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }

    setIsSaving(true);
    const res = editingId
      ? await updateAdminUser(editingId, username, name, password || undefined)
      : await createAdminUser(username, name, password);
    setIsSaving(false);

    setMessage({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) {
      resetForm();
      await loadUsers();
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Hapus pengguna panitia "${user.username}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    setMessage(null);
    const res = await deleteAdminUser(user.id);
    setMessage({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) {
      if (editingId === user.id) resetForm();
      await loadUsers();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Kelola Pengguna Panitia (KPU)
        </h3>
        <p className="text-xs text-slate-500">
          Tambah, ubah, atau hapus akun panitia yang berhak mengakses panel ini.
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Tambah / Ubah */}
        <div className="lg:col-span-1 bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4 h-fit">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {editingId ? (
                <Edit className="w-4 h-4 text-amber-600" />
              ) : (
                <UserPlus className="w-4 h-4 text-blue-600" />
              )}
              <span>{editingId ? 'Ubah Pengguna' : 'Tambah Pengguna Baru'}</span>
            </h4>
            {editingId && (
              <button
                onClick={resetForm}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Batal ubah"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) =>
                  setForm({
                    ...form,
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''),
                  })
                }
                placeholder="contoh: panitia_2"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Nama Lengkap / Jabatan *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="contoh: Budi Santoso (Ketua KPU)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Kata Sandi {editingId ? '(biarkan kosong bila tidak diubah)' : '*'}
              </label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingId ? '••••••' : 'Minimal 6 karakter'}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                required={!editingId}
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {editingId ? <Save className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>
                {isSaving ? 'Memproses...' : editingId ? 'Simpan Perubahan' : 'Tambah Pengguna'}
              </span>
            </button>
          </form>

          <p className="text-[10px] text-slate-400 leading-relaxed">
            Akun ini dipakai untuk login di panel “Login Pengurus & Panitia”. Simpan kredensial
            dengan aman.
          </p>
        </div>

        {/* Tabel Pengguna */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden h-fit">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Daftar Pengguna Panitia</span>
            </h4>
            <span className="text-xs text-slate-500 font-mono">{users.length} Akun</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Nama / Jabatan</th>
                  <th className="py-3 px-4">Terakhir Login</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-6 px-4 text-center text-slate-400">
                      Memuat data pengguna...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 px-4 text-center text-slate-400">
                      Belum ada pengguna panitia.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        editingId === user.id ? 'bg-amber-50/60' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-mono font-bold text-slate-900">{user.username}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{user.name}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {formatDate(user.lastSignInAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleStartEdit(user)}
                            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
