export interface StudentProfile {
  student_id: number;
  student_name: string;
  overall_understanding: number;
  concepts_mastered: number;
  concepts_strong: number;
  concepts_developing: number;
  concepts_at_risk: number;
  concepts_confused: number;
  recent_improvement: number;
  critical_prerequisites: Array<{
    concept_id: string;
    concept_name: string;
    required_by: string;
    accuracy: number;
    status: string;
  }>;
  weak_concepts: ConceptPerformanceItem[];
  recommended_next_step: {
    concept_id: string;
    concept_name: string;
    action: string;
    reason: string;
  };
}

export interface ConceptPerformanceItem {
  concept_id: string;
  concept_name: string;
  module: string;
  accuracy: number;
  average_confidence: number;
  attempts_count: number;
  correct_count: number;
  incorrect_count: number;
  high_conf_errors_count: number;
  calibration_gap: number;
  status: 'MASTERED' | 'STRONG' | 'DEVELOPING' | 'AT_RISK' | 'CONFUSED';
  confusion_probability: number;
  common_errors: string[];
  recommended_action: string;
}

export interface QuestionItem {
  id: number;
  subject_id: number;
  topic: string;
  difficulty: string;
  question_type: string;
  question: string;
  code_snippet?: string;
  options: string[];
  concepts: string[];
  prerequisites: string[];
}

export interface DiagnosticSessionData {
  id: number;
  student_id: number;
  subject_id: number;
  topic?: string;
  status: string;
  total_questions: number;
  questions: QuestionItem[];
}

export interface AnswerResult {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  concept_id: string;
  misconception_tag?: string;
}

export interface DiagnosticCompleteData {
  diagnostic_id: number;
  score_percentage: number;
  total_answered: number;
  correct_count: number;
  confused_concepts: string[];
  at_risk_concepts: string[];
  strong_concepts: string[];
  recommended_concept?: string;
}

export interface EvidencePanelData {
  concept_id: string;
  concept_name: string;
  status: string;
  confusion_probability: number;
  learning_difficulty_score?: number;
  issue_type?: string;
  system_confidence: number;
  evidence_items: string[];
  likely_prerequisite?: string;
  prerequisite_name?: string;
  prerequisite_status?: string;
  prerequisite_accuracy?: number;
  prerequisite_evidence?: string;
  common_errors: string[];
  recommended_intervention: string[];
  ml_contributing_factors: Array<{
    feature: string;
    label: string;
    importance: number;
    value: number;
    impact_level: 'High' | 'Medium' | 'Low';
  }>;
}

export interface GraphNode {
  id: string;
  name: string;
  module: string;
  status: 'MASTERED' | 'STRONG' | 'DEVELOPING' | 'AT_RISK' | 'CONFUSED';
  accuracy: number;
  confidence: number;
  attempts: number;
  prerequisites: string[];
}

export interface GraphEdge {
  from_concept: string;
  to_concept: string;
  weight: number;
}

export interface ConceptGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface InterventionStep {
  step_number: number;
  title: string;
  duration_label: string;
  type: string;
  content: string;
  code_example?: string;
  key_takeaway: string;
}

export interface InterventionData {
  id: number;
  student_id: number;
  concept_id: string;
  concept_name: string;
  title: string;
  steps: InterventionStep[];
  pre_intervention_score: number;
  post_intervention_score?: number;
  status: string;
}

export interface VerificationQuestion {
  id: number;
  question: string;
  code_snippet?: string;
  options: string[];
  difficulty: string;
}

export interface VerificationStartData {
  verification_id: number;
  intervention_id: number;
  concept_id: string;
  concept_name: string;
  pre_score: number;
  questions: VerificationQuestion[];
}

export interface VerificationResultData {
  verification_id: number;
  concept_id: string;
  concept_name: string;
  pre_score: number;
  post_score: number;
  improvement_delta: number;
  questions_attempted: number;
  questions_correct: number;
  verdict: string;
  updated_status: string;
}

export interface ConfidenceAccuracyPoint {
  concept_name: string;
  accuracy: number;
  confidence: number;
  gap: number;
  status: string;
  attempts: number;
}

export interface AnalyticsHistoryItem {
  date: string;
  concept_id: string;
  concept_name: string;
  pre_score: number;
  post_score?: number;
  intervention_taken: boolean;
  improvement_delta?: number;
  status: string;
}

export interface AnalyticsData {
  student_id: number;
  overall_understanding: number;
  confidence_accuracy_points: ConfidenceAccuracyPoint[];
  history: AnalyticsHistoryItem[];
  confusion_distribution: Record<string, number>;
  calibration_message: string;
}

// Multi-Subject & Topic Types
export interface SubjectItem {
  id: number;
  code: string;
  name: string;
  description: string;
  topic_count: number;
  concept_count: number;
}

export interface TopicItem {
  topic: string;
  subject_id: number;
  concepts: string[];
  question_count: number;
}

export interface WeakConceptItem {
  concept_id: string;
  concept_name: string;
  module: string;
  accuracy: number;
  status: string;
  learning_difficulty_score: number;
  issue_type: string;
  suspected_prerequisite?: string;
  suspected_prerequisite_name?: string;
  common_errors: string[];
  recommended_action: string;
}

export interface WeakConceptsResponse {
  student_id: number;
  weak_concepts: WeakConceptItem[];
  detected_root_concept?: string;
  detected_root_name?: string;
  root_evidence?: string;
}

export interface StudentAnalysisResponse {
  student_id: number;
  overall_understanding: number;
  status: string;
  detected_root_concept?: string;
  detected_root_name?: string;
  learning_difficulty_score: number;
  possible_issue: string;
  evidence: string[];
  recommended_action: string;
  weak_concepts: WeakConceptItem[];
  strong_concepts: string[];
}

export interface KnowledgeDecayItem {
  date: string;
  score: number;
  concept_name: string;
  decay_observed: boolean;
  retrieval_recommended: boolean;
}

export interface StudentProgressResponse {
  student_id: number;
  overall_understanding: number;
  concepts_strong: number;
  concepts_developing: number;
  concepts_at_risk: number;
  learning_streak_days: number;
  improving_concepts: Array<{ concept_name: string; accuracy: number; trend: string }>;
  declining_concepts: Array<{ concept_name: string; accuracy: number; trend: string }>;
  knowledge_decay_timeline: KnowledgeDecayItem[];
  confidence_accuracy_points: ConfidenceAccuracyPoint[];
  response_efficiency: Array<{ concept_name: string; avg_response_time: number; accuracy: number }>;
  history: AnalyticsHistoryItem[];
  learning_difficulty_scores: Record<string, number>;
}

export interface EvaluationRunResponse {
  total_samples: number;
  classification_accuracy: number;
  prerequisite_identification_accuracy: number;
  misconception_detection: {
    true_positives: number;
    false_positives: number;
    false_negatives: number;
    true_negatives: number;
    precision: number;
    recall: number;
    f1_score: number;
  };
  evaluation_notice: string;
  sample_details: Array<{
    id: string;
    concept: string;
    expected_classification: string;
    predicted_classification: string;
    is_match: boolean;
    has_misconception_ground_truth: boolean;
    has_misconception_predicted: boolean;
  }>;
}

export interface SettingsData {
  weights: {
    weight_incorrect: number;
    weight_repeated_errors: number;
    weight_low_confidence: number;
    weight_response_time: number;
    weight_hint_dependency: number;
    weight_prerequisite_weakness: number;
  };
}
