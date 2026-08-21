"""
Configurable Scenario Generator for Paytm IntentGuard.
Implements the 10 canonical scenarios evaluating personalized intent mismatch vs legitimate context.
"""
from typing import Dict, Any, List
import datetime

SCENARIO_DEFINITIONS = [
    {
        "scenario_id": "NORMAL",
        "title": "Normal Everyday Transaction",
        "description": "Routine spend within normal hours, regular amount, known recipient, and trusted device.",
        "risk_category": "BENIGN",
        "expected_action": "ALLOW",
        "expected_score_range": (0, 15),
        "primary_signals": []
    },
    {
        "scenario_id": "AMOUNT_SPIKE",
        "title": "Amount Spike Anomaly",
        "description": "Amount significantly exceeds 95th percentile with no recurring pattern, to known recipient.",
        "risk_category": "ANOMALOUS_AMOUNT",
        "expected_action": "INFORM",
        "expected_score_range": (31, 50),
        "primary_signals": ["amount_anomaly"]
    },
    {
        "scenario_id": "NEW_RECIPIENT",
        "title": "New Recipient Risk",
        "description": "Transfer to a first-time payee within normal daytime hours and standard amount.",
        "risk_category": "NEW_PAYEE",
        "expected_action": "INFORM",
        "expected_score_range": (20, 35),
        "primary_signals": ["new_recipient"]
    },
    {
        "scenario_id": "UNUSUAL_TIME",
        "title": "Unusual Time Anomaly",
        "description": "Payment initiated during deep night (2:30 AM) outside the user's regular activity hours.",
        "risk_category": "TEMPORAL_ANOMALY",
        "expected_action": "INFORM",
        "expected_score_range": (15, 30),
        "primary_signals": ["time_anomaly"]
    },
    {
        "scenario_id": "NEW_DEVICE",
        "title": "New Device Anomaly",
        "description": "First-ever payment originating from an unrecognized device hardware identifier.",
        "risk_category": "HARDWARE_ANOMALY",
        "expected_action": "INFORM",
        "expected_score_range": (20, 35),
        "primary_signals": ["new_device"]
    },
    {
        "scenario_id": "LOCATION_DEVIATION",
        "title": "Location Deviation",
        "description": "Transaction initiated from a geographic city/state outside the user's historical cluster.",
        "risk_category": "GEO_ANOMALY",
        "expected_action": "INFORM",
        "expected_score_range": (10, 25),
        "primary_signals": ["location_anomaly"]
    },
    {
        "scenario_id": "VELOCITY_ANOMALY",
        "title": "Velocity & Retry Anomaly",
        "description": "Multiple rapid payment attempts with preceding failed MPIN attempts in quick succession.",
        "risk_category": "VELOCITY_RETRY",
        "expected_action": "INFORM",
        "expected_score_range": (20, 40),
        "primary_signals": ["velocity_anomaly"]
    },
    {
        "scenario_id": "MULTI_SIGNAL_ANOMALY",
        "title": "Multi-Signal Compound Anomaly (ATO)",
        "description": "High amount + New recipient + 2:07 AM + New device in an unrecognized region (Classic Account Takeover).",
        "risk_category": "ACCOUNT_TAKEOVER",
        "expected_action": "CONFIRM",
        "expected_score_range": (65, 79),
        "primary_signals": ["amount_anomaly", "new_recipient", "time_anomaly", "new_device"]
    },
    {
        "scenario_id": "SOCIAL_ENGINEERING",
        "title": "Social Engineering / Coercion Attack",
        "description": "Active phone call indicator + urgent coercion transfer to suspected mule account with retries.",
        "risk_category": "COERCION_SCAM",
        "expected_action": "ESCALATE",
        "expected_score_range": (80, 100),
        "primary_signals": ["amount_anomaly", "new_recipient", "time_anomaly", "new_device", "location_anomaly", "velocity_anomaly"]
    },
    {
        "scenario_id": "LEGITIMATE_HIGH_VALUE",
        "title": "Legitimate High-Value Payment (The IntentGuard Differentiator)",
        "description": "₹50,000 monthly rent to regular Landlord on 1st of month. Amount is high, but matches verified recurring pattern -> Zero false friction.",
        "risk_category": "VERIFIED_LEGITIMATE",
        "expected_action": "ALLOW",
        "expected_score_range": (0, 15),
        "primary_signals": ["pattern_suppression"]
    }
]

