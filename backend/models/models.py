import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime, JSON
)
from sqlalchemy.orm import relationship
from backend.database.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    responses = relationship("StudentResponse", back_populates="student", cascade="all, delete-orphan")
    performances = relationship("ConceptPerformance", back_populates="student", cascade="all, delete-orphan")
    diagnostics = relationship("DiagnosticSession", back_populates="student", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="student", cascade="all, delete-orphan")
    verifications = relationship("VerificationSession", back_populates="student", cascade="all, delete-orphan")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # e.g. "c_programming"
    name = Column(String(100), nullable=False)                          # e.g. "C Programming"
    description = Column(Text, nullable=True)

    concepts = relationship("Concept", back_populates="subject")
    questions = relationship("Question", back_populates="subject")


class Concept(Base):
    __tablename__ = "concepts"

    id = Column(String(60), primary_key=True, index=True)  # slug id e.g. "pointer_arithmetic"
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    module = Column(String(60), nullable=False)            # e.g. "Pointers", "Control Flow"
    name = Column(String(100), nullable=False)             # e.g. "Pointer Arithmetic"
    description = Column(Text, nullable=True)
    difficulty_baseline = Column(String(20), default="medium")  # easy, medium, hard

    subject = relationship("Subject", back_populates="concepts")
    
    # Prerequisite relationships
    prerequisites = relationship(
        "Prerequisite",
        foreign_keys="Prerequisite.concept_id",
        back_populates="concept",
        cascade="all, delete-orphan"
    )
    is_prerequisite_for = relationship(
        "Prerequisite",
        foreign_keys="Prerequisite.prerequisite_id",
        back_populates="prerequisite",
        cascade="all, delete-orphan"
    )

    performances = relationship("ConceptPerformance", back_populates="concept")


class Prerequisite(Base):
    __tablename__ = "prerequisites"

    id = Column(Integer, primary_key=True, index=True)
    concept_id = Column(String(60), ForeignKey("concepts.id"), nullable=False)
    prerequisite_id = Column(String(60), ForeignKey("concepts.id"), nullable=False)
    weight = Column(Float, default=1.0)  # importance of prerequisite (0.5 to 1.0)

    concept = relationship("Concept", foreign_keys=[concept_id], back_populates="prerequisites")
    prerequisite = relationship("Concept", foreign_keys=[prerequisite_id], back_populates="is_prerequisite_for")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    topic = Column(String(60), nullable=False)
    difficulty = Column(String(20), default="medium")  # easy, medium, hard
    question_type = Column(String(30), default="mcq")  # mcq, code_output, true_false
    question = Column(Text, nullable=False)
    code_snippet = Column(Text, nullable=True)
    options = Column(JSON, nullable=False)             # list of strings or dicts
    correct_answer = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=False)
    concepts = Column(JSON, nullable=False)            # list of concept_id strings
    prerequisites = Column(JSON, nullable=True)        # list of prerequisite concept_id strings
    misconception_distractors = Column(JSON, nullable=True)  # maps option text to misconception type tag

    subject = relationship("Subject", back_populates="questions")
    responses = relationship("StudentResponse", back_populates="question")


class DiagnosticSession(Base):
    __tablename__ = "diagnostic_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    topic = Column(String(60), nullable=True)
    status = Column(String(30), default="in_progress")  # in_progress, completed
    total_questions = Column(Integer, default=0)
    score_percentage = Column(Float, default=0.0)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    student = relationship("Student", back_populates="diagnostics")
    responses = relationship("StudentResponse", back_populates="diagnostic", cascade="all, delete-orphan")


class StudentResponse(Base):
    __tablename__ = "student_responses"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    diagnostic_id = Column(Integer, ForeignKey("diagnostic_sessions.id"), nullable=True)
    selected_answer = Column(String(255), nullable=False)
    correct_answer = Column(String(255), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_taken_seconds = Column(Float, default=0.0)
    confidence = Column(Integer, default=3)  # 1 (very unsure) to 5 (very confident)
    attempt_number = Column(Integer, default=1)
    hints_used = Column(Integer, default=0)
    concepts = Column(JSON, nullable=False)  # stored list of concepts tested
    detected_misconception_tag = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="responses")
    question = relationship("Question", back_populates="responses")
    diagnostic = relationship("DiagnosticSession", back_populates="responses")


class ConceptPerformance(Base):
    __tablename__ = "concept_performances"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    concept_id = Column(String(60), ForeignKey("concepts.id"), nullable=False)
    accuracy = Column(Float, default=0.0)           # 0.0 to 100.0
    average_confidence = Column(Float, default=0.0) # 0.0 to 100.0
    attempts_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    high_conf_errors_count = Column(Integer, default=0)  # confidence >= 4 and incorrect
    calibration_gap = Column(Float, default=0.0)    # confidence - accuracy
    status = Column(String(30), default="DEVELOPING") # MASTERED, STRONG, DEVELOPING, AT_RISK, CONFUSED
    confusion_probability = Column(Float, default=0.0) # ML model output 0.0 to 1.0
    common_errors = Column(JSON, default=list)      # observed mistake categories
    last_evaluated_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="performances")
    concept = relationship("Concept", back_populates="performances")
    diagnoses = relationship("Diagnosis", back_populates="concept_performance", cascade="all, delete-orphan")


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id = Column(Integer, primary_key=True, index=True)
    concept_performance_id = Column(Integer, ForeignKey("concept_performances.id"), nullable=False)
    concept_id = Column(String(60), nullable=False)
    status = Column(String(30), nullable=False)
    diagnosis_summary = Column(Text, nullable=False)
    likely_prerequisite = Column(String(60), nullable=True)
    prerequisite_evidence = Column(Text, nullable=True)
    evidence_points = Column(JSON, default=list)    # strictly observed items
    confidence = Column(Float, default=0.85)        # system confidence in diagnosis 0.0 to 1.0
    recommended_interventions = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    concept_performance = relationship("ConceptPerformance", back_populates="diagnoses")
    interventions = relationship("Intervention", back_populates="diagnosis")


class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    diagnosis_id = Column(Integer, ForeignKey("diagnoses.id"), nullable=True)
    concept_id = Column(String(60), nullable=False)
    title = Column(String(200), nullable=False)
    steps = Column(JSON, nullable=False)             # ordered micro-steps: 5-step targeted flow
    pre_intervention_score = Column(Float, default=0.0)
    post_intervention_score = Column(Float, nullable=True)
    status = Column(String(30), default="active")   # active, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    student = relationship("Student", back_populates="interventions")
    diagnosis = relationship("Diagnosis", back_populates="interventions")
    verifications = relationship("VerificationSession", back_populates="intervention")


class InterventionQuestion(Base):
    __tablename__ = "intervention_questions"

    id = Column(Integer, primary_key=True, index=True)
    intervention_id = Column(Integer, ForeignKey("interventions.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    code_snippet = Column(Text, nullable=True)
    options = Column(JSON, nullable=False)
    correct_answer = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=False)
    difficulty = Column(String(20), default="medium")
    concept_id = Column(String(60), nullable=False)


class VerificationSession(Base):
    __tablename__ = "verification_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    intervention_id = Column(Integer, ForeignKey("interventions.id"), nullable=False)
    concept_id = Column(String(60), nullable=False)
    pre_score = Column(Float, default=0.0)
    post_score = Column(Float, default=0.0)
    improvement_delta = Column(Float, default=0.0)
    questions_attempted = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    verdict = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="verifications")
    intervention = relationship("Intervention", back_populates="verifications")
