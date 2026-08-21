"""
SQLAlchemy ORM models for IntentGuard
"""
import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from backend.app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    persona = Column(String(64), nullable=False) # student, salaried_professional, shopkeeper, freelancer
    upi_handle = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id = Column(String(64), ForeignKey("users.user_id"), primary_key=True, index=True)
    median_amount = Column(Float, nullable=False, default=1000.0)
    mad_amount = Column(Float, nullable=False, default=500.0)
    p90_amount = Column(Float, nullable=False, default=2500.0)
    p95_amount = Column(Float, nullable=False, default=5000.0)
    max_amount = Column(Float, nullable=False, default=10000.0)
    usual_start_hour = Column(Integer, default=8)
    usual_end_hour = Column(Integer, default=22)
    known_recipients_json = Column(Text, default="[]")
    known_devices_json = Column(Text, default="[]")
    usual_regions_json = Column(Text, default="[]")
    transaction_count = Column(Integer, default=0)
    profile_status = Column(String(32), default="ESTABLISHED") # LEARNING, ESTABLISHED
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.user_id"), index=True, nullable=False)
    recipient_id = Column(String(64), nullable=False)
    recipient_name = Column(String(128), nullable=False)
    recipient_upi = Column(String(128), nullable=False)
    amount = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    device_id = Column(String(64), nullable=False)
    location_region = Column(String(64), nullable=False)
    is_known_recipient = Column(Boolean, default=False)
    is_known_device = Column(Boolean, default=True)
    failed_attempts_recent = Column(Integer, default=0)
    status = Column(String(32), default="PENDING") # PENDING, ALLOWED, CONFIRMED, ESCALATED, CANCELLED

class RiskEvent(Base):
    __tablename__ = "risk_events"

    event_id = Column(String(64), primary_key=True, index=True)
    transaction_id = Column(String(64), index=True, nullable=False)
    user_id = Column(String(64), index=True, nullable=False)
    risk_score = Column(Integer, nullable=False)
    risk_band = Column(String(32), nullable=False) # LOW, MEDIUM, HIGH, VERY_HIGH
    policy_action = Column(String(32), nullable=False) # ALLOW, INFORM, CONFIRM, ESCALATE
    signals_json = Column(Text, nullable=False) # JSON list of signal dicts
    reasons_json = Column(Text, nullable=False) # JSON list of string reasons
    reasons_hi_json = Column(Text, nullable=True) # Hindi translations
    anomaly_score = Column(Float, default=0.0) # IsolationForest anomaly indicator
    policy_version = Column(String(32), nullable=False)
    evaluated_at = Column(DateTime, default=datetime.datetime.utcnow)
    latency_ms = Column(Float, default=0.0)
    is_simulation = Column(Boolean, default=True)

class IntentContext(Base):
    __tablename__ = "intent_contexts"

    intent_id = Column(String(64), primary_key=True, index=True)
    transaction_id = Column(String(64), index=True, nullable=False)
    category = Column(String(64), nullable=False) # PURCHASE, RENT_BILL, FAMILY_FRIEND, MEDICAL_EMERGENCY, INVESTMENT, OTHER
    free_text = Column(Text, nullable=True)
    extracted_relationship = Column(String(64), nullable=True)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class FeedbackRecord(Base):
    __tablename__ = "feedback_records"

    feedback_id = Column(String(64), primary_key=True, index=True)
    transaction_id = Column(String(64), index=True, nullable=False)
    user_id = Column(String(64), index=True, nullable=False)
    user_action = Column(String(32), nullable=False) # CONTINUED, CANCELLED, ESCALATED
    is_intentional = Column(Boolean, default=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class TrustedPattern(Base):
    __tablename__ = "trusted_patterns"

    pattern_id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.user_id"), index=True, nullable=False)
    title = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)
    typical_amount = Column(Float, nullable=False)
    frequency = Column(String(64), nullable=False) # Monthly, Weekly, Daily
    recipient_id = Column(String(64), nullable=True)
    status = Column(String(32), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
