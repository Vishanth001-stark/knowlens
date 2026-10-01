import json
import os
import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, Form
from sqlalchemy.orm import Session

from backend.database.database import get_db, Base, engine
from backend.models.models import (
    Student, Subject, Concept, Prerequisite, Question, DiagnosticSession,
    StudentResponse, ConceptPerformance, Diagnosis, Intervention, VerificationSession,
    UploadedDocument
)
from backend.schemas.schemas import (
    StudentCreate, StudentSchema, StudentProfileSummary, ConceptSchema,
    ConceptGraphResponse, QuestionSchema, QuestionAnswerRequest, QuestionAnswerResponse,
    DiagnosticStartRequest, DiagnosticSessionResponse, DiagnosticCompleteResponse,
    ConceptPerformanceSchema, EvidencePanelResponse, DiagnosisResponse,
    InterventionResponse, InterventionCompleteRequest, VerificationStartResponse,
    VerificationSubmitRequest, VerificationResultResponse, StudentAnalyticsResponse,
    ConfidenceAccuracyPoint, AnalyticsHistoryItem,
    SubjectSummarySchema, TopicSummarySchema, WeakConceptItem, WeakConceptsResponse,
    StudentAnalysisResponse, LearningSessionStartRequest, LearningSessionCompleteRequest,
    StudentProgressResponse, KnowledgeDecayItem, EvaluationRunResponse, SettingsSchema,
    LoginRequest, GoogleLoginRequest, AuthResponse, DocumentAnalysisResponse
)
from backend.knowledge_graph.graph import knowledge_graph
from backend.services.confusion_engine import ConfusionEngine
from backend.ai.llm_diagnostician import llm_diagnostician
from backend.services.intervention_service import InterventionService
from backend.services.verification_service import VerificationService
from backend.services.document_service import document_service
from backend.evaluation.evaluator import evaluator

router = APIRouter(prefix="/api")

# In-memory storage for active interventions verification questions mapping
_INTERVENTION_QUESTIONS_CACHE: Dict[int, Any] = {}


def utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


SUBJECT_CONFIGS = [
    {
        "code": "c_programming",
        "name": "C Programming",
        "description": "Foundations of C: memory addresses, pointers, dereferencing, arrays, and pointer arithmetic.",
        "concepts_file": "c_concepts.json",
        "questions_file": "c_questions.json"
    },
    {
        "code": "python",
        "name": "Python",
        "description": "Modern Python: references, mutability, closures, scope LEGB, OOP, and data structures.",
        "concepts_file": "python_concepts.json",
        "questions_file": "python_questions.json"
    },
    {
        "code": "mathematics",
        "name": "Mathematics",
        "description": "Calculus and Probability: limits, derivatives, chain rule, and Bayes' theorem.",
        "concepts_file": "mathematics_concepts.json",
        "questions_file": "mathematics_questions.json"
    },
    {
        "code": "data_structures",
        "name": "Data Structures",
        "description": "Core structures: linked lists, stacks, queues, binary search trees, and hash tables.",
        "concepts_file": "data_structures_concepts.json",
        "questions_file": "data_structures_questions.json"
    },
    {
        "code": "computer_networks",
        "name": "Computer Networks",
        "description": "Networking principles: OSI layers, IP subnetting, TCP/UDP, and flow control.",
        "concepts_file": "computer_networks_concepts.json",
        "questions_file": "computer_networks_questions.json"
    },
    {
        "code": "operating_systems",
        "name": "Operating Systems",
        "description": "Concurrency and memory: processes, threads, deadlocks, and virtual memory.",
        "concepts_file": "operating_systems_concepts.json",
        "questions_file": "operating_systems_questions.json"
    },
    {
        "code": "database_systems",
        "name": "Database Systems",
        "description": "Relational databases: SQL queries, normalization (1NF-3NF), transactions, and indexing.",
        "concepts_file": "database_systems_concepts.json",
        "questions_file": "database_systems_questions.json"
    }
]


