import pytest
from fastapi.testclient import TestClient
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app

client = TestClient(app)

def test_root_endpoint():
    # When frontend/dist exists, / serves the SPA index.html, while /api/health returns JSON
    resp_spa = client.get("/")
    assert resp_spa.status_code == 200
    
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "KnowLens"
    assert data["status"] == "online"


def test_load_demo_student():
    response = client.post("/api/demo/load")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"


def test_get_student_profile():
    # Load demo first
    client.post("/api/demo/load")
    
    response = client.get("/api/student/1/profile")
    assert response.status_code == 200
    profile = response.json()
    assert profile["student_id"] == 1
    assert "overall_understanding" in profile
    assert profile["concepts_confused"] >= 1
    assert len(profile["weak_concepts"]) > 0


def test_concept_graph_endpoint():
    response = client.get("/api/concepts?student_id=1")
    assert response.status_code == 200
    graph = response.json()
    assert "nodes" in graph
    assert "edges" in graph
    assert len(graph["nodes"]) >= 20
    assert any(n["id"] == "pointer_arithmetic" for n in graph["nodes"])


def test_evidence_diagnosis_endpoint():
    # Check diagnosis for pointer_arithmetic
    client.post("/api/demo/load")
    response = client.get("/api/concepts/pointer_arithmetic/diagnosis?student_id=1")
    assert response.status_code == 200
    diag = response.json()
    assert diag["concept_id"] == "pointer_arithmetic"
    assert diag["status"] in ["CONFUSED", "AT_RISK"]
    assert len(diag["evidence_items"]) > 0
    assert len(diag["ml_contributing_factors"]) > 0


def test_full_diagnostic_flow():
    # 1. Start diagnostic
    start_res = client.post("/api/diagnostic/start", json={"student_id": 2, "subject_code": "c_programming", "question_count": 5})
    assert start_res.status_code == 200
    session_data = start_res.json()
    session_id = session_data["id"]
    assert len(session_data["questions"]) == 5

    # 2. Answer questions
    for q in session_data["questions"]:
        ans_res = client.post(
            f"/api/diagnostic/{session_id}/answer?question_id={q['id']}",
            json={
                "student_id": 2,
                "selected_answer": q["options"][0],
                "confidence": 4,
                "time_taken_seconds": 15
            }
        )
        assert ans_res.status_code == 200

    # 3. Complete diagnostic
    comp_res = client.post(f"/api/diagnostic/{session_id}/complete")
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["total_answered"] == 5


def test_intervention_and_verification_flow():
    # 1. Generate intervention
    gen_res = client.post("/api/intervention/generate?concept_id=pointer_arithmetic&student_id=1")
    assert gen_res.status_code == 200
    interv = gen_res.json()
    interv_id = interv["id"]
    assert len(interv["steps"]) == 5

    # 2. Complete intervention steps
    comp_interv = client.post(f"/api/intervention/{interv_id}/complete", json={"completed_steps": [0, 1, 2, 3, 4]})
    assert comp_interv.status_code == 200

    # 3. Start verification
    v_start_res = client.post(f"/api/verification/start?intervention_id={interv_id}")
    assert v_start_res.status_code == 200
    v_data = v_start_res.json()
    v_id = v_data["verification_id"]
    assert len(v_data["questions"]) == 3

    # 4. Submit verification answers
    answers = [
        {"question_id": q["id"], "selected_answer": q["options"][0]}
        for q in v_data["questions"]
    ]
    v_sub_res = client.post(f"/api/verification/{v_id}/submit", json={"answers": answers})
    assert v_sub_res.status_code == 200
    v_result = v_sub_res.json()
    assert "post_score" in v_result
    assert "improvement_delta" in v_result
    assert "verdict" in v_result


def test_analytics_endpoint():
    response = client.get("/api/analytics/1")
    assert response.status_code == 200
    analytics = response.json()
    assert "confidence_accuracy_points" in analytics
    assert "confusion_distribution" in analytics
    assert "calibration_message" in analytics
