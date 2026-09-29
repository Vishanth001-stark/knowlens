import {
  StudentProfile,
  DiagnosticSessionData,
  AnswerResult,
  DiagnosticCompleteData,
  EvidencePanelData,
  ConceptGraphData,
  InterventionData,
  VerificationStartData,
  VerificationResultData,
  AnalyticsData,
  SubjectItem,
  TopicItem,
  WeakConceptsResponse,
  StudentAnalysisResponse,
  StudentProgressResponse,
  EvaluationRunResponse,
  SettingsData,
} from '../types';

const BASE_URL = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Server error: ${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.detail) {
        errorMsg = errJson.detail;
      }
    } catch (_) {}
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Demo Student loader
  loadDemoStudent: async (): Promise<{ status: string; message: string }> => {
    const res = await fetch(`${BASE_URL}/demo/load`, { method: 'POST' });
    return handleResponse(res);
  },

  // Student Profile
  getStudentProfile: async (studentId: number = 1): Promise<StudentProfile> => {
    const res = await fetch(`${BASE_URL}/student/${studentId}/profile`);
    return handleResponse(res);
  },

  // Subjects & Topics
  getSubjects: async (): Promise<SubjectItem[]> => {
    const res = await fetch(`${BASE_URL}/subjects`);
    return handleResponse(res);
  },

  getSubjectTopics: async (subjectId: number): Promise<TopicItem[]> => {
    const res = await fetch(`${BASE_URL}/subjects/${subjectId}/topics`);
    return handleResponse(res);
  },

  getTopicConcepts: async (topicName: string): Promise<any[]> => {
    const res = await fetch(`${BASE_URL}/topics/${encodeURIComponent(topicName)}/concepts`);
    return handleResponse(res);
  },

  // Student Concept List
  getStudentConcepts: async (studentId: number = 1): Promise<any[]> => {
    const res = await fetch(`${BASE_URL}/student/${studentId}/concepts`);
    return handleResponse(res);
  },

  // Knowledge Graph
  getConceptGraph: async (studentId: number = 1, subjectCode?: string): Promise<ConceptGraphData> => {
    let url = `${BASE_URL}/concepts?student_id=${studentId}`;
    if (subjectCode) {
      url += `&subject_code=${encodeURIComponent(subjectCode)}`;
    }
    const res = await fetch(url);
    return handleResponse(res);
  },

  // Concept Details
  getConceptDetails: async (conceptId: string, studentId: number = 1): Promise<any> => {
    const res = await fetch(`${BASE_URL}/concepts/${conceptId}?student_id=${studentId}`);
    return handleResponse(res);
  },

  // Evidence panel ("Why was this detected?")
  getConceptDiagnosis: async (conceptId: string, studentId: number = 1): Promise<EvidencePanelData> => {
    const res = await fetch(`${BASE_URL}/concepts/${conceptId}/diagnosis?student_id=${studentId}`);
    return handleResponse(res);
  },

  // Weak Concepts & Analysis
  getStudentWeakConcepts: async (studentId: number = 1): Promise<WeakConceptsResponse> => {
    const res = await fetch(`${BASE_URL}/students/${studentId}/weak-concepts`);
    return handleResponse(res);
  },

  getStudentAnalysis: async (studentId: number = 1): Promise<StudentAnalysisResponse> => {
    const res = await fetch(`${BASE_URL}/students/${studentId}/analysis`);
    return handleResponse(res);
  },

  // Start Diagnostic
  startDiagnostic: async (
    studentId: number = 1,
    subjectCode: string = 'c_programming',
    topic?: string,
    questionCount: number = 10
  ): Promise<DiagnosticSessionData> => {
    const res = await fetch(`${BASE_URL}/diagnostic/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        subject_code: subjectCode,
        topic: topic || null,
        question_count: questionCount,
      }),
    });
    return handleResponse(res);
  },

  // Answer Diagnostic Question
  answerDiagnostic: async (
    sessionId: number,
    questionId: number,
    studentId: number,
    selectedAnswer: string,
    confidence: number,
    timeTakenSeconds: number = 0,
    hintsUsed: number = 0
  ): Promise<AnswerResult> => {
    const res = await fetch(`${BASE_URL}/diagnostic/${sessionId}/answer?question_id=${questionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        selected_answer: selectedAnswer,
        confidence: confidence,
        time_taken_seconds: timeTakenSeconds,
        hints_used: hintsUsed,
      }),
    });
    return handleResponse(res);
  },

  // Complete Diagnostic
  completeDiagnostic: async (sessionId: number): Promise<DiagnosticCompleteData> => {
    const res = await fetch(`${BASE_URL}/diagnostic/${sessionId}/complete`, { method: 'POST' });
    return handleResponse(res);
  },

  // Generate Targeted Intervention
  generateIntervention: async (conceptId: string, studentId: number = 1): Promise<InterventionData> => {
    const res = await fetch(`${BASE_URL}/intervention/generate?concept_id=${conceptId}&student_id=${studentId}`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  // Start Learning Session (Alias)
  startLearningSession: async (conceptId: string, studentId: number = 1): Promise<InterventionData> => {
    const res = await fetch(`${BASE_URL}/learning-session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, concept_id: conceptId }),
    });
    return handleResponse(res);
  },

  // Complete Intervention Steps
  completeIntervention: async (interventionId: number, completedSteps: number[]): Promise<any> => {
    const res = await fetch(`${BASE_URL}/intervention/${interventionId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed_steps: completedSteps }),
    });
    return handleResponse(res);
  },

  // Complete Learning Session
  completeLearningSession: async (sessionId: number): Promise<any> => {
    const res = await fetch(`${BASE_URL}/learning-session/${sessionId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    return handleResponse(res);
  },

  // Start Verification
  startVerification: async (interventionId: number): Promise<VerificationStartData> => {
    const res = await fetch(`${BASE_URL}/verification/start?intervention_id=${interventionId}`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  // Submit Verification Answers
  submitVerification: async (
    verificationId: number,
    answers: Array<{ question_id: number; selected_answer: string }>
  ): Promise<VerificationResultData> => {
    const res = await fetch(`${BASE_URL}/verification/${verificationId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    return handleResponse(res);
  },

  // Analytics & Progress
  getAnalytics: async (studentId: number = 1): Promise<AnalyticsData> => {
    const res = await fetch(`${BASE_URL}/analytics/${studentId}`);
    return handleResponse(res);
  },

  getStudentProgress: async (studentId: number = 1): Promise<StudentProgressResponse> => {
    const res = await fetch(`${BASE_URL}/students/${studentId}/progress`);
    return handleResponse(res);
  },

  getStudentHistory: async (studentId: number = 1): Promise<any[]> => {
    const res = await fetch(`${BASE_URL}/student/${studentId}/history`);
    return handleResponse(res);
  },

  // Evaluation Run
  runEvaluation: async (): Promise<EvaluationRunResponse> => {
    const res = await fetch(`${BASE_URL}/evaluation/run`, { method: 'POST' });
    return handleResponse(res);
  },

  // Configurable Settings
  getSettings: async (): Promise<SettingsData> => {
    const res = await fetch(`${BASE_URL}/settings`);
    return handleResponse(res);
  },

  updateSettings: async (weights: SettingsData['weights']): Promise<SettingsData> => {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weights }),
    });
    return handleResponse(res);
  },

  // Delete History (Privacy)
  deleteHistory: async (studentId: number = 1): Promise<{ status: string; message: string }> => {
    const res = await fetch(`${BASE_URL}/student/${studentId}/history`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Authentication
  loginStudent: async (email: string, name?: string): Promise<{ token: string; student: any; is_new: boolean }> => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    return handleResponse(res);
  },

  googleLogin: async (name: string, email: string, avatar_url?: string): Promise<{ token: string; student: any; is_new: boolean }> => {
    const res = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, avatar_url }),
    });
    return handleResponse(res);
  },

  // Document Upload & AI Confusion Analysis
  uploadDocument: async (file: File, studentId: number, preferredSubject?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('student_id', studentId.toString());
    if (preferredSubject) {
      formData.append('preferred_subject', preferredSubject);
    }
    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  getStudentDocuments: async (studentId: number): Promise<any[]> => {
    const res = await fetch(`${BASE_URL}/students/${studentId}/documents`);
    return handleResponse(res);
  },

  startDocumentDiagnostic: async (docId: number, studentId: number): Promise<any> => {
    const res = await fetch(`${BASE_URL}/documents/${docId}/start-diagnostic?student_id=${studentId}`, {
      method: 'POST',
    });
    return handleResponse(res);
  },
};
