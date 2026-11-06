import React from 'react';
import { Candidate } from '../types';
import { X, Check, Award, Target, Sparkles, Vote } from 'lucide-react';

interface CandidateModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  onVoteForCandidate: (candidate: Candidate) => void;
  isElectionOpen: boolean;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({
  candidate,
  onClose,
  onVoteForCandidate,
  isElectionOpen,
}) => {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 overflow-hidden shadow-2xl border border-slate-200 animate-scale-up">
        {/* Header with Candidate Color */}
        <div
          className="p-6 text-white relative"
          style={{ backgroundColor: candidate.color.primary }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <img
              src={candidate.photoUrl}
              alt={`Paslon ${candidate.number}`}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white/60 shadow-md shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-white/20 text-xs font-bold tracking-wider uppercase mb-1">
                Pasangan Calon No. 0{candidate.number}
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                {candidate.chairmanName} & {candidate.viceChairmanName}
              </h2>
              <p className="text-xs text-white/90 italic mt-1 line-clamp-2">
                &ldquo;{candidate.slogan}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Visi */}
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span>Visi Kepemimpinan</span>
            </div>
            <p className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 leading-relaxed text-slate-800 text-xs sm:text-sm">
              {candidate.vision}
            </p>
          </div>

          {/* Misi */}
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Misi Utama</span>
            </div>
            <ul className="space-y-2">
              {candidate.mission.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Program Kerja Unggulan */}
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>3 Program Kerja Unggulan</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {candidate.workPrograms.map((prog, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">
                      Program {idx + 1}
                    </span>
                    <span className="text-slate-300">·</span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {prog.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {prog.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Tutup
          </button>

          {isElectionOpen && (
            <button
              onClick={() => {
                onClose();
                onVoteForCandidate(candidate);
              }}
              className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              style={{ backgroundColor: candidate.color.primary }}
            >
              <Vote className="w-4 h-4" />
              <span>Pilih Paslon 0{candidate.number} di Bilik Suara</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
