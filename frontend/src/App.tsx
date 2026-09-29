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
import { LoginModal } from './components/LoginModal';
import { LoginPage } from './components/LoginPage';
import { DocumentAnalysisModal } from './components/DocumentAnalysisModal';
import { api } from './services/api';
import {
  StudentProfile,
  DiagnosticCompleteData,
  SubjectItem,
  StudentUser,
  DocumentAnalysis,
  QuestionItem,
} from './types';

export function App() {
  // Authentication State
  const [studentUser, setStudentUser] = useState<StudentUser | null>(() => {
    try {
      const saved = localStorage.getItem('student_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('student_user');
      return saved ? 'dashboard' : 'login';
    } catch {
      return 'login';
    }
  });
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);

  // Document Upload & Analysis State
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentAnalysis[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);
  const [activeDocAnalysis, setActiveDocAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [customDiagnosticSessionId, setCustomDiagnosticSessionId] = useState<number | undefined>(undefined);
  const [customDiagnosticQuestions, setCustomDiagnosticQuestions] = useState<QuestionItem[] | undefined>(undefined);

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
    const studentId = studentUser?.id || 1;
    loadProfile(studentId);
    loadStudentDocuments(studentId);
  }, []);

  const loadProfile = async (studentId: number = 1) => {
    try {
      setIsLoadingProfile(true);
      const data = await api.getStudentProfile(studentId);
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadStudentDocuments = async (studentId: number) => {
    try {
      const docs = await api.getStudentDocuments(studentId);
      setUploadedDocuments(docs);
    } catch (err) {
      console.error('Failed to load student documents:', err);
    }
  };

  const handleDirectLogin = async (name: string, email: string) => {
    setIsLoadingAuth(true);
    try {
      const res = await api.loginStudent(email, name);
      const user: StudentUser = {
        id: res.student.id,
        name: res.student.name,
        email: res.student.email,
        avatar_url: res.student.avatar_url,
        auth_provider: res.student.auth_provider,
      };
      setStudentUser(user);
      localStorage.setItem('student_user', JSON.stringify(user));
      await loadProfile(user.id);
      await loadStudentDocuments(user.id);
      setCurrentTab('dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleGoogleLogin = async (name: string, email: string) => {
    setIsLoadingAuth(true);
    try {
      const res = await api.googleLogin(name, email);
      const user: StudentUser = {
        id: res.student.id,
        name: res.student.name,
        email: res.student.email,
        avatar_url: res.student.avatar_url,
        auth_provider: res.student.auth_provider,
      };
      setStudentUser(user);
      localStorage.setItem('student_user', JSON.stringify(user));
      await loadProfile(user.id);
      await loadStudentDocuments(user.id);
      setCurrentTab('dashboard');
    } catch (err: any) {
      console.error('Google login error:', err);
      throw err;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem('student_user');
    } catch (e) {
      console.error(e);
    }
    setStudentUser(null);
    setCurrentTab('login');
  };

  const handleUploadDocument = async (file: File) => {
    const studentId = studentUser?.id || 1;
    setIsUploadingDoc(true);
    try {
      const doc = await api.uploadDocument(file, studentId, activeSubjectCode);
      setActiveDocAnalysis(doc);
      setIsDocModalOpen(true);
      await loadStudentDocuments(studentId);
    } catch (err: any) {
      console.error('Upload document error:', err);
      alert(`Failed to analyze document: ${err.message}`);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleStartDocDiagnostic = async (docId: number) => {
    const studentId = studentUser?.id || 1;
    try {
      const res = await api.startDocumentDiagnostic(docId, studentId);
      setCustomDiagnosticSessionId(res.session_id);
      setCustomDiagnosticQuestions(res.questions);
      setIsDocModalOpen(false);
      setCurrentTab('diagnostic');
    } catch (err: any) {
      console.error('Start doc diagnostic error:', err);
      alert(`Failed to start diagnostic: ${err.message}`);
    }
  };

  const handleLoadDemo = async () => {
    try {
      setIsLoadingDemo(true);
      await api.loadDemoStudent();
      const studentId = studentUser?.id || 1;
      await loadProfile(studentId);
      await loadStudentDocuments(studentId);
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
    loadProfile(studentUser?.id || 1);
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
    setCustomDiagnosticQuestions(undefined);
    setCustomDiagnosticSessionId(undefined);
    setCurrentTab('diagnostic');
  };

  const handleStartTopicDiagnostic = (subjectCode: string, topicName: string) => {
    setActiveSubjectCode(subjectCode);
    setActiveTopicName(topicName);
    setCustomDiagnosticQuestions(undefined);
    setCustomDiagnosticSessionId(undefined);
    setCurrentTab('diagnostic');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Navbar */}
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
        studentUser={studentUser}
        onOpenLogin={() => setCurrentTab('login')}
        onOpenUploadDoc={() => {
          setCurrentTab('dashboard');
        }}
        onSignOut={handleSignOut}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {currentTab === 'login' && (
          <LoginPage
            onGoogleLogin={handleGoogleLogin}
            onDirectLogin={handleDirectLogin}
            onExploreGuest={() => setCurrentTab('landing')}
            isLoading={isLoadingAuth}
          />
        )}

        {currentTab === 'landing' && (
          <LandingPage
            onStartDiagnostic={() => {
              setActiveSubjectCode('c_programming');
              setActiveTopicName(undefined);
              setCustomDiagnosticQuestions(undefined);
              setCustomDiagnosticSessionId(undefined);
              setCurrentTab('diagnostic');
            }}
            onLoadDemo={handleLoadDemo}
            isLoadingDemo={isLoadingDemo}
            onOpenLogin={() => setCurrentTab('login')}
          />
        )}

        {currentTab === 'dashboard' && (
          <StudentDashboard
            profile={profile}
            studentUser={studentUser}
            isLoading={isLoadingProfile}
            onOpenEvidence={conceptId => setActiveEvidenceConceptId(conceptId)}
            onStartRecovery={handleStartRecovery}
            onStartDiagnostic={() => {
              setActiveSubjectCode('c_programming');
              setActiveTopicName(undefined);
              setCustomDiagnosticQuestions(undefined);
              setCustomDiagnosticSessionId(undefined);
              setCurrentTab('diagnostic');
            }}
            onViewConfusionMap={() => setCurrentTab('confusion_map')}
            onUploadDocument={handleUploadDocument}
            isUploadingDoc={isUploadingDoc}
            uploadedDocuments={uploadedDocuments}
            onViewDocumentAnalysis={(doc) => {
              setActiveDocAnalysis(doc);
              setIsDocModalOpen(true);
            }}
            onStartDocDiagnostic={handleStartDocDiagnostic}
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
            studentId={studentUser?.id || 1}
            subjectCode={activeSubjectCode}
            topic={activeTopicName}
            customSessionId={customDiagnosticSessionId}
            customQuestions={customDiagnosticQuestions}
            onComplete={handleDiagnosticComplete}
            onCancel={() => {
              setCustomDiagnosticQuestions(undefined);
              setCustomDiagnosticSessionId(undefined);
              setCurrentTab('dashboard');
            }}
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
            studentId={studentUser?.id || 1}
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
          <AnalyticsView onRefresh={() => loadProfile(studentUser?.id || 1)} />
        )}

        {currentTab === 'history' && (
          <LearningHistoryView
            studentId={studentUser?.id || 1}
            onStartRecovery={handleStartRecovery}
          />
        )}

        {currentTab === 'evaluation' && (
          <EvaluationView />
        )}

        {currentTab === 'settings' && (
          <ProfileSettingsView
            profile={profile}
            onRefreshProfile={() => loadProfile(studentUser?.id || 1)}
          />
        )}
      </main>

      {/* Login / Auth Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(user) => {
          setStudentUser(user);
          localStorage.setItem('student_user', JSON.stringify(user));
          loadProfile(user.id);
          loadStudentDocuments(user.id);
          setCurrentTab('dashboard');
        }}
        onDirectLogin={handleDirectLogin}
        onGoogleLogin={handleGoogleLogin}
        isLoading={isLoadingAuth}
      />

      {/* Document Analysis Modal */}
      <DocumentAnalysisModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        documentAnalysis={activeDocAnalysis}
        onStartDiagnostic={handleStartDocDiagnostic}
      />

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
            loadProfile(studentUser?.id || 1);
            setCurrentTab('dashboard');
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 py-6 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>KnowLens — Intelligent Diagnostic Learning Platform</span>
          <span>Prerequisite DAG Tracing • Behavioral Psychometrics • Anti-Hallucination Grounding</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
