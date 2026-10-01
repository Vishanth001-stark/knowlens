import React from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, Cpu, GitFork, Compass } from 'lucide-react';

interface LandingPageProps {
  onStartDiagnostic: () => void;
  onOpenLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartDiagnostic,
  onOpenLogin,
}) => {
  const handleScrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden text-center max-w-4xl mx-auto px-4 pt-10 pb-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
          <Cpu className="w-3.5 h-3.5" />
          <span>Diagnostic Misconception Detection Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-6">
          Find what you're actually{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">
            confused about.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
          AI that detects the concepts behind your mistakes and helps you fix the root problem.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStartDiagnostic}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 text-base cursor-pointer"
          >
            <span>Start Diagnostic</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-center space-x-2 text-base cursor-pointer"
            >
              <span>Sign In / Personalize</span>
            </button>
          )}

          <button
            onClick={handleScrollToFeatures}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-slate-300 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 transition-all flex items-center justify-center space-x-2 text-base cursor-pointer"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>See How It Works</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-4">
          Multi-subject AI diagnostic engine (C, Python, Math, DS, OS, Networks, DB). Upload notes or take assessment.
        </p>
      </section>

      {/* 4 Feature Cards (Section 4 Requirement) */}
      <section id="features" className="max-w-6xl mx-auto px-4 scroll-mt-20">
        <div className="text-center mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Core Diagnostic Features</h2>
          <p className="text-2xl font-bold text-white mt-1">Don't just answer questions. Find out why you're confused.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Concept Detection</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Identify weak concepts instead of simply counting wrong answers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
              <GitFork className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Root-Cause Analysis</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Find prerequisite concepts that may be causing confusion.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Adaptive Learning</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Generate targeted revision based on the student's actual weaknesses.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Progress Intelligence</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Track whether understanding improves or decays over time.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison: Why Traditional Tutors Fall Short */}
      <section className="max-w-5xl mx-auto px-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8">
        <h2 className="text-lg font-bold text-white mb-6 text-center">How We Differ From Generic AI Chatbots</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3 bg-slate-950/60 p-5 rounded-xl border border-slate-800/80">
            <div className="text-rose-400 font-semibold text-sm flex items-center space-x-2">
              <span>Standard AI Chatbots & Tutors</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <li>• Give lengthy unstructured explanations you didn't ask for</li>
              <li>• Simply report "You scored 40% in Pointers" without evidence</li>
              <li>• Cannot detect whether your mistake was byte offset math vs raw address value</li>
              <li>• No verification of whether the explanation actually improved understanding</li>
            </ul>
          </div>

          <div className="space-y-3 bg-indigo-950/20 p-5 rounded-xl border border-indigo-500/30">
            <div className="text-indigo-300 font-semibold text-sm flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>KnowLens</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <li>• Pinpoints the exact misconception (e.g. byte arithmetic vs element scaling)</li>
              <li>• Shows transparent empirical evidence: attempts, error tags, confidence mismatch</li>
              <li>• Backtracks through prerequisite concept graphs</li>
              <li>• Delivers targeted 5-step micro-recovery and measures post-test improvement (+Δ%)</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
