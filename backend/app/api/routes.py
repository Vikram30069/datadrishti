"""
API route definitions for IntentGuard prototype,
including evaluation, user profile, intent analysis, telemetry,
100-persona dataset exploration, 10-scenario execution, and live streaming.
"""
import os
import json
import uuid
import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import FileResponse

from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database.connection import get_db
from backend.app.schemas.profile import UserProfileSchema
from backend.app.schemas.transaction import TransactionCreateSchema, IntentExtractRequestSchema
from backend.app.schemas.evaluation import RiskEvaluationResponse, IntentExtractResponse
from backend.app.schemas.telemetry import (
    FeedbackCreateSchema,
    DashboardMetricsSchema,
    EscalationRequestSchema,
    EscalationStatusSchema,
    EscalationSimulateSchema,
    EscalationCompleteSchema
)
from backend.app.services.profile_service import ProfileService
from backend.app.services.feature_service import FeatureService
from backend.app.services.twilio_service import TwilioEscalationService
from backend.app.risk.anomaly_model import AnomalyModelService
from backend.app.risk.engine import RiskEngine
from backend.app.policy.friction_engine import FrictionEngine
from backend.app.intent.extractor import IntentExtractor
from backend.app.explanations.generator import ExplanationGenerator
from backend.app.simulation.fixtures import SCENARIOS, PERSONAS, REGULAR_PAYEES_DATASET
from backend.app.simulation.scenario_engine import SCENARIO_DEFINITIONS, generate_scenario_transaction
from backend.app.simulation.persona_generator import generate_personas
from backend.app.simulation.dataset_exporter import DATA_DIR, export_all_datasets

router = APIRouter()

# In-memory stream tracker for live ticker
STREAM_STATE = {
    "current_index": 0,
    "seed_counter": 100
}

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "policy_version": settings.POLICY_VERSION,
        "disclaimer": settings.SIMULATION_DISCLAIMER
    }

@router.get("/recipients")
def get_regular_recipients():
    """
    Returns the comprehensive dataset of regular payees with regular amounts,
    typical payment times, and verification status.
    """
    return REGULAR_PAYEES_DATASET

@router.get("/users/{user_id}/profile", response_model=UserProfileSchema)
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    """
    Returns baseline user profile including median, MAD, percentiles,
    known recipients, and verified recurring patterns.
    """
    profile = ProfileService.get_user_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return profile

