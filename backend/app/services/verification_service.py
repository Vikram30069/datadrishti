"""
Authoritative Verification Response Service for IntentGuard.

Handles the shared state machine and verification pipeline for BOTH
WhatsApp and Voice Call channels using Groq natural language classification.
"""
import datetime
import logging
from typing import Dict, Any, Optional

from backend.app.services.groq_classifier import GroqVerificationClassifier

logger = logging.getLogger("intentguard.verification_service")

# In-memory authoritative store for verification sessions
# Keyed by transaction_id
VERIFICATION_SESSIONS: Dict[str, Dict[str, Any]] = {}
DEFAULT_EXPIRATION_SECONDS = 300  # 5 minutes


class VerificationResponseService:
    """
    Unified backend verification engine.
    Processes user responses across WhatsApp, Voice Call (TTS), and Demo controls.
    """

    @classmethod
    def get_or_create_session(
        cls,
        transaction_id: Optional[str] = None,
        amount: float = 75000.0,
        recipient_name: str = "QuickCrypto Pay",
        user_id: str = "U102",
        channel: str = "voice"
    ) -> Dict[str, Any]:
        """Initializes or retrieves an active verification session."""
        txn_id = transaction_id or "TXN_DEMO_D"
        now = datetime.datetime.now(datetime.timezone.utc)
        expires_at = now + datetime.timedelta(seconds=DEFAULT_EXPIRATION_SECONDS)

        if txn_id not in VERIFICATION_SESSIONS:
            VERIFICATION_SESSIONS[txn_id] = {
                "transaction_id": txn_id,
                "user_id": user_id,
                "verification_status": "PENDING_VERIFICATION",
                "verification_method": channel.upper(),
                "verification_timestamp": None,
                "verification_response": None,
                "amount": amount,
                "recipient_name": recipient_name,
                "channel": channel,
                "raw_input": None,
                "action_taken": "AWAITING_USER_RESPONSE",
                "groq_decision": None,
                "groq_confidence": 0.0,
                "groq_reason": None,
                "created_at": now.isoformat(),
                "expires_at": expires_at.isoformat(),
                "updated_at": now.isoformat()
            }
        return VERIFICATION_SESSIONS[txn_id]

    @classmethod
    def get_session(cls, transaction_id: Optional[str] = None) -> Dict[str, Any]:
        """Returns the authoritative verification status for a given transaction_id."""
        if transaction_id:
            if transaction_id in VERIFICATION_SESSIONS:
                session = VERIFICATION_SESSIONS[transaction_id]
                cls._check_expiration(session)
                return session
            return cls.get_or_create_session(transaction_id)

        if "latest" in VERIFICATION_SESSIONS:
            latest = VERIFICATION_SESSIONS["latest"]
            cls._check_expiration(latest)
            return latest

        return cls.get_or_create_session("TXN_DEMO_D")


    @classmethod
    def _check_expiration(cls, session: Dict[str, Any]) -> None:
        """Marks session EXPIRED if past expiration window and not completed."""
        if session.get("verification_status") in ["COMPLETED", "CANCELLED", "REJECTED"]:
            return
        expires_str = session.get("expires_at")
        if expires_str:
            try:
                expires_at = datetime.datetime.fromisoformat(expires_str)
                now = datetime.datetime.now(datetime.timezone.utc)
                if now > expires_at:
                    session["verification_status"] = "EXPIRED"
                    session["action_taken"] = "VERIFICATION_EXPIRED"
                    session["updated_at"] = now.isoformat()
            except Exception:
                pass

    @classmethod
    def process_verification_response(
        cls,
        transaction_id: str,
        channel: str,
        response_text: str,
        user_id: str = "U102"
    ) -> Dict[str, Any]:
        """
        Single entry point for WhatsApp, Voice Call, and Demo responses.
        1. Classifies user text with Groq (or fallback).
        2. Applies confidence threshold (>= 0.85).
        3. Updates backend state machine authoritatively.
        """
        session = cls.get_or_create_session(transaction_id, user_id=user_id, channel=channel)
        cls._check_expiration(session)

        # Invariant 1: Terminal states cannot be altered
        current_status = session.get("verification_status")
        if current_status == "COMPLETED":
            return {
                "session": session,
                "decision": "COMPLETED",
                "message": "Transaction has already been completed."
            }
        if current_status in ["CANCELLED", "REJECTED"]:
            return {
                "session": session,
                "decision": "CANCELLED",
                "message": "Transaction has already been cancelled and cannot be reopened."
            }
        if current_status == "EXPIRED":
            return {
                "session": session,
                "decision": "EXPIRED",
                "message": "Verification request has expired. Please initiate a new request."
            }

        # Run Groq natural language classification
        groq_result = GroqVerificationClassifier.classify_response(response_text)
        decision = groq_result.get("decision", "UNCLEAR")
        confidence = groq_result.get("confidence", 0.0)
        reason = groq_result.get("reason", "")

        session["groq_decision"] = decision
        session["groq_confidence"] = confidence
        session["groq_reason"] = reason
        session["raw_input"] = response_text
        session["verification_response"] = decision
        session["verification_method"] = channel.upper()
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        session["updated_at"] = now_iso

        if decision == "YES":
            session["verification_status"] = "VERIFIED"
            session["action_taken"] = "PROCEED_ENABLED"
            session["verification_timestamp"] = now_iso
        elif decision == "NO":
            session["verification_status"] = "REJECTED"
            session["action_taken"] = "CANCEL_PAYMENT"
            session["verification_timestamp"] = now_iso
        else:  # UNCLEAR
            session["verification_status"] = "PENDING_VERIFICATION"
            session["action_taken"] = "AWAITING_USER_RESPONSE"

        VERIFICATION_SESSIONS[transaction_id] = session
        VERIFICATION_SESSIONS["latest"] = session

        logger.info(
            f"[IntentGuard Verification] Txn: {transaction_id} | Channel: {channel} | "
            f"Input: '{response_text}' -> Groq Decision: {decision} (conf: {confidence:.2f}) -> Status: {session['verification_status']}"
        )

        return {
            "session": session,
            "decision": decision,
            "confidence": confidence,
            "reason": reason,
            "verification_status": session["verification_status"],
            "action_taken": session["action_taken"]
        }

    @classmethod
    def complete_transaction(cls, transaction_id: str) -> Dict[str, Any]:
        """
        Authoritatively finalizes the transaction ONLY if verification_status is VERIFIED.
        Raises ValueError otherwise.
        """
        session = cls.get_session(transaction_id)
        if session.get("verification_status") != "VERIFIED":
            raise ValueError(
                f"Cannot complete payment for transaction '{transaction_id}'. "
                f"Authoritative verification status is '{session.get('verification_status')}', not 'VERIFIED'."
            )
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        session["verification_status"] = "COMPLETED"
        session["action_taken"] = "PAYMENT_COMPLETED"
        session["updated_at"] = now_iso
        VERIFICATION_SESSIONS[transaction_id] = session
        VERIFICATION_SESSIONS["latest"] = session
        return session
