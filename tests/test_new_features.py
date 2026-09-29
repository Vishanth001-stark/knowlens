import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_list_subjects():
    response = client.get("/api/subjects")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 7
    codes = [s["code"] for s in data]
    assert "c_programming" in codes
    assert "python" in codes
    assert "mathematics" in codes
    assert "data_structures" in codes
    assert "computer_networks" in codes
    assert "operating_systems" in codes
    assert "database_systems" in codes


def test_list_subject_topics():
    subj_resp = client.get("/api/subjects")
    assert subj_resp.status_code == 200
    subjs = subj_resp.json()
    c_subj = next(s for s in subjs if s["code"] == "c_programming")
    
    topics_resp = client.get(f"/api/subjects/{c_subj['id']}/topics")
    assert topics_resp.status_code == 200
    topics = topics_resp.json()
    assert len(topics) > 0


def test_create_student():
    response = client.post("/api/students", json={"name": "Alice Tester", "email": "alice@test.edu"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Alice Tester"
    assert "id" in data


def test_adaptive_diagnostic_start():
    # Start diagnostic for Python with topic
    response = client.post("/api/diagnostic/start", json={
        "student_id": 999,
        "subject_code": "python",
        "topic": "Memory Model",
        "question_count": 5
    })
    assert response.status_code == 200
    data = response.json()
    assert "questions" in data
    assert len(data["questions"]) > 0


def test_standalone_question_answer():
    # Get a question ID
    diag_resp = client.post("/api/diagnostic/start", json={
        "student_id": 999,
        "subject_code": "c_programming",
        "question_count": 5
    })
    q_id = diag_resp.json()["questions"][0]["id"]

    ans_resp = client.post(f"/api/questions/{q_id}/answer", json={
        "student_id": 999,
        "selected_answer": "test",
        "confidence": 4,
        "time_taken_seconds": 18.5,
        "hints_used": 1
    })
    assert ans_resp.status_code == 200
    data = ans_resp.json()
    assert "is_correct" in data
    assert "concept_id" in data


def test_student_analysis_and_weak_concepts():
    # Load demo student first
    client.post("/api/demo/load")
    
    weak_resp = client.get("/api/students/1/weak-concepts")
    assert weak_resp.status_code == 200
    weak_data = weak_resp.json()
    assert "weak_concepts" in weak_data
    assert weak_data["detected_root_concept"] is not None

    analysis_resp = client.get("/api/students/1/analysis")
    assert analysis_resp.status_code == 200
    analysis = analysis_resp.json()
    assert "learning_difficulty_score" in analysis
    assert len(analysis["evidence"]) > 0


def test_learning_session_flow():
    client.post("/api/demo/load")
    # Start micro-learning session for memory_addresses
    start_resp = client.post("/api/learning-session/start", json={
        "student_id": 1,
        "concept_id": "memory_addresses"
    })
    assert start_resp.status_code == 200
    session_data = start_resp.json()
    session_id = session_data["id"]
    assert len(session_data["steps"]) == 5

    # Complete session
    comp_resp = client.post(f"/api/learning-session/{session_id}/complete", json={})
    assert comp_resp.status_code == 200


def test_student_progress_endpoint():
    client.post("/api/demo/load")
    resp = client.get("/api/students/1/progress")
    assert resp.status_code == 200
    data = resp.json()
    assert "learning_streak_days" in data
    assert "knowledge_decay_timeline" in data
    assert len(data["knowledge_decay_timeline"]) > 0


def test_evaluation_run_endpoint():
    resp = client.post("/api/evaluation/run")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_samples"] == 25
    assert data["classification_accuracy"] >= 80.0
    assert "misconception_detection" in data


def test_configurable_settings_endpoint():
    get_resp = client.get("/api/settings")
    assert get_resp.status_code == 200
    weights = get_resp.json()["weights"]
    assert "weight_incorrect" in weights

    # Update weights
    weights["weight_incorrect"] = 0.30
    post_resp = client.post("/api/settings", json={"weights": weights})
    assert post_resp.status_code == 200
    assert post_resp.json()["weights"]["weight_incorrect"] == 0.30
