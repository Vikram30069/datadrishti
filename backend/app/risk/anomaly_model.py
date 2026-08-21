"""
Unsupervised Anomaly Model (IsolationForest)
Used purely as an observational anomaly indicator signal.
CRITICAL FINTECH SAFETY RULE: This model NEVER directly approves, blocks, or escalates transactions.
"""
import numpy as np
from typing import Dict, Any
from sklearn.ensemble import IsolationForest
from datetime import datetime

class AnomalyModel:
    _instance = None

    def __init__(self):
        np.random.seed(42)
        normal_samples = []
        for _ in range(500):
            amt_ratio = np.random.exponential(scale=1.0)
            hour_diff = np.random.choice([0, 0, 0, 1, 2], p=[0.7, 0.15, 0.1, 0.03, 0.02])
            new_rec = np.random.choice([0, 1], p=[0.85, 0.15])
            new_dev = np.random.choice([0, 1], p=[0.95, 0.05])
            new_loc = np.random.choice([0, 1], p=[0.90, 0.10])
            fails = np.random.choice([0, 1], p=[0.97, 0.03])
            normal_samples.append([amt_ratio, hour_diff, new_rec, new_dev, new_loc, fails])

        self.model = IsolationForest(
            n_estimators=50,
            contamination=0.05,
            random_state=42
        )
        self.model.fit(normal_samples)

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = AnomalyModel()
        return cls._instance

    def predict_anomaly_score(
        self,
        amount_ratio: float,
        hour_deviation: int,
        is_new_recipient: bool,
        is_new_device: bool,
        is_new_location: bool,
        failed_attempts: int
    ) -> float:
        """
        Returns an anomaly score indicator bounded between 0.0 (very normal) and 1.0 (highly anomalous).
        """
        try:
            features = np.array([[
                amount_ratio,
                hour_deviation,
                1 if is_new_recipient else 0,
                1 if is_new_device else 0,
                1 if is_new_location else 0,
                failed_attempts
            ]])
            raw_score = self.model.decision_function(features)[0]
            anomaly_score = 1.0 / (1.0 + np.exp(raw_score * 8.0))
            return float(np.clip(anomaly_score, 0.01, 0.99))
        except Exception:
            return 0.15

class AnomalyModelService:
    @staticmethod
    def score_transaction(transaction_data: Dict[str, Any], profile_data: Dict[str, Any]) -> float:
        """
        High-level wrapper to calculate the observational anomaly score.
        """
        amount = float(transaction_data.get("amount", 100.0))
        median_amt = float(profile_data.get("median_amount", 1000.0))
        amount_ratio = amount / max(median_amt, 10.0)

        # Hour diff
        start_h = profile_data.get("usual_start_hour", 8)
        end_h = profile_data.get("usual_end_hour", 22)
        tx_dt_raw = transaction_data.get("timestamp")
        if isinstance(tx_dt_raw, str):
            try:
                tx_dt = datetime.fromisoformat(tx_dt_raw)
            except Exception:
                tx_dt = datetime.utcnow()
        elif isinstance(tx_dt_raw, datetime):
            tx_dt = tx_dt_raw
        else:
            tx_dt = datetime.utcnow()
        tx_hour = tx_dt.hour
        hour_diff = 0 if start_h <= tx_hour <= end_h else min(abs(tx_hour - start_h), abs(tx_hour - end_h))

        is_new_rec = not transaction_data.get("is_known_recipient", False)
        is_new_dev = not transaction_data.get("is_known_device", True)
        is_new_loc = transaction_data.get("location_region", "") not in profile_data.get("usual_regions", [])
        fails = int(transaction_data.get("failed_attempts_recent", 0))

        return AnomalyModel.get_instance().predict_anomaly_score(
            amount_ratio=amount_ratio,
            hour_deviation=hour_diff,
            is_new_recipient=is_new_rec,
            is_new_device=is_new_dev,
            is_new_location=is_new_loc,
            failed_attempts=fails
        )
