"""
Twilio Escalation Service for IntentGuard Prototype.
Supports Out-of-Band WhatsApp Alerts, Automated Voice Calls (TwiML TTS), and SMS.
Implements authoritative backend state machine:
PENDING_VERIFICATION -> VERIFYING -> VERIFIED / REJECTED / CANCELLED -> COMPLETED
"""
import os
import uuid
import html
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
                '<?xml version="1.0" encoding="UTF-8"?>\n'
                '<Response>\n'
                '  <Say language="en-IN">Thank you. Your identity has been verified. You may now proceed on your screen.</Say>\n'
                '</Response>'
            )
        elif decision == "NO":
            twiml_reply = (
                '<?xml version="1.0" encoding="UTF-8"?>\n'
                '<Response>\n'
                '  <Say language="en-IN">Payment cancelled immediately for your protection. Your account is secure.</Say>\n'
                '</Response>'
            )
        else:
            # Unclear speech - keep PENDING_VERIFICATION and retry
            action_attr = f' action="{settings.PUBLIC_WEBHOOK_URL.rstrip("/")}/api/v1/escalation/voice-webhook?transaction_id={transaction_id}" method="POST"' if settings.PUBLIC_WEBHOOK_URL else ""
            twiml_reply = (
                f'<?xml version="1.0" encoding="UTF-8"?>\n'
                f'<Response>\n'
                f'  <Say language="en-IN">We could not clearly verify your response. Please press 1 to cancel the payment, or press 2 to verify and approve it.</Say>\n'
                f'  <Gather input="speech dtmf" timeout="6" speechTimeout="auto"{action_attr} hints="yes, no, cancel, approve, 1, 2" language="en-IN">\n'
                f'    <Say language="en-IN">Press 1 to cancel. Press 2 to approve.</Say>\n'
                f'  </Gather>\n'
                f'  <Say language="en-IN">No input received. The payment remains paused. Stay safe with Paytm IntentGuard.</Say>\n'
                f'</Response>'
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
            reply_msg = "⚠️ *Paytm IntentGuard*: We couldn't clearly verify your response.\n\nPlease reply:\n• *YES*, to confirm this payment\n• *NO*, to cancel and protect your account."

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
        channel: str,
        recipient_name: str,
        amount: float,
        to_phone: Optional[str] = None,
        user_name: str = "Vikram Verma",
        transaction_id: str = "TXN_DEMO_D"
    ) -> Dict[str, Any]:
        """
        Dispatches real-time live out-of-band escalation via Twilio
        or produces realistic simulation payload if Twilio is unconfigured.
        """
        target_phone = to_phone or settings.DEMO_USER_PHONE_NUMBER
        safe_recipient = html.escape(str(recipient_name))
        safe_user = html.escape(str(user_name))

        # Ensure session is created and updated to VERIFYING state
        cls.get_or_create_session(transaction_id=transaction_id, amount=amount, recipient_name=recipient_name, channel=channel)
        cls.update_session(transaction_id=transaction_id, status="VERIFYING", channel=channel)

        # 1. WHATSAPP ALERT
        if channel.lower() == "whatsapp":
            body = (
                f"🛡️ *Paytm IntentGuard Security Alert*\n\n"
                f"Hello {user_name},\n"
                f"An unusual payment of *₹{amount:,.2f}* to *{recipient_name}* was initiated "
                f"and differs significantly from your usual activity.\n\n"
                f"Did you initiate this payment?\n\n"
                f"Reply *YES* to confirm.\n"
                f"Reply *NO* to cancel."
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
            action_attr = f' action="{settings.PUBLIC_WEBHOOK_URL.rstrip("/")}/api/v1/escalation/voice-webhook?transaction_id={transaction_id}" method="POST"' if settings.PUBLIC_WEBHOOK_URL else ""
            twiml_content = (
                f'<?xml version="1.0" encoding="UTF-8"?>\n'
                f'<Response>\n'
                f'  <Pause length="1"/>\n'
                f'  <Say language="en-IN">'
                f'This is a Paytm IntentGuard security verification. '
                f'A payment of rupees {int(amount):,} to {safe_recipient} requires verification. '
                f'Did you initiate this payment? '
                f'Please say YES to approve, or say NO to cancel. '
                f'You can also press 1 to cancel, or press 2 to approve.'
                f'</Say>\n'
                f'  <Gather input="speech dtmf" timeout="7" speechTimeout="auto"{action_attr} hints="yes, no, cancel, approve, 1, 2" language="en-IN">\n'
                f'    <Say language="en-IN">Please answer YES or NO, or press 1 to cancel, 2 to approve.</Say>\n'
                f'  </Gather>\n'
                f'  <Pause length="1"/>\n'
                f'  <Say language="en-IN">We did not receive your confirmation. The payment remains paused. Stay safe with Paytm IntentGuard.</Say>\n'
                f'</Response>'
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
