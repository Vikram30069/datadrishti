"""
Pydantic schemas for Transaction and Intent
"""
from typing import Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field, model_validator

class TransactionCreate(BaseModel):
    transaction_id: Optional[str] = None
    user_id: str = "U102"
    recipient_id: Optional[str] = "R991"
    recipient_name: Optional[str] = "Amit Kumar"
    recipient_upi: Optional[str] = "amit@upi"
    amount: float = Field(..., gt=0)
    timestamp: Optional[datetime] = None
    device_id: Optional[str] = "DEV_UNKNOWN"
    location_region: Optional[str] = "Mumbai"
    is_known_recipient: Optional[bool] = None
    is_known_device: Optional[bool] = None
    failed_attempts_recent: int = 0
    idempotency_key: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def unpack_nested_transaction(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "transaction" in data and isinstance(data["transaction"], dict):
                inner = dict(data["transaction"])
                for k, v in data.items():
                    if k != "transaction" and k not in inner:
                        inner[k] = v
                return inner
        return data

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
