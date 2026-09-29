import pytest
import os
import sys

# Ensure backend is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.knowledge_graph.graph import ConceptKnowledgeGraph
from backend.services.confusion_engine import ConfusionEngine
from backend.models.models import StudentResponse


def test_concept_knowledge_graph_structure():
    graph_engine = ConceptKnowledgeGraph()
    assert "pointer_arithmetic" in graph_engine.graph
    assert "memory_addresses" in graph_engine.graph
    assert "dereferencing" in graph_engine.graph

    prereqs = graph_engine.get_prerequisites("pointer_arithmetic")
    assert "dereferencing" in prereqs or "memory_addresses" in prereqs

    all_ancestors = graph_engine.get_all_prerequisites("pointer_arithmetic")
    assert "memory_addresses" in all_ancestors


def test_prerequisite_bottleneck_detection():
    graph_engine = ConceptKnowledgeGraph()
    mock_perfs = {
        "pointer_arithmetic": {"accuracy": 40.0, "status": "CONFUSED", "attempts_count": 5},
        "dereferencing": {"accuracy": 55.0, "status": "AT_RISK", "attempts_count": 4},
        "memory_addresses": {"accuracy": 30.0, "status": "CONFUSED", "attempts_count": 4},
    }
    bottleneck = graph_engine.analyze_prerequisite_bottleneck("pointer_arithmetic", mock_perfs)
    assert bottleneck is not None
    assert bottleneck["prerequisite_id"] in ["memory_addresses", "dereferencing"]
    assert "prerequisite_name" in bottleneck


def test_confidence_calibration_gap():
    # Overconfident: Accuracy 40%, Confidence 80% (gap = +40%)
    gap = ConfusionEngine.calculate_calibration_gap(accuracy=40.0, average_confidence=80.0)
    assert gap == 40.0

    # Underconfident: Accuracy 90%, Confidence 60% (gap = -30%)
    gap_under = ConfusionEngine.calculate_calibration_gap(accuracy=90.0, average_confidence=60.0)
    assert gap_under == -30.0


def test_evaluate_concept_performance_confusion_status():
    responses = [
        StudentResponse(
            student_id=1,
            question_id=111,
            selected_answer="0x1002",
            correct_answer="0x1008",
            is_correct=False,
            time_taken_seconds=30,
            confidence=5,  # High confidence error!
            concepts=["pointer_arithmetic"],
            detected_misconception_tag="treating_pointer_addition_as_raw_byte_addition"
        ),
        StudentResponse(
            student_id=1,
            question_id=112,
            selected_answer="13 12",
            correct_answer="40 30",
            is_correct=False,
            time_taken_seconds=25,
            confidence=4,  # High confidence error!
            concepts=["pointer_arithmetic"],
            detected_misconception_tag="treating_pointer_addition_as_raw_byte_addition"
        ),
        StudentResponse(
            student_id=1,
            question_id=113,
            selected_answer="val=100 *ptr=200",
            correct_answer="val=100 *ptr=200",
            is_correct=True,
            time_taken_seconds=20,
            confidence=3,
            concepts=["pointer_arithmetic"]
        )
    ]

    all_perfs = {
        "memory_addresses": {"accuracy": 35.0, "status": "CONFUSED", "attempts_count": 3}
    }

    eval_res = ConfusionEngine.evaluate_concept_performance(responses, all_perfs, "pointer_arithmetic")
    assert eval_res["attempts_count"] == 3
    assert eval_res["correct_count"] == 1
    assert eval_res["incorrect_count"] == 2
    assert eval_res["high_conf_errors_count"] == 2
    assert eval_res["status"] in ["CONFUSED", "AT_RISK"]
    assert "treating_pointer_addition_as_raw_byte_addition" in eval_res["common_errors"]


def test_evidence_panel_no_fabrication():
    responses = [
        StudentResponse(
            student_id=1,
            question_id=111,
            selected_answer="0x1002",
            correct_answer="0x1008",
            is_correct=False,
            time_taken_seconds=30,
            confidence=5,
            concepts=["pointer_arithmetic"],
            detected_misconception_tag="treating_pointer_addition_as_raw_byte_addition"
        )
    ]
    perf = {
        "concept_name": "Pointer Arithmetic",
        "accuracy": 0.0,
        "average_confidence": 100.0,
        "calibration_gap": 100.0,
        "high_conf_errors_count": 1,
        "status": "CONFUSED",
        "common_errors": ["treating_pointer_addition_as_raw_byte_addition"],
        "likely_prerequisite": "memory_addresses",
        "prerequisite_evidence": "Prerequisite gap detected"
    }
    panel = ConfusionEngine.generate_evidence_panel("pointer_arithmetic", perf, responses)
    assert len(panel["evidence_items"]) > 0
    assert any("treating pointer addition as raw byte addition" in item for item in panel["evidence_items"])
    assert any("High confidence" in item for item in panel["evidence_items"])
