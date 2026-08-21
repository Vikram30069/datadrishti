"""
Feature engineering service computing 6 explainable signal scores and reasons
using robust personal baselines (Median, MAD, Percentiles).
"""
import math
from typing import Dict, Any, List, Tuple
from datetime import datetime
from backend.app.schemas.evaluation import SignalContribution

class FeatureService:
    @staticmethod
    def extract_features(
        transaction_data: Dict[str, Any],
        profile_data: Dict[str, Any]
    ) -> List[SignalContribution]:
        """
        Computes the 6 calibrated risk signals:
        1. Amount Anomaly (max 30 pts)
        2. New Recipient Risk (max 20 pts)
        3. Time Anomaly (max 15 pts)
        4. New Device Risk (max 20 pts)
        5. Location Anomaly (max 10 pts)
        6. Velocity & Failed Attempts (max 5 pts)
        """
        signals: List[SignalContribution] = []

        amount = float(transaction_data.get("amount", 0.0))
        recipient_id = transaction_data.get("recipient_id", "")
        recipient_name = transaction_data.get("recipient_name", "Recipient")
        recipient_upi = transaction_data.get("recipient_upi", "")
        device_id = transaction_data.get("device_id", "")
        location_region = transaction_data.get("location_region", "")
        failed_attempts = int(transaction_data.get("failed_attempts_recent", 0))

        # Parse timestamp for hour
        tx_time_raw = transaction_data.get("timestamp")
        if isinstance(tx_time_raw, str):
            try:
                tx_dt = datetime.fromisoformat(tx_time_raw)
            except Exception:
                tx_dt = datetime.utcnow()
        elif isinstance(tx_dt_val := tx_time_raw, datetime):
            tx_dt = tx_dt_val
        else:
            tx_dt = datetime.utcnow()
        tx_hour = tx_dt.hour

        # Baselines from profile
        median_amt = profile_data.get("median_amount", 1000.0)
        mad_amt = max(profile_data.get("mad_amount", 500.0), 50.0)
        p90_amt = profile_data.get("p90_amount", 2500.0)
        p95_amt = profile_data.get("p95_amount", 5000.0)
        max_amt = profile_data.get("max_amount", 10000.0)
        usual_start_hour = profile_data.get("usual_start_hour", 8)
        usual_end_hour = profile_data.get("usual_end_hour", 22)
        known_recipients = profile_data.get("known_recipients", [])
        known_devices = profile_data.get("known_devices", [])
        usual_regions = profile_data.get("usual_regions", [])
        trusted_patterns = profile_data.get("trusted_patterns", [])

        # Check if transaction matches a known trusted recurring pattern (e.g. Rent to Landlord)
        is_pattern_match = False
        for tp in trusted_patterns:
            target_rec_id = tp.get("recipient_id")
            typical_amt = tp.get("typical_amount", 0.0)
            if target_rec_id == recipient_id and abs(amount - typical_amt) <= (0.1 * typical_amt):
                is_pattern_match = True
                break

        # -------------------------------------------------------------
        # 1. AMOUNT ANOMALY (Max 30 pts)
        # -------------------------------------------------------------
        amount_score = 0
        amount_severity = "LOW"
        amount_reason_en = "Amount is consistent with your typical spending pattern."
        amount_reason_hi = "राशि आपके सामान्य खर्च के अनुसार है।"

        if is_pattern_match:
            amount_score = 0
            amount_severity = "LOW"
            amount_reason_en = f"Amount ₹{amount:,.0f} matches your regular recurring payment pattern."
            amount_reason_hi = f"राशि ₹{amount:,.0f} आपके नियमित भुगतान पैटर्न से मेल खाती है।"
        elif amount <= p90_amt:
            amount_score = 0
            amount_severity = "LOW"
            amount_reason_en = f"Amount ₹{amount:,.0f} is within your typical range (Median: ₹{median_amt:,.0f})."
            amount_reason_hi = f"राशि ₹{amount:,.0f} आपके सामान्य दायरे में है (औसत: ₹{median_amt:,.0f})।"
        elif amount <= p95_amt:
            amount_score = 10
            amount_severity = "MEDIUM"
            amount_reason_en = f"Amount ₹{amount:,.0f} is moderately higher than usual (Typical: ₹{median_amt:,.0f}–₹{p90_amt:,.0f})."
            amount_reason_hi = f"राशि ₹{amount:,.0f} सामान्य से कुछ अधिक है (सामान्य: ₹{median_amt:,.0f}–₹{p90_amt:,.0f})।"
        elif amount <= (max_amt * 1.05):
            amount_score = 17
            amount_severity = "HIGH"
            amount_reason_en = f"Amount ₹{amount:,.0f} is significantly higher than your typical transfers (Median: ₹{median_amt:,.0f})."
            amount_reason_hi = f"राशि ₹{amount:,.0f} आपके सामान्य लेन-देन से काफी अधिक है (औसत: ₹{median_amt:,.0f})।"
        else:
            amount_score = 30
            amount_severity = "HIGH"
            amount_reason_en = f"Amount ₹{amount:,.0f} exceeds your historical maximum transfer (Max: ₹{max_amt:,.0f})."
            amount_reason_hi = f"राशि ₹{amount:,.0f} आपके पिछले अधिकतम भुगतान से अधिक है (अधिकतम: ₹{max_amt:,.0f})।"

        signals.append(SignalContribution(
            name="amount_anomaly",
            display_name="Amount Anomaly",
            score=amount_score,
            max_points=30,
            severity=amount_severity,
            reason=amount_reason_en,
            reason_hi=amount_reason_hi
        ))

        # -------------------------------------------------------------
        # 2. NEW RECIPIENT RISK (Max 20 pts)
        # -------------------------------------------------------------
        rec_score = 0
        rec_severity = "LOW"
        rec_reason_en = f"Frequent recipient ({recipient_name})."
        rec_reason_hi = f"पहचाना हुआ प्राप्तकर्ता ({recipient_name})।"

        matched_rec = None
        for r in known_recipients:
            if (recipient_id and r.get("id") == recipient_id) or (recipient_upi and r.get("upi") == recipient_upi):
                matched_rec = r
                break

        if matched_rec:
            tx_cnt = matched_rec.get("tx_count", 1)
            if tx_cnt >= 3:
                rec_score = 0
                rec_severity = "LOW"
                rec_reason_en = f"Familiar recipient ({recipient_name}) with {tx_cnt} prior transactions."
                rec_reason_hi = f"पहचाना हुआ प्राप्तकर्ता ({recipient_name}), पूर्व में {tx_cnt} लेन-देन।"
            else:
                rec_score = 5
                rec_severity = "LOW"
                rec_reason_en = f"Recipient {recipient_name} is known ({tx_cnt} past payments)."
                rec_reason_hi = f"प्राप्तकर्ता {recipient_name} से पूर्व में {tx_cnt} भुगतान हुआ है।"
        else:
            rec_score = 20
            rec_severity = "HIGH"
            rec_reason_en = f"First payment to new recipient: {recipient_name} ({recipient_upi})."
            rec_reason_hi = f"नए प्राप्तकर्ता को पहला भुगतान: {recipient_name} ({recipient_upi})।"

        signals.append(SignalContribution(
            name="new_recipient",
            display_name="New Recipient Risk",
            score=rec_score,
            max_points=20,
            severity=rec_severity,
            reason=rec_reason_en,
            reason_hi=rec_reason_hi
        ))

        # -------------------------------------------------------------
        # 3. TIME ANOMALY (Max 15 pts)
        # -------------------------------------------------------------
        time_score = 0
        time_severity = "LOW"
        time_reason_en = f"Payment time ({tx_hour:02d}:{tx_dt.minute:02d}) is within your normal activity hours."
        time_reason_hi = f"भुगतान का समय ({tx_hour:02d}:{tx_dt.minute:02d}) आपके सामान्य समय में है।"

        if usual_start_hour <= tx_hour <= usual_end_hour:
            time_score = 0
            time_severity = "LOW"
        elif tx_hour in (usual_start_hour - 1, usual_end_hour + 1):
            time_score = 5
            time_severity = "MEDIUM"
            time_reason_en = f"Payment time ({tx_hour:02d}:{tx_dt.minute:02d}) is slightly outside normal hours ({usual_start_hour} AM–{usual_end_hour % 12 or 12} PM)."
            time_reason_hi = f"भुगतान का समय ({tx_hour:02d}:{tx_dt.minute:02d}) सामान्य समय से थोड़ा भिन्न है।"
        else:
            time_score = 15
            time_severity = "HIGH"
            time_reason_en = f"Unusual payment time ({tx_hour:02d}:{tx_dt.minute:02d}). Most payments occur between {usual_start_hour} AM–{usual_end_hour % 12 or 12} PM."
            time_reason_hi = f"असामान्य समय ({tx_hour:02d}:{tx_dt.minute:02d})। आपके अधिकांश भुगतान {usual_start_hour} AM–{usual_end_hour % 12 or 12} PM के बीच होते हैं।"

        signals.append(SignalContribution(
            name="time_anomaly",
            display_name="Time Anomaly",
            score=time_score,
            max_points=15,
            severity=time_severity,
            reason=time_reason_en,
            reason_hi=time_reason_hi
        ))

        # -------------------------------------------------------------
        # 4. NEW DEVICE RISK (Max 20 pts)
        # -------------------------------------------------------------
        dev_score = 0
        dev_severity = "LOW"
        dev_reason_en = "Recognized trusted device."
        dev_reason_hi = "पहचाना हुआ सुरक्षित उपकरण।"

        if device_id in known_devices or not known_devices:
            dev_score = 0
            dev_severity = "LOW"
        else:
            dev_score = 20
            dev_severity = "HIGH"
            dev_reason_en = f"Unrecognized device ({device_id}). First transaction from this device."
            dev_reason_hi = f"अपरिचित उपकरण ({device_id}) से पहला लेन-देन।"

        signals.append(SignalContribution(
            name="new_device",
            display_name="New Device Risk",
            score=dev_score,
            max_points=20,
            severity=dev_severity,
            reason=dev_reason_en,
            reason_hi=dev_reason_hi
        ))

        # -------------------------------------------------------------
        # 5. LOCATION ANOMALY (Max 10 pts)
        # -------------------------------------------------------------
        loc_score = 0
        loc_severity = "LOW"
        loc_reason_en = f"Transaction location ({location_region}) is in your frequent region."
        loc_reason_hi = f"लेन-देन का स्थान ({location_region}) आपके नियमित क्षेत्र में है।"

        if location_region in usual_regions or not usual_regions:
            loc_score = 0
            loc_severity = "LOW"
        else:
            loc_score = 10
            loc_severity = "MEDIUM"
            loc_reason_en = f"Unusual location ({location_region}). Typical transactions occur in {', '.join(usual_regions)}."
            loc_reason_hi = f"असामान्य स्थान ({location_region})। सामान्य लेन-देन {', '.join(usual_regions)} में होते हैं।"

        signals.append(SignalContribution(
            name="location_anomaly",
            display_name="Location Anomaly",
            score=loc_score,
            max_points=10,
            severity=loc_severity,
            reason=loc_reason_en,
            reason_hi=loc_reason_hi
        ))

        # -------------------------------------------------------------
        # 6. VELOCITY & FAILED ATTEMPTS (Max 5 pts)
        # -------------------------------------------------------------
        vel_score = 0
        vel_severity = "LOW"
        vel_reason_en = "Normal transaction velocity."
        vel_reason_hi = "सामान्य लेन-देन गति।"

        if failed_attempts == 0:
            vel_score = 0
            vel_severity = "LOW"
        elif failed_attempts == 1:
            vel_score = 3
            vel_severity = "MEDIUM"
            vel_reason_en = "1 recent failed payment attempt detected before this transaction."
            vel_reason_hi = "इस लेन-देन से पहले 1 असफल प्रयास दर्ज हुआ है।"
        else:
            vel_score = 5
            vel_severity = "HIGH"
            vel_reason_en = f"{failed_attempts} recent failed payment attempts detected in rapid succession."
            vel_reason_hi = f"तेजी से {failed_attempts} असफल भुगतान प्रयास दर्ज हुए हैं।"

        signals.append(SignalContribution(
            name="velocity_anomaly",
            display_name="Velocity & Retries",
            score=vel_score,
            max_points=5,
            severity=vel_severity,
            reason=vel_reason_en,
            reason_hi=vel_reason_hi
        ))

        return signals
