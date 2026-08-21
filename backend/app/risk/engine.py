"""
Authoritative Deterministic Risk Scoring Engine
Calculates risk score (0..100), risk band, reason codes, and attaches observational anomaly score.
"""
from typing import List, Dict, Any, Tuple
from backend.app.schemas.evaluation import SignalContribution
from backend.app.risk.anomaly_model import AnomalyModel
from backend.app.config import settings

class RiskEngine:
    @staticmethod
    def compute_risk_score(signals: List[SignalContribution]) -> Tuple[int, List[str]]:
        """
        Deterministic sum of signal contributions and collection of reason codes.
        """
        raw_score = sum(s.score for s in signals)
        risk_score = min(100, max(0, int(raw_score)))

        reason_codes: List[str] = []
        for s in signals:
            if s.score > 0:
                if s.name == "amount_anomaly":
                    reason_codes.append("AMOUNT_ANOMALY_HIGH" if s.score >= 20 else "AMOUNT_ANOMALY_MODERATE")
                elif s.name == "new_recipient":
                    reason_codes.append("NEW_RECIPIENT_FIRST_TIME" if s.score >= 15 else "RECIPIENT_INFREQUENT")
                elif s.name == "time_anomaly":
                    reason_codes.append("UNUSUAL_HOURS_NIGHT" if s.score >= 10 else "UNUSUAL_HOURS_BOUNDARY")
                elif s.name == "new_device":
                    reason_codes.append("UNRECOGNIZED_DEVICE")
                elif s.name == "location_anomaly":
                    reason_codes.append("UNUSUAL_GEOGRAPHIC_REGION")
                elif s.name == "velocity_anomaly":
                    reason_codes.append("RAPID_RETRY_FAILED_ATTEMPTS")

        if not reason_codes:
            reason_codes.append("ACTIVITY_CONSISTENT_WITH_BASELINE")

        return risk_score, reason_codes

    @staticmethod
    def evaluate(
        signals: List[SignalContribution],
        transaction_data: Dict[str, Any],
        profile_data: Dict[str, Any]
    ) -> Tuple[int, str, List[str], float]:
        """
        Returns:
            (risk_score, risk_band, reason_codes, model_anomaly_score)
        """
        risk_score, reason_codes = RiskEngine.compute_risk_score(signals)

        # Risk band assignment
        if risk_score <= settings.THRESHOLD_LOW_MAX:
            risk_band = "LOW"
        elif risk_score <= settings.THRESHOLD_MEDIUM_MAX:
            risk_band = "MEDIUM"
        elif risk_score <= settings.THRESHOLD_HIGH_MAX:
            risk_band = "HIGH"
        else:
            risk_band = "VERY_HIGH"

        # Observational Anomaly Model Score
        amount = float(transaction_data.get("amount", 0.0))
        median_amt = max(float(profile_data.get("median_amount", 1000.0)), 1.0)
        amt_ratio = amount / median_amt
        
        usual_start = profile_data.get("usual_start_hour", 8)
        usual_end = profile_data.get("usual_end_hour", 22)
        
        tx_hour = 12
        if "timestamp" in transaction_data:
            try:
                from datetime import datetime
                if isinstance(transaction_data["timestamp"], str):
                    tx_hour = datetime.fromisoformat(transaction_data["timestamp"]).hour
                else:
                    tx_hour = transaction_data["timestamp"].hour
            except Exception:
                pass
        
        if usual_start <= tx_hour <= usual_end:
            hour_dev = 0
        else:
            hour_dev = min(abs(tx_hour - usual_start), abs(tx_hour - usual_end))

        is_new_rec = any(s.name == "new_recipient" and s.score >= 15 for s in signals)
        is_new_dev = any(s.name == "new_device" and s.score > 0 for s in signals)
        is_new_loc = any(s.name == "location_anomaly" and s.score > 0 for s in signals)
        failed_attempts = int(transaction_data.get("failed_attempts_recent", 0))

        anomaly_model = AnomalyModel.get_instance()
        anomaly_score = anomaly_model.predict_anomaly_score(
            amount_ratio=amt_ratio,
            hour_deviation=hour_dev,
            is_new_recipient=is_new_rec,
            is_new_device=is_new_dev,
            is_new_location=is_new_loc,
            failed_attempts=failed_attempts
        )

        return risk_score, risk_band, reason_codes, anomaly_score