def generate_scenario_transaction(scenario_id: str, persona: Dict[str, Any], seed_counter: int = 1) -> Dict[str, Any]:
    """
    Constructs a synthetic transaction tailored to the given scenario and persona.
    """
    user_id = persona["user_id"]
    median_amt = persona["median_amount"]
    p90_amt = persona["p90_amount"]
    usual_start_h = persona["usual_start_hour"]
    usual_end_h = persona["usual_end_hour"]
    usual_device = persona["known_devices"][0] if persona.get("known_devices") else "DEV_DEFAULT"
    usual_region = persona["usual_regions"][0] if persona.get("usual_regions") else "Mumbai"
    known_recs = persona.get("known_recipients", [])
    trusted_pats = persona.get("trusted_patterns", [])

    now = datetime.datetime.now(datetime.timezone.utc)
    tx_id = f"TXN_{scenario_id}_{user_id}_{seed_counter:04d}"

    # Target payment hour inside normal active window
    normal_hour = max(usual_start_h, min(usual_end_h - 1, usual_start_h + 2))

    if scenario_id == "NORMAL":
        rec = known_recs[0] if known_recs else {"id": "R_BENIGN", "name": "Daily Grocery", "upi": "grocery@paytm"}
        return {
            "transaction_id": tx_id,
            "user_id": user_id,
            "recipient_id": rec["id"],
            "recipient_name": rec["name"],
            "recipient_upi": rec["upi"],
            "amount": float(rec.get("regular_amount", median_amt)),
            "timestamp": now.replace(hour=normal_hour, minute=15).isoformat(),
            "transaction_type": "P2M",
            "device_id": usual_device,
            "location": usual_region,
            "location_region": usual_region,
            "is_known_recipient": True,
            "is_known_device": True,
            "recent_transaction_count": 1,
            "failed_attempts": 0,
            "failed_attempts_recent": 0,
            "scenario_id": "NORMAL",
            "label": "LEGITIMATE",
            "context_note": "Routine daily shopping"
        }

    elif scenario_id == "AMOUNT_SPIKE":
        rec = known_recs[0] if known_recs else {"id": "R_BENIGN", "name": "Nature Basket", "upi": "nature@paytm"}
        return {
            "transaction_id": tx_id,
            "user_id": user_id,
            "recipient_id": rec["id"],
            "recipient_name": rec["name"],
            "recipient_upi": rec["upi"],
            "amount": float(min(100000.0, p90_amt * 4.5)),
            "timestamp": now.replace(hour=normal_hour, minute=30).isoformat(),
            "transaction_type": "P2M",
            "device_id": usual_device,
            "location": usual_region,
            "location_region": usual_region,
            "is_known_recipient": True,
            "is_known_device": True,
            "recent_transaction_count": 1,
            "failed_attempts": 0,
            "failed_attempts_recent": 0,
            "scenario_id": "AMOUNT_SPIKE",
            "label": "UNUSUAL_LEGITIMATE",
            "context_note": "Unusually large payment for annual electronics purchase"
        }

    elif scenario_id == "NEW_RECIPIENT":
        return {
            "transaction_id": tx_id,
            "user_id": user_id,
            "recipient_id": f"REC_NEW_{seed_counter}",
            "recipient_name": "Rohan Deshmukh",
            "recipient_upi": "rohan.d88@okaxis",
            "amount": float(median_amt),
            "timestamp": now.replace(hour=normal_hour, minute=0).isoformat(),
            "transaction_type": "P2P",
            "device_id": usual_device,
            "location": usual_region,
            "location_region": usual_region,
            "is_known_recipient": False,
            "is_known_device": True,
            "recent_transaction_count": 1,
            "failed_attempts": 0,
            "failed_attempts_recent": 0,
            "scenario_id": "NEW_RECIPIENT",
            "label": "LEGITIMATE",
            "context_note": "Paying colleague for shared team lunch bill"
        }

    elif scenario_id == "UNUSUAL_TIME":
        rec = known_recs[0] if known_recs else {"id": "R_BENIGN", "name": "Nature Basket", "upi": "nature@paytm"}
        return {
            "transaction_id": tx_id,
            "user_id": user_id,
            "recipient_id": rec["id"],
            "recipient_name": rec["name"],
            "recipient_upi": rec["upi"],
            "amount": float(median_amt),
            "timestamp": now.replace(hour=2, minute=45).isoformat(), # 2:45 AM
            "transaction_type": "P2P",
            "device_id": usual_device,
            "location": usual_region,
            "location_region": usual_region,
            "is_known_recipient": True,
            "is_known_device": True,
            "recent_transaction_count": 1,
            "failed_attempts": 0,
            "failed_attempts_recent": 0,
            "scenario_id": "UNUSUAL_TIME",
            "label": "LEGITIMATE",
            "context_note": "Late night urgent pharmacy purchase"
        }

    elif scenario_id == "NEW_DEVICE":
        rec = known_recs[0] if known_recs else {"id": "R_BENIGN", "name": "Nature Basket", "upi": "nature@paytm"}
        return {
            "transaction_id": tx_id,
            "user_id": user_id,
            "recipient_id": rec["id"],
            "recipient_name": rec["name"],
            "recipient_upi": rec["upi"],
            "amount": float(median_amt * 1.5),
            "timestamp": now.replace(hour=normal_hour, minute=10).isoformat(),
            "transaction_type": "P2M",
            "device_id": f"DEV_UNRECOGNIZED_HARDWARE_{seed_counter}",
            "location": usual_region,
            "location_region": usual_region,
            "is_known_recipient": True,
            "is_known_device": False,
            "recent_transaction_count": 1,
            "failed_attempts": 0,
            "failed_attempts_recent": 0,
            "scenario_id": "NEW_DEVICE",
            "label": "SUSPICIOUS",
            "context_note": "Payment from a newly purchased smartphone"
        }

    elif scenario_id == "LOCATION_DEVIATION":
        rec = known_recs[0] if known_recs else {"id": "R_BENIGN", "name": "Nature Basket", "upi": "nature@paytm"}
        unusual_city = "Kolkata" if "Kolkata" not in persona.get("usual_regions", []) else "Bengaluru"
        return {
            "transaction_id": tx_id,
            "user_id": user_id,
            "recipient_id": rec["id"],
            "recipient_name": rec["name"],
            "recipient_upi": rec["upi"],
            "amount": float(median_amt * 1.2),
            "timestamp": now.replace(hour=normal_hour, minute=0).isoformat(),
            "transaction_type": "P2M",
            "device_id": usual_device,
            "location": unusual_city,
            "location_region": unusual_city,
            "is_known_recipient": True,
            "is_known_device": True,
            "recent_transaction_count": 1,
            "failed_attempts": 0,
            "failed_attempts_recent": 0,
            "scenario_id": "LOCATION_DEVIATION",
            "label": "LEGITIMATE",
            "context_note": "Travel expenses during out-of-station vacation"
        }

    elif scenario_id == "VELOCITY_ANOMALY":
        return {
            "transaction_id": tx_id,
            "user_id": user_id,
            "recipient_id": f"REC_RAPID_{seed_counter}",
            "recipient_name": "QuickTransfer Agent",
            "recipient_upi": "rapidpay@okhdfc",
            "amount": float(median_amt * 2.0),
            "timestamp": now.replace(hour=normal_hour, minute=22).isoformat(),
            "transaction_type": "P2P",
            "device_id": usual_device,
            "location": usual_region,
            "location_region": usual_region,
            "is_known_recipient": False,
            "is_known_device": True,
            "recent_transaction_count": 6,
            "failed_attempts": 2,
            "failed_attempts_recent": 2,
            "scenario_id": "VELOCITY_ANOMALY",
            "label": "SUSPICIOUS",
            "context_note": "High velocity retry after failed PIN attempts"
        }

    elif scenario_id == "MULTI_SIGNAL_ANOMALY":
        return {
            "transaction_id": tx_id,
            "user_id": user_id,
            "recipient_id": f"REC_SUSP_{seed_counter}",
            "recipient_name": "Amit Kumar",
            "recipient_upi": "amit.kumar89@okaxis",
            "amount": 45000.0,
            "timestamp": now.replace(hour=2, minute=7).isoformat(), # 2:07 AM
            "transaction_type": "P2P",
            "device_id": f"DEV_UNKNOWN_EMULATOR_{seed_counter}",
            "location": usual_region,
            "location_region": usual_region,
            "is_known_recipient": False,
            "is_known_device": False,
            "recent_transaction_count": 1,
            "failed_attempts": 0,
            "failed_attempts_recent": 0,
            "scenario_id": "MULTI_SIGNAL_ANOMALY",
            "label": "ATO",
            "context_note": "Account takeover attempt with new payee and device at 2 AM"
        }

    elif scenario_id == "SOCIAL_ENGINEERING":
        return {
            "transaction_id": tx_id,
            "user_id": user_id,
            "recipient_id": f"REC_MULE_{seed_counter}",
            "recipient_name": "FastCash Verification Agent",
            "recipient_upi": "mule.kyc@ybl",
            "amount": 75000.0,
            "timestamp": now.replace(hour=3, minute=18).isoformat(), # 3:18 AM
            "transaction_type": "P2P",
            "device_id": f"DEV_SCAM_DEVICE_{seed_counter}",
            "location": "Kolkata",
            "location_region": "Kolkata",
            "is_known_recipient": False,
            "is_known_device": False,
            "recent_transaction_count": 4,
            "failed_attempts": 2,
            "failed_attempts_recent": 2,
            "scenario_id": "SOCIAL_ENGINEERING",
            "label": "COERCION",
            "context_note": "Victim on active phone call being coerced to transfer money to unblock account"
        }

    elif scenario_id == "LEGITIMATE_HIGH_VALUE":
        rent_pat = next((p for p in trusted_pats if "Rent" in p.get("title", "") or "Housing" in p.get("category", "")), None)
        if rent_pat and rent_pat.get("recipient_id"):
            landlord_rec = next((r for r in known_recs if r["id"] == rent_pat["recipient_id"]), None)
            if not landlord_rec:
                landlord_rec = known_recs[1] if len(known_recs) > 1 else known_recs[0]
            amount = float(rent_pat["typical_amount"])
            rec_name = landlord_rec["name"]
            rec_upi = landlord_rec["upi"]
            rec_id = rent_pat["recipient_id"]
        else:
            rec = known_recs[0] if known_recs else {"id": "R201", "name": "Suresh Nair (Landlord)", "upi": "suresh.nair@okhdfcbank"}
            amount = float(rec.get("regular_amount", 50000.0))
            rec_name = rec["name"]
            rec_upi = rec["upi"]
            rec_id = rec["id"]

        return {
            "transaction_id": tx_id,
            "user_id": user_id,
            "recipient_id": rec_id,
            "recipient_name": rec_name,
            "recipient_upi": rec_upi,
            "amount": amount,
            "timestamp": now.replace(hour=normal_hour, minute=15).isoformat(),
            "transaction_type": "RENT",
            "device_id": usual_device,
            "location": usual_region,
            "location_region": usual_region,
            "is_known_recipient": True,
            "is_known_device": True,
            "recent_transaction_count": 1,
            "failed_attempts": 0,
            "failed_attempts_recent": 0,
            "scenario_id": "LEGITIMATE_HIGH_VALUE",
            "label": "LEGITIMATE",
            "context_note": "Verified monthly apartment rent transfer"
        }

    return generate_scenario_transaction("NORMAL", persona, seed_counter)
