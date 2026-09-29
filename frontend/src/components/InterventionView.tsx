import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Code2,
  Lightbulb,
  Award,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api';
import { InterventionData, InterventionStep } from '../types';

interface InterventionViewProps {
  conceptId: string;
  onLaunchVerification: (interventionId: number) => void;
  onBack: () => void;
}

export const InterventionView: React.FC<InterventionViewProps> = ({
  conceptId,
  onLaunchVerification,
  onBack,
}) => {
  const [intervention, setIntervention] = useState<InterventionData | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateIntervention();
  }, [conceptId]);

  const generateIntervention = async () => {
    try {
      setIsLoading(true);
      const data = await api.generateIntervention(conceptId, 1);
      setIntervention(data);
      setActiveStep(0);
      setCompletedSteps([]);
    } catch (err) {
      console.error('Failed to generate intervention:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (!intervention) return;
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps(prev => [...prev, activeStep]);
    }

    if (activeStep + 1 < intervention.steps.length) {
      setActiveStep(prev => prev + 1);
    } else {
      // Complete intervention and open verification
      api.completeIntervention(intervention.id, [...completedSteps, activeStep]);
      onLaunchVerification(intervention.id);
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  if (isLoading || !intervention) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400">Synthesizing targeted learning intervention...</p>
        </div>
      </div>
    );
  }

  const currentStep: InterventionStep = intervention.steps[activeStep];
  const isFinalStep = activeStep === intervention.steps.length - 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Baseline Score:</span>
          <span className="font-mono font-bold text-rose-400">{intervention.pre_intervention_score}%</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Targeted 5-Step Recovery Session</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {intervention.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Focused micro-learning module designed to dismantle the specific identified misconception.
          </p>
        </div>

        {/* Step Tabs */}
        <div className="grid grid-cols-5 gap-2 pt-2">
          {intervention.steps.map((step, idx) => {
            const isCompleted = completedSteps.includes(idx);
            const isCurrent = activeStep === idx;

            return (
              <button
                key={step.step_number}
                onClick={() => setActiveStep(idx)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-sm'
                    : isCompleted
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] font-mono uppercase font-bold text-slate-400">
                  Step 0{step.step_number}
                </div>
                <div className="text-xs font-semibold truncate mt-0.5">{step.duration_label}</div>
              </button>
            );
          })}
        </div>

        {/* Current Step Content */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-xs font-mono font-bold">
                {currentStep.step_number}
              </span>
              <span>{currentStep.title}</span>
            </h2>
            <span className="text-xs font-mono text-slate-400 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentStep.duration_label}</span>
            </span>
          </div>

          {/* Description Content */}
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {currentStep.content}
          </div>

          {/* Code Example Box (if any) */}
          {currentStep.code_example && (
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 p-4 font-mono text-xs text-cyan-200">
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-sans mb-2">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Working Example</span>
              </div>
              <pre className="overflow-x-auto">
                <code>{currentStep.code_example}</code>
              </pre>
            </div>
          )}

          {/* Key Takeaway */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-start space-x-3">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-indigo-200">Key Conceptual Takeaway: </span>
              <span className="text-slate-300">{currentStep.key_takeaway}</span>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handlePrevStep}
            disabled={activeStep === 0}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous Step
          </button>

          <button
            onClick={handleNextStep}
            className="px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <span>{isFinalStep ? 'Take Verification Test' : 'Next Step'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
