"""
Automated tests for Deterministic Synthetic Transaction Simulator
(100 Personas, 10,000+ Transactions, 10 Configurable Scenarios).
"""
import pytest
from backend.app.simulation.persona_generator import generate_personas
from backend.app.simulation.scenario_engine import generate_scenario_transaction, SCENARIO_DEFINITIONS
from backend.app.simulation.transaction_generator import generate_historical_transactions
from backend.app.services.feature_service import FeatureService
from backend.app.risk.engine import RiskEngine
from backend.app.policy.friction_engine import FrictionEngine

def test_100_personas_generation_and_fields():
    """Verify exactly 100 personas are generated with all required schema fields."""
    personas = generate_personas(count=100, seed=42)
    assert len(personas) == 100

    required_fields = [
        "user_id", "name", "income_band", "persona_type", "upi_handle",
        "typical_transaction_amount", "amount_std", "usual_payment_hours",
        "usual_regions", "known_devices", "known_recipients", "transaction_frequency",
        "weekly_pattern", "monthly_patterns", "preferred_transaction_types"
    ]

    for p in personas:
        for field in required_fields:
            assert field in p, f"Missing {field} in persona {p['user_id']}"
        assert p["max_amount"] <= 100000.0, "Max amount must be capped at 1 Lakh"
        assert len(p["known_recipients"]) >= 2
        assert len(p["known_devices"]) >= 1

def test_10000_transactions_generation_and_reproducibility():
    """Verify 10,000+ transactions generation with deterministic seed reproducibility."""
    personas = generate_personas(count=100, seed=42)
    txs_1 = generate_historical_transactions(personas, target_count=10000, seed=42)
    assert len(txs_1) >= 10000

    required_tx_fields = [
        "transaction_id", "user_id", "recipient_id", "amount", "timestamp",
        "transaction_type", "device_id", "location", "is_known_recipient",
        "is_known_device", "recent_transaction_count", "failed_attempts",
        "scenario_id", "label"
    ]

    for tx in txs_1[:100]:
        for field in required_tx_fields:
            assert field in tx, f"Missing {field} in transaction {tx['transaction_id']}"
        assert tx["amount"] <= 100000.0, "Transaction amount must not exceed 1 Lakh"

    # Deterministic test: generating again with seed 42 must match exactly
    txs_2 = generate_historical_transactions(personas, target_count=10000, seed=42)
    assert txs_1[0]["transaction_id"] == txs_2[0]["transaction_id"]
    assert txs_1[500]["amount"] == txs_2[500]["amount"]

def test_10_configurable_scenarios():
    """Verify all 10 scenario types generate valid transactions and appropriate friction."""
    personas = generate_personas(count=10, seed=42)
    persona = personas[1] # Vikram

    scenario_ids = [s["scenario_id"] for s in SCENARIO_DEFINITIONS]
    assert len(scenario_ids) == 10

    for sc_id in scenario_ids:
        tx = generate_scenario_transaction(sc_id, persona, seed_counter=1)
        assert tx["scenario_id"] == sc_id
        assert tx["amount"] <= 100000.0

        signals = FeatureService.extract_features(tx, persona)
        score, reasons = RiskEngine.compute_risk_score(signals)
        band, action = FrictionEngine.resolve_policy(score)

        if sc_id == "NORMAL":
            assert action == "ALLOW", f"NORMAL scenario should be ALLOW, got {action}"
            assert score <= 30
        elif sc_id == "LEGITIMATE_HIGH_VALUE":
            assert action == "ALLOW", f"LEGITIMATE_HIGH_VALUE should be ALLOW, got {action}"
            assert score <= 30
        elif sc_id == "SOCIAL_ENGINEERING":
            assert action in ("CONFIRM", "ESCALATE"), f"SOCIAL_ENGINEERING should trigger friction, got {action}"
            assert score >= 70
        elif sc_id == "MULTI_SIGNAL_ANOMALY":
            assert action in ("CONFIRM", "ESCALATE"), f"MULTI_SIGNAL_ANOMALY should trigger friction, got {action}"
            assert score >= 65
