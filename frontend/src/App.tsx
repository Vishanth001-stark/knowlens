import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { StudentDashboard } from './components/StudentDashboard';
import { SubjectSelection } from './components/SubjectSelection';
import { TopicSelection } from './components/TopicSelection';
import { DiagnosticTest } from './components/DiagnosticTest';
import { ResultsView } from './components/ResultsView';
import { ConfusionAnalysis } from './components/ConfusionAnalysis';
import { ConfusionMap } from './components/ConfusionMap';
import { InterventionView } from './components/InterventionView';
import { AnalyticsView } from './components/AnalyticsView';
import { LearningHistoryView } from './components/LearningHistoryView';
import { EvaluationView } from './components/EvaluationView';
import { ProfileSettingsView } from './components/ProfileSettingsView';
import { EvidenceModal } from './components/EvidenceModal';
import { VerificationModal } from './components/VerificationModal';
import { api } from './services/api';
import { StudentProfile, DiagnosticCompleteData, SubjectItem } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState<boolean>(false);

  // Subject & Topic Context
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);
  const [activeSubjectCode, setActiveSubjectCode] = useState<string>('c_programming');
  const [activeTopicName, setActiveTopicName] = useState<string | undefined>(undefined);

  // Modals & Navigation Sub-states
  const [activeEvidenceConceptId, setActiveEvidenceConceptId] = useState<string | null>(null);
  const [activeInterventionConceptId, setActiveInterventionConceptId] = useState<string | null>(null);
  const [activeVerificationInterventionId, setActiveVerificationInterventionId] = useState<number | null>(null);
  const [diagnosticResultsData, setDiagnosticResultsData] = useState<DiagnosticCompleteData | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const data = await api.getStudentProfile(1);
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleLoadDemo = async () => {
    try {
      setIsLoadingDemo(true);
      await api.loadDemoStudent();
      await loadProfile();
      setActiveSubjectCode('c_programming');
      setCurrentTab('dashboard');
    } catch (err) {
      console.error('Failed to load demo:', err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleStartRecovery = (conceptId: string) => {
    setActiveInterventionConceptId(conceptId);
    setCurrentTab('intervention');
  };

  const handleDiagnosticComplete = (data: DiagnosticCompleteData) => {
    setDiagnosticResultsData(data);
    loadProfile();
    setCurrentTab('results');
  };

  const handleSelectSubject = (subject: SubjectItem) => {
    setSelectedSubject(subject);
    setActiveSubjectCode(subject.code);
    setCurrentTab('topics');
  };

  const handleQuickStartDiagnostic = (subjectCode: string) => {
    setActiveSubjectCode(subjectCode);
    setActiveTopicName(undefined);
    setCurrentTab('diagnostic');
  };

  const handleStartTopicDiagnostic = (subjectCode: string, topicName: string) => {
    setActiveSubjectCode(subjectCode);
    setActiveTopicName(topicName);
    setCurrentTab('diagnostic');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Navbar with All Navigation Tabs */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onLoadDemo={handleLoadDemo}
        isLoadingDemo={isLoadingDemo}
        activeSubjectName={
          selectedSubject?.name ||
          (activeSubjectCode === 'c_programming'
            ? 'C Programming'
            : activeSubjectCode.toUpperCase())
        }
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {currentTab === 'landing' && (
          <LandingPage
            onStartDiagnostic={() => {
              setActiveSubjectCode('c_programming');
              setActiveTopicName(undefined);
              setCurrentTab('diagnostic');
            }}
            onLoadDemo={handleLoadDemo}
            isLoadingDemo={isLoadingDemo}
          />
        )}

        {currentTab === 'dashboard' && (
          <StudentDashboard
            profile={profile}
            isLoading={isLoadingProfile}
            onOpenEvidence={conceptId => setActiveEvidenceConceptId(conceptId)}
            onStartRecovery={handleStartRecovery}
            onStartDiagnostic={() => {
              setActiveSubjectCode('c_programming');
              setActiveTopicName(undefined);
              setCurrentTab('diagnostic');
            }}
            onViewConfusionMap={() => setCurrentTab('confusion_map')}
          />
        )}

        {currentTab === 'subjects' && (
          <SubjectSelection
            onSelectSubject={handleSelectSubject}
            onQuickStartDiagnostic={handleQuickStartDiagnostic}
          />
        )}

        {currentTab === 'topics' && selectedSubject && (
          <TopicSelection
            subject={selectedSubject}
            onBack={() => setCurrentTab('subjects')}
            onStartTopicDiagnostic={handleStartTopicDiagnostic}
          />
        )}

        {currentTab === 'diagnostic' && (
          <DiagnosticTest
            subjectCode={activeSubjectCode}
            topic={activeTopicName}
            onComplete={handleDiagnosticComplete}
            onCancel={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'results' && diagnosticResultsData && (
          <ResultsView
            data={diagnosticResultsData}
            onGoToDashboard={() => setCurrentTab('dashboard')}
            onStartRecovery={handleStartRecovery}
            onRetake={() => setCurrentTab('diagnostic')}
          />
        )}

        {currentTab === 'confusion_analysis' && (
          <ConfusionAnalysis
            studentId={1}
            onStartRecovery={handleStartRecovery}
            onOpenEvidence={conceptId => setActiveEvidenceConceptId(conceptId)}
            onViewConceptMap={() => setCurrentTab('confusion_map')}
          />
        )}

        {currentTab === 'confusion_map' && (
          <ConfusionMap
            onOpenEvidence={conceptId => setActiveEvidenceConceptId(conceptId)}
            onStartRecovery={handleStartRecovery}
          />
        )}

        {currentTab === 'intervention' && activeInterventionConceptId && (
          <InterventionView
            conceptId={activeInterventionConceptId}
            onLaunchVerification={interventionId => setActiveVerificationInterventionId(interventionId)}
            onBack={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView onRefresh={loadProfile} />
        )}

        {currentTab === 'history' && (
          <LearningHistoryView
            studentId={1}
            onStartRecovery={handleStartRecovery}
          />
        )}

        {currentTab === 'evaluation' && (
          <EvaluationView />
        )}

        {currentTab === 'settings' && (
          <ProfileSettingsView
            profile={profile}
            onRefreshProfile={loadProfile}
          />
        )}
      </main>

      {/* Evidence Modal ("Why was this detected?") */}
      {activeEvidenceConceptId && (
        <EvidenceModal
          conceptId={activeEvidenceConceptId}
          onClose={() => setActiveEvidenceConceptId(null)}
          onStartRecovery={handleStartRecovery}
        />
      )}

      {/* Verification Modal (Before vs After Delta) */}
      {activeVerificationInterventionId && (
        <VerificationModal
          interventionId={activeVerificationInterventionId}
          onClose={() => setActiveVerificationInterventionId(null)}
          onVerified={() => {
            loadProfile();
            setCurrentTab('dashboard');
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 py-6 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI Confusion Detector — Intelligent Diagnostic Learning Platform</span>
          <span>Prerequisite DAG Tracing • Behavioral Psychometrics • Anti-Hallucination Grounding</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
