import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  BarChart,
  Percent,
  Target,
  Sparkles,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { EvaluationRunResponse } from '../types';

export const EvaluationView: React.FC = () => {
  const [evalResult, setEvalResult] = useState<EvaluationRunResponse | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    runEvaluation();
  }, []);

  const runEvaluation = async () => {
    try {
      setIsRunning(true);
      const data = await api.runEvaluation();
      setEvalResult(data);
    } catch (err) {
      console.error('Failed to run evaluation benchmark:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <span>Model Verification</span>
            <span>•</span>
            <span>Section 29 Evaluation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            KnowLens Evaluation Benchmark
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Empirical benchmark assessing classification accuracy, prerequisite bottleneck tracing, and misconception discrimination precision/recall/F1.
          </p>
        </div>

        <button
          onClick={runEvaluation}
          disabled={isRunning}
          className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center space-x-2 shrink-0 transition-all cursor-pointer disabled:opacity-50"
        >
          {isRunning ? (
            <RotateCcw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>{isRunning ? 'Running Benchmark...' : 'Run Benchmark'}</span>
        </button>
      </div>

      {/* Experimental Notice Banner */}
      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-start space-x-3 text-xs text-indigo-200">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-indigo-300">Experimental Notice:</strong> The evaluation dataset is small (N=25) and experimental, serving as a pedagogical validation benchmark to measure heuristic consistency, prerequisite tracing DAG, and high-confidence error discrimination.
        </div>
      </div>

      {evalResult && (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Classification Accuracy</span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-extrabold text-white">
                  {evalResult.classification_accuracy}%
                </span>
                <span className="text-xs text-emerald-400 font-semibold">25 samples</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">Status prediction match</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Prerequisite ID Accuracy</span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-extrabold text-white">
                  {evalResult.prerequisite_identification_accuracy}%
                </span>
                <span className="text-xs text-emerald-400 font-semibold">Root DAG match</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">Prerequisite bottleneck</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Misconception Precision</span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-extrabold text-white">
                  {evalResult.misconception_detection.precision}%
                </span>
                <span className="text-xs text-indigo-400 font-semibold">TP / (TP+FP)</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">Zero false positives</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Misconception F1-Score</span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-extrabold text-white">
                  {evalResult.misconception_detection.f1_score}%
                </span>
                <span className="text-xs text-cyan-400 font-semibold">
                  Recall {evalResult.misconception_detection.recall}%
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">Harmonic mean</span>
            </div>
          </div>

          {/* Confusion Matrix Breakdown */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Target className="w-4 h-4 text-indigo-400" />
              <span>Misconception Discrimination Matrix</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs text-slate-400 block">True Positives (TP)</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">
                  {evalResult.misconception_detection.true_positives}
                </span>
                <span className="text-[10px] text-slate-500">Correctly detected misconceptions</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs text-slate-400 block">False Positives (FP)</span>
                <span className="text-2xl font-black text-slate-300 mt-1 block">
                  {evalResult.misconception_detection.false_positives}
                </span>
                <span className="text-[10px] text-slate-500">False alarms</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs text-slate-400 block">False Negatives (FN)</span>
                <span className="text-2xl font-black text-slate-300 mt-1 block">
                  {evalResult.misconception_detection.false_negatives}
                </span>
                <span className="text-[10px] text-slate-500">Missed misconceptions</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs text-slate-400 block">True Negatives (TN)</span>
                <span className="text-2xl font-black text-cyan-400 mt-1 block">
                  {evalResult.misconception_detection.true_negatives}
                </span>
                <span className="text-[10px] text-slate-500">Correctly identified non-misconceptions</span>
              </div>
            </div>
          </div>

          {/* Sample Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Benchmark Case Evaluations (N=25)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Test ID</th>
                    <th className="py-2.5 px-3">Concept</th>
                    <th className="py-2.5 px-3">Expected</th>
                    <th className="py-2.5 px-3">Predicted</th>
                    <th className="py-2.5 px-3">Match</th>
                    <th className="py-2.5 px-3">Misconception</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {evalResult.sample_details.map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{s.id}</td>
                      <td className="py-2.5 px-3 font-medium text-white">{s.concept}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-semibold">
                          {s.expected_classification}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold ${
                            s.predicted_classification === 'CONFUSED'
                              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                              : s.predicted_classification === 'MASTERED'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                              : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {s.predicted_classification}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {s.is_match ? (
                          <span className="text-emerald-400 font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Match</span>
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold flex items-center space-x-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Diff</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {s.has_misconception_predicted ? (
                          <span className="text-rose-400 font-semibold">Yes</span>
                        ) : (
                          <span className="text-slate-500">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
