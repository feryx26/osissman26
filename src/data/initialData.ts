import { Candidate, Student, ElectionSettings, VoteLog } from '../types';

export const OSIS_EMBLEM_URL = 'https://smanegeri26garut.wordpress.com/wp-content/uploads/2012/08/backup_of_logo-sucinaraja_fina1l-lat.jpg';

export const INITIAL_SETTINGS: ElectionSettings = {
  schoolName: 'SMA NEGERI 26 GARUT',
  schoolAddress: 'Kp. Tegal Panjang Kec. Sucinaraja GARUT',
  logoUrl: 'https://smanegeri26garut.wordpress.com/wp-content/uploads/2012/08/backup_of_logo-sucinaraja_fina1l-lat.jpg',
  schoolYear: '2026/2027',
  electionTitle: 'Pemilihan Raya Ketua & Wakil Ketua OSIS',
  isOpen: true,
  totalVoters: 120,
  lastUpdated: new Date().toISOString(),
  scheduledEnd: '15:00 WIB Hari Ini',
};

export const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 1,
    number: 1,
    chairmanName: 'Raditya Pratama',
    viceChairmanName: 'Annisa Rahmawati',
    photoUrl: '/src/assets/images/paslon_satu_1793931489291.jpg',
    slogan: 'OSIS Proaktif, Kolaboratif, dan Berkarakter Juara',
    vision: 'Mewujudkan OSIS SMA NEGERI 26 GARUT sebagai wadah aspirasi yang inklusif, adaptif terhadap kemajuan teknologi, serta melahirkan siswa yang berintegritas dan berprestasi tingkat nasional.',
    mission: [
      'Meningkatkan transparansi dan komunikasi aspirasi siswa melalui platform digital OSIS terpadu.',
      'Mengembangkan minat dan bakat siswa di bidang sains, teknologi digital, olahraga, dan seni kreasi.',
      'Menggalakkan kepedulian lingkungan hidup dan gerakan zero waste di seluruh lingkungan sekolah.',
      'Mempererat tali silaturahmi dan solidaritas antar-ekstrakurikuler serta antar-angkatan.'
    ],
    workPrograms: [
      {
        title: 'CreatiFest & Digital Expo',
        description: 'Pekan kreativitas tahunan siswa berupa pameran karya teknologi, startup siswa, bazar kreatif, dan pagelaran musik seni.'
      },
      {
        title: 'Ruang Aspirasi "Curhat OSIS"',
        description: 'Kotak suara dan kanal konsultasi digital yang aman untuk menyalurkan kritik, saran, serta kebutuhan siswa ke pihak sekolah.'
      },
      {
        title: 'Gerakan Sekolah Hijau (Eco-School)',
        description: 'Optimalisasi bank sampah sekolah, pemilahan limbah plastik, dan penanaman hidroponik di area terbuka hijau sekolah.'
      }
    ],
    votes: 31,
    color: {
      primary: '#2563eb',
      light: '#eff6ff',
      border: '#bfdbfe',
      ring: 'ring-blue-500',
      bgHover: 'hover:bg-blue-50',
      badge: 'bg-blue-600 text-white',
      text: 'text-blue-700',
    }
  },
  {
    id: 2,
    number: 2,
    chairmanName: 'Muhammad Fajar',
    viceChairmanName: 'Siti Zahra Khairunnisa',
    photoUrl: '/src/assets/images/paslon_dua_1793931490711.jpg',
    slogan: 'Sinergi Inovasi, Integritas, dan Kepedulian untuk Generasi Unggul',
    vision: 'Menjadikan OSIS sebagai pusat pengembangan kepemimpinan pemuda yang kritis, berjiwa sosial tinggi, serta siap menghadapi tantangan era global dengan tetap menjunjung etika kesantunan.',
    mission: [
      'Menyelenggarakan pelatihan kepemimpinan dan public speaking bersertifikat untuk seluruh perwakilan kelas.',
      'Membangun jejaring kolaborasi dengan universitas terkemuka dan alumni inspiratif untuk bimbingan karir.',
      'Mengaktifkan kembali kompetisi olahraga, debat ilmiah, dan e-sports antarkelas (Class Meeting berkualitas).',
      'Memperkuat program bakti sosial dan tanggap bencana pemuda di lingkungan masyarakat sekitar.'
    ],
    workPrograms: [
      {
        title: 'Youth Leadership & Career Mentoring',
        description: 'Workshop rutin bersama alumni berprestasi mengenai beasiswa, seleksi masuk PTN, dan kepemimpinan organisasi.'
      },
      {
        title: 'Nusantara Cup & E-Sports League',
        description: 'Kompetisi tahunan futsal, basket, bulutangkis, serta turnamen e-sport bernilai sportivitas tinggi.'
      },
      {
        title: 'Peduli Kasih & Sahabat Mengajar',
        description: 'Aksi sosial berkala OSIS membantu anak-anak di panti asuhan dan penyaluran bantuan buku ke perpustakaan desa.'
      }
    ],
    votes: 24,
    color: {
      primary: '#059669',
      light: '#ecfdf5',
      border: '#a7f3d0',
      ring: 'ring-emerald-500',
      bgHover: 'hover:bg-emerald-50',
      badge: 'bg-emerald-600 text-white',
      text: 'text-emerald-700',
    }
  },
  {
    id: 3,
    number: 3,
    chairmanName: 'Dimas Arya Sena',
    viceChairmanName: 'Clarissa Aurelia',
    photoUrl: '/src/assets/images/paslon_tiga_1793931490345.jpg',
    slogan: 'Budaya Sekolah Asik, Kreatif, dan Berprestasi Tanpa Batas',
    vision: 'Membangun ekosistem sekolah yang menyenangkan, mendukung kesehatan mental siswa, memicu lahirnya karya-karya orisinal bernilai seni tinggi, dan berdaya saing antarsekolah.',
    mission: [
      'Menciptakan iklim belajar yang ramah siswa dengan program relaksasi dan dukungan konseling sebaya.',
      'Mewadahi bakat konten kreatif, fotografi, videografi, dan literasi lewat media publikasi sekolah.',
      'Memodernisasi sistem inventaris perlengkapan ekstrakurikuler agar mudah dipinjam.',
      'Mengadakan dialog terbuka berkala antara pengurus OSIS, MPK, dan perwakilan kelas setiap bulan.'
    ],
    workPrograms: [
      {
        title: 'Podcast "Suara Siswa Nusantara"',
        description: 'Siaran bincang-bincang inspiratif di YouTube & Spotify sekolah membahas prestasi siswa, karya seni, dan tips belajar.'
      },
      {
        title: 'Pekan Seni & Budaya Multikultural',
        description: 'Festival kostum adat, kuliner daerah nusantara, pameran fotografi, dan lomba tari kreasi tradisional modern.'
      },
      {
        title: 'Mental Health Corner & Peer Support',
        description: 'Program pendampingan teman sebaya dan seminar psikologi remaja untuk meminimalisasi stres jelang ujian.'
      }
    ],
    votes: 16,
    color: {
      primary: '#b91c1c',
      light: '#fef2f2',
      border: '#fecaca',
      ring: 'ring-rose-500',
      bgHover: 'hover:bg-rose-50',
      badge: 'bg-rose-600 text-white',
      text: 'text-rose-700',
    }
  }
];

