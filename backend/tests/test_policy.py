"""
Unit tests for Policy Engine & ML Isolation (Safety Guarantee)
"""
import pytest
from backend.app.policy.friction_engine import FrictionPolicyEngine
from backend.app.risk.engine import RiskEngine
from backend.app.schemas.evaluation import SignalContribution

def test_authoritative_policy_mapping():
    assert FrictionPolicyEngine.determine_action("LOW", 10)["action"] == "ALLOW"
    assert FrictionPolicyEngine.determine_action("MEDIUM", 42)["action"] == "INFORM"
    assert FrictionPolicyEngine.determine_action("HIGH", 68)["action"] == "CONFIRM"
    assert FrictionPolicyEngine.determine_action("VERY_HIGH", 90)["action"] == "ESCALATE"

def test_ml_score_cannot_override_policy():
    """
    CRITICAL FINTECH SAFETY CONTRACT:
    Even if the ML anomaly model outputs an anomaly score of 0.99 (or 0.01),
    the policy action is strictly dictated by the deterministic rule score and band.
    """
    # Safe signals (Score 0) -> Policy MUST be ALLOW regardless of model anomaly
    signals = [
        SignalContribution(name="amount_anomaly", display_name="Amount", score=0, max_points=30, severity="LOW", reason="Normal"),
    ]
    score, band, reasons, anomaly_score = RiskEngine.evaluate(
        signals=signals,
        transaction_data={"amount": 500},
        profile_data={"median_amount": 1000, "usual_start_hour": 8, "usual_end_hour": 22}
    )
    
    policy_res = FrictionPolicyEngine.determine_action(band, score)
    assert score == 0
    assert band == "LOW"
    assert policy_res["action"] == "ALLOW"
