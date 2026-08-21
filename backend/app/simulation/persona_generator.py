"""
Deterministic User Profile Generator for Paytm IntentGuard.
Generates 100 rich user personas with personalized behavioral baselines,
known recipients, trusted patterns, and weekly/monthly temporal habits.
"""
import random
from typing import List, Dict, Any

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Muhammad", "Sai", "Arnav", "Ayaan",
    "Krishna", "Ishaan", "Shaurya", "Atharva", "Advik", "Pranav", "Advaith", "Aaryan", "Dhruv", "Kabir",
    "Vikram", "Rohan", "Siddharth", "Rahul", "Amit", "Kunal", "Gaurav", "Nikhil", "Manish", "Suresh",
    "Ananya", "Diya", "Saanvi", "Aadhya", "Pari", "Kiara", "Myra", "Riya", "Anushka", "Fatima",
    "Aanya", "Isha", "Kavya", "Navya", "Sara", "Avani", "Meera", "Pooja", "Neha", "Priya",
    "Sneha", "Tanvi", "Sujata", "Roshni", "Swati", "Deepa", "Shreya", "Divya", "Ritika", "Pallavi"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Banerjee", "Gupta", "Nair", "Iyer", "Rao", "Reddy", "Mehta",
    "Chopra", "Malhotra", "Kapoor", "Bhatia", "Joshi", "Kulkarni", "Deshmukh", "Singhal", "Mishra", "Pandey",
    "Yadav", "Chauhan", "Bose", "Ghosh", "Mukherjee", "Chatterjee", "Menon", "Pillai", "Das", "Agarwal"
]

CITIES = [
    ("Mumbai", ["Mumbai", "Thane", "Navi Mumbai"]),
    ("Delhi-NCR", ["Delhi-NCR", "Noida", "Gurugram"]),
    ("Bengaluru", ["Bengaluru", "Electronic City", "Whitefield"]),
    ("Hyderabad", ["Hyderabad", "Secunderabad", "Cyberabad"]),
    ("Pune", ["Pune", "Pimpri-Chinchwad", "Hinjawadi"]),
    ("Ahmedabad", ["Ahmedabad", "Gandhinagar"]),
    ("Chennai", ["Chennai", "Tambaram"]),
    ("Kolkata", ["Kolkata", "Howrah", "Salt Lake"])
]

INCOME_BANDS = [
    {
        "band": "STUDENT_TIER",
        "weight": 20,
        "persona_type": "Student",
        "median_range": (250, 450),
        "mad_range": (100, 200),
        "p90_mult": 2.5,
        "p95_mult": 3.8,
        "max_amount": 100000.0,
        "usual_hours": (8, 23),
        "preferred_types": ["P2P", "P2M", "CANTEEN", "FOOD_DELIVERY"],
        "freq": "High (3-5 per day)",
    },
    {
        "band": "ENTRY_SALARIED",
        "weight": 35,
        "persona_type": "Salaried Professional (Junior)",
        "median_range": (600, 1200),
        "mad_range": (300, 500),
        "p90_mult": 3.2,
        "p95_mult": 5.0,
        "max_amount": 100000.0,
        "usual_hours": (8, 22),
        "preferred_types": ["P2P", "P2M", "GROCERIES", "COMMUTE", "BILL_PAYMENT", "RENT"],
        "freq": "Moderate (15-25 per week)",
    },
    {
        "band": "SENIOR_SALARIED",
        "weight": 25,
        "persona_type": "Senior Professional / Manager",
        "median_range": (1500, 3500),
        "mad_range": (800, 1500),
        "p90_mult": 4.0,
        "p95_mult": 7.0,
        "max_amount": 100000.0,
        "usual_hours": (7, 23),
        "preferred_types": ["P2P", "P2M", "DINING", "RENT", "INVESTMENT", "UTILITIES", "TRAVEL"],
        "freq": "High (20-35 per week)",
    },
    {
        "band": "MERCHANT_SMB",
        "weight": 12,
        "persona_type": "Shopkeeper / SMB Merchant",
        "median_range": (4000, 9000),
        "mad_range": (2000, 4000),
        "p90_mult": 3.0,
        "p95_mult": 4.5,
        "max_amount": 100000.0,
        "usual_hours": (9, 21),
        "preferred_types": ["COMMERCIAL_INVENTORY", "LOGISTICS", "RENT", "SUPPLIES", "P2B"],
        "freq": "Very High (30-50 per week)",
    },
    {
        "band": "GIG_FREELANCER",
        "weight": 8,
        "persona_type": "Freelancer / Consultant",
        "median_range": (2000, 5000),
        "mad_range": (1200, 2500),
        "p90_mult": 4.5,
        "p95_mult": 7.5,
        "max_amount": 100000.0,
        "usual_hours": (10, 23),
        "preferred_types": ["SUBSCRIPTIONS", "CO_WORKING", "EQUIPMENT", "P2P", "CLIENT_TRANSFER"],
        "freq": "Variable (10-20 per week)",
    }
]

