from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
import datetime
from backend.models.models import VerificationSession, Intervention, ConceptPerformance, StudentResponse
from backend.schemas.schemas import VerificationAnswerSubmission, VerificationResultResponse
from backend.knowledge_graph.graph import knowledge_graph

class VerificationService:
    """
    Evaluates post-intervention student performance,
    computes before vs. after improvement delta, and constructs scientifically neutral verdicts.
    """

    @classmethod
    def evaluate_verification(
        cls,
        db: Session,
        verification_id: int,
        answers: List[VerificationAnswerSubmission],
        verification_questions: List[Dict[str, Any]]
    ) -> VerificationResultResponse:
        session = db.query(VerificationSession).filter(VerificationSession.id == verification_id).first()
        if not session:
            raise ValueError("Verification session not found.")

        total_questions = len(verification_questions)
        correct_count = 0

        # Map questions
        q_map = {idx + 1: q for idx, q in enumerate(verification_questions)}

        for ans in answers:
            q_data = q_map.get(ans.question_id)
            if q_data and ans.selected_answer.strip() == q_data["correct_answer"].strip():
                correct_count += 1

        post_score = round((correct_count / total_questions) * 100.0, 1) if total_questions > 0 else 0.0
        delta = round(post_score - session.pre_score, 1)

        # Formulate neutral, evidence-grounded verdict
        concept_name = knowledge_graph.concepts_data.get(session.concept_id, {}).get("name", session.concept_id)
        if delta > 0:
            verdict = (
                f"Evidence indicates performance improved after the intervention. "
                f"Accuracy increased by +{delta} percentage points (from {session.pre_score}% to {post_score}%)."
            )
            updated_status = "STRONG" if post_score >= 70.0 else "DEVELOPING"
        elif delta == 0:
            verdict = (
                f"Performance on {concept_name} remained stable at {post_score}%. "
                f"Additional practice on foundational examples is recommended."
            )
            updated_status = "DEVELOPING"
        else:
            verdict = (
                f"Post-assessment score was {post_score}% compared to pre-assessment {session.pre_score}%. "
                f"Underlying prerequisite concepts should be reviewed."
            )
            updated_status = "AT_RISK"

        # Update verification session
        session.post_score = post_score
        session.improvement_delta = delta
        session.questions_attempted = total_questions
        session.questions_correct = correct_count
        session.verdict = verdict
        
        # Update intervention
        intervention = db.query(Intervention).filter(Intervention.id == session.intervention_id).first()
        if intervention:
            intervention.post_intervention_score = post_score
            intervention.status = "completed"
            intervention.completed_at = datetime.datetime.utcnow()

        # Update ConceptPerformance
        perf = db.query(ConceptPerformance).filter(
            ConceptPerformance.student_id == session.student_id,
            ConceptPerformance.concept_id == session.concept_id
        ).first()

        if perf:
            # Weighted average of new verification performance
            perf.accuracy = round((perf.accuracy * 0.4) + (post_score * 0.6), 1)
            perf.status = updated_status
            perf.attempts_count += total_questions
            perf.correct_count += correct_count
            perf.incorrect_count += (total_questions - correct_count)
            perf.last_evaluated_at = datetime.datetime.utcnow()

        db.commit()

        return VerificationResultResponse(
            verification_id=session.id,
            concept_id=session.concept_id,
            concept_name=concept_name,
            pre_score=session.pre_score,
            post_score=post_score,
            improvement_delta=delta,
            questions_attempted=total_questions,
            questions_correct=correct_count,
            verdict=verdict,
            updated_status=updated_status
        )
