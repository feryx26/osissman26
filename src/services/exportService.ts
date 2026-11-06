import { Candidate, ElectionSettings, Student } from '../types';

export const downloadBeritaAcaraHtml = (
  candidates: Candidate[],
  students: Student[],
  settings: ElectionSettings
) => {
  const totalVotes = candidates.reduce((s, c) => s + c.votes, 0);
  const totalDpt = students.length;
  const nonVoters = totalDpt - totalVotes;
  const turnout = totalDpt > 0 ? ((totalVotes / totalDpt) * 100).toFixed(1) : '0';

  const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes);
  const winner = sortedCandidates[0] || candidates[0];

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const candidateRowsHtml = candidates
    .map((cand) => {
      const pct = totalVotes > 0 ? ((cand.votes / totalVotes) * 100).toFixed(1) : '0';
      return `
        <tr>
          <td style="text-align: center; font-weight: bold; padding: 10px; border: 1px solid #cbd5e1;">0${cand.number}</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1;">
            <strong>${cand.chairmanName}</strong> & ${cand.viceChairmanName}
            <div style="font-size: 11px; color: #64748b; font-style: italic;">"${cand.slogan}"</div>
          </td>
          <td style="text-align: right; font-family: monospace; font-weight: bold; padding: 10px; border: 1px solid #cbd5e1; font-size: 14px;">${cand.votes}</td>
          <td style="text-align: right; font-family: monospace; font-weight: bold; padding: 10px; border: 1px solid #cbd5e1; color: #1e3a8a;">${pct}%</td>
        </tr>
      `;
    })
    .join('');

  const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Berita Acara Rekapitulasi Pemilihan Ketua OSIS - ${settings.schoolName}</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 40px;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      padding: 48px;
      background: #ffffff;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      text-align: center;
      border-bottom: 3px double #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h4 { margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .header h2 { margin: 4px 0; font-size: 18px; text-transform: uppercase; font-weight: 800; }
    .header h1 { margin: 4px 0; font-size: 20px; text-transform: uppercase; font-weight: 900; }
    .header p { margin: 2px 0; font-size: 12px; color: #475569; font-family: Arial, sans-serif; }
    .title-box { text-align: center; margin: 24px 0; }
    .title-box h3 { margin: 0; font-size: 16px; text-decoration: underline; text-transform: uppercase; font-weight: bold; }
    .title-box p { margin: 4px 0; font-size: 12px; color: #475569; font-family: Arial, sans-serif; }
    .summary-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 16px;
      border-radius: 6px;
      margin: 20px 0;
      font-family: Arial, sans-serif;
      font-size: 13px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .summary-row:last-child {
      margin-bottom: 0;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-family: Arial, sans-serif;
      font-size: 13px;
    }
    th {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 10px;
      text-align: left;
    }
    .verdict-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 16px;
      border-radius: 6px;
      font-family: Arial, sans-serif;
      font-size: 13px;
      color: #1e3a8a;
      margin: 24px 0;
    }
    .signatures {
      margin-top: 48px;
      display: flex;
      justify-content: space-between;
      text-align: center;
      font-family: Arial, sans-serif;
      font-size: 12px;
    }
    .sign-box { width: 30%; }
    .sign-space { height: 80px; }
    .sign-name { font-weight: bold; text-decoration: underline; }
    .footer-note {
      margin-top: 40px;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      font-family: Arial, sans-serif;
    }
    @media print {
      body { padding: 0; }
      .container { border: none; box-shadow: none; padding: 20px 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 800px; margin: 0 auto 20px auto; display: flex; justify-content: flex-end;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: #ffffff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-family: Arial, sans-serif; font-size: 13px;">
      🖨️ Cetak Dokumen / Simpan PDF
    </button>
  </div>

  <div class="container">
    <div class="header">
      <img src="${settings.logoUrl}" style="height: 72px; max-width: 120px; object-fit: contain; margin-bottom: 8px;" alt="Logo ${settings.schoolName}" />
      <h4>Pemerintah Daerah Provinsi Jawa Barat</h4>
      <h2>Dinas Pendidikan</h2>
      <h1>${settings.schoolName}</h1>
      <p style="font-weight: bold; font-size: 13px; margin: 4px 0;">Komisi Pemilihan Ketua & Wakil Ketua OSIS (KPU Sekolah)</p>
      <p>${settings.schoolAddress} · Tahun Ajaran ${settings.schoolYear}</p>
    </div>

    <div class="title-box">
      <h3>Berita Acara Rekapitulasi Hasil Penghitungan Suara</h3>
      <p>Nomor: 042/BA-KPU/PILKETOS/${settings.schoolYear.replace('/', '-')}</p>
    </div>

    <p style="font-size: 13px; font-family: Arial, sans-serif; text-align: justify;">
      Pada hari ini, <strong>${currentDate}</strong>, bertempat di <strong>${settings.schoolName}</strong>, Panitia Pemilihan Ketua dan Wakil Ketua OSIS telah menyelesaikan proses pemungutan dan rekapitulasi penghitungan suara secara elektronik (e-Voting) pada pukul ${currentTime} WIB dengan rincian data sebagai berikut:
    </p>

    <div class="summary-box">
      <div class="summary-row">
        <span>A. Jumlah Pemilih Terdaftar dalam DPT (Daftar Pemilih Tetap)</span>
        <span><strong>${totalDpt}</strong> Siswa</span>
      </div>
      <div class="summary-row">
        <span>B. Jumlah Suara Masuk (Sah Tercatat)</span>
        <span style="color: #059669;"><strong>${totalVotes}</strong> Suara</span>
      </div>
      <div class="summary-row">
        <span>C. Jumlah Pemilih Belum Memberikan Suara</span>
        <span style="color: #d97706;"><strong>${nonVoters}</strong> Siswa</span>
      </div>
      <div class="summary-row">
        <span>D. Tingkat Partisipasi Siswa</span>
        <span style="color: #2563eb;">${turnout}%</span>
      </div>
    </div>

    <h4 style="font-family: Arial, sans-serif; font-size: 13px; margin-bottom: 8px;">Perolehan Suara Pasangan Calon:</h4>
    <table>
      <thead>
        <tr>
          <th style="width: 70px; text-align: center;">No. Urut</th>
          <th>Nama Pasangan Calon</th>
          <th style="text-align: right; width: 130px;">Jumlah Suara Sah</th>
          <th style="text-align: right; width: 110px;">Persentase</th>
        </tr>
      </thead>
      <tbody>
        ${candidateRowsHtml}
      </tbody>
    </table>

    <div class="verdict-box">
      <strong>Ketetapan Panitia Pemilihan:</strong><br>
      Berdasarkan hasil rekapitulasi resmi sistem Real Count tersebut di atas, pasangan calon yang memperoleh suara terbanyak dan dinyatakan sebagai <strong>Ketua dan Wakil Ketua OSIS Terpilih Masa Bakti ${settings.schoolYear}</strong> adalah:
      <div style="font-size: 15px; font-weight: bold; margin-top: 6px;">
        Pasangan Calon No. 0${winner.number} : ${winner.chairmanName} & ${winner.viceChairmanName}
      </div>
      dengan perolehan suara sejumlah <strong>${winner.votes} suara (${totalVotes > 0 ? ((winner.votes / totalVotes) * 100).toFixed(1) : 0}%)</strong>.
    </div>

    <p style="font-size: 13px; font-family: Arial, sans-serif;">
      Demikian Berita Acara Rekapitulasi ini dibuat dan ditandatangani oleh Panitia KPU Sekolah, Pembina OSIS, dan Kepala Sekolah dengan sebenar-benarnya serta dapat dipertanggungjawabkan secara sah.
    </p>

    <div class="signatures">
      <div class="sign-box">
        <p>Ketua Panitia KPU,</p>
        <div class="sign-space"></div>
        <p class="sign-name">Fajar Maulana, S.Pd.</p>
        <p style="font-size: 10px; color: #64748b; margin: 0;">NIP. 19850412 201001 1 012</p>
      </div>

      <div class="sign-box">
        <p>Pembina OSIS,</p>
        <div class="sign-space"></div>
        <p class="sign-name">Dra. Hj. Nurjanah, M.Pd.</p>
        <p style="font-size: 10px; color: #64748b; margin: 0;">NIP. 19720815 199802 2 001</p>
      </div>

      <div class="sign-box">
        <p>Kepala Sekolah,</p>
        <div class="sign-space"></div>
        <p class="sign-name">Dr. H. Bambang Subagyo, M.M.</p>
        <p style="font-size: 10px; color: #64748b; margin: 0;">NIP. 19681120 199403 1 004</p>
      </div>
    </div>

    <div class="footer-note">
      Dokumen ini diunduh melalui Sistem E-Pilketos Terpadu pada ${currentDate} pukul ${currentTime} WIB. Arsip Resmi KPU Sekolah.
    </div>
  </div>
</body>
</html>`;

  // Trigger file download
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Berita_Acara_Pemilihan_Ketua_OSIS_${settings.schoolYear.replace('/', '_')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadRekapitulasiCsv = (
  candidates: Candidate[],
  students: Student[],
  settings: ElectionSettings
) => {
  const totalVotes = candidates.reduce((s, c) => s + c.votes, 0);
  const totalDpt = students.length;
  const nonVoters = totalDpt - totalVotes;
  const turnout = totalDpt > 0 ? ((totalVotes / totalDpt) * 100).toFixed(1) : '0';

  const rows: string[][] = [
    ['REKAPITULASI HASIL PEMILIHAN KETUA OSIS'],
    ['Sekolah', settings.schoolName],
    ['Alamat', settings.schoolAddress],
    ['Tahun Ajaran', settings.schoolYear],
    ['Tanggal Unduh', new Date().toLocaleDateString('id-ID')],
    ['Waktu Unduh', new Date().toLocaleTimeString('id-ID')],
    [''],
    ['STATISTIK PEMILIH'],
    ['Total DPT Terdaftar', totalDpt.toString()],
    ['Total Suara Masuk (Sah)', totalVotes.toString()],
    ['Siswa Belum Memilih', nonVoters.toString()],
    ['Persentase Partisipasi', `${turnout}%`],
    [''],
    ['PEROLEHAN SUARA PASANGAN CALON'],
    ['Nomor Urut', 'Calon Ketua', 'Calon Wakil Ketua', 'Slogan', 'Perolehan Suara', 'Persentase (%)'],
  ];

  candidates.forEach((cand) => {
    const pct = totalVotes > 0 ? ((cand.votes / totalVotes) * 100).toFixed(1) : '0';
    rows.push([
      `Paslon 0${cand.number}`,
      cand.chairmanName,
      cand.viceChairmanName,
      `"${cand.slogan.replace(/"/g, '""')}"`,
      cand.votes.toString(),
      `${pct}%`,
    ]);
  });

  const csvContent = '\uFEFF' + rows.map((e) => e.join(';')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Rekapitulasi_Suara_Pilketos_${settings.schoolYear.replace('/', '_')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadDptCsv = (students: Student[], settings: ElectionSettings) => {
  const rows: string[][] = [
    ['DAFTAR PEMILIH TETAP (DPT) & TOKEN PEMILIHAN'],
    ['Sekolah', settings.schoolName],
    ['Alamat', settings.schoolAddress],
    ['Tahun Ajaran', settings.schoolYear],
    ['Total DPT', students.length.toString()],
    [''],
    ['NO INDUK', 'NAMA', 'JK', 'NISN', 'KELAS', 'TOKEN PEMILIHAN', 'STATUS HAK SUARA', 'WAKTU MEMILIH', 'NO BUKTI SUARA'],
  ];

  students.forEach((st) => {
    rows.push([
      st.nis,
      st.name,
      st.gender,
      st.nisn || '',
      st.grade,
      st.token,
      st.hasVoted ? 'SUDAH MEMILIH' : 'BELUM MEMILIH',
      st.votedAt || '',
      st.receiptId || '',
    ]);
  });

  const csvContent = '\uFEFF' + rows.map((e) => e.join(';')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `DPT_dan_Token_Pemilih_${settings.schoolYear.replace('/', '_')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

