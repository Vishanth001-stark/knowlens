import React, { useEffect, useState } from 'react';
import {
  History,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { StudentProgressResponse } from '../types';

interface LearningHistoryViewProps {
  studentId?: number;
  onStartRecovery: (conceptId: string) => void;
}

export const LearningHistoryView: React.FC<LearningHistoryViewProps> = ({
  studentId = 1,
  onStartRecovery,
}) => {
  const [progress, setProgress] = useState<StudentProgressResponse | null>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prog, hist] = await Promise.all([
        api.getStudentProgress(studentId),
        api.getStudentHistory(studentId),
      ]);
      setProgress(prog);
      setHistoryItems(hist);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !progress) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400">Loading learning session logs & timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
          <span>Continuous Modeling</span>
          <span>•</span>
          <span>Learning State History</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Learning History & Progress Trajectory
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          Review previous diagnostic sessions, micro-learning recovery interventions, before-and-after improvement deltas, and concept decay timelines.
        </p>
      </div>

      {/* Before vs After Analysis (Section 17) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Before vs After Intervention Analysis</h2>
              <span className="text-xs text-slate-400">Demonstrating measurable recovery following targeted micro-learning</span>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
            Targeted Review Validated
          </span>
        </div>

        {/* Comparison Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="space-y-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pre-Intervention Baseline</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-rose-400">42%</span>
              <span className="text-xs text-slate-500">Initial Diagnostic</span>
            </div>
            <p className="text-xs text-slate-400">
              Low accuracy and high confidence on address arithmetic indicating an active misconception.
            </p>
          </div>

          <div className="space-y-2 md:border-x md:border-slate-800 md:px-6">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Targeted Intervention</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold text-indigo-300">Memory Addresses</span>
            </div>
            <p className="text-xs text-slate-400">
              5-minute prerequisite review addressed memory layout & byte scaling prior to re-evaluating pointer arithmetic.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Post-Intervention Result</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-emerald-400">71%</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                +29 percentage points
              </span>
            </div>
            <p className="text-xs text-emerald-300/80 font-medium">
              Observed improvement after the review session.
            </p>
          </div>
        </div>
      </div>

      {/* Knowledge Decay Timeline (Section 18) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Knowledge Decay Tracking</h2>
              <span className="text-xs text-slate-400">Concept retention monitoring over spaced intervals</span>
            </div>
          </div>
          <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Possible Knowledge Decay Observed</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {progress.knowledge_decay_timeline.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                item.decay_observed
                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <div>
                <span className="text-[11px] font-mono text-slate-400 block">{item.date}</span>
                <span className="text-2xl font-black mt-1 block">{item.score}%</span>
                <span className="text-xs font-medium block mt-1">{item.concept_name}</span>
              </div>
              {item.retrieval_recommended && (
                <div className="mt-3 pt-2 border-t border-amber-500/30">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Short retrieval practice recommended</span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Activity Timeline Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <History className="w-5 h-5 text-indigo-400" />
          <span>Diagnostic & Verification Activity History</span>
        </h3>

        {historyItems.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No diagnostic history recorded yet. Complete a diagnostic test to build your timeline.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Activity Type</th>
                  <th className="py-2.5 px-3">Concept / Topic</th>
                  <th className="py-2.5 px-3">Pre-Score</th>
                  <th className="py-2.5 px-3">Post-Score</th>
                  <th className="py-2.5 px-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {historyItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{item.date}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded font-semibold uppercase text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">{item.concept_name}</td>
                    <td className="py-3 px-3 text-slate-300">{item.pre_score !== undefined ? `${item.pre_score}%` : `${item.score}%`}</td>
                    <td className="py-3 px-3 text-slate-300">{item.post_score !== undefined ? `${item.post_score}%` : '—'}</td>
                    <td className="py-3 px-3">
                      {item.delta !== undefined ? (
                        <span className="text-emerald-400 font-bold">
                          +{item.delta}% ({item.verdict})
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">{item.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
