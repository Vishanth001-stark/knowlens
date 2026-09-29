import React, { useEffect, useState } from 'react';
import {
  Code2,
  Terminal,
  Calculator,
  Binary,
  Network,
  Cpu,
  Database,
  ArrowRight,
  BookOpen,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api';
import { SubjectItem } from '../types';

interface SubjectSelectionProps {
  onSelectSubject: (subject: SubjectItem) => void;
  onQuickStartDiagnostic: (subjectCode: string) => void;
}

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  c_programming: <Terminal className="w-6 h-6 text-cyan-400" />,
  python: <Code2 className="w-6 h-6 text-amber-400" />,
  mathematics: <Calculator className="w-6 h-6 text-emerald-400" />,
  data_structures: <Binary className="w-6 h-6 text-purple-400" />,
  computer_networks: <Network className="w-6 h-6 text-blue-400" />,
  operating_systems: <Cpu className="w-6 h-6 text-rose-400" />,
  database_systems: <Database className="w-6 h-6 text-teal-400" />,
};

const SUBJECT_ACCENTS: Record<string, { bg: string; border: string; glow: string }> = {
  c_programming: { bg: 'bg-cyan-950/20', border: 'border-cyan-500/30', glow: 'hover:border-cyan-400/60' },
  python: { bg: 'bg-amber-950/20', border: 'border-amber-500/30', glow: 'hover:border-amber-400/60' },
  mathematics: { bg: 'bg-emerald-950/20', border: 'border-emerald-500/30', glow: 'hover:border-emerald-400/60' },
  data_structures: { bg: 'bg-purple-950/20', border: 'border-purple-500/30', glow: 'hover:border-purple-400/60' },
  computer_networks: { bg: 'bg-blue-950/20', border: 'border-blue-500/30', glow: 'hover:border-blue-400/60' },
  operating_systems: { bg: 'bg-rose-950/20', border: 'border-rose-500/30', glow: 'hover:border-rose-400/60' },
  database_systems: { bg: 'bg-teal-950/20', border: 'border-teal-500/30', glow: 'hover:border-teal-400/60' },
};

export const SubjectSelection: React.FC<SubjectSelectionProps> = ({
  onSelectSubject,
  onQuickStartDiagnostic,
}) => {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await api.getSubjects();
      setSubjects(data);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
          <span>Diagnostic System</span>
          <span>•</span>
          <span>Subject Catalog</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Select a Subject to Diagnose
        </h1>
        <p className="text-base text-slate-400 max-w-3xl">
          The AI Confusion Detector models prerequisite chains and detects whether mistakes stem from current topics or underlying prerequisite gaps.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-400">Loading subject catalog...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map(subject => {
            const icon = SUBJECT_ICONS[subject.code] || <BookOpen className="w-6 h-6 text-slate-400" />;
            const accent = SUBJECT_ACCENTS[subject.code] || {
              bg: 'bg-slate-900',
              border: 'border-slate-800',
              glow: 'hover:border-slate-700',
            };

            return (
              <div
                key={subject.id}
                className={`p-6 rounded-2xl bg-slate-900 border ${accent.border} ${accent.glow} flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      {icon}
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {subject.concept_count} Concepts
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {subject.name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {subject.description}
                  </p>

                  <div className="flex items-center space-x-3 mt-4 text-xs text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{subject.topic_count} Topics</span>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">Diagnostic Ready</span>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between gap-3">
                  <button
                    onClick={() => onSelectSubject(subject)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <span>Browse Topics</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onQuickStartDiagnostic(subject.code)}
                    className="py-2 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Diagnose</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