@router.post("/evaluate", response_model=RiskEvaluationResponse)
def evaluate_transaction(
    tx_in: TransactionCreateSchema,
    db: Session = Depends(get_db)
):
    """
    Core Evaluation Pipeline:
    1. Fetch user profile & baselines
    2. Extract 6 explainable features
    3. Compute ML observational anomaly score (IsolationForest)
    4. Compute deterministic 100-point risk score and reason codes
    5. Map authoritatively to policy action (ALLOW, INFORM, CONFIRM, ESCALATE)
    6. Generate plain-language English and Hindi explanations
    7. Measure and record execution latency
    """
    start_time = datetime.datetime.now(datetime.timezone.utc)

    # 1. Fetch user profile
    profile_data = ProfileService.get_user_profile(db, tx_in.user_id)
    if not profile_data:
        profile_data = PERSONAS.get(tx_in.user_id, PERSONAS["U102"])

    # 2. Extract 6 explainable signal scores
    tx_dict = tx_in.model_dump()
    signals = FeatureService.extract_features(tx_dict, profile_data)

    # 3. Observational ML anomaly score
    ml_score = AnomalyModelService.score_transaction(tx_dict, profile_data)

    # 4. Deterministic risk score & reason codes
    risk_score, reason_codes = RiskEngine.compute_risk_score(signals)

    # 5. Authoritative policy mapping
    risk_band, policy_action = FrictionEngine.resolve_policy(risk_score)

    # 6. Plain-language explanation generator
    rec_name = tx_in.recipient_name or "Recipient"
    explanation_en, explanation_hi = ExplanationGenerator.generate_explanations(
        signals=signals,
        risk_score=risk_score,
        risk_band=risk_band,
        recipient_name=rec_name,
        amount=tx_in.amount
    )

    # 7. Execution Latency
    end_time = datetime.datetime.now(datetime.timezone.utc)
    latency_ms = max(1.0, (end_time - start_time).total_seconds() * 1000)

    # Persist risk event
    event_id = f"EVT_{datetime.datetime.now().strftime('%Y%m%d%H%M%S%f')[:17]}"
    now_dt = datetime.datetime.now(datetime.timezone.utc)
    ProfileService.record_risk_event(
        db=db,
        event_id=event_id,
        user_id=tx_in.user_id,
        transaction_id=tx_in.transaction_id,
        risk_score=risk_score,
        risk_band=risk_band,
        policy_action=policy_action,
        reason_codes=reason_codes,
        signals=[s.model_dump() for s in signals],
        model_anomaly_score=ml_score,
        explanation_en=explanation_en,
        explanation_hi=explanation_hi,
        latency_ms=latency_ms,
        evaluated_at=now_dt
    )

    # If ESCALATE, initialize fresh verification session
    if policy_action == "ESCALATE":
        from backend.app.services.verification_service import VERIFICATION_SESSIONS, VerificationResponseService
        txn_id = tx_in.transaction_id or f"TXN_{event_id}"
        # Always initialize fresh session
        if txn_id in VERIFICATION_SESSIONS:
            del VERIFICATION_SESSIONS[txn_id]
        if "latest" in VERIFICATION_SESSIONS:
            del VERIFICATION_SESSIONS["latest"]
        VerificationResponseService.get_or_create_session(
            transaction_id=txn_id,
            amount=tx_in.amount,
            recipient_name=rec_name,
            user_id=tx_in.user_id
        )

    return RiskEvaluationResponse(
        event_id=event_id,
        user_id=tx_in.user_id,
        transaction_id=tx_in.transaction_id or f"TXN_{event_id}",
        risk_score=risk_score,
        risk_band=risk_band,
        policy_action=policy_action,
        signals=signals,
        reason_codes=reason_codes,
        explanation_en=explanation_en,
        explanation_hi=explanation_hi,
        model_anomaly_score=ml_score,
        policy_version=settings.POLICY_VERSION,
        evaluated_at=now_dt,
        latency_ms=latency_ms,
        is_simulation=True,
        disclaimer=settings.SIMULATION_DISCLAIMER
    )


@router.post("/intent/extract", response_model=IntentExtractResponse)
def extract_intent(intent_req: IntentExtractRequestSchema):
    """
    Extracts payment purpose, entities, and relationship context from free-text note.
    """
    text_content = intent_req.text or intent_req.free_text or ""
    return IntentExtractor.extract_intent(text_content)

@router.post("/feedback")
def submit_feedback(fb_in: FeedbackCreateSchema, db: Session = Depends(get_db)):
    """
    Records post-payment user feedback ('intentional' vs 'unintentional')
    and applies safe gradual baseline updates.
    """
    now_dt = datetime.datetime.now(datetime.timezone.utc)
    ProfileService.record_feedback(
        db=db,
        user_id=fb_in.user_id,
        transaction_id=fb_in.transaction_id,
        user_action=fb_in.user_action,
        is_intentional=fb_in.is_intentional,
        created_at=now_dt
    )

    if fb_in.is_intentional:
        ProfileService.update_profile_from_feedback(db, fb_in.user_id, fb_in.transaction_id)

    return {"status": "RECORDED", "message": "Feedback recorded safely."}

@router.get("/dashboard/metrics", response_model=DashboardMetricsSchema)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """
    Returns live telemetry metrics: transaction counts, friction rates,
    average execution latency, and recent evaluation log.
    """
    return ProfileService.get_telemetry_metrics(db)