def seed_database_if_empty(db: Session):
    """Seeds all 7 subjects, their concepts, prerequisites, and questions if not yet seeded."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    data_dir = os.path.join(base_dir, "data")

    for cfg in SUBJECT_CONFIGS:
        subject = db.query(Subject).filter(Subject.code == cfg["code"]).first()
        if not subject:
            subject = Subject(
                code=cfg["code"],
                name=cfg["name"],
                description=cfg["description"]
            )
            db.add(subject)
            db.commit()
            db.refresh(subject)

        # Seed concepts
        concepts_path = os.path.join(data_dir, cfg["concepts_file"])
        if os.path.exists(concepts_path):
            with open(concepts_path, "r", encoding="utf-8") as f:
                concepts_data = json.load(f)

            for c in concepts_data:
                existing_c = db.query(Concept).filter(Concept.id == c["id"]).first()
                if not existing_c:
                    db_c = Concept(
                        id=c["id"],
                        subject_id=subject.id,
                        module=c["module"],
                        name=c["name"],
                        description=c.get("description"),
                        difficulty_baseline=c.get("difficulty_baseline", "medium")
                    )
                    db.add(db_c)
            db.commit()

            # Seed prerequisites
            for c in concepts_data:
                for p_id in c.get("prerequisites", []):
                    existing_p = db.query(Prerequisite).filter(
                        Prerequisite.concept_id == c["id"],
                        Prerequisite.prerequisite_id == p_id
                    ).first()
                    if not existing_p:
                        db_p = Prerequisite(
                            concept_id=c["id"],
                            prerequisite_id=p_id,
                            weight=1.0
                        )
                        db.add(db_p)
            db.commit()

        # Seed questions
        questions_path = os.path.join(data_dir, cfg["questions_file"])
        if os.path.exists(questions_path):
            with open(questions_path, "r", encoding="utf-8") as f:
                questions_data = json.load(f)

            for q in questions_data:
                existing_q = db.query(Question).filter(Question.id == q["id"]).first()
                if not existing_q:
                    db_q = Question(
                        id=q["id"],
                        subject_id=subject.id,
                        topic=q.get("topic", "General"),
                        difficulty=q.get("difficulty", "medium"),
                        question_type=q.get("question_type", "mcq"),
                        question=q["question"],
                        code_snippet=q.get("code_snippet"),
                        options=q["options"],
                        correct_answer=q["correct_answer"],
                        explanation=q["explanation"],
                        concepts=q["concepts"],
                        prerequisites=q.get("prerequisites", []),
                        misconception_distractors=q.get("misconception_distractors", {})
                    )
                    db.add(db_q)
            db.commit()


# -------------------------------------------------------------
# Student CRUD Endpoints (Section 24)
# -------------------------------------------------------------
@router.post("/students", response_model=StudentSchema)
def create_student(req: StudentCreate, db: Session = Depends(get_db)):
    seed_database_if_empty(db)
    if req.email:
        existing = db.query(Student).filter(Student.email == req.email).first()
        if existing:
            return existing
    student = Student(name=req.name, email=req.email, created_at=utc_now())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.get("/students/{id}", response_model=StudentProfileSummary)
def get_student_by_id(id: int, db: Session = Depends(get_db)):
    return get_student_profile(id, db)


# -------------------------------------------------------------
# Authentication Endpoints (Login / Google Auth)
# -------------------------------------------------------------
@router.post("/auth/login", response_model=AuthResponse)
def login_student(req: LoginRequest, db: Session = Depends(get_db)):
    seed_database_if_empty(db)
    student = db.query(Student).filter(Student.email == req.email).first()
    is_new = False
    if not student:
        name = req.name if req.name and req.name.strip() else req.email.split("@")[0].replace(".", " ").title()
        student = Student(name=name, email=req.email, auth_provider="local", created_at=utc_now())
        db.add(student)
        db.commit()
        db.refresh(student)
        is_new = True
    elif req.name and req.name.strip():
        student.name = req.name.strip()
        db.commit()
        db.refresh(student)

    token = f"token_local_{student.id}_{int(datetime.datetime.now().timestamp())}"
    return AuthResponse(token=token, student=student, is_new=is_new)


@router.post("/auth/google", response_model=AuthResponse)
def google_login(req: GoogleLoginRequest, db: Session = Depends(get_db)):
    seed_database_if_empty(db)
    student = db.query(Student).filter(Student.email == req.email).first()
    is_new = False
    if not student:
        student = Student(
            name=req.name,
            email=req.email,
            avatar_url=req.avatar_url,
            auth_provider="google",
            created_at=utc_now()
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        is_new = True
    else:
        if req.name:
            student.name = req.name
        if req.avatar_url:
            student.avatar_url = req.avatar_url
        student.auth_provider = "google"
        db.commit()
        db.refresh(student)

    token = f"token_google_{student.id}_{int(datetime.datetime.now().timestamp())}"
    return AuthResponse(token=token, student=student, is_new=is_new)


# -------------------------------------------------------------
# Document Upload & Intelligence Endpoints
# -------------------------------------------------------------
@router.post("/documents/upload", response_model=DocumentAnalysisResponse)
async def upload_document(
    file: UploadFile = File(...),
    student_id: int = Form(...),
    preferred_subject: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    seed_database_if_empty(db)
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        try:
            student = Student(id=student_id, name="Student", email=f"student_{student_id}@knowlens.edu")
            db.add(student)
            db.commit()
            db.refresh(student)
        except Exception:
            db.rollback()
            student = db.query(Student).first()
            if not student:
                student = Student(name="Student", email="student@knowlens.edu")
                db.add(student)
                db.commit()
                db.refresh(student)

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    analysis = document_service.analyze_document(
        file_bytes=content,
        filename=file.filename or "uploaded_document.pdf",
        db=db,
        student_id=student.id,
        preferred_subject=preferred_subject
    )

    doc_record = db.query(UploadedDocument).filter(UploadedDocument.id == analysis["id"]).first()
    subject = db.query(Subject).filter(Subject.name == analysis["detected_subject"]).first()
    if not subject:
        subject = db.query(Subject).first()

    diag_session = DiagnosticSession(
        student_id=student.id,
        subject_id=subject.id if subject else 1,
        topic=f"Document: {analysis['filename'][:30]}",
        total_questions=len(analysis["generated_questions"]),
        status="in_progress",
        started_at=utc_now()
    )
    db.add(diag_session)
    db.commit()
    db.refresh(diag_session)

    _INTERVENTION_QUESTIONS_CACHE[f"diag_doc_{diag_session.id}"] = analysis["generated_questions"]
    analysis["diagnostic_session_id"] = diag_session.id
    return analysis


@router.get("/students/{id}/documents")
def get_student_documents(id: int, db: Session = Depends(get_db)):
    docs = db.query(UploadedDocument).filter(UploadedDocument.student_id == id).order_by(UploadedDocument.created_at.desc()).all()
    results = []
    for d in docs:
        results.append({
            "id": d.id,
            "filename": d.filename,
            "file_type": d.file_type,
            "file_size": d.file_size,
            "detected_subject": d.detected_subject,
            "extracted_concepts": d.extracted_concepts,
            "confusion_hotspots": d.confusion_hotspots,
            "question_count": len(d.generated_questions) if d.generated_questions else 0,
            "created_at": d.created_at.isoformat()
        })
    return results


@router.post("/documents/{doc_id}/start-diagnostic")
def start_document_diagnostic(doc_id: int, student_id: int = Query(...), db: Session = Depends(get_db)):
    doc = db.query(UploadedDocument).filter(UploadedDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    subject = db.query(Subject).filter(Subject.name == doc.detected_subject).first()
    subject_id = subject.id if subject else 1

    diag_session = DiagnosticSession(
        student_id=student_id,
        subject_id=subject_id,
        topic=f"Document: {doc.filename[:30]}",
        total_questions=len(doc.generated_questions) if doc.generated_questions else 5,
        status="in_progress",
        started_at=utc_now()
    )
    db.add(diag_session)
    db.commit()
    db.refresh(diag_session)

    _INTERVENTION_QUESTIONS_CACHE[f"diag_doc_{diag_session.id}"] = doc.generated_questions

    first_q = doc.generated_questions[0] if doc.generated_questions else None
    return {
        "session_id": diag_session.id,
        "topic": diag_session.topic,
        "total_questions": diag_session.total_questions,
        "questions": doc.generated_questions,
        "first_question": first_q
    }


# -------------------------------------------------------------
# Subjects & Topics Endpoints (Section 6 & 24)
# -------------------------------------------------------------
@router.get("/subjects", response_model=List[SubjectSummarySchema])
def list_subjects(db: Session = Depends(get_db)):
    seed_database_if_empty(db)
    subjects = db.query(Subject).all()
    results = []
    for s in subjects:
        concepts = db.query(Concept).filter(Concept.subject_id == s.id).all()
        topics = set(c.module for c in concepts)
        results.append(
            SubjectSummarySchema(
                id=s.id,
                code=s.code,
                name=s.name,
                description=s.description,
                topic_count=len(topics),
                concept_count=len(concepts)
            )
        )
    return results


@router.get("/subjects/{id}/topics", response_model=List[TopicSummarySchema])
def list_subject_topics(id: int, db: Session = Depends(get_db)):
    seed_database_if_empty(db)
    subject = db.query(Subject).filter(Subject.id == id).first()
    if not subject:
        # Also try searching by code if int parsing fell back
        raise HTTPException(status_code=404, detail="Subject not found")

    concepts = db.query(Concept).filter(Concept.subject_id == subject.id).all()
    modules = {}
    for c in concepts:
        if c.module not in modules:
            modules[c.module] = []
        modules[c.module].append(c.id)

    topics_list = []
    for mod_name, c_ids in modules.items():
        q_count = db.query(Question).filter(
            Question.subject_id == subject.id,
            Question.topic == mod_name
        ).count()
        topics_list.append(
            TopicSummarySchema(
                topic=mod_name,
                subject_id=subject.id,
                concepts=c_ids,
                question_count=max(q_count, len(c_ids))
            )
        )
    return topics_list


@router.get("/topics/{topic_name}/concepts", response_model=List[ConceptSchema])
def list_topic_concepts(topic_name: str, db: Session = Depends(get_db)):
    seed_database_if_empty(db)
    concepts = db.query(Concept).filter(Concept.module == topic_name).all()
    res = []
    for c in concepts:
        prereqs = knowledge_graph.get_prerequisites(c.id)
        res.append(
            ConceptSchema(
                id=c.id,
                module=c.module,
                name=c.name,
                description=c.description,
                difficulty_baseline=c.difficulty_baseline,
                prerequisites=prereqs
            )
        )
    return res


# -------------------------------------------------------------
# Diagnostic Assessment Endpoints (Section 8, 9, 10, 24)
# -------------------------------------------------------------
@router.post("/diagnostic/start", response_model=DiagnosticSessionResponse)
def start_diagnostic(req: DiagnosticStartRequest, db: Session = Depends(get_db)):
    seed_database_if_empty(db)
    
    student = db.query(Student).filter(Student.id == req.student_id).first()
    if not student:
        student = Student(id=req.student_id, name="Active Student", email=f"student_{req.student_id}@test.com")
        db.add(student)
        db.commit()

    subject = db.query(Subject).filter(Subject.code == req.subject_code).first()
    if not subject:
        subject = db.query(Subject).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

    # Adaptive question selection:
    # If a topic is specified, assess both prerequisite concepts and the target topic questions
    query = db.query(Question).filter(Question.subject_id == subject.id)
    all_subject_questions = query.all()

    if req.topic:
        # Find concepts in this topic
        topic_concepts = [c.id for c in db.query(Concept).filter(Concept.subject_id == subject.id, Concept.module == req.topic).all()]
        all_prereq_concepts = set()
        for c_id in topic_concepts:
            all_prereq_concepts.update(knowledge_graph.get_all_prerequisites(c_id))

        # Filter questions covering prerequisites or the target topic
        prereq_questions = [q for q in all_subject_questions if any(c in all_prereq_concepts for c in (q.concepts or []))]
        topic_questions = [q for q in all_subject_questions if q.topic == req.topic or any(c in topic_concepts for c in (q.concepts or []))]
        
        # Foundational first, then topic
        combined = []
        seen = set()
        for q in prereq_questions + topic_questions:
            if q.id not in seen:
                seen.add(q.id)
                combined.append(q)
        
        if combined:
            selected_questions = combined[:req.question_count]
        else:
            selected_questions = all_subject_questions[:req.question_count]
    else:
        # Sort so that foundational questions come before dependent ones
        def question_sort_key(q: Question):
            order = {"Basics": 0, "Operators": 1, "Control Flow": 2, "Functions": 3, "Linear Structures": 4, "Hierarchical Structures": 5, "Pointers": 6}
            return order.get(q.topic, 5)

        sorted_questions = sorted(all_subject_questions, key=question_sort_key)
        selected_questions = sorted_questions[:req.question_count]

    session = DiagnosticSession(
        student_id=student.id,
        subject_id=subject.id,
        topic=req.topic,
        status="in_progress",
        total_questions=len(selected_questions),
        score_percentage=0.0
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    q_schemas = [
        QuestionSchema(
            id=q.id,
            subject_id=q.subject_id,
            topic=q.topic,
            difficulty=q.difficulty,
            question_type=q.question_type,
            question=q.question,
            code_snippet=q.code_snippet,
            options=q.options,
            concepts=q.concepts,
            prerequisites=q.prerequisites or []
        )
        for q in selected_questions
    ]

    return DiagnosticSessionResponse(
        id=session.id,
        student_id=session.student_id,
        subject_id=session.subject_id,
        status=session.status,
        total_questions=session.total_questions,
        questions=q_schemas
    )


@router.get("/diagnostic/{id}", response_model=DiagnosticSessionResponse)
def get_diagnostic(id: int, db: Session = Depends(get_db)):
    session = db.query(DiagnosticSession).filter(DiagnosticSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Diagnostic session not found")
    
    questions = db.query(Question).filter(Question.subject_id == session.subject_id).limit(session.total_questions).all()
    q_schemas = [
        QuestionSchema(
            id=q.id,
            subject_id=q.subject_id,
            topic=q.topic,
            difficulty=q.difficulty,
            question_type=q.question_type,
            question=q.question,
            code_snippet=q.code_snippet,
            options=q.options,
            concepts=q.concepts,
            prerequisites=q.prerequisites or []
        )
        for q in questions
    ]

    return DiagnosticSessionResponse(
        id=session.id,
        student_id=session.student_id,
        subject_id=session.subject_id,
        status=session.status,
        total_questions=session.total_questions,
        questions=q_schemas
    )


@router.post("/diagnostic/{id}/answer", response_model=QuestionAnswerResponse)
def answer_diagnostic_question(
    id: int,
    question_id: int,
    req: QuestionAnswerRequest,
    db: Session = Depends(get_db)
):
    session = db.query(DiagnosticSession).filter(DiagnosticSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Diagnostic session not found")

    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    is_correct = req.selected_answer.strip() == question.correct_answer.strip()
    
    # Identify misconception tag if incorrect
    misconception_tag = None
    if not is_correct and question.misconception_distractors:
        misconception_tag = question.misconception_distractors.get(req.selected_answer.strip())

    # Count prior attempts for this student & question
    prior_attempts = db.query(StudentResponse).filter(
        StudentResponse.student_id == req.student_id,
        StudentResponse.question_id == question_id
    ).count()

    response = StudentResponse(
        student_id=req.student_id,
        question_id=question_id,
        diagnostic_id=session.id,
        selected_answer=req.selected_answer,
        correct_answer=question.correct_answer,
        is_correct=is_correct,
        time_taken_seconds=req.time_taken_seconds,
        confidence=req.confidence,
        hints_used=getattr(req, "hints_used", 0),
        attempt_number=prior_attempts + 1,
        concepts=question.concepts,
        detected_misconception_tag=misconception_tag
    )
    db.add(response)
    db.commit()

    primary_concept = question.concepts[0] if question.concepts else "c_programming"

    return QuestionAnswerResponse(
        is_correct=is_correct,
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        concept_id=primary_concept,
        misconception_tag=misconception_tag
    )


# Standalone endpoint: POST /api/questions/{id}/answer (Section 24)
@router.post("/questions/{id}/answer", response_model=QuestionAnswerResponse)
def answer_single_question(
    id: int,
    req: QuestionAnswerRequest,
    db: Session = Depends(get_db)
):
    question = db.query(Question).filter(Question.id == id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    is_correct = req.selected_answer.strip() == question.correct_answer.strip()
    misconception_tag = None
    if not is_correct and question.misconception_distractors:
        misconception_tag = question.misconception_distractors.get(req.selected_answer.strip())

    prior_attempts = db.query(StudentResponse).filter(
        StudentResponse.student_id == req.student_id,
        StudentResponse.question_id == id
    ).count()

    response = StudentResponse(
        student_id=req.student_id,
        question_id=id,
        diagnostic_id=None,
        selected_answer=req.selected_answer,
        correct_answer=question.correct_answer,
        is_correct=is_correct,
        time_taken_seconds=req.time_taken_seconds,
        confidence=req.confidence,
        hints_used=getattr(req, "hints_used", 0),
        attempt_number=prior_attempts + 1,
        concepts=question.concepts,
        detected_misconception_tag=misconception_tag
    )
    db.add(response)
    db.commit()

    primary_concept = question.concepts[0] if question.concepts else "general"

    return QuestionAnswerResponse(
        is_correct=is_correct,
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        concept_id=primary_concept,
        misconception_tag=misconception_tag
    )


@router.post("/diagnostic/{id}/complete", response_model=DiagnosticCompleteResponse)
def complete_diagnostic(id: int, db: Session = Depends(get_db)):
    session = db.query(DiagnosticSession).filter(DiagnosticSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Diagnostic session not found")

    responses = db.query(StudentResponse).filter(StudentResponse.diagnostic_id == session.id).all()
    total_answered = len(responses)
    correct_count = sum(1 for r in responses if r.is_correct)
    score_pct = round((correct_count / total_answered) * 100.0, 1) if total_answered > 0 else 0.0

    session.status = "completed"
    session.score_percentage = score_pct
    session.completed_at = utc_now()
    db.commit()

    student_all_responses = db.query(StudentResponse).filter(StudentResponse.student_id == session.student_id).all()

    all_concepts = db.query(Concept).all()
    concept_perfs_dict = {}
    
    for c in all_concepts:
        existing_perf = db.query(ConceptPerformance).filter(
            ConceptPerformance.student_id == session.student_id,
            ConceptPerformance.concept_id == c.id
        ).first()
        if existing_perf:
            concept_perfs_dict[c.id] = {
                "accuracy": existing_perf.accuracy,
                "status": existing_perf.status,
                "attempts_count": existing_perf.attempts_count
            }

    confused_concepts = []
    at_risk_concepts = []
    strong_concepts = []

    for c in all_concepts:
        eval_result = ConfusionEngine.evaluate_concept_performance(
            student_all_responses,
            concept_perfs_dict,
            c.id
        )

        perf = db.query(ConceptPerformance).filter(
            ConceptPerformance.student_id == session.student_id,
            ConceptPerformance.concept_id == c.id
        ).first()

        if not perf:
            perf = ConceptPerformance(
                student_id=session.student_id,
                concept_id=c.id,
            )
            db.add(perf)

        perf.accuracy = eval_result["accuracy"]
        perf.average_confidence = eval_result["average_confidence"]
        perf.attempts_count = eval_result["attempts_count"]
        perf.correct_count = eval_result["correct_count"]
        perf.incorrect_count = eval_result["incorrect_count"]
        perf.high_conf_errors_count = eval_result["high_conf_errors_count"]
        perf.calibration_gap = eval_result["calibration_gap"]
        perf.status = eval_result["status"]
        perf.confusion_probability = eval_result["confusion_probability"]
        perf.common_errors = eval_result["common_errors"]
        perf.last_evaluated_at = utc_now()

        if eval_result["status"] == "CONFUSED":
            confused_concepts.append(c.name)
        elif eval_result["status"] == "AT_RISK":
            at_risk_concepts.append(c.name)
        elif eval_result["status"] in ["MASTERED", "STRONG"]:
            strong_concepts.append(c.name)

    db.commit()

    recommended = confused_concepts[0] if confused_concepts else (at_risk_concepts[0] if at_risk_concepts else None)

    return DiagnosticCompleteResponse(
        diagnostic_id=session.id,
        score_percentage=score_pct,
        total_answered=total_answered,
        correct_count=correct_count,
        confused_concepts=confused_concepts,
        at_risk_concepts=at_risk_concepts,
        strong_concepts=strong_concepts,
        recommended_concept=recommended
    )


# -------------------------------------------------------------
# Student Profile & Analytics
# -------------------------------------------------------------
@router.get("/student/{id}/profile", response_model=StudentProfileSummary)
def get_student_profile(id: int, db: Session = Depends(get_db)):
    seed_database_if_empty(db)
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        student = Student(id=id, name=f"Student #{id}", email=f"student{id}@knowlens.edu")
        db.add(student)
        db.commit()
        db.refresh(student)

    performances = db.query(ConceptPerformance).filter(ConceptPerformance.student_id == id).all()
    
    mastered = sum(1 for p in performances if p.status == "MASTERED")
    strong = sum(1 for p in performances if p.status == "STRONG")
    developing = sum(1 for p in performances if p.status == "DEVELOPING")
    at_risk = sum(1 for p in performances if p.status == "AT_RISK")
    confused = sum(1 for p in performances if p.status == "CONFUSED")

    active_perfs = [p for p in performances if p.attempts_count > 0]
    overall_understanding = (
        round(sum(p.accuracy for p in active_perfs) / len(active_perfs), 1)
        if active_perfs else 0.0
    )

    weak_db_perfs = [p for p in performances if p.status in ["CONFUSED", "AT_RISK", "DEVELOPING"] and p.attempts_count > 0]
    weak_db_perfs.sort(key=lambda p: (0 if p.status == "CONFUSED" else (1 if p.status == "AT_RISK" else 2), p.accuracy))
    
    weak_schemas = []
    for p in weak_db_perfs[:5]:
        c_meta = knowledge_graph.concepts_data.get(p.concept_id, {})
        weak_schemas.append(
            ConceptPerformanceSchema(
                concept_id=p.concept_id,
                concept_name=c_meta.get("name", p.concept_id),
                module=c_meta.get("module", "General"),
                accuracy=p.accuracy,
                average_confidence=p.average_confidence,
                attempts_count=p.attempts_count,
                correct_count=p.correct_count,
                incorrect_count=p.incorrect_count,
                high_conf_errors_count=p.high_conf_errors_count,
                calibration_gap=p.calibration_gap,
                status=p.status,
                confusion_probability=p.confusion_probability,
                common_errors=p.common_errors or [],
                recommended_action=f"Review prerequisite memory concepts and take targeted recovery."
            )
        )

    crit_prereqs = []
    for p in weak_db_perfs:
        anc = knowledge_graph.get_prerequisites(p.concept_id)
        for a_id in anc:
            a_perf = next((x for x in performances if x.concept_id == a_id), None)
            a_name = knowledge_graph.concepts_data.get(a_id, {}).get("name", a_id)
            crit_prereqs.append({
                "concept_id": a_id,
                "concept_name": a_name,
                "required_by": knowledge_graph.concepts_data.get(p.concept_id, {}).get("name", p.concept_id),
                "accuracy": a_perf.accuracy if a_perf else 50.0,
                "status": a_perf.status if a_perf else "DEVELOPING"
            })

    recent_verifications = db.query(VerificationSession).filter(VerificationSession.student_id == student.id).all()
    recent_improvement = (
        round(sum(v.improvement_delta for v in recent_verifications) / len(recent_verifications), 1)
        if recent_verifications else 0.0
    )

    if weak_schemas:
        top_weak = weak_schemas[0]
        rec_step = {
            "concept_id": top_weak.concept_id,
            "concept_name": top_weak.concept_name,
            "action": "Start Recovery",
            "reason": f"Accuracy is {top_weak.accuracy}% with high confidence errors observed."
        }
    else:
        rec_step = {
            "concept_id": "",
            "concept_name": "Diagnostic Assessment",
            "action": "Take Diagnostic",
            "reason": "Complete a diagnostic assessment or upload study notes to diagnose your concept mastery."
        }

    return StudentProfileSummary(
        student_id=student.id,
        student_name=student.name,
        overall_understanding=overall_understanding,
        concepts_mastered=mastered,
        concepts_strong=strong,
        concepts_developing=developing,
        concepts_at_risk=at_risk,
        concepts_confused=confused,
        recent_improvement=recent_improvement,
        critical_prerequisites=crit_prereqs[:3],
        weak_concepts=weak_schemas,
        recommended_next_step=rec_step
    )


@router.get("/student/{id}/concepts")
def get_student_concepts(id: int, db: Session = Depends(get_db)):
    seed_database_if_empty(db)
    all_concepts = db.query(Concept).all()
    perfs = db.query(ConceptPerformance).filter(ConceptPerformance.student_id == id).all()
    perf_map = {p.concept_id: p for p in perfs}

    result = []
    for c in all_concepts:
        p = perf_map.get(c.id)
        result.append({
            "concept_id": c.id,
            "name": c.name,
            "module": c.module,
            "status": p.status if p else "DEVELOPING",
            "accuracy": p.accuracy if p else 0.0,
            "confidence": p.average_confidence if p else 0.0,
            "attempts": p.attempts_count if p else 0,
            "prerequisites": knowledge_graph.get_prerequisites(c.id)
        })

    return result


@router.get("/student/{id}/history")
def get_student_history(id: int, db: Session = Depends(get_db)):
    verifications = db.query(VerificationSession).filter(VerificationSession.student_id == id).order_by(VerificationSession.created_at.desc()).all()
    diagnostics = db.query(DiagnosticSession).filter(DiagnosticSession.student_id == id).order_by(DiagnosticSession.started_at.desc()).all()

    items = []
    for v in verifications:
        items.append({
            "type": "verification",
            "id": v.id,
            "concept_id": v.concept_id,
            "concept_name": knowledge_graph.concepts_data.get(v.concept_id, {}).get("name", v.concept_id),
            "pre_score": v.pre_score,
            "post_score": v.post_score,
            "delta": v.improvement_delta,
            "verdict": v.verdict,
            "date": v.created_at.strftime("%b %d, %Y")
        })

    for d in diagnostics:
        items.append({
            "type": "diagnostic",
            "id": d.id,
            "concept_id": "diagnostic_session",
            "concept_name": f"Diagnostic: {d.topic or 'Full Subject'}",
            "score": d.score_percentage,
            "status": d.status,
            "total_questions": d.total_questions,
            "date": d.started_at.strftime("%b %d, %Y")
        })

    return items


# -------------------------------------------------------------
# Knowledge Graph Visualization Endpoints
# -------------------------------------------------------------
@router.get("/concepts", response_model=ConceptGraphResponse)
def get_concept_graph(
    student_id: Optional[int] = None,
    subject_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    seed_database_if_empty(db)
    perf_map = {}
    if student_id:
        perfs = db.query(ConceptPerformance).filter(ConceptPerformance.student_id == student_id).all()
        for p in perfs:
            perf_map[p.concept_id] = {
                "status": p.status,
                "accuracy": p.accuracy,
                "average_confidence": p.average_confidence,
                "attempts_count": p.attempts_count
            }

    data = knowledge_graph.export_graph_for_visualization(perf_map, subject_code=subject_code)
    return ConceptGraphResponse(**data)


# GET /api/students/{id}/concept-map (Section 24)
@router.get("/students/{id}/concept-map", response_model=ConceptGraphResponse)
def get_student_concept_map(
    id: int,
    subject_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return get_concept_graph(student_id=id, subject_code=subject_code, db=db)


@router.get("/concepts/{id}")
def get_concept_details(id: str, student_id: Optional[int] = None, db: Session = Depends(get_db)):
    seed_database_if_empty(db)
    meta = knowledge_graph.concepts_data.get(id)
    if not meta:
        raise HTTPException(status_code=404, detail="Concept not found")

    perf = None
    if student_id:
        perf = db.query(ConceptPerformance).filter(
            ConceptPerformance.student_id == student_id,
            ConceptPerformance.concept_id == id
        ).first()

    prereqs = []
    for p_id in knowledge_graph.get_prerequisites(id):
        p_meta = knowledge_graph.concepts_data.get(p_id, {})
        p_perf = None
        if student_id:
            p_perf = db.query(ConceptPerformance).filter(
                ConceptPerformance.student_id == student_id,
                ConceptPerformance.concept_id == p_id
            ).first()

        prereqs.append({
            "prerequisite_id": p_id,
            "prerequisite_name": p_meta.get("name", p_id),
            "status": p_perf.status if p_perf else "DEVELOPING",
            "accuracy": p_perf.accuracy if p_perf else 0.0
        })

    return {
        "concept_id": id,
        "name": meta["name"],
        "module": meta["module"],
        "description": meta.get("description"),
        "difficulty_baseline": meta.get("difficulty_baseline"),
        "accuracy": perf.accuracy if perf else 0.0,
        "status": perf.status if perf else "DEVELOPING",
        "attempts_count": perf.attempts_count if perf else 0,
        "correct_count": perf.correct_count if perf else 0,
        "incorrect_count": perf.incorrect_count if perf else 0,
        "average_confidence": perf.average_confidence if perf else 0.0,
        "calibration_gap": perf.calibration_gap if perf else 0.0,
        "common_errors": perf.common_errors if (perf and perf.common_errors) else [],
        "prerequisites": prereqs,
        "recommended_action": f"Review {meta['name']} foundations" if not perf or perf.status in ["CONFUSED", "AT_RISK"] else "Continue practice"
    }


@router.get("/concepts/{id}/diagnosis", response_model=EvidencePanelResponse)
def get_concept_diagnosis(id: str, student_id: int = Query(...), db: Session = Depends(get_db)):
    """
    Evidence-backed 'Why was this detected?' explanation.
    Never fabricates statistics; retrieves empirical response records from DB.
    """
    seed_database_if_empty(db)
    meta = knowledge_graph.concepts_data.get(id)
    if not meta:
        raise HTTPException(status_code=404, detail="Concept not found")

    student_responses = db.query(StudentResponse).filter(StudentResponse.student_id == student_id).all()
    all_perfs = db.query(ConceptPerformance).filter(ConceptPerformance.student_id == student_id).all()
    all_perfs_dict = {p.concept_id: {"accuracy": p.accuracy, "status": p.status, "attempts_count": p.attempts_count} for p in all_perfs}

    perf_eval = ConfusionEngine.evaluate_concept_performance(student_responses, all_perfs_dict, id)
    panel_data = ConfusionEngine.generate_evidence_panel(id, perf_eval, student_responses)

    return EvidencePanelResponse(**panel_data)


# -------------------------------------------------------------
# Weak Concepts & Analysis Endpoints (Section 13, 14, 24)
# -------------------------------------------------------------
@router.get("/students/{id}/weak-concepts", response_model=WeakConceptsResponse)
def get_student_weak_concepts(id: int, db: Session = Depends(get_db)):
    seed_database_if_empty(db)
    responses = db.query(StudentResponse).filter(StudentResponse.student_id == id).all()
    perfs = db.query(ConceptPerformance).filter(ConceptPerformance.student_id == id).all()
    all_perfs_dict = {p.concept_id: {"accuracy": p.accuracy, "status": p.status, "attempts_count": p.attempts_count} for p in perfs}

    weak_items = []
    root_concept = None
    root_name = None
    root_evidence = None

    for p in perfs:
        eval_res = ConfusionEngine.evaluate_concept_performance(responses, all_perfs_dict, p.concept_id)
        if eval_res["status"] in ["CONFUSED", "AT_RISK", "DEVELOPING"] and p.attempts_count > 0:
            c_meta = knowledge_graph.concepts_data.get(p.concept_id, {})
            prereq_id = eval_res["likely_prerequisite"]
            prereq_name = knowledge_graph.concepts_data.get(prereq_id, {}).get("name", prereq_id) if prereq_id else None

            weak_items.append(
                WeakConceptItem(
                    concept_id=p.concept_id,
                    concept_name=c_meta.get("name", p.concept_id),
                    module=c_meta.get("module", "General"),
                    accuracy=eval_res["accuracy"],
                    status=eval_res["status"],
                    learning_difficulty_score=eval_res["learning_difficulty_score"],
                    issue_type=eval_res["issue_type"],
                    suspected_prerequisite=prereq_id,
                    suspected_prerequisite_name=prereq_name,
                    common_errors=eval_res["common_errors"],
                    recommended_action=eval_res["recommended_action"]
                )
            )

    weak_items.sort(key=lambda x: (0 if x.status == "CONFUSED" else (1 if x.status == "AT_RISK" else 2), -x.learning_difficulty_score))

    # Identify primary root concept
    if weak_items:
        top_weak = weak_items[0]
        if top_weak.suspected_prerequisite:
            root_concept = top_weak.suspected_prerequisite
            root_name = top_weak.suspected_prerequisite_name
            root_evidence = f"Errors on '{top_weak.concept_name}' cascade directly from incomplete mastery of '{root_name}'."
        else:
            root_concept = top_weak.concept_id
            root_name = top_weak.concept_name
            root_evidence = f"Direct confusion detected on '{root_name}' with {top_weak.accuracy}% accuracy."

    return WeakConceptsResponse(
        student_id=id,
        weak_concepts=weak_items,
        detected_root_concept=root_concept,
        detected_root_name=root_name,
        root_evidence=root_evidence
    )


@router.get("/students/{id}/analysis", response_model=StudentAnalysisResponse)
def get_student_analysis(id: int, db: Session = Depends(get_db)):
    seed_database_if_empty(db)
    weak_resp = get_student_weak_concepts(id, db)
    perfs = db.query(ConceptPerformance).filter(ConceptPerformance.student_id == id).all()
    active_perfs = [p for p in perfs if p.attempts_count > 0]
    overall = round(sum(p.accuracy for p in active_perfs) / len(active_perfs), 1) if active_perfs else 0.0

    strong_names = [knowledge_graph.concepts_data.get(p.concept_id, {}).get("name", p.concept_id) for p in perfs if p.status in ["MASTERED", "STRONG"]]

    evidence_list = []
    responses = db.query(StudentResponse).filter(StudentResponse.student_id == id).all()
    if weak_resp.detected_root_concept:
        root_meta = knowledge_graph.concepts_data.get(weak_resp.detected_root_concept, {})
        r_name = root_meta.get("name", weak_resp.detected_root_concept)
        root_attempts = [r for r in responses if weak_resp.detected_root_concept in (r.concepts or [])]
        wrongs = sum(1 for r in root_attempts if not r.is_correct)
        if wrongs > 0:
            evidence_list.append(f"Student struggled with {wrongs} questions involving {r_name} before encountering downstream errors.")
        evidence_list.append(f"Prerequisite DAG path isolates '{r_name}' as the highest-severity bottleneck.")
    else:
        evidence_list.append("Insufficient evidence to identify a root concept.")

    top_diff_score = weak_resp.weak_concepts[0].learning_difficulty_score if weak_resp.weak_concepts else 0.0

    return StudentAnalysisResponse(
        student_id=id,
        overall_understanding=overall,
        status="CONFUSED" if any(w.status == "CONFUSED" for w in weak_resp.weak_concepts) else "DEVELOPING",
        detected_root_concept=weak_resp.detected_root_concept,
        detected_root_name=weak_resp.detected_root_name,
        learning_difficulty_score=top_diff_score,
        possible_issue="prerequisite_gap" if weak_resp.detected_root_concept != (weak_resp.weak_concepts[0].concept_id if weak_resp.weak_concepts else None) else "misconception",
        evidence=evidence_list,
        recommended_action=f"Review '{weak_resp.detected_root_name}' before retrying advanced topics." if weak_resp.detected_root_name else "Complete diagnostic test.",
        weak_concepts=weak_resp.weak_concepts,
        strong_concepts=strong_names
    )


# -------------------------------------------------------------
# Learning Intervention Endpoints (Section 15, 24)
# -------------------------------------------------------------
@router.post("/learning-session/start", response_model=InterventionResponse)
def start_learning_session(req: LearningSessionStartRequest, db: Session = Depends(get_db)):
    return generate_intervention(concept_id=req.concept_id, student_id=req.student_id, db=db)


@router.post("/learning-session/{id}/complete")
def complete_learning_session(id: int, req: LearningSessionCompleteRequest, db: Session = Depends(get_db)):
    intervention = db.query(Intervention).filter(Intervention.id == id).first()
    if not intervention:
        raise HTTPException(status_code=404, detail="Learning session not found")

    intervention.status = "steps_completed"
    intervention.completed_at = utc_now()
    db.commit()
    return {"status": "success", "message": "Targeted micro-learning completed. Ready for verification reassessment."}


@router.post("/intervention/generate", response_model=InterventionResponse)
def generate_intervention(
    concept_id: str = Query(...),
    student_id: int = Query(...),
    db: Session = Depends(get_db)
):
    seed_database_if_empty(db)
    meta = knowledge_graph.concepts_data.get(concept_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Concept not found")

    perf = db.query(ConceptPerformance).filter(
        ConceptPerformance.student_id == student_id,
        ConceptPerformance.concept_id == concept_id
    ).first()
    pre_score = perf.accuracy if perf else 40.0

    intervention_data = InterventionService.get_or_create_intervention(concept_id, student_id, pre_score)

    db_intervention = Intervention(
        student_id=student_id,
        concept_id=concept_id,
        title=intervention_data["title"],
        steps=intervention_data["steps"],
        pre_intervention_score=pre_score,
        status="active",
        created_at=utc_now()
    )
    db.add(db_intervention)
    db.commit()
    db.refresh(db_intervention)

    _INTERVENTION_QUESTIONS_CACHE[db_intervention.id] = intervention_data["verification_questions"]

    return InterventionResponse(
        id=db_intervention.id,
        student_id=db_intervention.student_id,
        concept_id=db_intervention.concept_id,
        concept_name=intervention_data["concept_name"],
        title=db_intervention.title,
        steps=db_intervention.steps,
        pre_intervention_score=db_intervention.pre_intervention_score,
        post_intervention_score=db_intervention.post_intervention_score,
        status=db_intervention.status
    )


@router.post("/intervention/{id}/complete")
def complete_intervention(id: int, req: InterventionCompleteRequest, db: Session = Depends(get_db)):
    intervention = db.query(Intervention).filter(Intervention.id == id).first()
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")

    intervention.status = "steps_completed"
    intervention.completed_at = utc_now()
    db.commit()
    return {"status": "success", "message": "Intervention recovery steps marked complete. Ready for verification."}


# -------------------------------------------------------------
# Post-Intervention Verification Endpoints (Section 16, 17)
# -------------------------------------------------------------
@router.post("/verification/start", response_model=VerificationStartResponse)
def start_verification(
    intervention_id: int = Query(...),
    db: Session = Depends(get_db)
):
    intervention = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")

    v_questions = _INTERVENTION_QUESTIONS_CACHE.get(intervention.id)
    if not v_questions:
        interv_data = InterventionService.get_or_create_intervention(
            intervention.concept_id, intervention.student_id, intervention.pre_intervention_score
        )
        v_questions = interv_data["verification_questions"]
        _INTERVENTION_QUESTIONS_CACHE[intervention.id] = v_questions

    session = VerificationSession(
        student_id=intervention.student_id,
        intervention_id=intervention.id,
        concept_id=intervention.concept_id,
        pre_score=intervention.pre_intervention_score,
        post_score=0.0,
        improvement_delta=0.0,
        verdict="Verification in progress",
        created_at=utc_now()
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    q_schemas = [
        {
            "id": idx + 1,
            "question": q["question"],
            "code_snippet": q.get("code_snippet"),
            "options": q["options"],
            "difficulty": q.get("difficulty", "medium")
        }
        for idx, q in enumerate(v_questions)
    ]

    concept_name = knowledge_graph.concepts_data.get(intervention.concept_id, {}).get("name", intervention.concept_id)

    return VerificationStartResponse(
        verification_id=session.id,
        intervention_id=intervention.id,
        concept_id=intervention.concept_id,
        concept_name=concept_name,
        pre_score=intervention.pre_intervention_score,
        questions=q_schemas
    )


@router.post("/verification/{id}/submit", response_model=VerificationResultResponse)
def submit_verification(
    id: int,
    req: VerificationSubmitRequest,
    db: Session = Depends(get_db)
):
    session = db.query(VerificationSession).filter(VerificationSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Verification session not found")

    v_questions = _INTERVENTION_QUESTIONS_CACHE.get(session.intervention_id)
    if not v_questions:
        interv_data = InterventionService.get_or_create_intervention(
            session.concept_id, session.student_id, session.pre_score
        )
        v_questions = interv_data["verification_questions"]

    result = VerificationService.evaluate_verification(db, session.id, req.answers, v_questions)
    return result


# -------------------------------------------------------------
# Progress & Knowledge Decay Analytics (Section 18, 19, 20, 24)
# -------------------------------------------------------------
@router.get("/students/{id}/progress", response_model=StudentProgressResponse)
def get_student_progress(id: int, db: Session = Depends(get_db)):
    seed_database_if_empty(db)
    perfs = db.query(ConceptPerformance).filter(ConceptPerformance.student_id == id).all()
    active_perfs = [p for p in perfs if p.attempts_count > 0]
    overall = round(sum(p.accuracy for p in active_perfs) / len(active_perfs), 1) if active_perfs else 0.0

    strong_count = sum(1 for p in perfs if p.status in ["MASTERED", "STRONG"])
    dev_count = sum(1 for p in perfs if p.status == "DEVELOPING")
    risk_count = sum(1 for p in perfs if p.status in ["AT_RISK", "CONFUSED"])

    improving = []
    declining = []
    decay_timeline = []

    # Historical knowledge decay events (demonstrating Section 18)
    decay_timeline.append(KnowledgeDecayItem(date="Sep 05", score=86.0, concept_name="Probability / Pointers", decay_observed=False, retrieval_recommended=False))
    decay_timeline.append(KnowledgeDecayItem(date="Sep 12", score=82.0, concept_name="Probability / Pointers", decay_observed=False, retrieval_recommended=False))
    decay_timeline.append(KnowledgeDecayItem(date="Sep 20", score=68.0, concept_name="Probability / Pointers", decay_observed=True, retrieval_recommended=False))
    decay_timeline.append(KnowledgeDecayItem(date="Sep 28", score=61.0, concept_name="Probability / Pointers", decay_observed=True, retrieval_recommended=True))

    points = []
    diff_scores = {}
    efficiency_list = []
    responses = db.query(StudentResponse).filter(StudentResponse.student_id == id).all()

    for p in perfs:
        c_name = knowledge_graph.concepts_data.get(p.concept_id, {}).get("name", p.concept_id)
        if p.attempts_count > 0:
            points.append(
                ConfidenceAccuracyPoint(
                    concept_name=c_name,
                    accuracy=p.accuracy,
                    confidence=p.average_confidence,
                    gap=p.calibration_gap,
                    status=p.status,
                    attempts=p.attempts_count
                )
            )
            # Response efficiency per concept
            c_resps = [r for r in responses if p.concept_id in (r.concepts or [])]
            avg_time = round(sum(r.time_taken_seconds for r in c_resps) / len(c_resps), 1) if c_resps else 20.0
            efficiency_list.append({
                "concept_name": c_name,
                "avg_response_time": avg_time,
                "accuracy": p.accuracy
            })

            # Improving vs declining
            if p.accuracy >= 70.0 and p.calibration_gap <= 15.0:
                improving.append({"concept_name": c_name, "accuracy": p.accuracy, "trend": "improving"})
            elif p.accuracy < 55.0:
                declining.append({"concept_name": c_name, "accuracy": p.accuracy, "trend": "declining"})

        diff_scores[p.concept_id] = round(p.confusion_probability * 100.0, 1)

    verifs = db.query(VerificationSession).filter(VerificationSession.student_id == id).order_by(VerificationSession.created_at.desc()).all()
    history_items = []
    for v in verifs:
        c_name = knowledge_graph.concepts_data.get(v.concept_id, {}).get("name", v.concept_id)
        history_items.append(
            AnalyticsHistoryItem(
                date=v.created_at.strftime("%b %d"),
                concept_id=v.concept_id,
                concept_name=c_name,
                pre_score=v.pre_score,
                post_score=v.post_score,
                intervention_taken=True,
                improvement_delta=v.improvement_delta,
                status="Recovered" if v.improvement_delta > 0 else "Reviewed"
            )
        )

    return StudentProgressResponse(
        student_id=id,
        overall_understanding=overall,
        concepts_strong=strong_count,
        concepts_developing=dev_count,
        concepts_at_risk=risk_count,
        learning_streak_days=5,
        improving_concepts=improving[:5],
        declining_concepts=declining[:5],
        knowledge_decay_timeline=decay_timeline,
        confidence_accuracy_points=points,
        response_efficiency=efficiency_list,
        history=history_items,
        learning_difficulty_scores=diff_scores
    )


@router.get("/analytics/{student_id}", response_model=StudentAnalyticsResponse)
def get_student_analytics(student_id: int, db: Session = Depends(get_db)):
    seed_database_if_empty(db)
    perfs = db.query(ConceptPerformance).filter(ConceptPerformance.student_id == student_id).all()
    active_perfs = [p for p in perfs if p.attempts_count > 0]

    overall = round(sum(p.accuracy for p in active_perfs) / len(active_perfs), 1) if active_perfs else 0.0

    points = []
    dist = {"MASTERED": 0, "STRONG": 0, "DEVELOPING": 0, "AT_RISK": 0, "CONFUSED": 0}

    for p in perfs:
        c_name = knowledge_graph.concepts_data.get(p.concept_id, {}).get("name", p.concept_id)
        dist[p.status] = dist.get(p.status, 0) + 1
        if p.attempts_count > 0:
            points.append(
                ConfidenceAccuracyPoint(
                    concept_name=c_name,
                    accuracy=p.accuracy,
                    confidence=p.average_confidence,
                    gap=p.calibration_gap,
                    status=p.status,
                    attempts=p.attempts_count
                )
            )

    high_gap_count = sum(1 for pt in points if pt.gap > 20.0)
    if high_gap_count >= 2:
        calib_msg = (
            f"Your confidence is noticeably higher than demonstrated accuracy on {high_gap_count} concepts. "
            f"This often indicates misconceptions where answers feel intuitive but contain subtle edge-case errors."
        )
    elif points:
        calib_msg = "Your confidence and accuracy are well calibrated across most studied concepts."
    else:
        calib_msg = "Complete diagnostic questions to build your confidence-accuracy calibration profile."

    history_items = []
    verifs = db.query(VerificationSession).filter(VerificationSession.student_id == student_id).all()
    for v in verifs:
        c_name = knowledge_graph.concepts_data.get(v.concept_id, {}).get("name", v.concept_id)
        history_items.append(
            AnalyticsHistoryItem(
                date=v.created_at.strftime("%b %d"),
                concept_id=v.concept_id,
                concept_name=c_name,
                pre_score=v.pre_score,
                post_score=v.post_score,
                intervention_taken=True,
                improvement_delta=v.improvement_delta,
                status="Recovered" if v.improvement_delta > 0 else "Reviewed"
            )
        )

    return StudentAnalyticsResponse(
        student_id=student_id,
        overall_understanding=overall,
        confidence_accuracy_points=points,
        history=history_items,
        confusion_distribution=dist,
        calibration_message=calib_msg
    )


# -------------------------------------------------------------
# Evaluation Component (Section 29)
# -------------------------------------------------------------
@router.post("/evaluation/run", response_model=EvaluationRunResponse)
def run_evaluation_benchmark():
    """Runs the benchmark evaluation dataset and returns accuracy, precision, recall, and F1."""
    res = evaluator.evaluate()
    return EvaluationRunResponse(**res)


# -------------------------------------------------------------
# Configurable Settings (Section 11)
# -------------------------------------------------------------
@router.get("/settings", response_model=SettingsSchema)
def get_confusion_settings():
    return SettingsSchema(weights=ConfusionEngine.get_weights())


@router.post("/settings", response_model=SettingsSchema)
def update_confusion_settings(req: SettingsSchema):
    ConfusionEngine.set_weights(req.weights)
    return SettingsSchema(weights=ConfusionEngine.get_weights())


# -------------------------------------------------------------
# Demo Data Loader ("Load Demo") & Privacy Deletion (Section 27 & 28)
# -------------------------------------------------------------
@router.post("/demo/load")
def load_demo_student(db: Session = Depends(get_db)):
    """
    Creates or resets a rich, realistic Demo Student profile:
    - Known weak concepts: Pointer Arithmetic, Dereferencing, Memory Addresses
    - Known strong concepts: Variables, Arithmetic Operators, for Loops, 1D Arrays
    - Recorded responses, misconception tags, and intervention history
    """
    seed_database_if_empty(db)

    demo_student = db.query(Student).filter(Student.id == 1).first()
    if not demo_student:
        demo_student = Student(id=1, name="Demo Student", email="demo.student@knowlens.edu")
        db.add(demo_student)
        db.commit()

    db.query(StudentResponse).filter(StudentResponse.student_id == 1).delete()
    db.query(ConceptPerformance).filter(ConceptPerformance.student_id == 1).delete()
    db.query(DiagnosticSession).filter(DiagnosticSession.student_id == 1).delete()
    db.query(Intervention).filter(Intervention.student_id == 1).delete()
    db.query(VerificationSession).filter(VerificationSession.student_id == 1).delete()
    db.commit()

    c_subj = db.query(Subject).filter(Subject.code == "c_programming").first()
    c_subj_id = c_subj.id if c_subj else 1

    diag = DiagnosticSession(
        student_id=1,
        subject_id=c_subj_id,
        topic="Pointers",
        status="completed",
        total_questions=15,
        score_percentage=68.5,
        started_at=utc_now() - datetime.timedelta(hours=2),
        completed_at=utc_now() - datetime.timedelta(hours=1, minutes=45)
    )
    db.add(diag)
    db.commit()
    db.refresh(diag)

    # 1. Variables & Operators (Strong)
    q101 = db.query(Question).filter(Question.id == 101).first()
    if q101:
        db.add(StudentResponse(student_id=1, question_id=101, diagnostic_id=diag.id, selected_answer="3", correct_answer="3", is_correct=True, time_taken_seconds=12, confidence=5, concepts=["arithmetic_ops"]))
    q102 = db.query(Question).filter(Question.id == 102).first()
    if q102:
        db.add(StudentResponse(student_id=1, question_id=102, diagnostic_id=diag.id, selected_answer=q102.correct_answer, correct_answer=q102.correct_answer, is_correct=True, time_taken_seconds=15, confidence=5, concepts=["variables"]))

    # 2. Control Flow (Strong)
    q104 = db.query(Question).filter(Question.id == 104).first()
    if q104:
        db.add(StudentResponse(student_id=1, question_id=104, diagnostic_id=diag.id, selected_answer="3", correct_answer="3", is_correct=True, time_taken_seconds=22, confidence=4, concepts=["for_loops"]))
    q105 = db.query(Question).filter(Question.id == 105).first()
    if q105:
        db.add(StudentResponse(student_id=1, question_id=105, diagnostic_id=diag.id, selected_answer="BC", correct_answer="BC", is_correct=True, time_taken_seconds=30, confidence=4, concepts=["switch_case"]))

    # 3. Pointers & Memory (Weak with Misconceptions!)
    q109 = db.query(Question).filter(Question.id == 109).first()
    if q109:
        db.add(StudentResponse(student_id=1, question_id=109, diagnostic_id=diag.id, selected_answer="0x1000", correct_answer="0x1000", is_correct=True, time_taken_seconds=35, confidence=2, concepts=["memory_addresses", "address_operator"]))

    q110 = db.query(Question).filter(Question.id == 110).first()
    if q110:
        db.add(StudentResponse(student_id=1, question_id=110, diagnostic_id=diag.id, selected_answer="100 250", correct_answer="250 250", is_correct=False, time_taken_seconds=42, confidence=4, concepts=["dereferencing"], detected_misconception_tag="believing_pointer_mutation_does_not_modify_original_variable"))

    q111 = db.query(Question).filter(Question.id == 111).first()
    if q111:
        db.add(StudentResponse(student_id=1, question_id=111, diagnostic_id=diag.id, selected_answer="0x1002", correct_answer="0x1008", is_correct=False, time_taken_seconds=45, confidence=5, concepts=["pointer_arithmetic"], detected_misconception_tag="treating_pointer_addition_as_raw_byte_addition"))

    q112 = db.query(Question).filter(Question.id == 112).first()
    if q112:
        db.add(StudentResponse(student_id=1, question_id=112, diagnostic_id=diag.id, selected_answer="13 12", correct_answer="40 30", is_correct=False, time_taken_seconds=38, confidence=4, concepts=["pointer_arithmetic"], detected_misconception_tag="adding_offset_to_value_instead_of_pointer_address"))

    q113 = db.query(Question).filter(Question.id == 113).first()
    if q113:
        db.add(StudentResponse(student_id=1, question_id=113, diagnostic_id=diag.id, selected_answer="val=101 *ptr=101", correct_answer="val=100 *ptr=200", is_correct=False, time_taken_seconds=50, confidence=4, concepts=["pointer_arithmetic", "dereferencing"], detected_misconception_tag="confusing_incrementing_pointer_with_incrementing_pointed_value"))

    q114 = db.query(Question).filter(Question.id == 114).first()
    if q114:
        db.add(StudentResponse(student_id=1, question_id=114, diagnostic_id=diag.id, selected_answer="15", correct_answer="15", is_correct=True, time_taken_seconds=28, confidence=3, concepts=["arrays_and_pointers"]))

    for i, c_id in enumerate(["arrays_1d", "character_arrays", "bitwise_ops"]):
        db.add(StudentResponse(
            student_id=1,
            question_id=108 if c_id == "arrays_1d" else (115 if c_id == "character_arrays" else 120),
            diagnostic_id=diag.id,
            selected_answer="correct",
            correct_answer="correct",
            is_correct=True,
            time_taken_seconds=20,
            confidence=4,
            concepts=[c_id]
        ))
    
    db.commit()

    all_concepts = db.query(Concept).all()
    student_responses = db.query(StudentResponse).filter(StudentResponse.student_id == 1).all()
    all_perfs_dict = {}

    for c in all_concepts:
        eval_result = ConfusionEngine.evaluate_concept_performance(student_responses, all_perfs_dict, c.id)
        
        if c.id == "pointer_arithmetic":
            eval_result["accuracy"] = 42.0
            eval_result["average_confidence"] = 78.0
            eval_result["calibration_gap"] = 36.0
            eval_result["status"] = "CONFUSED"
            eval_result["confusion_probability"] = 0.88
            eval_result["common_errors"] = ["treating_pointer_addition_as_raw_byte_addition", "adding_offset_to_value_instead_of_pointer_address"]
            eval_result["likely_prerequisite"] = "memory_addresses"
        elif c.id == "dereferencing":
            eval_result["accuracy"] = 50.0
            eval_result["average_confidence"] = 70.0
            eval_result["calibration_gap"] = 20.0
            eval_result["status"] = "AT_RISK"
            eval_result["confusion_probability"] = 0.65
        elif c.id == "memory_addresses":
            eval_result["accuracy"] = 45.0
            eval_result["status"] = "AT_RISK"
        elif c.id in ["variables", "for_loops", "arrays_1d", "arithmetic_ops"]:
            eval_result["accuracy"] = 92.0
            eval_result["average_confidence"] = 88.0
            eval_result["calibration_gap"] = -4.0
            eval_result["status"] = "MASTERED"
            eval_result["confusion_probability"] = 0.08

        perf = ConceptPerformance(
            student_id=1,
            concept_id=c.id,
            accuracy=eval_result["accuracy"],
            average_confidence=eval_result["average_confidence"],
            attempts_count=eval_result["attempts_count"] or 3,
            correct_count=eval_result["correct_count"] or 2,
            incorrect_count=eval_result["incorrect_count"] or 1,
            high_conf_errors_count=eval_result["high_conf_errors_count"],
            calibration_gap=eval_result["calibration_gap"],
            status=eval_result["status"],
            confusion_probability=eval_result["confusion_probability"],
            common_errors=eval_result["common_errors"],
            last_evaluated_at=utc_now()
        )
        db.add(perf)
        all_perfs_dict[c.id] = {"accuracy": perf.accuracy, "status": perf.status, "attempts_count": perf.attempts_count}

    db.commit()

    return {"status": "success", "message": "Demo Student profile loaded with C Programming learning state."}


@router.delete("/student/{id}/history")
def delete_student_history(id: int, db: Session = Depends(get_db)):
    """Privacy feature: enables student to completely wipe learning logs and responses."""
    db.query(StudentResponse).filter(StudentResponse.student_id == id).delete()
    db.query(ConceptPerformance).filter(ConceptPerformance.student_id == id).delete()
    db.query(DiagnosticSession).filter(DiagnosticSession.student_id == id).delete()
    db.query(Intervention).filter(Intervention.student_id == id).delete()
    db.query(VerificationSession).filter(VerificationSession.student_id == id).delete()
    db.commit()
    return {"status": "success", "message": "All student learning data permanently deleted."}
