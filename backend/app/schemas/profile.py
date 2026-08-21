"""
Pydantic schemas for User and User Profile
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class TrustedPatternSchema(BaseModel):
    pattern_id: str
    title: str
    category: str
    typical_amount: float
    frequency: str
    recipient_id: Optional[str] = None
    status: str

class UserProfileSchema(BaseModel):
    user_id: str
    name: str
    persona: str
    upi_handle: str
    median_amount: float
    mad_amount: float
    p90_amount: float
    p95_amount: float
    max_amount: float
    usual_start_hour: int
    usual_end_hour: int
    known_recipient_count: int = 0
    known_device_count: int = 0
    known_recipients: List[Dict[str, Any]] = []
    known_devices: List[str] = []
    usual_regions: List[str] = []
    transaction_count: int = 0
    profile_status: str = "ESTABLISHED"
    trusted_patterns: List[TrustedPatternSchema] = []
    simulation: bool = True
