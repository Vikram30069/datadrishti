"""
Pydantic schemas for Transaction and Intent
"""
from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime

class TransactionCreate(BaseModel):
    transaction_id: Optional[str] = None
    user_id: str
    recipient_id: str
    recipient_name: str
    recipient_upi: str
    amount: float = Field(..., gt=0)
    timestamp: Optional[datetime] = None
    device_id: str
    location_region: str
    is_known_recipient: Optional[bool] = None
    is_known_device: Optional[bool] = None
    failed_attempts_recent: int = 0
    idempotency_key: Optional[str] = None

# Aliases for routes
TransactionCreateSchema = TransactionCreate

class IntentExtractRequest(BaseModel):
    text: Optional[str] = None
    free_text: Optional[str] = None

    @model_validator(mode="after")
    def populate_text(self):
        if not self.text and self.free_text:
            self.text = self.free_text
        elif not self.text and not self.free_text:
            self.text = ""
        return self

IntentExtractRequestSchema = IntentExtractRequest

class TransactionResponse(BaseModel):
    transaction_id: str
    user_id: str
    recipient_id: str
    recipient_name: str
    recipient_upi: str
    amount: float
    timestamp: datetime
    device_id: str
    location_region: str
    is_known_recipient: bool
    is_known_device: bool
    failed_attempts_recent: int
    status: str
    simulation: bool = True
