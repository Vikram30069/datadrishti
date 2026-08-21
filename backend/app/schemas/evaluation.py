"""
Pydantic schemas for Risk Evaluation, Intent, and Feedback
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.app.schemas.transaction import TransactionCreate

class SignalContribution(BaseModel):
    name: str
    display_name: str
    score: int
    max_points: int
    severity: str # LOW, MEDIUM, HIGH
    reason: str
    reason_hi: Optional[str] = None

class IntentContextSchema(BaseModel):
    category: str # PURCHASE, RENT_BILL, FAMILY_FRIEND, MEDICAL_EMERGENCY, INVESTMENT, OTHER
    free_text: Optional[str] = None
    extracted_relationship: Optional[str] = None
    confidence: float = 1.0

class RiskEvaluationRequest(BaseModel):
    transaction: TransactionCreate
    intent: Optional[IntentContextSchema] = None

class RiskEvaluationResponse(BaseModel):
    event_id: str
    user_id: str
    transaction_id: str
    risk_score: int = Field(..., ge=0, le=100)
    risk_band: str # LOW, MEDIUM, HIGH, VERY_HIGH
    policy_action: str # ALLOW, INFORM, CONFIRM, ESCALATE
    signals: List[SignalContribution]
    reason_codes: List[str]
    explanation_en: str
    explanation_hi: str
    model_anomaly_score: float = 0.0
    policy_version: str
    evaluated_at: datetime
    latency_ms: float
    is_simulation: bool = True
    disclaimer: str = (
        "Simulated hackathon experience. No real payments, UPI PINs, OTPs, or bank credentials are used."
    )

class IntentExtractRequest(BaseModel):
    transaction_id: Optional[str] = None
    free_text: str

class IntentExtractResponse(BaseModel):
    category: str
    category_display: str
    extracted_relationship: Optional[str] = None
    extracted_keywords: List[str] = []
    confidence: float
    context_note: str

class FeedbackSubmission(BaseModel):
    transaction_id: str
    user_id: str
    user_action: str # CONTINUED, CANCELLED, ESCALATED
    is_intentional: bool = True
    note: Optional[str] = None

class FeedbackResponse(BaseModel):
    feedback_id: str
    transaction_id: str
    status: str
    message: str
    recorded_at: datetime
