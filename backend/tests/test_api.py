"""
Integration tests for FastAPI endpoints
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "disclaimer" in data

def test_get_user_profile():
    res = client.get("/api/v1/users/U102/profile")
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == "U102"
    assert data["name"] == "Vikram Verma"
    assert len(data["trusted_patterns"]) > 0

def test_scenario_a_evaluation_api():
    res = client.post("/api/v1/simulation/trigger-scenario/scenario_a")
    assert res.status_code == 200
    data = res.json()
    assert data["risk_band"] == "LOW"
    assert data["policy_action"] == "ALLOW"
    assert data["latency_ms"] >= 0.0
    assert "explanation_en" in data
    assert "explanation_hi" in data

def test_scenario_c_evaluation_api():
    res = client.post("/api/v1/simulation/trigger-scenario/scenario_c")
    assert res.status_code == 200
    data = res.json()
    assert data["risk_band"] in ["HIGH", "VERY_HIGH"]
    assert data["policy_action"] in ["CONFIRM", "ESCALATE"]
    assert len(data["signals"]) == 6

def test_intent_extraction_api():
    res = client.post("/api/v1/intent/extract", json={"free_text": "Hospital emergency bill for my brother"})
    assert res.status_code == 200
    data = res.json()
    assert data["category"] == "MEDICAL_EMERGENCY"
    assert data["extracted_relationship"] == "brother"
    assert data["confidence"] > 0.8

def test_feedback_and_dashboard_metrics():
    # Submit feedback
    fb_res = client.post("/api/v1/feedback", json={
        "transaction_id": "TXN_DEMO_TEST",
        "user_id": "U102",
        "user_action": "CONTINUED",
        "is_intentional": True,
        "note": "Confirmed by user"
    })
    assert fb_res.status_code == 200
    assert fb_res.json()["status"] == "RECORDED"

    # Check dashboard metrics
    db_res = client.get("/api/v1/dashboard/metrics")
    assert db_res.status_code == 200
    data = db_res.json()
    assert data["transactions_evaluated"] >= 1
    assert "risk_distribution" in data
    assert data["is_simulation"] is True