# --------------------------------------------------------------------------
# SYNTHETIC SIMULATOR, 10 SCENARIOS, 100 PERSONAS & STREAMING API
# --------------------------------------------------------------------------

@router.get("/simulation/scenarios")
def list_simulation_scenarios():
    """
    Returns the 10 configurable scenarios matrix.
    """
    return SCENARIO_DEFINITIONS

@router.get("/simulation/personas")
def list_synthetic_personas(income_band: Optional[str] = None):
    """
    Returns the list of 100 generated user personas.
    """
    personas_path = os.path.join(DATA_DIR, "synthetic_personas.json")
    if not os.path.exists(personas_path):
        export_all_datasets()
    
    with open(personas_path, "r", encoding="utf-8") as f:
        personas = json.load(f)
    
    if income_band:
        personas = [p for p in personas if p["income_band"] == income_band]
    
    return personas

@router.get("/simulation/dataset/stats")
def get_dataset_stats():
    """
    Returns summary statistics for the 100 personas and 10,000+ transactions dataset.
    """
    tx_path = os.path.join(DATA_DIR, "synthetic_transactions.json")
    p_path = os.path.join(DATA_DIR, "synthetic_personas.json")
    
    if not os.path.exists(tx_path) or not os.path.exists(p_path):
        res = export_all_datasets()
        total_p = res["total_personas"]
        total_tx = res["total_transactions"]
    else:
        with open(p_path, "r", encoding="utf-8") as f:
            total_p = len(json.load(f))
        with open(tx_path, "r", encoding="utf-8") as f:
            total_tx = len(json.load(f))

    return {
        "total_personas": total_p,
        "total_transactions": total_tx,
        "days_history": 90,
        "scenarios_available": len(SCENARIO_DEFINITIONS),
        "export_formats": ["CSV", "JSON"],
        "max_transfer_limit": 100000.0
    }

@router.get("/simulation/stream/next")
def get_next_stream_transaction(db: Session = Depends(get_db)):
    """
    Pulls the next synthetic transaction from the 10,000+ dataset and evaluates it live
    through the IntentGuard policy engine.
    """
    tx_path = os.path.join(DATA_DIR, "synthetic_transactions.json")
    p_path = os.path.join(DATA_DIR, "synthetic_personas.json")
    if not os.path.exists(tx_path):
        export_all_datasets()

    with open(tx_path, "r", encoding="utf-8") as f:
        all_tx = json.load(f)
    with open(p_path, "r", encoding="utf-8") as f:
        all_p = {p["user_id"]: p for p in json.load(f)}

    idx = STREAM_STATE["current_index"] % len(all_tx)
    STREAM_STATE["current_index"] += 1

    sampled_tx = all_tx[idx]
    user_id = sampled_tx["user_id"]
    profile_data = all_p.get(user_id, PERSONAS["U102"])

    # Live IntentGuard evaluation
    start_time = datetime.datetime.now(datetime.timezone.utc)
    signals = FeatureService.extract_features(sampled_tx, profile_data)
    ml_score = AnomalyModelService.score_transaction(sampled_tx, profile_data)
    risk_score, reason_codes = RiskEngine.compute_risk_score(signals)
    risk_band, policy_action = FrictionEngine.resolve_policy(risk_score)
    rec_name = sampled_tx.get("recipient_name", "Recipient")
    exp_en, exp_hi = ExplanationGenerator.generate_explanations(
        signals=signals,
        risk_score=risk_score,
        risk_band=risk_band,
        recipient_name=rec_name,
        amount=sampled_tx["amount"]
    )
    end_time = datetime.datetime.now(datetime.timezone.utc)
    latency_ms = max(1.0, (end_time - start_time).total_seconds() * 1000)

    return {
        "stream_index": idx,
        "transaction": sampled_tx,
        "user_name": profile_data["name"],
        "income_band": profile_data["income_band"],
        "evaluation": {
            "risk_score": risk_score,
            "risk_band": risk_band,
            "policy_action": policy_action,
            "signals": [s.model_dump() for s in signals],
            "explanation_en": exp_en,
            "latency_ms": latency_ms
        }
    }

