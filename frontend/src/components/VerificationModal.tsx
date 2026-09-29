import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/api';
import { VerificationStartData, VerificationResultData } from '../types';

interface VerificationModalProps {
  interventionId: number;
  onClose: () => void;
  onVerified: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  interventionId,
  onClose,
  onVerified,
}) => {
  const [data, setData] = useState<VerificationStartData | null>(null);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationResultData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    initVerification();
  }, [interventionId]);

  const initVerification = async () => {
    try {
      setIsLoading(true);
      const res = await api.startVerification(interventionId);
      setData(res);
      setCurrentIdx(0);
      setSelectedAnswers({});
      setResult(null);
    } catch (err) {
      console.error('Failed to start verification:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId: number, option: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleNext = () => {
    if (!data) return;
    if (currentIdx + 1 < data.questions.length) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handleSubmitAll = async () => {
    if (!data) return;

    try {
      setIsSubmitting(true);
      const answerPayload = data.questions.map(q => ({
        question_id: q.id,
        selected_answer: selectedAnswers[q.id] || '',
      }));

      const res = await api.submitVerification(data.verification_id, answerPayload);
      setResult(res);
    } catch (err) {
      console.error('Error evaluating verification:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400">Loading verification questions...</p>
        </div>
      </div>
    );
  }

  const currentQ = data.questions[currentIdx];
  const allAnswered = data.questions.every(q => selectedAnswers[q.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!result ? (
          <>
            {/* Header */}
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Post-Intervention Verification Assessment</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                {data.concept_name}
              </h2>
              <div className="flex items-center space-x-3 mt-1.5 text-xs text-slate-400">
                <span>Baseline Score: <strong className="text-rose-400 font-mono">{data.pre_score}%</strong></span>
                <span>•</span>
                <span>Question {currentIdx + 1} of {data.questions.length}</span>
              </div>
            </div>

            {/* Question Card */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white leading-relaxed">
                {currentQ.question}
              </h3>

              {currentQ.code_snippet && (
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-200 overflow-x-auto">
                  <pre>
                    <code>{currentQ.code_snippet}</code>
                  </pre>
                </div>
              )}

              {/* Options */}
              <div className="space-y-2 pt-2">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[currentQ.id] === opt;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQ.id, opt)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center space-x-3 cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center text-[11px] font-bold shrink-0">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-30"
              >
                Previous
              </button>

              {currentIdx + 1 < data.questions.length ? (
                <button
                  onClick={handleNext}
                  disabled={!selectedAnswers[currentQ.id]}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitAll}
                  disabled={!allAnswered || isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 disabled:opacity-40 flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Evaluating Verification...' : 'Submit Verification Test'}</span>
                  <Award className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        ) : (
          /* Result View (Section 20 Requirement: Before vs After Delta) */
          <div className="space-y-6 text-center animate-fade-in py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Recovery Verification Complete
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                {result.concept_name}
              </h2>
            </div>

            {/* Before vs After Comparison Card */}
            <div className="grid grid-cols-3 gap-3 p-5 rounded-2xl bg-slate-950 border border-slate-800 text-left">
              <div>
                <span className="text-xs text-slate-500 block">Pre-Intervention</span>
                <span className="text-2xl font-extrabold text-slate-400 font-mono">
                  {result.pre_score}%
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Post-Intervention</span>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                  {result.post_score}%
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Observed Delta</span>
                <div className="flex items-center space-x-1 text-2xl font-extrabold text-cyan-400 font-mono">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <span>+{result.improvement_delta}%</span>
                </div>
              </div>
            </div>

            {/* Grounded Verdict */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed text-left">
              <strong className="text-white block mb-1">Empirical Verdict:</strong>
              {result.verdict}
            </div>

            {/* Close / Return CTA */}
            <button
              onClick={() => {
                onVerified();
                onClose();
              }}
              className="w-full px-6 py-3 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Return to Updated Learning Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
