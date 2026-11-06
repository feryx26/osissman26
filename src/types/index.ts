export interface WorkProgram {
  title: string;
  description: string;
}

export interface Candidate {
  id: number;
  number: number;
  chairmanName: string;
  viceChairmanName: string;
  photoUrl: string;
  slogan: string;
  vision: string;
  mission: string[];
  workPrograms: WorkProgram[];
  votes: number;
  color: {
    primary: string;
    light: string;
    border: string;
    ring: string;
    bgHover: string;
    badge: string;
    text: string;
  };
}

export interface Student {
  nis: string; // NO INDUK
  nisn?: string; // NISN
  name: string; // NAMA
  grade: string; // KELAS
  gender: 'L' | 'P'; // JK
  hasVoted: boolean;
  votedAt?: string | null;
  token: string;
  receiptId?: string;
  candidateChosen?: number; // kept for student's own proof receipt
}

export interface VoteLog {
  id: string;
  timestamp: string;
  grade: string;
  maskedNis: string;
  candidateNumber: number;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  createdAt: string;
  lastSignInAt: string | null;
}

export interface ElectionSettings {
  schoolName: string;
  schoolAddress: string;
  logoUrl: string;
  schoolYear: string;
  electionTitle: string;
  isOpen: boolean;
  totalVoters: number;
  lastUpdated: string;
  scheduledEnd: string;
}

export type ActiveTab = 'dashboard' | 'bilik-suara' | 'kandidat' | 'dpt' | 'admin';