@router.get("/simulation/export/{target}")
def export_dataset_file(target: str, format: str = Query("json", pattern="^(json|csv)$")):
    """
    Downloads personas or transactions dataset in CSV or JSON.
    """
    if target == "personas":
        file_path = os.path.join(DATA_DIR, f"synthetic_personas.{format}")
    elif target == "transactions":
        file_path = os.path.join(DATA_DIR, f"synthetic_transactions.{format}")
    else:
        raise HTTPException(status_code=400, detail="Invalid export target. Use 'personas' or 'transactions'.")

    if not os.path.exists(file_path):
        export_all_datasets()

    media_type = "text/csv" if format == "csv" else "application/json"
    filename = f"intentguard_synthetic_{target}.{format}"
    return FileResponse(file_path, media_type=media_type, filename=filename)

@router.post("/simulation/trigger-scenario/{scenario_id}")
def trigger_simulation_scenario(scenario_id: str, db: Session = Depends(get_db)):
    """
    Triggers one of the canonical demonstration scenarios (Scenario A, B, C, D).
    """
    sc_data = SCENARIOS.get(scenario_id)
    if not sc_data:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found.")

    tx_in = TransactionCreateSchema(**sc_data["transaction"])
    return evaluate_transaction(tx_in=tx_in, db=db)

@router.post("/simulation/reset")
def reset_simulation(db: Session = Depends(get_db)):
    """
    Resets in-memory and SQLite tables to baseline seeded state.
    """
    from backend.app.database.models import FeedbackRecord, RiskEvent
    
    db.query(FeedbackRecord).delete()
    db.query(RiskEvent).delete()
    db.commit()

    return {"status": "success", "message": "Simulation state reset successfully to baseline fixtures."}

@router.get("/escalation/status", response_model=EscalationStatusSchema)
def get_escalation_status():
    """
    Returns Twilio service readiness status (live credentials vs simulated mode).
    """
    return {
        "is_live_configured": TwilioEscalationService.is_live_configured(),
        "account_sid_present": bool(settings.TWILIO_ACCOUNT_SID and not settings.TWILIO_ACCOUNT_SID.startswith("AC_DEMO")),
        "from_phone": settings.TWILIO_FROM_PHONE,
        "whatsapp_from": settings.TWILIO_WHATSAPP_FROM,
        "demo_user_phone": settings.DEMO_USER_PHONE_NUMBER,
        "supported_channels": ["whatsapp", "voice", "sms"]
    }

@router.post("/escalation/trigger")
def trigger_escalation_alert(req: EscalationRequestSchema):
    """
    Dispatches an out-of-band escalation via WhatsApp, Automated Voice Call (TwiML TTS), or SMS.
    Uses live Twilio API if credentials are configured, or high-fidelity simulation in demo mode.
    """
    res = TwilioEscalationService.trigger_escalation(
        channel=req.channel,
        recipient_name=req.recipient_name,
        amount=req.amount,
        to_phone=req.to_phone,
        user_name=req.user_name or "Vikram Verma",
        transaction_id=req.transaction_id or "TXN_DEMO"
    )
    return res

@router.get("/escalation/session")
def get_escalation_session(transaction_id: Optional[str] = None):
    """
    Returns the authoritative escalation response state (PENDING_VERIFICATION, VERIFYING, VERIFIED, REJECTED, CANCELLED, COMPLETED)
    for real-time UI synchronization.
    """
    return TwilioEscalationService.get_session(transaction_id)

