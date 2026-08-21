"""
Authoritative Policy & Adaptive Friction Engine
Determines the exact intervention friction required based on risk band and intent context.
"""
from typing import Dict, Any, Optional, Tuple
from backend.app.schemas.evaluation import IntentContextSchema
from backend.app.config import settings

class FrictionPolicyEngine:
    @staticmethod
    def resolve_policy(risk_score: int) -> Tuple[str, str]:
        """
        Maps a 100-point risk score to (risk_band, policy_action).
        0..30   -> LOW, ALLOW
        31..55  -> MEDIUM, INFORM
        56..79  -> HIGH, CONFIRM
        80..100 -> VERY_HIGH, ESCALATE
        """
        if risk_score <= settings.THRESHOLD_LOW_MAX:
            return "LOW", "ALLOW"
        elif risk_score <= settings.THRESHOLD_MEDIUM_MAX:
            return "MEDIUM", "INFORM"
        elif risk_score <= settings.THRESHOLD_HIGH_MAX:
            return "HIGH", "CONFIRM"
        else:
            return "VERY_HIGH", "ESCALATE"

    @staticmethod
    def determine_action(
        risk_band: str,
        risk_score: int,
        intent_context: Optional[IntentContextSchema] = None
    ) -> Dict[str, Any]:
        """
        Determines authoritative policy action details.
        """
        if risk_band == "LOW":
            return {
                "action": "ALLOW",
                "ui_mode": "SEAMLESS",
                "friction_level": 0,
                "banner_text": "Protected by IntentGuard — Payment appears consistent with your usual activity.",
                "banner_text_hi": "IntentGuard द्वारा सुरक्षित — भुगतान आपकी सामान्य गतिविधि के अनुसार है।"
            }
        elif risk_band == "MEDIUM":
            return {
                "action": "INFORM",
                "ui_mode": "BANNER_INFORM",
                "friction_level": 1,
                "banner_text": "This payment is somewhat different from your usual activity. Review details before proceeding.",
                "banner_text_hi": "यह भुगतान आपकी सामान्य गतिविधि से थोड़ा भिन्न है। कृपया आगे बढ़ने से पहले विवरण की समीक्षा करें।"
            }
        elif risk_band == "HIGH":
            return {
                "action": "CONFIRM",
                "ui_mode": "INTERVENTION_SCREEN",
                "friction_level": 2,
                "banner_text": "Before you continue... This payment differs significantly from your normal pattern.",
                "banner_text_hi": "आगे बढ़ने से पहले... यह भुगतान आपके सामान्य पैटर्न से काफी भिन्न है।"
            }
        else: # VERY_HIGH
            return {
                "action": "ESCALATE",
                "ui_mode": "ESCALATION_COOLDOWN",
                "friction_level": 3,
                "banner_text": "Elevated Protection Active — This payment triggered multiple severe anomaly signals.",
                "banner_text_hi": "उच्च सुरक्षा सक्रिय — इस भुगतान ने कई गंभीर विसंगति संकेत उत्पन्न किए हैं।"
            }

# Alias
FrictionEngine = FrictionPolicyEngine
