import React, { useRef } from 'react';
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
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { StudentProfile, ConceptPerformanceItem, StudentUser, DocumentAnalysis } from '../types';

interface StudentDashboardProps {
  profile: StudentProfile | null;
  studentUser: StudentUser | null;
  isLoading: boolean;
  onOpenEvidence: (conceptId: string) => void;
  onStartRecovery: (conceptId: string) => void;
  onStartDiagnostic: () => void;
  onViewConfusionMap: () => void;
  onUploadDocument: (file: File) => void;
  isUploadingDoc: boolean;
  uploadedDocuments: DocumentAnalysis[];
  onViewDocumentAnalysis: (doc: DocumentAnalysis) => void;
  onStartDocDiagnostic: (docId: number) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  profile,
  studentUser,
  isLoading,
  onOpenEvidence,
  onStartRecovery,
  onStartDiagnostic,
  onViewConfusionMap,
  onUploadDocument,
  isUploadingDoc,
  uploadedDocuments,
  onViewDocumentAnalysis,
  onStartDocDiagnostic,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const displayName = studentUser?.name || profile?.student_name || 'Learner';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadDocument(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadDocument(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };


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
            Good morning, {displayName}.
          </h1>
          <p className="text-sm text-slate-300 mt-1 font-medium">
            Here's what your learning data says.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Learning Activity Status */}
          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{profile.overall_understanding > 0 ? 'Active Session' : 'New Learner'}</span>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload Notes</span>
          </button>

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

      {/* Prominent Document / PDF Upload for KnowLens */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>KnowLens Document & PDF Scanner</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              Upload Your Study Notes or PDF to Detect Confusion
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Upload lecture notes, textbook chapters, or assignments. KnowLens will parse the text, identify concept dependencies, detect potential confusion bottlenecks, and build a targeted diagnostic.
            </p>
          </div>

          <div className="shrink-0 flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.txt,.md,.c,.cpp,.py,.doc,.docx"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingDoc}
              className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isUploadingDoc ? 'Analyzing Document...' : 'Upload PDF or Document'}</span>
            </button>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl p-5 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/60 transition-all space-y-2 group"
        >
          <UploadCloud className="w-8 h-8 text-indigo-400 mx-auto group-hover:scale-110 transition-transform" />
          <div className="text-xs font-semibold text-slate-200">
            Drag & drop PDF, TXT, MD, or Code files here, or click to browse
          </div>
          <p className="text-[11px] text-slate-400">
            Auto-detects: C Programming, Python, Operating Systems, Computer Networks, Database Systems, Math, and Data Structures
          </p>
        </div>

        {/* Recently Analyzed Documents */}
        {uploadedDocuments && uploadedDocuments.length > 0 && (
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
              <span>Your Analyzed Documents</span>
              <span className="text-indigo-400">{uploadedDocuments.length} on file</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {uploadedDocuments.slice(0, 4).map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-1.5 font-bold text-slate-200 truncate">
                      <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{doc.filename}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <span className="text-cyan-400">{doc.detected_subject}</span>
                      <span>•</span>
                      <span className="text-amber-300">{doc.confusion_hotspots.length} hotspots</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => onViewDocumentAnalysis(doc)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                    >
                      Analysis
                    </button>
                    <button
                      onClick={() => onStartDocDiagnostic(doc.id)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Test</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Understanding */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Overall Understanding</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {Math.round(profile.overall_understanding || 0)}%
            </span>
            {profile.recent_improvement > 0 && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                +{profile.recent_improvement}%
              </span>
            )}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, profile.overall_understanding || 0))}%` }}
            ></div>
          </div>
        </div>

        {/* Concepts Strong */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Concepts Strong</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">
              {(profile.concepts_mastered || 0) + (profile.concepts_strong || 0)}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">calibrated mastery</span>
          </div>
        </div>

        {/* Concepts Developing */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Concepts Developing</span>
            <HelpCircle className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">
              {profile.concepts_developing || 0}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">steady progression</span>
          </div>
        </div>

        {/* Concepts At Risk */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Concepts At Risk</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-amber-300">
              {profile.concepts_at_risk || 0}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">fragile foundation</span>
          </div>
        </div>
      </div>

      {/* CURRENT WEAK AREA */}
      {profile.weak_concepts && profile.weak_concepts.length > 0 ? (
        (() => {
          const topWeak = profile.weak_concepts[0];
          const rootPrereq = profile.critical_prerequisites && profile.critical_prerequisites.length > 0
            ? profile.critical_prerequisites[0].concept_name
            : 'Prerequisite Foundations';
          return (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-indigo-950/40 border border-rose-500/30 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>CURRENT WEAK AREA</span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-extrabold text-white">{topWeak.concept_name}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-300">
                      <span className="bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700">
                        Accuracy: <strong className="text-rose-400 font-bold ml-1">{topWeak.accuracy}%</strong>
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700">
                        Detected Root Concept: <strong className="text-amber-300 font-bold ml-1">{rootPrereq}</strong>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                    Diagnostic evidence indicates that errors in {topWeak.concept_name} are caused by confusion over {rootPrereq}. Review this prerequisite before retaking the assessment.
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => onStartRecovery(topWeak.concept_id)}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2.5 cursor-pointer transition-all border border-indigo-400/30"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>5-minute prerequisite review</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>DIAGNOSTIC STATUS</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Ready for Your First Diagnostic Assessment?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                KnowLens analyzes your response time, confidence, and mistakes to uncover the root prerequisite bottlenecks behind concepts.
              </p>
            </div>
            <div className="shrink-0 flex items-center space-x-3">
              <button
                onClick={onStartDiagnostic}
                className="px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 flex items-center space-x-2 cursor-pointer transition-all"
              >
                <span>Start Diagnostic Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Concepts Improving & Declining */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Concepts Improving */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Concepts Improving</span>
            </div>
            <span className="text-xs text-slate-400">Mastery Trends</span>
          </div>
          <div className="space-y-2">
            {profile.concepts_strong > 0 ? (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-emerald-400 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{profile.concepts_strong} concept(s) exhibiting consistent accuracy and calibrated confidence.</span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
                No concept gains recorded yet. Complete an assessment to track improving concepts.
              </div>
            )}
          </div>
        </div>

        {/* Concepts Declining */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              <span>Concepts Requiring Review</span>
            </div>
            <span className="text-xs text-slate-400">Focus Areas</span>
          </div>
          <div className="space-y-2">
            {profile.weak_concepts && profile.weak_concepts.length > 0 ? (
              profile.weak_concepts.slice(0, 3).map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{item.concept_name}</span>
                    <div className="text-[11px] text-slate-400">{item.status} • {item.accuracy}% accuracy</div>
                  </div>
                  <button
                    onClick={() => onStartRecovery(item.concept_id)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    Review
                  </button>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
                No declining concepts detected.
              </div>
            )}
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
