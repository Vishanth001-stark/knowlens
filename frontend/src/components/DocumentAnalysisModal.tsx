import React from 'react';
import {
  X,
  FileText,
  AlertTriangle,
  GitBranch,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { DocumentAnalysis } from '../types';

interface DocumentAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentAnalysis: DocumentAnalysis | null;
  onStartDiagnostic: (docId: number) => void;
}

export const DocumentAnalysisModal: React.FC<DocumentAnalysisModalProps> = ({
  isOpen,
  onClose,
  documentAnalysis,
  onStartDiagnostic,
}) => {
  if (!isOpen || !documentAnalysis) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl my-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title & Meta */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>AI Document Confusion Scanner</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {documentAnalysis.filename}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
                Subject: {documentAnalysis.detected_subject}
              </span>
              <span>•</span>
              <span>{Math.round(documentAnalysis.file_size / 1024)} KB</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">Text parsed successfully</span>
            </div>
          </div>
        </div>

        {/* Extracted Concepts */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Concepts Identified in Uploaded Notes</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {documentAnalysis.extracted_concepts.map((concept, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
              >
                {concept.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* AI Detected Confusion Hotspots & Bottlenecks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Cognitive Confusion Hotspots & Prerequisite Bottlenecks</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {documentAnalysis.confusion_hotspots.length} detected
            </span>
          </div>

          <div className="space-y-3">
            {documentAnalysis.confusion_hotspots.map((hotspot, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-200">{hotspot.concept}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        hotspot.risk_level === 'high'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {hotspot.risk_level} Risk Confusion
                    </span>
                  </div>

                  {hotspot.prerequisite_bottleneck && (
                    <div className="flex items-center space-x-1.5 text-xs text-amber-300 font-medium">
                      <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                      <span>Root: {hotspot.prerequisite_bottleneck}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-slate-100">Potential Misconception: </strong>
                  {hotspot.potential_confusion}
                </p>

                <div className="text-xs text-indigo-300 bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-500/20">
                  <strong className="text-indigo-200">AI Diagnostic Recommendation: </strong>
                  {hotspot.remedy_suggestion}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Diagnostic Session Generator CTA */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Ready for Diagnostic</span>
            </div>
            <h4 className="text-base font-bold text-white">
              {documentAnalysis.question_count} Tailored Diagnostic Questions Generated
            </h4>
            <p className="text-xs text-slate-300">
              Test your understanding of the concepts and prerequisite traps found in your notes.
            </p>
          </div>

          <button
            onClick={() => onStartDiagnostic(documentAnalysis.id)}
            className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 cursor-pointer transition-all shrink-0"
          >
            <span>Start Diagnostic on Uploaded Material</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