@router.post("/escalation/simulate-response")
def simulate_escalation_response(payload: EscalationSimulateSchema):
    """
    Simulates a live response from the user (e.g., user said YES/CONFIRM or NO/BLOCK)
    through the authoritative VerificationResponseService and Groq natural language classifier.
    """
    txn_id = payload.transaction_id or "TXN_DEMO_D"
    
    # Determine input text
    if payload.raw_input:
        input_text = payload.raw_input
    elif payload.action and payload.action.upper() in ["YES", "VERIFIED", "APPROVED", "CONFIRMED", "PROCEED"]:
        input_text = "Yes, I initiated this payment."
    elif payload.action and payload.action.upper() in ["NO", "CANCELLED", "REJECTED", "BLOCK"]:
        input_text = "No, I did not initiate this payment."
    elif payload.action and payload.action.upper() in ["UNCLEAR", "MAYBE", "AMBIGUOUS"]:
        input_text = "Maybe, I am not sure."
    else:
        input_text = payload.action or "Yes, I initiated this payment."

    from backend.app.services.verification_service import VerificationResponseService
    result = VerificationResponseService.process_verification_response(
        transaction_id=txn_id,
        channel=payload.channel or "DEMO",
        response_text=input_text
    )
    return {
        "status": "success",
        "session": result.get("session"),
        "decision": result.get("decision"),
        "confidence": result.get("confidence"),
        "reason": result.get("reason"),
        "action_taken": result.get("action_taken")
    }


@router.post("/escalation/complete")
def complete_verified_transaction(payload: EscalationCompleteSchema):
    """
    Finalizes and executes the payment ONLY if backend state is VERIFIED.
    Returns 400 if unverified, rejected, or invalid.
    """
    try:
        session = TwilioEscalationService.complete_transaction(payload.transaction_id)
        # Log feedback update to profile
        try:
            db_session = next(get_db())
            ProfileService.record_feedback(
                db=db_session,
                user_id="U102",
                transaction_id=payload.transaction_id,
                is_intentional=True
            )
        except Exception:
            pass
        return {
            "status": "success",
            "message": "Payment authorized and completed successfully.",
            "session": session
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.api_route("/escalation/voice-webhook", methods=["GET", "POST"])
async def twilio_voice_webhook(
    request: Request,
    transaction_id: Optional[str] = Query(None)
):
    """
    Twilio Voice Gather Webhook. Receives transcribed speech or keypress digits from the phone call
    and returns appropriate TwiML while updating authoritative state machine.
    """
    from fastapi.responses import Response
    
    # Twilio sends form data via POST
    form_data = {}
    try:
        form = await request.form()
        form_data = dict(form)
    except Exception:
        pass

    speech_result = form_data.get("SpeechResult") or request.query_params.get("SpeechResult") or ""
    digits = form_data.get("Digits") or request.query_params.get("Digits") or ""
    txn_id = transaction_id or form_data.get("transaction_id") or request.query_params.get("transaction_id") or "TXN_DEMO_D"

    result = TwilioEscalationService.process_voice_response(
        speech_result=speech_result,
        digits=digits,
        transaction_id=txn_id
    )
    return Response(content=result["twiml"], media_type="application/xml")

@router.api_route("/escalation/whatsapp-webhook", methods=["GET", "POST"])
async def twilio_whatsapp_webhook(
    request: Request,
    transaction_id: Optional[str] = Query(None)
):
    """
    Twilio WhatsApp Incoming Message Webhook.
    Parses 'YES' / 'NO' and updates authoritative state machine.
    """
    from fastapi.responses import Response

    form_data = {}
    try:
        form = await request.form()
        form_data = dict(form)
    except Exception:
        pass

    body = form_data.get("Body") or request.query_params.get("Body") or ""
    from_phone = form_data.get("From") or request.query_params.get("From") or ""
    txn_id = transaction_id or form_data.get("transaction_id") or request.query_params.get("transaction_id") or "TXN_DEMO_D"

    result = TwilioEscalationService.process_whatsapp_response(
        body=body,
        from_phone=from_phone,
        transaction_id=txn_id
    )
    twiml_msg = f"<Response><Message>{result['reply_message']}</Message></Response>"
    return Response(content=twiml_msg, media_type="application/xml")




