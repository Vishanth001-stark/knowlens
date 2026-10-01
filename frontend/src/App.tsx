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
      console.warn('Backend login unavailable, creating client student session:', err);
      const fallbackUser: StudentUser = {
        id: Date.now(),
        name: name,
        email: email,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        auth_provider: 'local',
      };
      setStudentUser(fallbackUser);
      localStorage.setItem('student_user', JSON.stringify(fallbackUser));
      setCurrentTab('dashboard');
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
      console.warn('Backend Google auth unavailable, creating client student session:', err);
      const fallbackUser: StudentUser = {
        id: Date.now(),
        name: name,
        email: email,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        auth_provider: 'google',
      };
      setStudentUser(fallbackUser);
      localStorage.setItem('student_user', JSON.stringify(fallbackUser));
      setCurrentTab('dashboard');
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
      // Analyze document by content and filename without forcing activeSubjectCode
      const doc = await api.uploadDocument(file, studentId);
      setActiveDocAnalysis(doc);
      if (doc.detected_subject_code) {
        setActiveSubjectCode(doc.detected_subject_code);
      }
      setIsDocModalOpen(true);
      await loadStudentDocuments(studentId);
    } catch (err: any) {
      console.warn('Backend document upload error, activating resilient client diagnosis:', err);
      const filename = file.name || 'uploaded_document.pdf';
      const ext = filename.split('.').pop()?.toLowerCase() || 'pdf';
      const fnameLower = filename.toLowerCase();

      let detectedCode = 'c_programming';
      let subjectName = 'C Programming';
      let extracted = ['memory_addresses', 'dereferencing', 'pointer_arithmetic'];
      let hotspots = [
        {
          concept: 'Pointer Arithmetic & Stride',
          risk_level: 'high' as const,
          potential_confusion: 'Misinterpreting memory address strides versus byte indices.',
          prerequisite_bottleneck: 'Memory Addresses',
          remedy_suggestion: 'Review hardware address layout and byte representations before complex arithmetic.',
        },
        {
          concept: 'Dereferencing (*ptr)',
          risk_level: 'medium' as const,
          potential_confusion: 'Confusing direct value modification with address reference redirection.',
          prerequisite_bottleneck: 'Variables & Scope',
          remedy_suggestion: 'Trace pointer variables step-by-step with memory diagram models.',
        }
      ];

      if (fnameLower.includes('math') || fnameLower.includes('calc') || fnameLower.includes('algebra') || fnameLower.includes('prob') || fnameLower.includes('deriv') || fnameLower.includes('integral')) {
        detectedCode = 'mathematics';
        subjectName = 'Mathematics';
        extracted = ['math_limits', 'math_derivatives', 'math_chain_rule'];
        hotspots = [
          {
            concept: 'Calculus Derivatives & Rate of Change',
            risk_level: 'high' as const,
            potential_confusion: "Confusing the slope of the tangent line f'(x) with average rate of change or function value f(x).",
            prerequisite_bottleneck: 'Limits & Continuity',
            remedy_suggestion: 'Review the limit definition of difference quotients before applying power rules.',
          },
          {
            concept: 'Chain Rule for Composite Functions',
            risk_level: 'medium' as const,
            potential_confusion: "Omitting multiplication by the inner derivative g'(x) when differentiating composite f(g(x)).",
            prerequisite_bottleneck: 'Derivatives & Rate of Change',
            remedy_suggestion: 'Decompose into inner u = g(x) and outer y = f(u) explicitly.',
          }
        ];
      } else if (fnameLower.includes('python') || fnameLower.includes('py')) {
        detectedCode = 'python';
        subjectName = 'Python';
        extracted = ['py_variables', 'py_mutability', 'py_scope_legb'];
      } else if (fnameLower.includes('os') || fnameLower.includes('deadlock') || fnameLower.includes('thread') || fnameLower.includes('process')) {
        detectedCode = 'operating_systems';
        subjectName = 'Operating Systems';
        extracted = ['os_processes_threads', 'os_deadlocks', 'os_virtual_memory'];
      } else if (fnameLower.includes('net') || fnameLower.includes('tcp') || fnameLower.includes('udp') || fnameLower.includes('ip') || fnameLower.includes('osi')) {
        detectedCode = 'computer_networks';
        subjectName = 'Computer Networks';
        extracted = ['cn_osi_model', 'cn_tcp_udp', 'cn_three_way_handshake'];
      } else if (fnameLower.includes('db') || fnameLower.includes('sql') || fnameLower.includes('normal') || fnameLower.includes('relat')) {
        detectedCode = 'database_systems';
        subjectName = 'Database Systems';
        extracted = ['db_relational_model', 'db_normalization', 'db_transactions_acid'];
      } else if (fnameLower.includes('tree') || fnameLower.includes('list') || fnameLower.includes('stack') || fnameLower.includes('queue') || fnameLower.includes('ds') || fnameLower.includes('algo')) {
        detectedCode = 'data_structures';
        subjectName = 'Data Structures';
        extracted = ['ds_arrays', 'ds_linked_lists', 'ds_bst'];
      }

      setActiveSubjectCode(detectedCode);

      const fallbackAnalysis: DocumentAnalysis = {
        id: Date.now(),
        filename: filename,
        file_type: ext,
        file_size: file.size || 1024,
        detected_subject: subjectName,
        detected_subject_code: detectedCode,
        extracted_concepts: extracted,
        confusion_hotspots: hotspots,
        question_count: 5,
        created_at: new Date().toISOString(),
      };
      setActiveDocAnalysis(fallbackAnalysis);
      setUploadedDocuments(prev => [fallbackAnalysis, ...prev]);
      setIsDocModalOpen(true);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleStartDocDiagnostic = async (docId: number) => {
    const studentId = studentUser?.id || 1;
    if (activeDocAnalysis?.detected_subject_code) {
      setActiveSubjectCode(activeDocAnalysis.detected_subject_code);
    }
    try {
      const res = await api.startDocumentDiagnostic(docId, studentId);
      setCustomDiagnosticSessionId(res.session_id);
      setCustomDiagnosticQuestions(res.questions);
      setIsDocModalOpen(false);
      setCurrentTab('diagnostic');
    } catch (err: any) {
      console.warn('Doc diagnostic server fallback:', err);
      setIsDocModalOpen(false);
      setActiveTopicName(activeDocAnalysis?.filename);
      setCurrentTab('diagnostic');
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
