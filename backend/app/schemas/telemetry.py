"""
Pydantic schemas for Telemetry, Feedback, Dashboard, and Simulation
"""
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.app.schemas.evaluation import RiskEvaluationResponse

class FeedbackCreate(BaseModel):
    user_id: str
    transaction_id: str
    user_action: str # "ALLOWED", "CANCELLED", "CONTINUED"
    is_intentional: bool

FeedbackCreateSchema = FeedbackCreate

class RiskEventSummary(BaseModel):
    event_id: str
    transaction_id: str
    user_id: str
    user_name: str
    recipient_name: str
    amount: float
    risk_score: int
    risk_band: str
    policy_action: str
    evaluated_at: datetime
    latency_ms: float

class DashboardMetrics(BaseModel):
    transactions_evaluated: int
    warnings_shown: int
    simulated_cancellations: int
    simulated_continuations: int
    escalations_triggered: int
    avg_evaluation_latency_ms: float
    risk_distribution: Dict[str, int]
    recent_events: List[RiskEventSummary] = []
    is_simulation: bool = True
    note: str = "All metrics are measured from simulated hackathon transactions."

DashboardMetricsSchema = DashboardMetrics

class ScenarioTriggerRequest(BaseModel):
    scenario_id: str # scenario_a, scenario_b, scenario_c, scenario_d
    custom_amount: Optional[float] = None
    custom_recipient_name: Optional[str] = None
