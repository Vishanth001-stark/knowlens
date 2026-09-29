import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Flame,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Compass,
  CheckCircle,
  FileText,
  Activity,
  Zap,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { StudentAnalysisResponse, WeakConceptItem } from '../types';

interface ConfusionAnalysisProps {
  studentId?: number;
  onStartRecovery: (conceptId: string) => void;
  onOpenEvidence: (conceptId: string) => void;
  onViewConceptMap: () => void;
}

export const ConfusionAnalysis: React.FC<ConfusionAnalysisProps> = ({
  studentId = 1,
  onStartRecovery,
  onOpenEvidence,
  onViewConceptMap,
}) => {
  const [analysis, setAnalysis] = useState<StudentAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAnalysis();
  }, [studentId]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const data = await api.getStudentAnalysis(studentId);
      setAnalysis(data);
    } catch (err) {
      console.error('Failed to load confusion analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analysis) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400">Synthesizing learning diagnostics & root causes...</p>
        </div>
      </div>
    );
  }

  const getIssueBadge = (type: string) => {
    if (type === 'misconception') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
          <Flame className="w-3.5 h-3.5" />
          <span>Possible Misconception Detected</span>
        </span>
      );
    }
    if (type === 'knowledge_gap') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Possible Knowledge Gap</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center space-x-1">
        <Compass className="w-3.5 h-3.5" />
        <span>Prerequisite Gap</span>
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-rose-400 uppercase tracking-wider">
          <span>Diagnostic Intelligence</span>
          <span>•</span>
          <span>Root-Cause Identification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Confusion & Prerequisite Diagnosis
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          The system evaluates student answers, confidence, response times, and repeated attempts to distinguish between simple knowledge gaps, deep-seated misconceptions, and prerequisite bottlenecks.
        </p>
      </div>

      {/* Hero Root Concept Card (Section 13) */}
      {analysis.detected_root_concept ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border border-rose-500/30 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-4 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Detected Root Concept
                </span>
                {getIssueBadge(analysis.possible_issue)}
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {analysis.detected_root_name || analysis.detected_root_concept}
                </h2>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  Instead of merely reviewing downstream topics, the diagnostic traces an underlying prerequisite gap in <strong className="text-white">{analysis.detected_root_name}</strong> that is actively triggering downstream confusion.
                </p>
              </div>

              {/* Evidence Points */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Observed Student Evidence:
                </span>
                <ul className="space-y-1.5">
                  {analysis.evidence.map((ev, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <button
                onClick={() => onStartRecovery(analysis.detected_root_concept!)}
                className="px-6 py-3.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 shadow-xl shadow-rose-600/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start 5-Minute Targeted Review</span>
              </button>

              <button
                onClick={onViewConceptMap}
                className="px-6 py-3 rounded-2xl font-semibold text-xs text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <span>Inspect in Concept Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-slate-900 border border-emerald-500/30 text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Critical Confusion Detected</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Your recent performance demonstrates solid conceptual stability across all tested prerequisites.
          </p>
        </div>
      )}

      {/* Weak Concepts Breakdown Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span>Analyzed Concepts & Difficulty Scores</span>
          </h3>
          <span className="text-xs text-slate-400">
            Learning Difficulty Score (0-100)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analysis.weak_concepts.map(c => (
            <div
              key={c.concept_id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">{c.module}</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      c.status === 'CONFUSED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <h4 className="text-base font-bold text-white">{c.concept_name}</h4>

                {/* Score meters */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Accuracy</span>
                    <span className="font-bold text-white">{c.accuracy}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${c.accuracy < 50 ? 'bg-rose-500' : 'bg-amber-500'}`}
                      style={{ width: `${c.accuracy}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">Learning Difficulty Score</span>
                    <span className="font-bold text-rose-400">{c.learning_difficulty_score} / 100</span>
                  </div>
                </div>

                {/* Suspected bottleneck */}
                {c.suspected_prerequisite && (
                  <div className="text-xs bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-slate-300">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Suspected Prerequisite Gap:
                    </span>
                    <span className="font-semibold text-indigo-300">
                      {c.suspected_prerequisite_name || c.suspected_prerequisite}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenEvidence(c.concept_id)}
                  className="flex-1 py-1.5 px-2.5 rounded-lg text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                >
                  Evidence Panel
                </button>
                <button
                  onClick={() => onStartRecovery(c.concept_id)}
                  className="py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors cursor-pointer"
                >
                  Recover
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
