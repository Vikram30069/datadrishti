"""
Explanation Generator for IntentGuard
Produces calm, clear, explainable summaries in English and Hindi.
"""
from typing import List, Dict, Any, Tuple
from backend.app.schemas.evaluation import SignalContribution

class ExplanationGenerator:
    @staticmethod
    def generate_explanations(
        signals: List[SignalContribution],
        risk_score: int,
        risk_band: str,
        recipient_name: str,
        amount: float
    ) -> Tuple[str, str]:
        """
        Generates English and Hindi explanations for the transaction.
        """
        active_signals = [s for s in signals if s.score > 0]
        active_signals.sort(key=lambda x: x.score, reverse=True)

        if not active_signals or risk_band == "LOW":
            en = (
                f"This payment of ₹{amount:,.0f} to {recipient_name} appears consistent with your established payment activity. "
                "No unusual patterns were detected."
            )
            hi = (
                f"{recipient_name} को ₹{amount:,.0f} का यह भुगतान आपकी सामान्य लेन-देन गतिविधि के अनुसार है। "
                "कोई असामान्य पैटर्न नहीं मिला।"
            )
            return en, hi

        # Top 3 signals for bullet points
        top_reasons_en = [s.reason for s in active_signals[:3]]
        top_reasons_hi = [s.reason_hi or s.reason for s in active_signals[:3]]

        reasons_en_str = " ".join(top_reasons_en)
        reasons_hi_str = " ".join(top_reasons_hi)

        if risk_band == "MEDIUM":
            en = (
                f"This payment of ₹{amount:,.0f} to {recipient_name} is slightly different from your usual activity. "
                f"{reasons_en_str} "
                "This does not mean the payment is fraudulent; please review the details before continuing."
            )
            hi = (
                f"{recipient_name} को ₹{amount:,.0f} का यह भुगतान आपकी सामान्य गतिविधि से थोड़ा भिन्न है। "
                f"{reasons_hi_str} "
                "इसका यह अर्थ नहीं है कि लेन-देन धोखाधड़ी है; कृपया आगे बढ़ने से पहले विवरण की समीक्षा करें।"
            )
        elif risk_band == "HIGH":
            en = (
                f"This payment of ₹{amount:,.0f} to {recipient_name} is unusual for your account. "
                f"{reasons_en_str} "
                "This does NOT mean the payment is fraudulent. It means the payment differs from several recent patterns on your account."
            )
            hi = (
                f"{recipient_name} को ₹{amount:,.0f} का यह भुगतान आपके खाते के लिए असामान्य है। "
                f"{reasons_hi_str} "
                "इसका यह अर्थ नहीं है कि यह धोखाधड़ी है। इसका अर्थ है कि यह भुगतान आपके हालिया पैटर्न से काफी भिन्न है।"
            )
        else: # VERY_HIGH
            en = (
                f"Elevated security alert: This payment of ₹{amount:,.0f} to {recipient_name} triggered multiple severe anomaly signals. "
                f"{reasons_en_str} "
                "For your financial protection, please verify all recipient and transfer details before continuing."
            )
            hi = (
                f"उच्च सुरक्षा चेतावनी: {recipient_name} को ₹{amount:,.0f} के इस भुगतान ने कई गंभीर विसंगति संकेत उत्पन्न किए हैं। "
                f"{reasons_hi_str} "
                "आपकी वित्तीय सुरक्षा के लिए, कृपया आगे बढ़ने से पहले प्राप्तकर्ता और विवरण की पुनः पुष्टि करें।"
            )

        return en, hi
