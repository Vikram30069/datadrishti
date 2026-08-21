"""
Application Configuration for IntentGuard
"""
import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    model_config = ConfigDict(case_sensitive=True)

    PROJECT_NAME: str = "Paytm IntentGuard Concept Prototype"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./intentguard.db")
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

settings = Settings()
