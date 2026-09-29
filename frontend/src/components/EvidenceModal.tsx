import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  GitBranch,
  ShieldAlert,
  ArrowRight,
  Flame,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { api } from '../services/api';
import { EvidencePanelData } from '../types';

interface EvidenceModalProps {
  conceptId: string;
  onClose: () => void;
  onStartRecovery: (conceptId: string) => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  conceptId,
  onClose,
  onStartRecovery,
}) => {
  const [data, setData] = useState<EvidencePanelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvidence();
  }, [conceptId]);

  const loadEvidence = async () => {
    try {
      setIsLoading(true);
      const res = await api.getConceptDiagnosis(conceptId, 1);
      setData(res);
    } catch (err) {
      console.error('Failed to load diagnosis evidence:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 p-6 sm:p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isLoading || !data ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-400">Compiling empirical student evidence...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
                <Flame className="w-4 h-4" />
                <span>Empirical Diagnosis Evidence</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Why was this detected?
              </h2>
              <div className="flex items-center space-x-3 mt-2">
                <span className="text-sm font-semibold text-slate-200">{data.concept_name}</span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  {data.status}
                </span>
                <span className="text-xs text-slate-400">
                  System Confidence: <strong className="text-white">{Math.round(data.system_confidence * 100)}%</strong>
                </span>
              </div>
            </div>

            {/* Evidence Bullets (Section 14: Never fabricate evidence) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Verified Evidence Recorded From Your Learning Sessions</span>
              </h3>

              <ul className="space-y-2.5 text-xs text-slate-300">
                {data.evidence_items.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prerequisite Bottleneck Callout */}
            {data.likely_prerequisite && (
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Likely Prerequisite Bottleneck</span>
                </div>
                <div className="text-sm font-bold text-slate-200">
                  {data.prerequisite_name || data.likely_prerequisite}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {data.prerequisite_evidence ||
                    `Foundational gaps in ${data.prerequisite_name || data.likely_prerequisite} are cascading into difficulty with ${data.concept_name}.`}
                </p>
              </div>
            )}

            {/* ML Explainability: Contributing Factors (Section 31 requirement) */}
            {data.ml_contributing_factors && data.ml_contributing_factors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Model Explainability (Confusion Estimate Factors)</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {data.ml_contributing_factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-300 font-medium">{factor.label}</span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                          factor.impact_level === 'High'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : factor.impact_level === 'Medium'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {factor.impact_level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Dismiss
              </button>

              <button
                onClick={() => {
                  onClose();
                  onStartRecovery(data.concept_id);
                }}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center space-x-2 transition-all cursor-pointer"
              >
                <span>Start Targeted Recovery</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