def generate_personas(count: int = 100, seed: int = 42) -> List[Dict[str, Any]]:
    """
    Generates deterministic user personas with complete baseline behavioral metrics.
    """
    rng = random.Random(seed)
    personas: List[Dict[str, Any]] = []

    # Flatten income bands according to distribution weights
    band_pool = []
    for b in INCOME_BANDS:
        band_pool.extend([b] * b["weight"])

    for i in range(1, count + 1):
        user_id = f"U{i:03d}"
        first_name = rng.choice(FIRST_NAMES)
        last_name = rng.choice(LAST_NAMES)
        full_name = f"{first_name} {last_name}"
        upi_handle = f"{first_name.lower()}.{last_name.lower()}{rng.randint(10, 99)}@paytm"

        band_config = band_pool[(i - 1) % len(band_pool)]
        income_band = band_config["band"]
        persona_type = band_config["persona_type"]

        median_amt = round(rng.uniform(*band_config["median_range"]), -1)
        mad_amt = round(rng.uniform(*band_config["mad_range"]), -1)
        p90_amt = round(median_amt * band_config["p90_mult"], -1)
        p95_amt = round(median_amt * band_config["p95_mult"], -1)
        max_amount = 100000.0 # Strict 1 Lakh limit

        city_info = rng.choice(CITIES)
        primary_city = city_info[0]
        usual_regions = city_info[1]

        start_h, end_h = band_config["usual_hours"]
        usual_payment_hours = [start_h, end_h]

        # Devices
        device_models = ["IPHONE15", "PIXEL8", "GALAXY_S24", "ONEPLUS_12", "REDMI_NOTE13", "MACBOOK_PRO"]
        primary_device = f"DEV_{first_name.upper()}_{rng.choice(device_models)}"
        known_devices = [primary_device]
        if rng.random() > 0.6:
            known_devices.append(f"DEV_{first_name.upper()}_TABLET")

        # Known Recipients & Trusted Patterns
        known_recipients = []
        trusted_patterns = []

        # 1. Local Grocery / Daily Store
        grocer_name = f"{rng.choice(['Nature Basket', 'Apna Bazaar', 'Daily Fresh', 'Reliance Smart', 'Kirana Store'])}"
        grocer_rec = {
            "id": f"REC_{user_id}_01",
            "name": grocer_name,
            "upi": f"{grocer_name.lower().replace(' ', '')}@paytm",
            "tx_count": rng.randint(20, 60),
            "regular_amount": round(median_amt * rng.uniform(0.6, 1.2), -1),
            "regular_time": "11:00 AM – 8:00 PM (Weekly)",
            "category": "Groceries",
            "is_regular": True
        }
        known_recipients.append(grocer_rec)

        # 2. Regular Rent / Housing (LEGITIMATE HIGH VALUE PATTERN)
        if income_band in ("ENTRY_SALARIED", "SENIOR_SALARIED", "MERCHANT_SMB", "GIG_FREELANCER"):
            rent_amt = round(rng.uniform(15000, 55000), -2)
            landlord_name = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)} (Landlord)"
            landlord_rec = {
                "id": f"REC_{user_id}_02",
                "name": landlord_name,
                "upi": f"{landlord_name.split()[0].lower()}.rent@okhdfcbank",
                "tx_count": rng.randint(6, 24),
                "regular_amount": rent_amt,
                "regular_time": "10:00 AM – 1:00 PM (1st–5th of Month)",
                "category": "Rent / Housing",
                "is_regular": True
            }
            known_recipients.append(landlord_rec)
            trusted_patterns.append({
                "pattern_id": f"PAT_{user_id}_RENT",
                "title": "Monthly House Rent",
                "category": "Rent / Housing",
                "typical_amount": rent_amt,
                "frequency": "Monthly (1st-5th)",
                "recipient_id": landlord_rec["id"],
                "status": "ACTIVE_TRUSTED"
            })

        # 3. Family / Close Friend
        fam_name = f"{rng.choice(FIRST_NAMES)} {last_name}"
        fam_rec = {
            "id": f"REC_{user_id}_03",
            "name": fam_name,
            "upi": f"{fam_name.split()[0].lower()}.fam@phonepe",
            "tx_count": rng.randint(12, 40),
            "regular_amount": round(median_amt * rng.uniform(1.5, 3.0), -1),
            "regular_time": "2:00 PM – 9:00 PM",
            "category": "Family & Friends",
            "is_regular": True
        }
        known_recipients.append(fam_rec)

        # 4. Utilities
        util_provider = rng.choice(["Adani Electricity", "Tata Power", "BESCOM", "MSEDCL", "Airtel Fiber"])
        util_amt = round(rng.uniform(800, 3200), -1)
        util_rec = {
            "id": f"REC_{user_id}_04",
            "name": util_provider,
            "upi": f"{util_provider.lower().replace(' ', '')}@billpay",
            "tx_count": rng.randint(8, 20),
            "regular_amount": util_amt,
            "regular_time": "9:00 AM – 5:00 PM (Monthly 10th-15th)",
            "category": "Utilities",
            "is_regular": True
        }
        known_recipients.append(util_rec)
        trusted_patterns.append({
            "pattern_id": f"PAT_{user_id}_UTIL",
            "title": f"Monthly {util_provider}",
            "category": "Utilities",
            "typical_amount": util_amt,
            "frequency": "Monthly",
            "recipient_id": util_rec["id"],
            "status": "ACTIVE_TRUSTED"
        })

        # Weekly & Monthly Patterns
        weekly_pattern = {
            "weekend_multiplier": round(rng.uniform(1.3, 1.8), 2),
            "highest_spend_day": rng.choice(["Saturday", "Sunday", "Friday"]),
            "lowest_spend_day": "Tuesday"
        }

        monthly_patterns = {
            "salary_credit_day": rng.choice([1, 30, 31]),
            "major_outflow_window": "1st to 5th (Rent & Bills)",
            "utility_bill_window": "10th to 15th"
        }

        personas.append({
            "user_id": user_id,
            "name": full_name,
            "persona_type": persona_type,
            "income_band": income_band,
            "upi_handle": upi_handle,
            "typical_transaction_amount": median_amt,
            "median_amount": median_amt,
            "amount_std": mad_amt,
            "mad_amount": mad_amt,
            "p90_amount": p90_amt,
            "p95_amount": p95_amt,
            "max_amount": max_amount,
            "usual_payment_hours": usual_payment_hours,
            "usual_start_hour": start_h,
            "usual_end_hour": end_h,
            "usual_regions": usual_regions,
            "known_devices": known_devices,
            "known_recipients": known_recipients,
            "known_recipient_count": len(known_recipients),
            "known_device_count": len(known_devices),
            "transaction_frequency": band_config["freq"],
            "weekly_pattern": weekly_pattern,
            "monthly_patterns": monthly_patterns,
            "preferred_transaction_types": band_config["preferred_types"],
            "trusted_patterns": trusted_patterns,
            "profile_status": "ESTABLISHED",
            "simulation": True
        })

    return personas
