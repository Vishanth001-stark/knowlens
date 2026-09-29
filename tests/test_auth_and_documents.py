import pytest
from fastapi.testclient import TestClient
import io
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app

client = TestClient(app)


def test_login_and_create_student_by_name():
    resp = client.post("/api/auth/login", json={
        "name": "Vishanth R",
        "email": "vishanth@example.com"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["student"]["name"] == "Vishanth R"
    assert data["student"]["email"] == "vishanth@example.com"
    student_id = data["student"]["id"]

    # Verify profile now has the name Vishanth R
    prof_resp = client.get(f"/api/students/{student_id}")
    assert prof_resp.status_code == 200
    assert prof_resp.json()["student_name"] == "Vishanth R"


def test_google_login():
    resp = client.post("/api/auth/google", json={
        "name": "Vishanth (Google)",
        "email": "vishanth.google@gmail.com",
        "avatar_url": "https://lh3.googleusercontent.com/a/default-user"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["student"]["name"] == "Vishanth (Google)"
    assert data["student"]["auth_provider"] == "google"


def test_document_upload_and_hotspot_analysis():
    # 1. Login student
    auth_resp = client.post("/api/auth/login", json={
        "name": "Vishanth R",
        "email": "vishanth_doc@example.com"
    })
    student_id = auth_resp.json()["student"]["id"]

    # 2. Upload sample study material on C Pointers
    c_lecture_notes = """
    Lecture 4: C Pointers and Memory Addresses
    A pointer stores a memory address in RAM.
    When we dereference a pointer with *ptr, we retrieve the value at that address.
    Pointer arithmetic: when you increment ptr + 1, it advances by sizeof(*ptr) bytes.
    Be careful with pointer decay when passing arrays to functions.
    """
    file_bytes = c_lecture_notes.encode("utf-8")

    upload_resp = client.post(
        "/api/documents/upload",
        data={"student_id": student_id, "preferred_subject": "c_programming"},
        files={"file": ("lecture4_pointers.txt", io.BytesIO(file_bytes), "text/plain")}
    )
    assert upload_resp.status_code == 200
    doc_data = upload_resp.json()
    assert doc_data["detected_subject"] == "C Programming"
    assert len(doc_data["extracted_concepts"]) > 0
    assert len(doc_data["confusion_hotspots"]) > 0
    assert doc_data["question_count"] >= 1
    assert "diagnostic_session_id" in doc_data
    doc_id = doc_data["id"]

    # 3. Retrieve student's uploaded documents
    list_resp = client.get(f"/api/students/{student_id}/documents")
    assert list_resp.status_code == 200
    docs = list_resp.json()
    assert len(docs) >= 1
    assert docs[0]["id"] == doc_id

    # 4. Start diagnostic from document
    diag_start_resp = client.post(f"/api/documents/{doc_id}/start-diagnostic?student_id={student_id}")
    assert diag_start_resp.status_code == 200
    diag_data = diag_start_resp.json()
    assert "session_id" in diag_data
    assert len(diag_data["questions"]) > 0
