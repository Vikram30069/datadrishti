"""
Deterministic Intent & Entity Extractor
Parses voluntary user text context into structured categories, relationships, and confidence.
Works completely offline without external paid LLMs.
"""
import re
from typing import Dict, Any, List, Optional
from backend.app.schemas.evaluation import IntentExtractResponse

KEYWORDS_MAP = {
    "MEDICAL_EMERGENCY": [
        "hospital", "doctor", "medical", "medicine", "emergency", "urgent", 
        "surgery", "accident", "patient", "icu", "health", "clinic", "treatment"
    ],
    "RENT_BILL": [
        "rent", "landlord", "flat", "apartment", "society", "maintenance", 
        "electricity", "power", "water", "wifi", "broadband", "recharge", "utility", "bill"
    ],
    "FAMILY_FRIEND": [
        "brother", "sister", "cousin", "mom", "mother", "dad", "father", 
        "spouse", "wife", "husband", "friend", "colleague", "uncle", "aunt", "family", "personal"
    ],
    "PURCHASE": [
        "purchase", "buy", "store", "groceries", "market", "order", "food", 
        "shopping", "item", "product", "goods", "electronics", "cloth", "vegetable"
    ],
    "INVESTMENT": [
        "crypto", "trading", "stock", "telegram", "forex", "scheme", "profit", 
        "double", "task", "deposit", "earn", "yield", "investment"
    ]
}

CATEGORY_DISPLAY = {
    "MEDICAL_EMERGENCY": "Medical / Emergency Assistance",
    "RENT_BILL": "Rent or Utility Bill",
    "FAMILY_FRIEND": "Transfer to Family / Friend",
    "PURCHASE": "Commercial Purchase / Service",
    "INVESTMENT": "Investment / Digital Asset",
    "OTHER": "Personal Transfer / Other"
}

RELATIONSHIPS = ["brother", "sister", "cousin", "mother", "father", "landlord", "friend", "wife", "husband", "colleague"]

class IntentExtractor:
    @staticmethod
    def extract_intent(free_text: str) -> IntentExtractResponse:
        """
        Parses free text intent and returns structured classification.
        """
        text_lower = free_text.lower()
        
        matched_category = "OTHER"
        max_matches = 0
        extracted_keywords: List[str] = []

        for category, keywords in KEYWORDS_MAP.items():
            matches = [kw for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', text_lower)]
            if len(matches) > max_matches:
                max_matches = len(matches)
                matched_category = category
                extracted_keywords = matches

        # Extract relationship
        extracted_rel: Optional[str] = None
        for rel in RELATIONSHIPS:
            if re.search(r'\b' + re.escape(rel) + r'\b', text_lower):
                extracted_rel = rel
                break

        # Calculate confidence
        if max_matches >= 2:
            confidence = 0.94
        elif max_matches == 1:
            confidence = 0.82
        else:
            confidence = 0.60

        if matched_category == "MEDICAL_EMERGENCY":
            context_note = "User stated an urgent medical context. Verified with caution; recipient verification still advised."
        elif matched_category == "RENT_BILL":
            context_note = "User identified transaction as regular rent/bill payment."
        elif matched_category == "INVESTMENT":
            context_note = "User mentioned speculative/investment keywords. Elevated verification recommended."
        else:
            context_note = f"Identified category '{matched_category}' from voluntary context."

        return IntentExtractResponse(
            category=matched_category,
            category_display=CATEGORY_DISPLAY.get(matched_category, "Other Context"),
            extracted_relationship=extracted_rel,
            extracted_keywords=extracted_keywords,
            confidence=confidence,
            context_note=context_note
        )
