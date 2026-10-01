from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
import datetime


# Student schemas
class StudentCreate(BaseModel):
    name: str = "Demo Student"
    email: Optional[str] = "demo@example.com"


class StudentSchema(BaseModel):
    id: int
    name: str
    email: Optional[str]
    avatar_url: Optional[str] = None
    auth_provider: Optional[str] = "local"
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# Auth Schemas
class LoginRequest(BaseModel):
    email: str
    name: Optional[str] = None
    password: Optional[str] = None


class GoogleLoginRequest(BaseModel):
    email: str
    name: str
    avatar_url: Optional[str] = None
    credential: Optional[str] = None


class AuthResponse(BaseModel):
    token: str
    student: StudentSchema
    is_new: bool = False


# Document Analysis Schemas
class DocumentHotspot(BaseModel):
    concept: str
    risk_level: str  # "high", "medium", "low"
    potential_confusion: str
    prerequisite_bottleneck: Optional[str] = None
    remedy_suggestion: str


class DocumentAnalysisResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    file_size: int
    detected_subject: str
    detected_subject_code: Optional[str] = None
    extracted_concepts: List[str]
    confusion_hotspots: List[DocumentHotspot]
    question_count: int
    diagnostic_session_id: Optional[int] = None
    created_at: str


# Concept & Graph schemas
class PrerequisiteItem(BaseModel):
    prerequisite_id: str
    prerequisite_name: str
    status: Optional[str] = "DEVELOPING"
    accuracy: Optional[float] = 0.0


class ConceptSchema(BaseModel):
    id: str
    module: str
    name: str
    description: Optional[str]
    difficulty_baseline: str
    prerequisites: List[str] = []


class ConceptGraphNode(BaseModel):
    id: str
    name: str
    module: str
    status: str  # MASTERED, STRONG, DEVELOPING, AT_RISK, CONFUSED
    accuracy: float
    confidence: float
    attempts: int
    prerequisites: List[str] = []


class ConceptGraphEdge(BaseModel):
    from_concept: str
    to_concept: str
    weight: float = 1.0


class ConceptGraphResponse(BaseModel):
    nodes: List[ConceptGraphNode]
    edges: List[ConceptGraphEdge]


# Question schemas
class QuestionSchema(BaseModel):
    id: int
    subject_id: int
    topic: str
    difficulty: str
    question_type: str
    question: str
    code_snippet: Optional[str] = None
    options: List[str]
    concepts: List[str]
    prerequisites: List[str] = []


class QuestionAnswerRequest(BaseModel):
    student_id: int
    selected_answer: str
    confidence: int = Field(ge=1, le=5)  # 1 (Very unsure) to 5 (Very confident)
    time_taken_seconds: float = 0.0
    hints_used: int = 0


class QuestionAnswerResponse(BaseModel):
    is_correct: bool
    correct_answer: str
    explanation: str
    concept_id: str
    misconception_tag: Optional[str] = None


# Diagnostic Session schemas
class DiagnosticStartRequest(BaseModel):
    student_id: int
    subject_code: str = "c_programming"
    topic: Optional[str] = None
    question_count: int = 10


class DiagnosticSessionResponse(BaseModel):
    id: int
    student_id: int
    subject_id: int
    status: str
    total_questions: int
    questions: List[QuestionSchema]


class DiagnosticCompleteResponse(BaseModel):
    diagnostic_id: int
    score_percentage: float
    total_answered: int
    correct_count: int
    confused_concepts: List[str]
    at_risk_concepts: List[str]
    strong_concepts: List[str]
    recommended_concept: Optional[str]


# Performance & Evidence Schemas
class ConceptPerformanceSchema(BaseModel):
    concept_id: str
    concept_name: str
    module: str
    accuracy: float
    average_confidence: float
    attempts_count: int
    correct_count: int
    incorrect_count: int
    high_conf_errors_count: int
    calibration_gap: float
    status: str
    confusion_probability: float
    common_errors: List[str]
    likely_prerequisite: Optional[str] = None
    recommended_action: str


class EvidencePanelResponse(BaseModel):
    concept_id: str
    concept_name: str
    status: str
    confusion_probability: float
    system_confidence: float
    evidence_items: List[str]
    likely_prerequisite: Optional[str] = None
    prerequisite_name: Optional[str] = None
    prerequisite_status: Optional[str] = None
    prerequisite_accuracy: Optional[float] = None
    prerequisite_evidence: Optional[str] = None
    common_errors: List[str] = []
    recommended_intervention: List[str] = []
    ml_contributing_factors: List[Dict[str, Any]] = []


# AI Diagnosis Schemas
class DiagnosisResponse(BaseModel):
    concept: str
    status: str
    diagnosis: str
    likely_prerequisite: Optional[str]
    prerequisite_status: Optional[str]
    evidence: List[str]
    confidence: float
    recommended_intervention: List[str]


