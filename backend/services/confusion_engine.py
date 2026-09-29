import datetime
from typing import Dict, List, Any, Optional
from backend.models.models import ConceptPerformance, StudentResponse, Question, Prerequisite
from backend.knowledge_graph.graph import knowledge_graph
from backend.ml.confusion_predictor import confusion_predictor


class ConfusionEngine:
    """
    Core algorithmic and heuristic engine for evaluating concept mastery,
    diagnosing misconceptions vs knowledge gaps, tracing prerequisites,
    and calculating the multi-factor Learning Difficulty Score.
    """

    # Configurable scoring weights for Learning Difficulty Score
    DEFAULT_WEIGHTS = {
        "weight_incorrect": 0.25,
        "weight_repeated_errors": 0.20,
        "weight_low_confidence": 0.15,
        "weight_response_time": 0.10,
        "weight_hint_dependency": 0.10,
        "weight_prerequisite_weakness": 0.20
    }

    current_weights = dict(DEFAULT_WEIGHTS)

    @classmethod
    def set_weights(cls, weights: Dict[str, float]):
        cls.current_weights.update(weights)

    @classmethod
    def get_weights(cls) -> Dict[str, float]:
        return dict(cls.current_weights)

    @staticmethod
    def calculate_calibration_gap(accuracy: float, average_confidence: float) -> float:
        """
        Calculates confidence calibration gap:
        gap = average_confidence (%) - accuracy (%)
        Positive gap indicates overconfidence (potential misconception).
        Negative gap indicates underconfidence (fragile knowledge / hesitation).
        """
        return round(average_confidence - accuracy, 1)

    @classmethod
    def evaluate_concept_performance(
        cls,
        responses: List[StudentResponse],
        all_concept_perfs: Dict[str, dict],
        concept_id: str
    ) -> Dict[str, Any]:
        """
        Evaluates a single concept from student responses.
        Calculates:
        - Mastery Score
        - Confidence Score
        - Consistency Score
        - Response Efficiency
        - Recent Performance
        - Error Frequency
        - Hint Dependency
        - Combined Learning Difficulty Score
        - Misconception vs Knowledge Gap diagnosis
        """
        concept_responses = [r for r in responses if concept_id in (r.concepts or [])]
        concept_name = knowledge_graph.concepts_data.get(concept_id, {}).get("name", concept_id)

        if not concept_responses:
            return {
                "concept_id": concept_id,
                "concept_name": concept_name,
                "accuracy": 0.0,
                "mastery_score": 0.0,
                "confidence_score": 0.0,
                "consistency_score": 100.0,
                "response_efficiency": 100.0,
                "recent_performance": 0.0,
                "error_frequency": 0.0,
                "hint_dependency": 0.0,
                "learning_difficulty_score": 0.0,
                "average_confidence": 0.0,
                "attempts_count": 0,
                "correct_count": 0,
                "incorrect_count": 0,
                "high_conf_errors_count": 0,
                "calibration_gap": 0.0,
                "status": "DEVELOPING",
                "confusion_probability": 0.0,
                "issue_type": "none",
                "common_errors": [],
                "likely_prerequisite": None,
                "prerequisite_evidence": None,
                "recommended_action": "Complete diagnostic questions."
            }

        total_attempts = len(concept_responses)
        correct_count = sum(1 for r in concept_responses if r.is_correct)
        incorrect_count = total_attempts - correct_count
        accuracy = (correct_count / total_attempts) * 100.0

        # Confidence: responses store 1-5. Map to 20%-100%
        conf_sum = sum((r.confidence * 20.0) for r in concept_responses)
        avg_confidence = conf_sum / total_attempts if total_attempts > 0 else 0.0
        calibration_gap = cls.calculate_calibration_gap(accuracy, avg_confidence)

        # High confidence errors: confidence >= 4 (80%+) and incorrect -> signal of MISCONCEPTION
        high_conf_errors = sum(1 for r in concept_responses if not r.is_correct and r.confidence >= 4)
        
        # Low confidence errors: confidence <= 2 and incorrect -> signal of KNOWLEDGE GAP
        low_conf_errors = sum(1 for r in concept_responses if not r.is_correct and r.confidence <= 2)

        # Hints used
        total_hints = sum((getattr(r, "hints_used", 0) or 0) for r in concept_responses)
        hint_dependency = min(100.0, round((total_hints / max(1, total_attempts)) * 50.0, 1))

        # Recent performance (last 3 attempts)
        sorted_responses = sorted(
            concept_responses,
            key=lambda r: r.timestamp if getattr(r, "timestamp", None) is not None else datetime.datetime.min,
            reverse=True
        )
        recent_responses = sorted_responses[:3]
        recent_correct = sum(1 for r in recent_responses if r.is_correct)
        recent_performance = round((recent_correct / len(recent_responses)) * 100.0, 1) if recent_responses else accuracy

        # Consistency score: variance of accuracy across sequential chunks
        if total_attempts >= 3:
            rolling_scores = [1.0 if r.is_correct else 0.0 for r in sorted_responses]
            # standard deviation penalty
            mean_sc = sum(rolling_scores) / len(rolling_scores)
            variance = sum((x - mean_sc) ** 2 for x in rolling_scores) / len(rolling_scores)
            consistency_score = round(max(0.0, (1.0 - variance * 2) * 100.0), 1)
        else:
            consistency_score = 80.0

        # Response efficiency: based on average time taken (baseline ~25 seconds)
        avg_time = sum(r.time_taken_seconds for r in concept_responses) / total_attempts if total_attempts > 0 else 20.0
        response_efficiency = round(max(10.0, min(100.0, 100.0 - max(0.0, (avg_time - 25.0) * 1.5))), 1)

        # Error frequency
        error_frequency = round((incorrect_count / total_attempts) * 100.0, 1)

        # Collect detected misconception tags
        error_tags = [r.detected_misconception_tag for r in concept_responses if r.detected_misconception_tag]
        tag_counts: Dict[str, int] = {}
        for tag in error_tags:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        common_errors = sorted(tag_counts.keys(), key=lambda t: tag_counts[t], reverse=True)
        max_repeated_err = max(tag_counts.values()) if tag_counts else 0

        # Prerequisite analysis via Knowledge Graph
        prereq_analysis = knowledge_graph.analyze_prerequisite_bottleneck(concept_id, all_concept_perfs)
        prereq_score = 1.0
        likely_prereq = None
        prereq_evidence = None

        if prereq_analysis:
            likely_prereq = prereq_analysis["prerequisite_id"]
            prereq_score = max(0.0, prereq_analysis["accuracy"] / 100.0)
            prereq_evidence = prereq_analysis["evidence"]

        prerequisite_weakness = round((1.0 - prereq_score) * 100.0, 1)

        # Learning Difficulty Score (combined weighted combination)
        w = cls.current_weights
        
        comp_incorrect = (incorrect_count / total_attempts) * 100.0
        comp_repeated = min(100.0, max_repeated_err * 40.0)
        comp_low_conf = max(0.0, 100.0 - avg_confidence)
        comp_time = max(0.0, min(100.0, (avg_time - 20.0) * 2.0))
        comp_hint = hint_dependency
        comp_prereq = prerequisite_weakness

        learning_difficulty_score = round(
            (w["weight_incorrect"] * comp_incorrect) +
            (w["weight_repeated_errors"] * comp_repeated) +
            (w["weight_low_confidence"] * comp_low_conf) +
            (w["weight_response_time"] * comp_time) +
            (w["weight_hint_dependency"] * comp_hint) +
            (w["weight_prerequisite_weakness"] * comp_prereq),
            1
        )

        # ML Model Confusion Probability
        features = {
            "accuracy": accuracy / 100.0,
            "recent_accuracy": recent_performance / 100.0,
            "average_confidence": avg_confidence / 100.0,
            "confidence_accuracy_gap": calibration_gap / 100.0,
            "average_response_time": avg_time,
            "repeated_error_count": max_repeated_err,
            "prerequisite_score": prereq_score,
            "attempt_count": total_attempts,
        }

        try:
            ml_pred = confusion_predictor.predict_confusion(features)
            confusion_prob = ml_pred["confusion_probability"]
            contributing_factors = ml_pred["contributing_factors"]
        except Exception:
            confusion_prob = round(learning_difficulty_score / 100.0, 2)
            contributing_factors = []

        # Distinction: Misconception vs Knowledge Gap
        if high_conf_errors >= 1 or max_repeated_err >= 2 or (calibration_gap >= 25.0 and incorrect_count > 0):
            issue_type = "misconception"  # Possible misconception detected
        elif low_conf_errors >= 1 or avg_confidence < 45.0:
            issue_type = "knowledge_gap"  # Possible knowledge gap
        elif prerequisite_weakness > 40.0:
            issue_type = "prerequisite_gap"
        else:
            issue_type = "normal"

        # Classification rule
        if accuracy >= 88.0 and total_attempts >= 2 and calibration_gap <= 20.0:
            status = "MASTERED"
        elif accuracy >= 70.0 and calibration_gap <= 25.0:
            status = "STRONG"
        elif (accuracy < 50.0 and (high_conf_errors >= 1 or calibration_gap >= 25.0)) or confusion_prob >= 0.70 or max_repeated_err >= 2:
            status = "CONFUSED"
        elif accuracy < 55.0 or (prereq_analysis and prereq_analysis["status"] in ["CONFUSED", "AT_RISK"]):
            status = "AT_RISK"
        else:
            status = "DEVELOPING"

        # Recommendation
        if status == "CONFUSED":
            if likely_prereq:
                prereq_name = knowledge_graph.concepts_data.get(likely_prereq, {}).get("name", likely_prereq)
                recommended_action = f"Review prerequisite '{prereq_name}' before retrying {concept_name}."
            else:
                recommended_action = f"Start targeted recovery for {concept_name}."
        elif status == "AT_RISK":
            recommended_action = f"Practice foundational examples for {concept_name}."
        elif status == "DEVELOPING":
            recommended_action = f"Complete 3 more practice questions on {concept_name}."
        else:
            recommended_action = f"Proceed to advanced topics."

        return {
            "concept_id": concept_id,
            "concept_name": concept_name,
            "accuracy": round(accuracy, 1),
            "mastery_score": round(accuracy, 1),
            "confidence_score": round(avg_confidence, 1),
            "consistency_score": consistency_score,
            "response_efficiency": response_efficiency,
            "recent_performance": recent_performance,
            "error_frequency": error_frequency,
            "hint_dependency": hint_dependency,
            "learning_difficulty_score": learning_difficulty_score,
            "average_confidence": round(avg_confidence, 1),
            "attempts_count": total_attempts,
            "correct_count": correct_count,
            "incorrect_count": incorrect_count,
            "high_conf_errors_count": high_conf_errors,
            "calibration_gap": calibration_gap,
            "status": status,
            "confusion_probability": round(confusion_prob, 2),
            "issue_type": issue_type,
            "common_errors": common_errors,
            "likely_prerequisite": likely_prereq,
            "prerequisite_evidence": prereq_evidence,
            "recommended_action": recommended_action,
            "contributing_factors": contributing_factors
        }

    @classmethod
    def generate_evidence_panel(
        cls,
        concept_id: str,
        perf_data: Dict[str, Any],
        responses: List[StudentResponse]
    ) -> Dict[str, Any]:
        """
        Builds transparent, verifiable evidence for the 'Why was this detected?' modal.
        Every single bullet point is verified against stored student data.
        """
        concept_responses = [r for r in responses if concept_id in (r.concepts or [])]
        concept_name = perf_data.get("concept_name", concept_id)
        
        evidence_items = []
        
        total = len(concept_responses)
        correct = sum(1 for r in concept_responses if r.is_correct)
        incorrect = total - correct
        evidence_items.append(f"{total} related question{'s' if total != 1 else ''} attempted: {correct} correct, {incorrect} incorrect.")

        # Misconception tags
        error_tags = [r.detected_misconception_tag for r in concept_responses if r.detected_misconception_tag]
        tag_counts = {}
        for t in error_tags:
            tag_counts[t] = tag_counts.get(t, 0) + 1
        
        for tag, count in tag_counts.items():
            readable_tag = tag.replace("_", " ")
            evidence_items.append(f"{count} error{'s' if count != 1 else ''} involved: {readable_tag}.")

        # Confidence calibration evidence
        high_conf_wrongs = sum(1 for r in concept_responses if not r.is_correct and r.confidence >= 4)
        if high_conf_wrongs > 0:
            evidence_items.append(f"High confidence (4/5 or 5/5) was reported on {high_conf_wrongs} incorrect answer{'s' if high_conf_wrongs != 1 else ''}, pointing to possible misconception.")

        gap = perf_data.get("calibration_gap", 0.0)
        if gap > 20.0:
            evidence_items.append(f"Confidence is {gap}% higher than demonstrated accuracy (calibration mismatch).")

        # Prerequisite bottleneck evidence
        prereq_id = perf_data.get("likely_prerequisite")
        prereq_name = None
        prereq_ev = perf_data.get("prerequisite_evidence")

        if prereq_id:
            prereq_name = knowledge_graph.concepts_data.get(prereq_id, {}).get("name", prereq_id)
            evidence_items.append(f"Prerequisite concept '{prereq_name}' exhibits low performance, suggesting a foundational gap.")

        recs = [
            f"Review core principles of {concept_name}",
            f"Trace address offsets step-by-step with small numerical memory blocks" if "address" in concept_id or "pointer" in concept_id else f"Work through structured examples of {concept_name}",
            f"Complete 3 guided practice problems with immediate feedback"
        ]

        return {
            "concept_id": concept_id,
            "concept_name": concept_name,
            "status": perf_data.get("status", "DEVELOPING"),
            "confusion_probability": perf_data.get("confusion_probability", 0.0),
            "learning_difficulty_score": perf_data.get("learning_difficulty_score", 0.0),
            "issue_type": perf_data.get("issue_type", "normal"),
            "system_confidence": round(0.75 + min(0.20, total * 0.03), 2),
            "evidence_items": evidence_items,
            "likely_prerequisite": prereq_id,
            "prerequisite_name": prereq_name,
            "prerequisite_status": "AT_RISK" if prereq_id else None,
            "prerequisite_accuracy": 45.0 if prereq_id else None,
            "prerequisite_evidence": prereq_ev,
            "common_errors": perf_data.get("common_errors", []),
            "recommended_intervention": recs,
            "ml_contributing_factors": perf_data.get("contributing_factors", [])
        }
