"""
Unit tests for Risk Engine and boundary conditions
"""
import pytest
from backend.app.risk.engine import RiskEngine
from backend.app.schemas.evaluation import SignalContribution

def test_risk_score_bounds_and_capping():
    # Test capping at 100
    signals = [
        SignalContribution(name="amount_anomaly", display_name="Amount", score=30, max_points=30, severity="HIGH", reason="High amount"),
        SignalContribution(name="new_recipient", display_name="Recipient", score=20, max_points=20, severity="HIGH", reason="New recipient"),
        SignalContribution(name="time_anomaly", display_name="Time", score=15, max_points=15, severity="HIGH", reason="Odd time"),
        SignalContribution(name="new_device", display_name="Device", score=20, max_points=20, severity="HIGH", reason="New device"),
        SignalContribution(name="location_anomaly", display_name="Location", score=10, max_points=10, severity="MEDIUM", reason="New city"),
        SignalContribution(name="velocity_anomaly", display_name="Velocity", score=5, max_points=5, severity="HIGH", reason="Retries"),
    ]
    tx_dummy = {"amount": 100000, "failed_attempts_recent": 2}
    profile_dummy = {"median_amount": 1000, "usual_start_hour": 8, "usual_end_hour": 22}

    score, band, reasons, anomaly = RiskEngine.evaluate(signals, tx_dummy, profile_dummy)
    assert score == 100
    assert band == "VERY_HIGH"
    assert "AMOUNT_ANOMALY_HIGH" in reasons
    assert "UNRECOGNIZED_DEVICE" in reasons
    assert 0.0 <= anomaly <= 1.0

def test_risk_score_low_band():
    signals = [
        SignalContribution(name="amount_anomaly", display_name="Amount", score=0, max_points=30, severity="LOW", reason="Normal"),
        SignalContribution(name="new_recipient", display_name="Recipient", score=5, max_points=20, severity="LOW", reason="Known"),
    ]
    score, band, reasons, anomaly = RiskEngine.evaluate(signals, {"amount": 500}, {"median_amount": 1000, "usual_start_hour": 8, "usual_end_hour": 22})
    assert score == 5
    assert band == "LOW"
