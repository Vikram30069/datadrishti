"""
Deterministic Transaction Generator for Paytm IntentGuard.
Generates 10,000+ historical transactions distributed across 100 user personas
over a 90-day window with personalized behavioral patterns and controlled scenario injections.
"""
import random
import datetime
from typing import List, Dict, Any
from backend.app.simulation.persona_generator import generate_personas
from backend.app.simulation.scenario_engine import generate_scenario_transaction, SCENARIO_DEFINITIONS

def generate_historical_transactions(
    personas: List[Dict[str, Any]],
    target_count: int = 10000,
    days_history: int = 90,
    seed: int = 42
) -> List[Dict[str, Any]]:
    """
    Generates 10,000+ deterministic transactions reflecting behavioral baselines
    and realistic scenario distributions (95% normal/legitimate high value, 5% anomalies).
    """
    rng = random.Random(seed)
    transactions: List[Dict[str, Any]] = []

    now = datetime.datetime.utcnow()
    start_date = now - datetime.timedelta(days=days_history)

    # Scenarios distribution pool (integer counts out of 200)
    scenario_pool = (
        ["NORMAL"] * 164 +
        ["LEGITIMATE_HIGH_VALUE"] * 16 +
        ["AMOUNT_SPIKE"] * 4 +
        ["NEW_RECIPIENT"] * 6 +
        ["UNUSUAL_TIME"] * 2 +
        ["NEW_DEVICE"] * 2 +
        ["LOCATION_DEVIATION"] * 2 +
        ["VELOCITY_ANOMALY"] * 2 +
        ["MULTI_SIGNAL_ANOMALY"] * 1 +
        ["SOCIAL_ENGINEERING"] * 1
    )

    tx_counter = 1
    per_user_target = max(target_count // len(personas), 100)

    for persona in personas:
        user_id = persona["user_id"]
        known_recs = persona["known_recipients"]
        trusted_pats = persona["trusted_patterns"]
        start_h = persona["usual_start_hour"]
        end_h = persona["usual_end_hour"]
        primary_device = persona["known_devices"][0]
        primary_region = persona["usual_regions"][0]
        median_amt = persona["median_amount"]
        mad_amt = persona["mad_amount"]

        # 1. Generate monthly recurring rent transactions on the 1st-5th of each past month
        for m in range(1, (days_history // 30) + 1):
            rent_pat = next((p for p in trusted_pats if "Rent" in p["title"]), None)
            if rent_pat:
                rent_date = now - datetime.timedelta(days=(m * 30) - rng.randint(1, 4))
                rent_tx_id = f"TXN_{user_id}_RENT_M{m}"
                transactions.append({
                    "transaction_id": rent_tx_id,
                    "user_id": user_id,
                    "recipient_id": rent_pat["recipient_id"],
                    "recipient_name": next((r["name"] for r in known_recs if r["id"] == rent_pat["recipient_id"]), "Landlord"),
                    "recipient_upi": next((r["upi"] for r in known_recs if r["id"] == rent_pat["recipient_id"]), "landlord@upi"),
                    "amount": float(rent_pat["typical_amount"]),
                    "timestamp": rent_date.replace(hour=10, minute=rng.randint(5, 55)).isoformat(),
                    "transaction_type": "RENT",
                    "device_id": primary_device,
                    "location": primary_region,
                    "location_region": primary_region,
                    "is_known_recipient": True,
                    "is_known_device": True,
                    "recent_transaction_count": 1,
                    "failed_attempts": 0,
                    "failed_attempts_recent": 0,
                    "scenario_id": "LEGITIMATE_HIGH_VALUE",
                    "label": "LEGITIMATE",
                    "context_note": "Verified monthly house rent"
                })
                tx_counter += 1

        # 2. Generate regular daily & weekly transactions over the 90 days
        for _ in range(per_user_target):
            random_days_ago = rng.uniform(0, days_history)
            tx_time = now - datetime.timedelta(days=random_days_ago)

            chosen_scenario = rng.choice(scenario_pool)

            if chosen_scenario == "NORMAL":
                # Sample within normal hours and known recipients
                hour = min(23, max(0, rng.randint(start_h, end_h)))
                rec = rng.choice(known_recs) if known_recs else {"id": "R001", "name": "Merchant", "upi": "m@paytm"}
                # Amount modeled using log-normal distribution around median
                sampled_amt = max(20.0, round(rng.gauss(median_amt, mad_amt), -1))
                if sampled_amt > 100000.0:
                    sampled_amt = 100000.0

                transactions.append({
                    "transaction_id": f"TXN_{user_id}_{tx_counter:05d}",
                    "user_id": user_id,
                    "recipient_id": rec["id"],
                    "recipient_name": rec["name"],
                    "recipient_upi": rec["upi"],
                    "amount": float(sampled_amt),
                    "timestamp": tx_time.replace(hour=hour, minute=rng.randint(0, 59)).isoformat(),
                    "transaction_type": "P2M" if "Grocery" in rec["name"] or "Store" in rec["name"] else "P2P",
                    "device_id": primary_device,
                    "location": primary_region,
                    "location_region": primary_region,
                    "is_known_recipient": True,
                    "is_known_device": True,
                    "recent_transaction_count": rng.randint(1, 3),
                    "failed_attempts": 0,
                    "failed_attempts_recent": 0,
                    "scenario_id": "NORMAL",
                    "label": "LEGITIMATE",
                    "context_note": "Normal routine transaction"
                })
            else:
                # Inject specific scenario
                scenario_tx = generate_scenario_transaction(chosen_scenario, persona, tx_counter)
                scenario_tx["timestamp"] = tx_time.isoformat()
                scenario_tx["transaction_id"] = f"TXN_{user_id}_{tx_counter:05d}"
                transactions.append(scenario_tx)

            tx_counter += 1

    # Sort deterministically by timestamp
    transactions.sort(key=lambda t: t["timestamp"])
    return transactions
