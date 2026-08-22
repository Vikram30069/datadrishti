"""
Application Configuration for IntentGuard
"""
import os
from pydantic_settings import BaseSettings, SettingsConfigDict

def _get_default_db_url() -> str:
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        return "sqlite:////tmp/intentguard.db"
    return "sqlite:///./intentguard.db"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )

    PROJECT_NAME: str = "Paytm IntentGuard Concept Prototype"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    DATABASE_URL: str = _get_default_db_url()
    SIMULATION_DISCLAIMER: str = (
        "Simulated hackathon experience. No real payments, UPI PINs, OTPs, or bank credentials are used."
    )
    POLICY_VERSION: str = "2026.08.1-calibrated"
    
    # 100-Point Calibrated Weights
    WEIGHT_AMOUNT_ANOMALY: int = 30
    WEIGHT_NEW_RECIPIENT: int = 20
    WEIGHT_TIME_ANOMALY: int = 15
    WEIGHT_NEW_DEVICE: int = 20
    WEIGHT_LOCATION_ANOMALY: int = 10
    WEIGHT_VELOCITY_ANOMALY: int = 5
    
    # Authoritative Policy Thresholds
    # 0..30  -> ALLOW (Seamless)
    # 31..55 -> INFORM (Calm banner)
    # 56..79 -> CONFIRM (Intervention Screen & Intent check)
    # 80..100-> ESCALATE (Security cooldown)
    THRESHOLD_LOW_MAX: int = 30
    THRESHOLD_MEDIUM_MAX: int = 55
    THRESHOLD_HIGH_MAX: int = 79

    # Twilio Prototype Escalation Settings
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_PHONE: str = "+15005550006"
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"
    DEMO_USER_PHONE_NUMBER: str = "+916304589007"
    PUBLIC_WEBHOOK_URL: str = ""

    # Groq Verification Response Classifier Settings
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "qwen/qwen3.6-27b"

settings = Settings()
