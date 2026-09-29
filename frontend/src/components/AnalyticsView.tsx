import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  History,
  Trash2,
  Clock,
  Compass,
  Award,
} from 'lucide-react';
import { api } from '../services/api';
import { AnalyticsData } from '../types';

interface AnalyticsViewProps {
  onRefresh: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onRefresh }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAnalytics(1);
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistory = async () => {
    if (!window.confirm('Are you sure you want to delete your learning logs and diagnostic history?')) return;
    try {
      setIsDeleting(true);
      await api.deleteHistory(1);
      await loadAnalytics();
      onRefresh();
    } catch (err) {
      console.error('Failed to delete history:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400">Loading progress analytics...</p>
        </div>
      </div>
    );
  }

  // Distribution chart data
  const distData = [
    { name: 'Mastered', count: data.confusion_distribution['MASTERED'] || 0, fill: '#10b981' },
    { name: 'Strong', count: data.confusion_distribution['STRONG'] || 0, fill: '#06b6d4' },
    { name: 'Developing', count: data.confusion_distribution['DEVELOPING'] || 0, fill: '#3b82f6' },
    { name: 'At Risk', count: data.confusion_distribution['AT_RISK'] || 0, fill: '#f59e0b' },
    { name: 'Confused', count: data.confusion_distribution['CONFUSED'] || 0, fill: '#f43f5e' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Psychometrics & Learning Behavior
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Progress & Calibration Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Examine confidence calibration, misconception prevalence, and intervention recovery trajectories.
          </p>
        </div>

        <button
          onClick={handleDeleteHistory}
          disabled={isDeleting}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 transition-colors flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
          title="Privacy: Permanently delete your responses and diagnostic logs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{isDeleting ? 'Deleting...' : 'Delete Learning History'}</span>
        </button>
      </div>

      {/* Confidence Calibration Message (Section 23) */}
      <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-start space-x-3.5">
        <Compass className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-indigo-300 block mb-0.5">Confidence Calibration Assessment:</span>
          <p className="text-slate-300 leading-relaxed">{data.calibration_message}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chart 1: Confidence vs Accuracy Calibration (Section 22 requirement) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Confidence vs. Accuracy Calibration</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Highlighting overconfidence (misconceptions) and fragile understanding.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  type="number"
                  dataKey="accuracy"
                  name="Accuracy"
                  unit="%"
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={11}
                />
                <YAxis
                  type="number"
                  dataKey="confidence"
                  name="Confidence"
                  unit="%"
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={11}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const pt = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs shadow-xl space-y-1">
                          <p className="font-bold text-white">{pt.concept_name}</p>
                          <p className="text-slate-300">Accuracy: <strong className="text-emerald-400">{pt.accuracy}%</strong></p>
                          <p className="text-slate-300">Confidence: <strong className="text-indigo-400">{pt.confidence}%</strong></p>
                          <p className="text-slate-400">Calibration Gap: {pt.gap > 0 ? `+${pt.gap}%` : `${pt.gap}%`}</p>
                          <p className="text-[11px] font-mono text-cyan-400">Status: {pt.status}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Concepts" data={data.confidence_accuracy_points}>
                  {data.confidence_accuracy_points.map((entry, index) => {
                    const color =
                      entry.status === 'CONFUSED'
                        ? '#f43f5e'
                        : entry.status === 'AT_RISK'
                        ? '#f59e0b'
                        : entry.status === 'DEVELOPING'
                        ? '#3b82f6'
                        : '#10b981';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-300">
              <strong>High Conf + Low Acc:</strong> Misconception Zone
            </div>
            <div className="p-2 rounded-lg bg-blue-950/20 border border-blue-900/30 text-blue-300">
              <strong>Low Conf + High Acc:</strong> Fragile Knowledge
            </div>
          </div>
        </div>

        {/* Chart 2: Knowledge State Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Concept Mastery Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown across the 26 C Programming concepts in the curriculum.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                          <span className="font-bold text-white">{item.name}: </span>
                          <span className="font-mono text-cyan-400">{item.count} concepts</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {distData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Total Concepts: 26</span>
            <span>Subject: C Programming (ANSI / C99)</span>
          </div>
        </div>
      </div>

      {/* Learning History Timeline (Section 21 requirement) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Learning & Verification History</h2>
        </div>

        {data.history.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No intervention verification sessions completed yet. Complete a recovery session to track before/after trajectories.
          </p>
        ) : (
          <div className="space-y-3">
            {data.history.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-200">{item.concept_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">{item.date}</div>
                </div>

                <div className="flex items-center space-x-6">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Pre-Test</span>
                    <span className="font-mono text-slate-300 font-bold">{item.pre_score}%</span>
                  </div>

                  <div className="text-slate-600">→</div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">Post-Test</span>
                    <span className="font-mono text-emerald-400 font-bold">{item.post_score}%</span>
                  </div>

                  {item.improvement_delta !== undefined && (
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px]">Delta</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        +{item.improvement_delta}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
