import React from 'react';
import {
  TrendingUp,
  AlertOctagon,
  CheckCircle,
  HelpCircle,
  Flame,
  ArrowRight,
  Sparkles,
  GitBranch,
  ShieldAlert,
  Clock,
  Layers,
} from 'lucide-react';
import { StudentProfile, ConceptPerformanceItem } from '../types';

interface StudentDashboardProps {
  profile: StudentProfile | null;
  isLoading: boolean;
  onOpenEvidence: (conceptId: string) => void;
  onStartRecovery: (conceptId: string) => void;
  onStartDiagnostic: () => void;
  onViewConfusionMap: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  profile,
  isLoading,
  onOpenEvidence,
  onStartRecovery,
  onStartDiagnostic,
  onViewConfusionMap,
}) => {
  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400">Loading student learning profile...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'MASTERED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Mastered</span>;
      case 'STRONG':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">Strong</span>;
      case 'DEVELOPING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">Developing</span>;
      case 'AT_RISK':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">At Risk</span>;
      case 'CONFUSED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">Confused</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">Pending</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <span>Student Dashboard</span>
            <span>•</span>
            <span>AI Diagnostic Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Good morning, Vishanth.
          </h1>
          <p className="text-sm text-slate-300 mt-1 font-medium">
            Here's what your learning data says.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Learning Streak Badge (Section 5) */}
          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
            <span>5-Day Streak</span>
          </div>

          <button
            onClick={onViewConfusionMap}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
            <span>Concept Graph</span>
          </button>

          <button
            onClick={onStartDiagnostic}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Start Diagnostic</span>
          </button>
        </div>
      </div>

      {/* Section 5 Primary Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Understanding: 78% */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Overall Understanding</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {profile.overall_understanding || 78}%
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +{profile.recent_improvement || 6}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${profile.overall_understanding || 78}%` }}
            ></div>
          </div>
        </div>

        {/* Concepts Strong: 24 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Concepts Strong</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">
              {profile.concepts_strong !== undefined && profile.concepts_strong > 0 ? (profile.concepts_mastered + profile.concepts_strong) : 24}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">calibrated mastery</span>
          </div>
        </div>

        {/* Concepts Developing: 7 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Concepts Developing</span>
            <HelpCircle className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">
              {profile.concepts_developing || 7}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">steady progression</span>
          </div>
        </div>

        {/* Concepts At Risk: 3 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Concepts At Risk</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-amber-300">
              {profile.concepts_at_risk || 3}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">fragile foundation</span>
          </div>
        </div>
      </div>

      {/* CURRENT WEAK AREA (Section 5 Requirement) */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-indigo-950/40 border border-rose-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>CURRENT WEAK AREA</span>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white">Pointer Arithmetic</h2>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-300">
                <span className="bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700">
                  Confidence: <strong className="text-rose-400 font-bold ml-1">Low</strong>
                </span>
                <span className="text-slate-500">•</span>
                <span className="bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700">
                  Detected Root Concept: <strong className="text-amber-300 font-bold ml-1">Memory Addresses</strong>
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Diagnostic evidence reveals that errors in pointer increments (+1 moving 4 bytes in <code className="text-cyan-300 font-mono">int*</code>) are caused by confusion over raw memory addresses rather than pointer syntax.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => onStartRecovery('memory_addresses')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2.5 cursor-pointer transition-all border border-indigo-400/30"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>5-minute prerequisite review</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Concepts Improving & Declining (Section 5 Requirement) */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Concepts Improving */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Concepts Improving</span>
            </div>
            <span className="text-xs text-slate-400">Past 7 days</span>
          </div>
          <div className="space-y-2">
            {[
              { name: 'Memory Addresses', gain: '+18%', note: 'Prerequisite session completed' },
              { name: 'Array Indexing', gain: '+14%', note: 'Consistent correct fast responses' },
              { name: 'Dereferencing (*ptr)', gain: '+10%', note: 'Confidence calibrated from unsure to confident' },
            ].map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-200">{item.name}</span>
                  <div className="text-[11px] text-slate-400">{item.note}</div>
                </div>
                <span className="text-emerald-400 font-bold font-mono text-xs">{item.gain}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Concepts Declining */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              <span>Concepts Declining</span>
            </div>
            <span className="text-xs text-slate-400">Needs review</span>
          </div>
          <div className="space-y-2">
            {[
              { name: 'Pointer Arithmetic', drop: '-12%', note: 'Repeated off-by-size byte calculation errors' },
              { name: 'Dynamic Memory Allocation (malloc)', drop: '-8%', note: 'Low response speed with hints used' },
              { name: 'Pointer to Pointer (**ptr)', drop: '-5%', note: 'Indirection level confusion detected' },
            ].map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-200">{item.name}</span>
                  <div className="text-[11px] text-slate-400">{item.note}</div>
                </div>
                <span className="text-rose-400 font-bold font-mono text-xs">{item.drop}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weak Concepts & Critical Prerequisites Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Weak Concepts (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span>Diagnosed Difficulties & Misconceptions</span>
            </h2>
            <span className="text-xs text-slate-400">{profile.weak_concepts.length} concepts requiring focus</span>
          </div>

          <div className="space-y-3">
            {profile.weak_concepts.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">No active misconceptions detected!</p>
                <p className="text-xs text-slate-400 mt-1">Take a new diagnostic assessment to test more advanced topics.</p>
              </div>
            ) : (
              profile.weak_concepts.map((concept: ConceptPerformanceItem) => (
                <div
                  key={concept.concept_id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <h3 className="text-sm font-bold text-white">{concept.concept_name}</h3>
                      {getStatusBadge(concept.status)}
                      <span className="text-xs text-slate-400 font-medium">({concept.module})</span>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-slate-300">
                      <div>
                        Understanding: <strong className="text-slate-100">{concept.accuracy}%</strong>
                      </div>
                      <div>
                        Confidence: <strong className="text-slate-100">{concept.average_confidence}%</strong>
                      </div>
                      {concept.calibration_gap > 15 && (
                        <div className="text-amber-400 font-medium flex items-center space-x-1">
                          <span>Overconfident by +{concept.calibration_gap}%</span>
                        </div>
                      )}
                    </div>

                    {concept.common_errors.length > 0 && (
                      <div className="text-xs text-slate-400">
                        Observed error pattern:{' '}
                        <span className="text-rose-300/90 font-mono">
                          {concept.common_errors[0].replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {/* "Why was this detected?" button (Section 14 requirement) */}
                    <button
                      onClick={() => onOpenEvidence(concept.concept_id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors cursor-pointer"
                    >
                      Why detected?
                    </button>

                    <button
                      onClick={() => onStartRecovery(concept.concept_id)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Start Recovery</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Critical Prerequisites & Quick Signals */}
        <div className="space-y-6">
          {/* Critical Prerequisites */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Prerequisite Bottlenecks</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Weakness in higher-level topics often stems from foundational prerequisite gaps.
            </p>

            <div className="space-y-2.5">
              {profile.critical_prerequisites.length === 0 ? (
                <p className="text-xs text-slate-500">No unresolved prerequisite bottlenecks detected.</p>
              ) : (
                profile.critical_prerequisites.map((prereq, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{prereq.concept_name}</div>
                      <div className="text-[11px] text-slate-400">Bottleneck for {prereq.required_by}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-amber-400 font-bold">{prereq.accuracy}%</div>
                      <div className="text-[10px] text-slate-500">{prereq.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Learning Tip */}
          <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>Cognitive Principle</span>
            </div>
            <h4 className="text-xs font-bold text-slate-200">The Danger of Overconfidence</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              When confidence is high but accuracy is low, re-reading the notes rarely works.
              You must challenge the specific misconception through code tracing and counter-examples.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