export const INITIAL_STUDENTS: Student[] = [
  // Kelas X
  { nis: '2026001', name: 'Ahmad Rizky Pratama', grade: 'X MIPA 1', gender: 'L', hasVoted: true, votedAt: '08:15 WIB', token: '4821', receiptId: 'REC-2601-A9F' },
  { nis: '2026002', name: 'Alya Putri Salsabila', grade: 'X MIPA 1', gender: 'P', hasVoted: true, votedAt: '08:22 WIB', token: '3910', receiptId: 'REC-2602-C7E' },
  { nis: '2026003', name: 'Bayu Aditya Putra', grade: 'X MIPA 1', gender: 'L', hasVoted: false, votedAt: null, token: '7724' },
  { nis: '2026004', name: 'Citra Dewi Anggraini', grade: 'X MIPA 1', gender: 'P', hasVoted: true, votedAt: '08:35 WIB', token: '1942', receiptId: 'REC-2604-D1B' },
  { nis: '2026005', name: 'Danendra Wicaksono', grade: 'X MIPA 1', gender: 'L', hasVoted: false, votedAt: null, token: '8301' },
  { nis: '2026006', name: 'Eka Lestari Rahayu', grade: 'X MIPA 1', gender: 'P', hasVoted: false, votedAt: null, token: '6155' },

  { nis: '2026011', name: 'Fadhil Arkananta', grade: 'X MIPA 2', gender: 'L', hasVoted: true, votedAt: '08:42 WIB', token: '2093', receiptId: 'REC-2611-F3A' },
  { nis: '2026012', name: 'Gita Maharani', grade: 'X MIPA 2', gender: 'P', hasVoted: true, votedAt: '08:50 WIB', token: '5821', receiptId: 'REC-2612-G8K' },
  { nis: '2026013', name: 'Hafiz Surya Al-Ghifari', grade: 'X MIPA 2', gender: 'L', hasVoted: false, votedAt: null, token: '9140' },
  { nis: '2026014', name: 'Indah Permata Sari', grade: 'X MIPA 2', gender: 'P', hasVoted: false, votedAt: null, token: '3318' },
  { nis: '2026015', name: 'Jevon Nathanel', grade: 'X MIPA 2', gender: 'L', hasVoted: true, votedAt: '09:02 WIB', token: '4472', receiptId: 'REC-2615-J4C' },

  { nis: '2026021', name: 'Kania Safira', grade: 'X IPS 1', gender: 'P', hasVoted: true, votedAt: '09:12 WIB', token: '1893', receiptId: 'REC-2621-K9X' },
  { nis: '2026022', name: 'Lukman Hakim', grade: 'X IPS 1', gender: 'L', hasVoted: false, votedAt: null, token: '7729' },
  { nis: '2026023', name: 'Maudy Ayunda Putri', grade: 'X IPS 1', gender: 'P', hasVoted: false, votedAt: null, token: '4481' },
  { nis: '2026024', name: 'Naufal Izzaturahman', grade: 'X IPS 1', gender: 'L', hasVoted: true, votedAt: '09:25 WIB', token: '6320', receiptId: 'REC-2624-N2P' },
  { nis: '2026025', name: 'Olivia Clarissa', grade: 'X IPS 1', gender: 'P', hasVoted: false, votedAt: null, token: '8204' },

  // Kelas XI
  { nis: '2025001', name: 'Pandu Satria Utama', grade: 'XI MIPA 1', gender: 'L', hasVoted: true, votedAt: '09:33 WIB', token: '5192', receiptId: 'REC-2501-P7T' },
  { nis: '2025002', name: 'Qonita Nailah', grade: 'XI MIPA 1', gender: 'P', hasVoted: true, votedAt: '09:41 WIB', token: '8834', receiptId: 'REC-2502-Q1M' },
  { nis: '2025003', name: 'Raka Mahardika', grade: 'XI MIPA 1', gender: 'L', hasVoted: false, votedAt: null, token: '3319' },
  { nis: '2025004', name: 'Syifa Nurul Izzati', grade: 'XI MIPA 1', gender: 'P', hasVoted: true, votedAt: '09:55 WIB', token: '9201', receiptId: 'REC-2504-S5R' },
  { nis: '2025005', name: 'Tegar Budi Perkasa', grade: 'XI MIPA 1', gender: 'L', hasVoted: false, votedAt: null, token: '6104' },

  { nis: '2025011', name: 'Ulya Rahadatul', grade: 'XI MIPA 2', gender: 'P', hasVoted: true, votedAt: '10:05 WIB', token: '4720', receiptId: 'REC-2511-U8L' },
  { nis: '2025012', name: 'Vino Bastian Ardiansyah', grade: 'XI MIPA 2', gender: 'L', hasVoted: false, votedAt: null, token: '8392' },
  { nis: '2025013', name: 'Wulan Dwi Angesti', grade: 'XI MIPA 2', gender: 'P', hasVoted: true, votedAt: '10:14 WIB', token: '2941', receiptId: 'REC-2513-W3K' },
  { nis: '2025014', name: 'Xavier Kevin Chandra', grade: 'XI MIPA 2', gender: 'L', hasVoted: false, votedAt: null, token: '5817' },
  { nis: '2025015', name: 'Yasmin Khansa', grade: 'XI MIPA 2', gender: 'P', hasVoted: true, votedAt: '10:22 WIB', token: '7721', receiptId: 'REC-2515-Y9Z' },

  { nis: '2025021', name: 'Zidane Al-Farizi', grade: 'XI IPS 1', gender: 'L', hasVoted: true, votedAt: '10:30 WIB', token: '1820', receiptId: 'REC-2521-Z4Q' },
  { nis: '2025022', name: 'Anindya Kusuma', grade: 'XI IPS 1', gender: 'P', hasVoted: false, votedAt: null, token: '9312' },
  { nis: '2025023', name: 'Bagas Mahendra', grade: 'XI IPS 1', gender: 'L', hasVoted: true, votedAt: '10:45 WIB', token: '3819', receiptId: 'REC-2522-B6H' },
  { nis: '2025024', name: 'Chelsea Olivia', grade: 'XI IPS 1', gender: 'P', hasVoted: false, votedAt: null, token: '6402' },
  { nis: '2025025', name: 'Davin Prasetyo', grade: 'XI IPS 1', gender: 'L', hasVoted: false, votedAt: null, token: '4831' },

  // Kelas XII
  { nis: '2024001', name: 'Erlangga Yudha', grade: 'XII MIPA 1', gender: 'L', hasVoted: true, votedAt: '11:02 WIB', token: '7741', receiptId: 'REC-2401-E2V' },
  { nis: '2024002', name: 'Farah Nadia', grade: 'XII MIPA 1', gender: 'P', hasVoted: true, votedAt: '11:10 WIB', token: '8310', receiptId: 'REC-2402-F9C' },
  { nis: '2024003', name: 'Galih Wicaksono', grade: 'XII MIPA 1', gender: 'L', hasVoted: false, votedAt: null, token: '5920' },
  { nis: '2024004', name: 'Hani Amalia', grade: 'XII MIPA 1', gender: 'P', hasVoted: true, votedAt: '11:18 WIB', token: '2914', receiptId: 'REC-2404-H5W' },
  { nis: '2024005', name: 'Irfan Maulana', grade: 'XII MIPA 1', gender: 'L', hasVoted: false, votedAt: null, token: '6483' },

  { nis: '2024011', name: 'Jessica Alvina', grade: 'XII MIPA 2', gender: 'P', hasVoted: true, votedAt: '11:27 WIB', token: '3912', receiptId: 'REC-2411-J7S' },
  { nis: '2024012', name: 'Krisna Dewantara', grade: 'XII MIPA 2', gender: 'L', hasVoted: false, votedAt: null, token: '8401' },
  { nis: '2024013', name: 'Larasati Putri', grade: 'XII MIPA 2', gender: 'P', hasVoted: true, votedAt: '11:35 WIB', token: '1947', receiptId: 'REC-2413-L3D' },
  { nis: '2024014', name: 'Mario Teguh Santoso', grade: 'XII MIPA 2', gender: 'L', hasVoted: false, votedAt: null, token: '5529' },
  { nis: '2024015', name: 'Nadya Amanda', grade: 'XII MIPA 2', gender: 'P', hasVoted: true, votedAt: '11:43 WIB', token: '7823', receiptId: 'REC-2415-N8R' },

  { nis: '2024021', name: 'Oki Setiawan', grade: 'XII IPS 1', gender: 'L', hasVoted: true, votedAt: '11:51 WIB', token: '4910', receiptId: 'REC-2421-O1P' },
  { nis: '2024022', name: 'Prita Wardani', grade: 'XII IPS 1', gender: 'P', hasVoted: false, votedAt: null, token: '6720' },
  { nis: '2024023', name: 'Rendy Firmansyah', grade: 'XII IPS 1', gender: 'L', hasVoted: true, votedAt: '12:05 WIB', token: '2839', receiptId: 'REC-2423-R5X' },
  { nis: '2024024', name: 'Salsa Billa Khansa', grade: 'XII IPS 1', gender: 'P', hasVoted: false, votedAt: null, token: '9103' },
  { nis: '2024025', name: 'Thoriq Aziz', grade: 'XII IPS 1', gender: 'L', hasVoted: false, votedAt: null, token: '3842' },
  { nis: '2024026', name: 'Vanya Aurel', grade: 'XII IPS 1', gender: 'P', hasVoted: true, votedAt: '12:15 WIB', token: '5621', receiptId: 'REC-2426-V9B' },
  { nis: '2024027', name: 'Wahyu Ramadhan', grade: 'XII IPS 1', gender: 'L', hasVoted: false, votedAt: null, token: '7219' },
  { nis: '2024028', name: 'Zahrotul Muna', grade: 'XII IPS 1', gender: 'P', hasVoted: false, votedAt: null, token: '8490' },
];

export const INITIAL_LOGS: VoteLog[] = [
  { id: 'log-1', timestamp: '12:15 WIB', grade: 'XII IPS 1', maskedNis: '2024026', candidateNumber: 1 },
  { id: 'log-2', timestamp: '12:05 WIB', grade: 'XII IPS 1', maskedNis: '2024023', candidateNumber: 2 },
  { id: 'log-3', timestamp: '11:51 WIB', grade: 'XII IPS 1', maskedNis: '2024021', candidateNumber: 1 },
  { id: 'log-4', timestamp: '11:43 WIB', grade: 'XII MIPA 2', maskedNis: '2024015', candidateNumber: 3 },
  { id: 'log-5', timestamp: '11:35 WIB', grade: 'XII MIPA 2', maskedNis: '2024013', candidateNumber: 2 },
  { id: 'log-6', timestamp: '11:27 WIB', grade: 'XII MIPA 2', maskedNis: '2024011', candidateNumber: 1 },
  { id: 'log-7', timestamp: '11:18 WIB', grade: 'XII MIPA 1', maskedNis: '2024004', candidateNumber: 1 },
  { id: 'log-8', timestamp: '11:10 WIB', grade: 'XII MIPA 1', maskedNis: '2024002', candidateNumber: 2 },
];
