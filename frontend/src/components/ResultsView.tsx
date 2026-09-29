import React from 'react';
import {
  Award,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DiagnosticCompleteData } from '../types';

interface ResultsViewProps {
  data: DiagnosticCompleteData;
  onGoToDashboard: () => void;
  onStartRecovery: (conceptId: string) => void;
  onRetake: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  data,
  onGoToDashboard,
  onStartRecovery,
  onRetake,
}) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
          <Award className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          Diagnostic Assessment Complete
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Diagnostic Summary & Misconception Scan
        </h1>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          Your responses, response latencies, and confidence levels have been mapped onto the concept prerequisite DAG.
        </p>
      </div>

      {/* Score Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-2">
        <span className="text-xs text-slate-400 font-medium">Diagnostic Accuracy</span>
        <div className="text-4xl sm:text-5xl font-extrabold text-white font-mono">
          {data.score_percentage}%
        </div>
        <p className="text-xs text-slate-400">
          {data.correct_count} of {data.total_answered} questions answered correctly
        </p>
      </div>

      {/* Categorized Findings */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Confused / Misconceptions */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-rose-900/40 bg-rose-950/10 space-y-3">
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <Flame className="w-4 h-4" />
            <span>Active Misconceptions ({data.confused_concepts.length})</span>
          </div>

          {data.confused_concepts.length === 0 ? (
            <p className="text-xs text-slate-500">No high-confidence misconceptions detected.</p>
          ) : (
            <div className="space-y-1.5">
              {data.confused_concepts.map((c, i) => (
                <div key={i} className="text-xs font-semibold text-rose-200 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Strong Concepts */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-900/40 bg-emerald-950/10 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Strong Concepts ({data.strong_concepts.length})</span>
          </div>

          {data.strong_concepts.length === 0 ? (
            <p className="text-xs text-slate-500">No concepts categorized as fully mastered yet.</p>
          ) : (
            <div className="space-y-1.5">
              {data.strong_concepts.slice(0, 4).map((c, i) => (
                <div key={i} className="text-xs font-semibold text-emerald-200 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Concept Action */}
      {data.recommended_concept && (
        <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
              Immediate Recommendation
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              Recover: {data.recommended_concept}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Begin a 5-step targeted micro-intervention to rectify the core prerequisite bottlenecks.
            </p>
          </div>

          <button
            onClick={() => onStartRecovery('pointer_arithmetic')}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 shrink-0 transition-all cursor-pointer"
          >
            <span>Start Recovery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center justify-center space-x-4 pt-2">
        <button
          onClick={onRetake}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retake Diagnostic</span>
        </button>

        <button
          onClick={onGoToDashboard}
          className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors cursor-pointer"
        >
          Go to Learning Profile Dashboard
        </button>
      </div>
    </div>
  );
};
