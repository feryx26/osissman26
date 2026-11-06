import React from 'react';
import { Candidate } from '../types';
import { Target, Award, Sparkles, Vote, Info, Check } from 'lucide-react';

interface CandidateListProps {
  candidates: Candidate[];
  onOpenCandidateModal: (candidate: Candidate) => void;
  onVoteForCandidate: (candidate: Candidate) => void;
  isElectionOpen: boolean;
}

export const CandidateList: React.FC<CandidateListProps> = ({
  candidates,
  onOpenCandidateModal,
  onVoteForCandidate,
  isElectionOpen,
}) => {
  return (
    <div className="space-y-8 pb-12">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
          Kandidat Pemilihan OSIS 2026/2027
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Profil Pasangan Calon Ketua & Wakil Ketua
        </h2>
        <p className="text-sm text-slate-500">
          Kenali visi, misi, dan program kerja unggulan tiap pasangan calon sebelum Anda menentukan pilihan di bilik suara.
        </p>
      </div>

      {/* Grid of Candidates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {candidates.map((cand) => (
          <div
            key={cand.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
          >
            {/* Header with Number */}
            <div
              className="py-3 px-5 flex items-center justify-between text-white font-bold"
              style={{ backgroundColor: cand.color.primary }}
            >
              <span className="text-xs tracking-wider uppercase opacity-90">
                Pasangan Calon
              </span>
              <span className="text-lg font-black font-mono">0{cand.number}</span>
            </div>

            {/* Photo */}
            <div className="p-5 pb-3">
              <div className="w-full aspect-square rounded-xl overflow-hidden border border-slate-100 shadow-xs bg-slate-50">
                <img
                  src={cand.photoUrl}
                  alt={`Paslon ${cand.number}`}
                  className="w-full h-full object-cover hover:scale-102 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-5 pt-0 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {cand.chairmanName}
                  </h3>
                  <p className="text-xs font-medium text-slate-600">
                    & {cand.viceChairmanName}
                  </p>
                  <p className="text-[11px] text-slate-500 italic mt-2">
                    &ldquo;{cand.slogan}&rdquo;
                  </p>
                </div>

                {/* Visi preview */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-blue-600" />
                    <span>Visi Singkat:</span>
                  </span>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {cand.vision}
                  </p>
                </div>

                {/* Programs preview */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Program Unggulan:</span>
                  </span>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {cand.workPrograms.slice(0, 2).map((p, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span className="truncate">{p.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onOpenCandidateModal(cand)}
                  className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>Lihat Selengkapnya</span>
                </button>

                {isElectionOpen && (
                  <button
                    type="button"
                    onClick={() => onVoteForCandidate(cand)}
                    className="w-full py-2.5 px-3 text-xs font-bold text-white rounded-lg shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    style={{ backgroundColor: cand.color.primary }}
                  >
                    <Vote className="w-4 h-4" />
                    <span>Pilih Paslon 0{cand.number}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
