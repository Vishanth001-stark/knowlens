import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  HelpCircle,
  Flame,
  Award,
  Lightbulb,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import { DiagnosticSessionData, QuestionItem, AnswerResult, DiagnosticCompleteData } from '../types';

interface DiagnosticTestProps {
  subjectCode?: string;
  topic?: string;
  onComplete: (data: DiagnosticCompleteData) => void;
  onCancel: () => void;
}

export const DiagnosticTest: React.FC<DiagnosticTestProps> = ({
  subjectCode = 'c_programming',
  topic,
  onComplete,
  onCancel,
}) => {
  const [session, setSession] = useState<DiagnosticSessionData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(3); // 1 to 5
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Live timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.round((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    initSession();
  }, [subjectCode, topic]);

  const initSession = async () => {
    try {
      setIsLoading(true);
      const data = await api.startDiagnostic(1, subjectCode, topic, 10);
      setSession(data);
      setCurrentIndex(0);
      setStartTime(Date.now());
      setElapsedSeconds(0);
      setHintsUsed(0);
      setShowHint(false);
    } catch (err) {
      console.error('Failed to start diagnostic session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (option: string) => {
    if (answerResult) return;
    setSelectedOption(option);
  };

  const handleIDontKnow = () => {
    if (answerResult) return;
    setSelectedOption("I don't know");
    setConfidence(1); // Very unsure
  };

  const handleRequestHint = () => {
    setHintsUsed(prev => prev + 1);
    setShowHint(true);
  };

  const handleSubmitAnswer = async () => {
    if (!session || selectedOption === null || !currentQuestion) return;

    try {
      setIsSubmitting(true);
      const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      const res = await api.answerDiagnostic(
        session.id,
        currentQuestion.id,
        1,
        selectedOption,
        confidence,
        timeTaken,
        hintsUsed
      );
      setAnswerResult(res);
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!session) return;

    if (currentIndex + 1 < session.questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setConfidence(3);
      setAnswerResult(null);
      setShowHint(false);
      setStartTime(Date.now());
      setElapsedSeconds(0);
    } else {
      try {
        setIsFinishing(true);
        const completeData = await api.completeDiagnostic(session.id);
        onComplete(completeData);
      } catch (err) {
        console.error('Error completing session:', err);
      } finally {
        setIsFinishing(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400">Preparing adaptive diagnostic questions...</p>
        </div>
      </div>
    );
  }

  if (!session || !session.questions || session.questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">No questions available</h3>
        <p className="text-xs text-slate-400">Could not initialize diagnostic questions for this subject/topic.</p>
        <button
          onClick={initSession}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 cursor-pointer"
        >
          Retry Initialization
        </button>
      </div>
    );
  }

  const currentQuestion: QuestionItem = session.questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / session.questions.length) * 100);

  const confidenceLabels = [
    { value: 1, label: 'Very unsure', color: 'text-slate-400 border-slate-700' },
    { value: 2, label: 'Unsure', color: 'text-amber-400 border-amber-600/40' },
    { value: 3, label: 'Neutral', color: 'text-blue-400 border-blue-600/40' },
    { value: 4, label: 'Confident', color: 'text-cyan-400 border-cyan-600/40' },
    { value: 5, label: 'Very confident', color: 'text-emerald-400 border-emerald-600/40' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Top Session Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
            {currentIndex + 1}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Question {currentIndex + 1} of {session.questions.length}
              </span>
              {topic && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {topic}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Tested Concepts: {currentQuestion.concepts.join(', ')}
            </span>
          </div>
        </div>

        {/* Live Timer & Exit */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>{elapsedSeconds}s</span>
          </div>

          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Exit Diagnostic
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
        <div
          className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* Question Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {currentQuestion.topic}
          </span>
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
                currentQuestion.difficulty === 'hard'
                  ? 'text-rose-400 bg-rose-950/30 border border-rose-900/50'
                  : currentQuestion.difficulty === 'medium'
                  ? 'text-amber-400 bg-amber-950/30 border border-amber-900/50'
                  : 'text-emerald-400 bg-emerald-950/30 border border-emerald-900/50'
              }`}
            >
              {currentQuestion.difficulty}
            </span>
          </div>
        </div>

        {/* Question Text */}
        <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
          {currentQuestion.question}
        </h2>

        {/* Code Snippet Box (if any) */}
        {currentQuestion.code_snippet && (
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 p-4 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto">
            <div className="absolute top-2 right-3 text-[10px] text-slate-500 uppercase tracking-widest font-sans select-none">
              Source Code
            </div>
            <pre className="pt-2 text-cyan-200">
              <code>{currentQuestion.code_snippet}</code>
            </pre>
          </div>
        )}

        {/* Hint Box (if requested) */}
        {showHint && (
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 text-xs text-amber-200 flex items-start space-x-2 animate-fade-in">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300">Conceptual Hint:</strong> Focus on how addresses and types scale in memory, or whether operations modify values vs references.
            </div>
          </div>
        )}

        {/* Options List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Select an answer:</span>
            {!answerResult && (
              <button
                onClick={handleRequestHint}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Need a hint? {hintsUsed > 0 ? `(${hintsUsed} used)` : ''}</span>
              </button>
            )}
          </div>

          <div className="grid gap-2.5">
            {currentQuestion.options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = selectedOption === opt;
              let btnClass = 'border-slate-800 bg-slate-950/60 text-slate-200 hover:border-slate-700 hover:bg-slate-800/40';

              if (answerResult) {
                if (isSelected) {
                  btnClass = 'border-indigo-500/80 bg-indigo-950/30 text-indigo-200 font-semibold';
                } else {
                  btnClass = 'border-slate-800 bg-slate-950/30 text-slate-500 opacity-60';
                }
              } else if (isSelected) {
                btnClass = 'border-indigo-500 bg-indigo-950/40 text-indigo-100 shadow-sm font-semibold ring-1 ring-indigo-500/50';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(opt)}
                  disabled={answerResult !== null}
                  className={`w-full p-4 rounded-xl border text-left font-mono text-xs sm:text-sm flex items-start space-x-3 transition-all cursor-pointer ${btnClass}`}
                >
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-sans font-bold shrink-0 mt-0.5">
                    {letter}
                  </span>
                  <span className="flex-1 font-sans font-medium">{opt}</span>
                </button>
              );
            })}

            {/* "I don't know" Option (Section 9) */}
            <button
              onClick={handleIDontKnow}
              disabled={answerResult !== null}
              className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm flex items-center space-x-3 transition-all cursor-pointer ${
                selectedOption === "I don't know"
                  ? 'border-indigo-500 bg-indigo-950/30 text-indigo-200 font-semibold'
                  : 'border-slate-800/60 bg-slate-950/30 text-slate-400 hover:bg-slate-800/30'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>I don't know (signal knowledge gap)</span>
            </button>
          </div>
        </div>

        {/* Confidence Input (Section 9) */}
        {!answerResult && (
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>How confident are you in this answer?</span>
              </span>
              <span className="text-xs font-mono font-bold text-indigo-300">
                {confidenceLabels.find(c => c.value === confidence)?.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {confidenceLabels.map(item => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setConfidence(item.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                    confidence === item.value
                      ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-sm'
                      : item.color + ' bg-slate-950/40 hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Card after submission (Section 9: Do NOT reveal answer directly; log behavior) */}
        {answerResult && (
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2 animate-fade-in">
            <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>Response & Behavioral Signals Logged</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Answer, confidence level ({confidence}/5), response time ({elapsedSeconds}s), and hint usage recorded for root-cause confusion detection.
            </p>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-4 flex items-center justify-end space-x-3">
          {!answerResult ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null || isSubmitting}
              className="px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Recording Signals...' : 'Submit Answer'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              disabled={isFinishing}
              className="px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span>
                {isFinishing
                  ? 'Compiling Diagnosis...'
                  : currentIndex + 1 < session.questions.length
                  ? 'Next Question'
                  : 'View Confusion Diagnosis'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
