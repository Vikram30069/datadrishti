"""
Unit tests for Feature Service & signal calculations
"""
import pytest
from backend.app.services.feature_service import FeatureService
from backend.app.simulation.fixtures import PERSONAS

def test_scenario_a_feature_signals():
    """Scenario A: Rs. 850 grocery payment to familiar merchant in normal hours"""
    profile = PERSONAS["U102"]
    tx = {
        "user_id": "U102",
        "recipient_id": "R202",
        "recipient_name": "Nature Basket Groceries",
        "recipient_upi": "naturebasket@paytm",
        "amount": 850.0,
        "timestamp": "2026-08-21T11:30:00",
        "device_id": "DEV_VIKRAM_IPHONE15",
        "location_region": "Mumbai",
        "failed_attempts_recent": 0
    }
    signals = FeatureService.extract_features(tx, profile)
    signal_dict = {s.name: s.score for s in signals}

    assert signal_dict["amount_anomaly"] == 0
    assert signal_dict["new_recipient"] == 0
    assert signal_dict["time_anomaly"] == 0
    assert signal_dict["new_device"] == 0
    assert signal_dict["location_anomaly"] == 0
    assert signal_dict["velocity_anomaly"] == 0
    assert sum(signal_dict.values()) == 0

def test_scenario_b_rent_pattern_suppression():
    """Scenario B: Rs. 50,000 monthly rent matches trusted pattern -> amount anomaly suppressed"""
    profile = PERSONAS["U102"]
    tx = {
        "user_id": "U102",
        "recipient_id": "R201",
        "recipient_name": "Suresh Nair (Landlord)",
        "recipient_upi": "suresh.nair@okhdfcbank",
        "amount": 50000.0,
        "timestamp": "2026-08-21T10:15:00",
        "device_id": "DEV_VIKRAM_IPHONE15",
        "location_region": "Mumbai",
        "failed_attempts_recent": 0
    }
    signals = FeatureService.extract_features(tx, profile)
    signal_dict = {s.name: s.score for s in signals}

    assert signal_dict["amount_anomaly"] == 0
    assert signal_dict["new_recipient"] == 0
    assert signal_dict["time_anomaly"] == 0
    assert signal_dict["new_device"] == 0
    assert sum(signal_dict.values()) == 0

def test_scenario_c_suspicious_signals():
    """Scenario C: Rs. 45,000 to new recipient at 2 AM from new device"""
    profile = PERSONAS["U102"]
    tx = {
        "user_id": "U102",
        "recipient_id": "R991",
        "recipient_name": "Amit Kumar",
        "recipient_upi": "amit.kumar89@okaxis",
        "amount": 45000.0,
        "timestamp": "2026-08-21T02:07:00",
        "device_id": "DEV_UNKNOWN_REDMI_12",
        "location_region": "Mumbai",
        "failed_attempts_recent": 0
    }
    signals = FeatureService.extract_features(tx, profile)
    signal_dict = {s.name: s.score for s in signals}

    assert signal_dict["amount_anomaly"] >= 15
    assert signal_dict["new_recipient"] == 20
    assert signal_dict["time_anomaly"] == 15
    assert signal_dict["new_device"] == 20
    assert sum(signal_dict.values()) == 72
