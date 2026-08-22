"""
Twilio Escalation Service for IntentGuard Prototype.
Supports Out-of-Band WhatsApp Alerts, Automated Voice Calls (TwiML TTS), and SMS.
Implements authoritative backend state machine:
PENDING_VERIFICATION -> VERIFYING -> VERIFIED / REJECTED / CANCELLED -> COMPLETED
"""
import os
import uuid
import datetime
from typing import Dict, Any, Optional
from backend.app.config import settings
from backend.app.services.verification_service import VerificationResponseService

# Attempt import of Twilio client
try:
    from twilio.rest import Client
    TWILIO_LIB_AVAILABLE = True
except ImportError:
    TWILIO_LIB_AVAILABLE = False


# In-memory Authoritative Escalation Session Store
ESCALATION_SESSIONS: Dict[str, Dict[str, Any]] = {}


class TwilioEscalationService:
    @classmethod
    def is_live_configured(cls) -> bool:
        """Returns True if Twilio library is installed and live credentials are set."""
        return bool(
            TWILIO_LIB_AVAILABLE
            and settings.TWILIO_ACCOUNT_SID
            and settings.TWILIO_AUTH_TOKEN
            and not settings.TWILIO_ACCOUNT_SID.startswith("AC_DEMO")
        )

    @classmethod
    def get_client(cls) -> Optional[Any]:
        if cls.is_live_configured():
            return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        return None

    @classmethod
    def get_or_create_session(

        cls,
        transaction_id: Optional[str] = None,
        amount: float = 75000.0,
        recipient_name: str = "QuickCrypto Pay",
        channel: str = "voice"
    ) -> Dict[str, Any]:
        """Delegates to VerificationResponseService."""
        return VerificationResponseService.get_or_create_session(
            transaction_id=transaction_id,
            amount=amount,
            recipient_name=recipient_name,
            channel=channel
        )

    @classmethod
    def get_session(cls, transaction_id: Optional[str] = None) -> Dict[str, Any]:
        """Delegates to VerificationResponseService."""
        return VerificationResponseService.get_session(transaction_id)


    @classmethod
    def update_session(
        cls,
        transaction_id: str,
        status: str,
        method: Optional[str] = None,
        raw_input: Optional[str] = None,
        channel: Optional[str] = None
    ) -> Dict[str, Any]:
        """Updates session state in VerificationResponseService."""
        session = VerificationResponseService.get_or_create_session(transaction_id)
        if session.get("verification_status") == "COMPLETED":
            return session
        if session.get("verification_status") in ["CANCELLED", "REJECTED"] and status not in ["CANCELLED", "REJECTED"]:
            return session

        session["verification_status"] = status
        if method:
            session["verification_method"] = method.upper()
        if channel:
            session["channel"] = channel
        if raw_input:
            session["raw_input"] = raw_input
            session["verification_response"] = raw_input

        if status == "VERIFIED":
            session["action_taken"] = "PROCEED_ENABLED"
            session["verification_timestamp"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        elif status in ["REJECTED", "CANCELLED"]:
            session["action_taken"] = "CANCEL_PAYMENT"
            session["verification_timestamp"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        elif status == "COMPLETED":
            session["action_taken"] = "PAYMENT_COMPLETED"
        elif status == "VERIFYING":
            session["action_taken"] = "AWAITING_USER_RESPONSE"

        session["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        from backend.app.services.verification_service import VERIFICATION_SESSIONS
        VERIFICATION_SESSIONS[transaction_id] = session
        VERIFICATION_SESSIONS["latest"] = session
        return session

    @classmethod
    def complete_transaction(cls, transaction_id: str) -> Dict[str, Any]:
        """Delegates to VerificationResponseService."""
        return VerificationResponseService.complete_transaction(transaction_id)

    @classmethod
    def process_voice_response(
        cls,
        speech_result: Optional[str] = None,
        digits: Optional[str] = None,
        transaction_id: str = "TXN_DEMO_D"
    ) -> Dict[str, Any]:
        """
        Parses speech transcription or pressed digits from Twilio automated voice call
        using unified Groq verification classifier.
        """
        # Map keypad digits: 1 -> "No, cancel it", 2 -> "Yes, authorize it"
        digit_str = str(digits or "").strip()
        if digit_str == "1":
            user_input = "No, cancel the payment."
        elif digit_str == "2":
            user_input = "Yes, I initiate this payment."
        else:
            user_input = f"{speech_result or ''}".strip()

        result = VerificationResponseService.process_verification_response(
            transaction_id=transaction_id,
            channel="VOICE",
            response_text=user_input
        )

        decision = result.get("decision", "UNCLEAR")
        session = result.get("session")

        if decision == "YES":
            twiml_reply = (
                "<Response>"
                "<Say voice='alice' language='en-IN'>Thank you. Your identity has been verified. You may now proceed on your screen.</Say>"
                "</Response>"
            )
        elif decision == "NO":
            twiml_reply = (
                "<Response>"
                "<Say voice='alice' language='en-IN'>Payment cancelled immediately for your protection. Your account is secure.</Say>"
                "</Response>"
            )
        else:
            # Unclear speech - keep PENDING_VERIFICATION and retry
            action_attr = f" action='{settings.PUBLIC_WEBHOOK_URL.rstrip('/')}/api/v1/escalation/voice-webhook?transaction_id={transaction_id}'" if settings.PUBLIC_WEBHOOK_URL else ""
            twiml_reply = (
                f"<Response>"
                f"<Say voice='alice' language='en-IN'>We could not clearly verify your response. Please say YES, I initiated this payment, or say NO, I did not initiate this payment.</Say>"
                f"<Gather input='speech dtmf' timeout='5' speechTimeout='auto'{action_attr} hints='yes, no, block, cancel, authorize, 1, 2' language='en-IN'>"
                f"<Say voice='alice' language='en-IN'>Please answer YES or NO.</Say>"
                f"</Gather>"
                f"</Response>"
            )

        return {
            "session": session,
            "twiml": twiml_reply,
            "status": session.get("verification_status") if session else "PENDING_VERIFICATION",
            "decision": decision,
            "confidence": result.get("confidence", 0.0),
            "reason": result.get("reason", "")
        }

    @classmethod
    def process_whatsapp_response(
        cls,
        body: str,
        from_phone: str,
        transaction_id: str = "TXN_DEMO_D"
    ) -> Dict[str, Any]:
        """
        Parses incoming WhatsApp reply using unified Groq verification classifier.
        """
        result = VerificationResponseService.process_verification_response(
            transaction_id=transaction_id,
            channel="WHATSAPP",
            response_text=body
        )

        decision = result.get("decision", "UNCLEAR")
        session = result.get("session")

        if decision == "YES":
            reply_msg = "✅ *Identity Verified*\nThank you! Your payment has been verified via WhatsApp. You may now tap Proceed on your screen."
        elif decision == "NO":
            reply_msg = "🛑 *Payment Cancelled*\nIntentGuard received a NO response. The payment has been cancelled for your protection. Zero funds debited."
        else:
            reply_msg = "❓ *Paytm IntentGuard*: We couldn't clearly verify your response.\n\nPlease reply:\n• *YES*, to confirm this payment\n• *NO*, to cancel and protect your account."

        return {
            "session": session,
            "reply_message": reply_msg,
            "status": session.get("verification_status") if session else "PENDING_VERIFICATION",
            "decision": decision,
            "confidence": result.get("confidence", 0.0),
            "reason": result.get("reason", "")
        }

    @classmethod
    def trigger_escalation(
        cls,
        channel: str,  # "whatsapp", "voice", "sms"

        recipient_name: str,
        amount: float,
        to_phone: Optional[str] = None,
        user_name: str = "Vikram Verma",
        transaction_id: str = "TXN_DEMO_D"
    ) -> Dict[str, Any]:
        """
        Dispatches an out-of-band escalation via WhatsApp, Automated Voice Call, or SMS.
        Authoritatively transitions state to VERIFYING.
        """
        target_phone = to_phone or settings.DEMO_USER_PHONE_NUMBER
        now_str = datetime.datetime.now().strftime("%I:%M %p")

        # Initialize or update session state as VERIFYING
        cls.update_session(
            transaction_id=transaction_id,
            status="VERIFYING",
            method=channel.upper(),
            raw_input=f"Dispatched {channel} alert",
            channel=channel
        )

        if channel.lower() == "whatsapp":
            body = (
                f"PAYTM INTENTGUARD 🛡️\n\n"
                f"A ₹{int(amount):,} payment to {recipient_name}\n"
                f"requires additional verification.\n\n"
                f"The payment was initiated at {now_str}\n"
                f"and differs significantly from your usual activity.\n\n"
                f"Did you initiate this payment?\n\n"
                f"Reply YES to confirm.\n"
                f"Reply NO to cancel."
            )

            if cls.is_live_configured():
                try:
                    client = cls.get_client()
                    formatted_to = target_phone if target_phone.startswith("whatsapp:") else f"whatsapp:{target_phone}"
                    from_wa = settings.TWILIO_WHATSAPP_FROM if settings.TWILIO_WHATSAPP_FROM.startswith("whatsapp:") else f"whatsapp:{settings.TWILIO_WHATSAPP_FROM}"
                    msg = client.messages.create(
                        from_=from_wa,
                        to=formatted_to,
                        body=body
                    )
                    return {
                        "status": "delivered",
                        "mode": "live",
                        "channel": "whatsapp",
                        "sid": msg.sid,
                        "to": target_phone,
                        "message": body,
                        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                        "note": f"Live WhatsApp message sent via Twilio to {target_phone}."
                    }
                except Exception as e:
                    return {
                        "status": "fallback_simulated",
                        "mode": "simulation",
                        "channel": "whatsapp",
                        "sid": f"SM_{uuid.uuid4().hex[:16]}",
                        "to": target_phone,
                        "message": body,
                        "error_detail": str(e),
                        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                        "note": f"Simulated delivery (Twilio error: {str(e)})."
                    }

            # Simulated WhatsApp
            return {
                "status": "delivered",
                "mode": "simulation",
                "channel": "whatsapp",
                "sid": f"WA_SIM_{uuid.uuid4().hex[:16]}",
                "to": target_phone,
                "message": body,
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "note": f"Simulated WhatsApp message delivered to {target_phone} (Demo Mode)."
            }

        # 2. AUTOMATED VOICE CALL
        elif channel.lower() == "voice":
            action_attr = f" action='{settings.PUBLIC_WEBHOOK_URL.rstrip('/')}/api/v1/escalation/voice-webhook?transaction_id={transaction_id}'" if settings.PUBLIC_WEBHOOK_URL else ""
            twiml_content = (
                f"<Response>"
                f"<Pause length='1'/>"
                f"<Say voice='alice' language='en-IN'>"
                f"This is a Paytm IntentGuard security verification. "
                f"A payment of rupees {int(amount):,} to {recipient_name} requires verification. "
                f"Did you initiate this payment? "
                f"Please answer YES or NO."
                f"</Say>"
                f"<Gather input='speech dtmf' timeout='6' speechTimeout='auto'{action_attr} hints='yes, no, block, freeze, cancel, authorize, one, two, 1, 2' language='en-IN'>"
                f"<Say voice='alice' language='en-IN'>Please answer YES or NO.</Say>"
                f"</Gather>"
                f"<Pause length='1'/>"
                f"<Say voice='alice' language='en-IN'>We did not receive your confirmation. The payment remains paused. Stay safe with Paytm IntentGuard.</Say>"
                f"</Response>"
            )


            if cls.is_live_configured():
                try:
                    client = cls.get_client()
                    call = client.calls.create(
                        twiml=twiml_content,
                        to=target_phone,
                        from_=settings.TWILIO_FROM_PHONE
                    )
                    return {
                        "status": "initiated",
                        "mode": "live",
                        "channel": "voice",
                        "sid": call.sid,
                        "to": target_phone,
                        "twiml_preview": f"Spoken warning: 'Unusual transfer of ₹{amount:,.0f} to {recipient_name}'",
                        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                        "note": f"Live automated call placed to {target_phone}."
                    }
                except Exception as e:
                    return {
                        "status": "fallback_simulated",
                        "mode": "simulation",
                        "channel": "voice",
                        "sid": f"CA_{uuid.uuid4().hex[:16]}",
                        "to": target_phone,
                        "twiml_preview": f"Spoken warning: 'Unusual transfer of ₹{amount:,.0f} to {recipient_name}'",
                        "error_detail": str(e),
                        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                        "note": f"Simulated call placed (Twilio error: {str(e)})."
                    }

            # Simulated Call
            return {
                "status": "initiated",
                "mode": "simulation",
                "channel": "voice",
                "sid": f"CA_SIM_{uuid.uuid4().hex[:16]}",
                "to": target_phone,
                "twiml_preview": f"Voice synthesis: 'Hello {user_name}, Paytm IntentGuard detected an unusual payment of ₹{amount:,.0f} to {recipient_name}...' (Say YES to Verify, Say NO to Cancel)",
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "note": f"Simulated Automated Voice Call ringing on {target_phone}."
            }

        # 3. SMS ALERT
        else:
            sms_body = (
                f"Paytm IntentGuard Alert: Unusual payment of ₹{amount:,.2f} to {recipient_name} detected. "
                f"Reply YES to verify or NO to cancel."
            )

            if cls.is_live_configured():
                try:
                    client = cls.get_client()
                    msg = client.messages.create(
                        from_=settings.TWILIO_FROM_PHONE,
                        to=target_phone,
                        body=sms_body
                    )
                    return {
                        "status": "delivered",
                        "mode": "live",
                        "channel": "sms",
                        "sid": msg.sid,
                        "to": target_phone,
                        "message": sms_body,
                        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                        "note": f"Live SMS sent to {target_phone}."
                    }
                except Exception as e:
                    return {
                        "status": "fallback_simulated",
                        "mode": "simulation",
                        "channel": "sms",
                        "sid": f"SM_{uuid.uuid4().hex[:16]}",
                        "to": target_phone,
                        "message": sms_body,
                        "error_detail": str(e),
                        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                        "note": f"Simulated SMS (Twilio error: {str(e)})."
                    }

            # Simulated SMS
            return {
                "status": "delivered",
                "mode": "simulation",
                "channel": "sms",
                "sid": f"SM_SIM_{uuid.uuid4().hex[:16]}",
                "to": target_phone,
                "message": sms_body,
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "note": f"Simulated SMS alert sent to {target_phone}."
            }

