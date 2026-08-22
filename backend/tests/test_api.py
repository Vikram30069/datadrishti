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


def test_escalation_status_and_trigger():
    # 1. Status endpoint
    status_res = client.get("/api/v1/escalation/status")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert "is_live_configured" in status_data
    assert "supported_channels" in status_data
    assert "whatsapp" in status_data["supported_channels"]

    # 2. Trigger WhatsApp escalation
    wa_res = client.post("/api/v1/escalation/trigger", json={
        "channel": "whatsapp",
        "recipient_name": "Amit Kumar",
        "amount": 75000.0,
        "to_phone": "+919876543210",
        "transaction_id": "TXN_TEST_WA_1"
    })
    assert wa_res.status_code == 200
    wa_data = wa_res.json()
    assert wa_data["channel"] == "whatsapp"
    assert wa_data["status"] in ["delivered", "fallback_simulated", "initiated"]
    assert "sid" in wa_data


def test_escalation_state_machine_whatsapp_yes_flow():
    txn_id = "TXN_TEST_WA_YES"
    # Initial state should be PENDING_VERIFICATION or VERIFYING
    session = client.get(f"/api/v1/escalation/session?transaction_id={txn_id}").json()
    assert session["verification_status"] == "PENDING_VERIFICATION"

    # Trigger escalation
    client.post("/api/v1/escalation/trigger", json={
        "channel": "whatsapp",
        "recipient_name": "QuickCrypto Pay",
        "amount": 75000.0,
        "transaction_id": txn_id
    })
    session_verifying = client.get(f"/api/v1/escalation/session?transaction_id={txn_id}").json()
    assert session_verifying["verification_status"] == "VERIFYING"

    # User replies YES
    sim_res = client.post("/api/v1/escalation/simulate-response", json={
        "transaction_id": txn_id,
        "action": "YES",
        "channel": "whatsapp"
    })
    assert sim_res.status_code == 200
    session_verified = client.get(f"/api/v1/escalation/session?transaction_id={txn_id}").json()
    assert session_verified["verification_status"] == "VERIFIED"
    assert session_verified["verification_method"] == "WHATSAPP"

    # User clicks Proceed -> Authoritative backend executes completion
    comp_res = client.post("/api/v1/escalation/complete", json={
        "transaction_id": txn_id,
        "amount": 75000.0,
        "recipient_name": "QuickCrypto Pay"
    })
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["status"] == "success"
    assert comp_data["session"]["verification_status"] == "COMPLETED"


def test_escalation_state_machine_whatsapp_no_flow():
    txn_id = "TXN_TEST_WA_NO"
    # User replies NO / BLOCK
    client.post("/api/v1/escalation/simulate-response", json={
        "transaction_id": txn_id,
        "action": "NO",
        "channel": "whatsapp"
    })
    session = client.get(f"/api/v1/escalation/session?transaction_id={txn_id}").json()
    assert session["verification_status"] in ["CANCELLED", "REJECTED"]

    # Attempting to complete rejected transaction MUST fail with 400
    comp_res = client.post("/api/v1/escalation/complete", json={
        "transaction_id": txn_id,
        "amount": 75000.0
    })
    assert comp_res.status_code == 400


def test_escalation_state_machine_voice_flows():
    # Voice YES
    txn_yes = "TXN_TEST_VOICE_YES"
    client.post("/api/v1/escalation/simulate-response", json={
        "transaction_id": txn_yes,
        "action": "VERIFIED",
        "channel": "voice"
    })
    session_yes = client.get(f"/api/v1/escalation/session?transaction_id={txn_yes}").json()
    assert session_yes["verification_status"] == "VERIFIED"

    # Voice NO
    txn_no = "TXN_TEST_VOICE_NO"
    client.post("/api/v1/escalation/simulate-response", json={
        "transaction_id": txn_no,
        "action": "CANCELLED",
        "channel": "voice"
    })
    session_no = client.get(f"/api/v1/escalation/session?transaction_id={txn_no}").json()
    assert session_no["verification_status"] in ["CANCELLED", "REJECTED"]


def test_unverified_transaction_cannot_complete_and_isolation():
    txn_pending = "TXN_TEST_PENDING_ISOLATION"
    # Trying to complete unverified transaction directly MUST fail with 400
    comp_res = client.post("/api/v1/escalation/complete", json={
        "transaction_id": txn_pending,
        "amount": 75000.0
    })
    assert comp_res.status_code == 400
    assert "not 'VERIFIED'" in comp_res.json()["detail"]


def test_groq_natural_language_classifier_yes_examples():
    from backend.app.services.groq_classifier import GroqVerificationClassifier
    yes_examples = [
        "yes",
        "Yes, I made this payment",
        "I initiated the transaction",
        "That's my payment",
        "Go ahead",
        "Proceed",
        "Yes, continue",
        "I authorized it",
        "I made this transfer",
        "Yes, that's my transaction.",
        "Please continue."
    ]
    for text in yes_examples:
        res = GroqVerificationClassifier.classify_response(text)
        assert res["decision"] == "YES", f"Failed for '{text}': {res}"
        assert res["confidence"] >= 0.85, f"Confidence too low for '{text}': {res}"


def test_groq_natural_language_classifier_no_examples():
    from backend.app.services.groq_classifier import GroqVerificationClassifier
    no_examples = [
        "no",
        "No, I didn't make it",
        "This wasn't me",
        "I don't recognize this payment",
        "Stop the payment",
        "Cancel it",
        "I did not authorize this",
        "Don't proceed",
        "No, I didn't make this.",
        "I don't recognize this transaction."
    ]
    for text in no_examples:
        res = GroqVerificationClassifier.classify_response(text)
        assert res["decision"] == "NO", f"Failed for '{text}': {res}"
        assert res["confidence"] >= 0.85, f"Confidence too low for '{text}': {res}"


def test_groq_natural_language_classifier_unclear_and_low_confidence():
    from backend.app.services.groq_classifier import GroqVerificationClassifier
    unclear_examples = [
        "maybe",
        "I'm not sure",
        "I think so",
        "What payment?",
        "Who is this?",
        "I don't know",
        "Can you explain?",
        "",
        None,
        "What is the weather today?"
    ]
    for text in unclear_examples:
        res = GroqVerificationClassifier.classify_response(text)
        assert res["decision"] == "UNCLEAR", f"Should be UNCLEAR for '{text}': {res}"


def test_terminal_state_locks_and_no_reversal():
    from backend.app.services.verification_service import VerificationResponseService
    txn_id = "TXN_TERMINAL_LOCK_TEST"

    # Step 1: User says NO -> CANCELLED
    res_no = VerificationResponseService.process_verification_response(
        transaction_id=txn_id,
        channel="WHATSAPP",
        response_text="No, I did not make this payment."
    )
    assert res_no["session"]["verification_status"] == "REJECTED"

    # Step 2: Later YES MUST NOT reverse the cancellation!
    res_later_yes = VerificationResponseService.process_verification_response(
        transaction_id=txn_id,
        channel="WHATSAPP",
        response_text="Yes, I authorized it."
    )
    assert res_later_yes["session"]["verification_status"] == "REJECTED"
    assert res_later_yes["decision"] == "CANCELLED"