# Intervention Schemas
class InterventionStep(BaseModel):
    step_number: int
    title: str
    duration_label: str
    type: str  # "review", "visual_explanation", "guided_example", "practice"
    content: str
    code_example: Optional[str] = None
    key_takeaway: str


class InterventionResponse(BaseModel):
    id: int
    student_id: int
    concept_id: str
    concept_name: str
    title: str
    steps: List[InterventionStep]
    pre_intervention_score: float
    post_intervention_score: Optional[float]
    status: str


class InterventionCompleteRequest(BaseModel):
    completed_steps: List[int]


# Verification schemas
class VerificationQuestionSchema(BaseModel):
    id: int
    question: str
    code_snippet: Optional[str]
    options: List[str]
    difficulty: str


class VerificationStartResponse(BaseModel):
    verification_id: int
    intervention_id: int
    concept_id: str
    concept_name: str
    pre_score: float
    questions: List[VerificationQuestionSchema]


class VerificationAnswerSubmission(BaseModel):
    question_id: int
    selected_answer: str


class VerificationSubmitRequest(BaseModel):
    answers: List[VerificationAnswerSubmission]


class VerificationResultResponse(BaseModel):
    verification_id: int
    concept_id: str
    concept_name: str
    pre_score: float
    post_score: float
    improvement_delta: float
    questions_attempted: int
    questions_correct: int
    verdict: str
    updated_status: str


# Student Profile & Analytics
class StudentProfileSummary(BaseModel):
    student_id: int
    student_name: str
    overall_understanding: float
    concepts_mastered: int
    concepts_strong: int
    concepts_developing: int
    concepts_at_risk: int
    concepts_confused: int
    recent_improvement: float
    critical_prerequisites: List[Dict[str, Any]]
    weak_concepts: List[ConceptPerformanceSchema]
    recommended_next_step: Dict[str, Any]


class AnalyticsHistoryItem(BaseModel):
    date: str
    concept_id: str
    concept_name: str
    pre_score: float
    post_score: Optional[float]
    intervention_taken: bool
    improvement_delta: Optional[float]
    status: str


class ConfidenceAccuracyPoint(BaseModel):
    concept_name: str
    accuracy: float
    confidence: float
    gap: float
    status: str
    attempts: int


class StudentAnalyticsResponse(BaseModel):
    student_id: int
    overall_understanding: float
    confidence_accuracy_points: List[ConfidenceAccuracyPoint]
    history: List[AnalyticsHistoryItem]
    confusion_distribution: Dict[str, int]
    calibration_message: str


# Multi-Subject & Topic Schemas
class SubjectSummarySchema(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str]
    topic_count: int
    concept_count: int


class TopicSummarySchema(BaseModel):
    topic: str
    subject_id: int
    concepts: List[str]
    question_count: int


class WeakConceptItem(BaseModel):
    concept_id: str
    concept_name: str
    module: str
    accuracy: float
    status: str
    learning_difficulty_score: float
    issue_type: str
    suspected_prerequisite: Optional[str] = None
    suspected_prerequisite_name: Optional[str] = None
    common_errors: List[str] = []
    recommended_action: str


class WeakConceptsResponse(BaseModel):
    student_id: int
    weak_concepts: List[WeakConceptItem]
    detected_root_concept: Optional[str] = None
    detected_root_name: Optional[str] = None
    root_evidence: Optional[str] = None


class StudentAnalysisResponse(BaseModel):
    student_id: int
    overall_understanding: float
    status: str
    detected_root_concept: Optional[str]
    detected_root_name: Optional[str]
    learning_difficulty_score: float
    possible_issue: str
    evidence: List[str]
    recommended_action: str
    weak_concepts: List[WeakConceptItem]
    strong_concepts: List[str]


class LearningSessionStartRequest(BaseModel):
    student_id: int
    concept_id: str


class LearningSessionCompleteRequest(BaseModel):
    answers: Optional[Dict[str, str]] = None


class KnowledgeDecayItem(BaseModel):
    date: str
    score: float
    concept_name: str
    decay_observed: bool
    retrieval_recommended: bool


class StudentProgressResponse(BaseModel):
    student_id: int
    overall_understanding: float
    concepts_strong: int
    concepts_developing: int
    concepts_at_risk: int
    learning_streak_days: int
    improving_concepts: List[Dict[str, Any]]
    declining_concepts: List[Dict[str, Any]]
    knowledge_decay_timeline: List[KnowledgeDecayItem]
    confidence_accuracy_points: List[ConfidenceAccuracyPoint]
    response_efficiency: List[Dict[str, Any]]
    history: List[AnalyticsHistoryItem]
    learning_difficulty_scores: Dict[str, float]


class EvaluationRunResponse(BaseModel):
    total_samples: int
    classification_accuracy: float
    prerequisite_identification_accuracy: float
    misconception_detection: Dict[str, Any]
    evaluation_notice: str
    sample_details: List[Dict[str, Any]]


class SettingsSchema(BaseModel):
    weights: Dict[str, float]

