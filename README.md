# Paytm IntentGuard: Contextual Payment Security Layer (Concept Prototype)

> **Simulated Hackathon Prototype**  
> *"Paytm already detects suspicious transactions. IntentGuard adds the missing contextual layer: instead of only asking whether a transaction looks risky, it asks whether this transaction makes sense for this user, and applies only as much friction as necessary."*  
> **Core Principle**: **Same amount. Different context. Different protection.**

---

## 1. Problem & Innovation

In modern UPI digital payments, a transaction can be technically authorized (correct PIN, valid session, normal device credentials), yet still represent a coerced transfer, panic fraud, or severe anomaly for that specific user.

Standard binary fraud blockers often:
1. Block legitimate high-value transactions (e.g., monthly ₹50,000 rent to a known landlord), creating frustration.
2. Rely on opaque *"FRAUD DETECTED"* alerts with zero explainability.
3. Fail to capture voluntary user intent.

### How IntentGuard Solves This:
- **Robust Personal Baselines**: Evaluates payments using median, Median Absolute Deviation (MAD), and percentiles rather than misleading averages.
- **6 Calibrated Explainable Signals**: Amount anomaly (+30), New recipient (+20), Time anomaly (+15), New device (+20), Location anomaly (+10), and Velocity (+5).
- **Adaptive Friction**:
  - `0–30 (LOW)` → **ALLOW**: Seamless 1-tap payment.
  - `31–55 (MEDIUM)` → **INFORM**: Calm contextual banner with 1-tap review.
  - `56–75 (HIGH)` → **CONFIRM**: Contextual intervention with 3 clear anomaly cards and voluntary intent context check.
  - `76–100 (VERY_HIGH)` → **ESCALATE**: Safety cooldown timer and interactive verification checklist.
- **Explainable Decomposition**: Full audit trail with reason codes and English & Hindi translations.
- **Feedback & Trust Profile**: Post-payment learning updates baselines conservatively without blinding risk engines.

---

## 2. Architecture & Decision Flow

```text
                  ┌────────────────────────────────────────────────────────────┐
                  │                 Paytm Mobile Simulator                     │
                  │   - Screen 1: Normal Payment Flow                          │
                  │   - Screen 2: IntentGuard Intervention (Wow Screen)        │
                  │   - Screen 3: "Why am I seeing this?" Score Decomposition   │
                  │   - Screen 4: IntentGuard Context Check (NLP Extractor)    │
                  │   - Screen 5: Post-Payment Learning Feedback               │
                  │   - Screen 6: "Your Trust Profile" (Trusted Patterns)      │
                  └─────────────────────────────┬──────────────────────────────┘
                                                │ REST API /evaluate
                                                ▼
                  ┌────────────────────────────────────────────────────────────┐
                  │                 FastAPI Backend (Port 8000)                │
                  ├────────────────────────────────────────────────────────────┤
                  │  1. Profile Service: Median / MAD / Trusted Pattern match  │
                  │  2. Feature Service: 6 Calibrated Signals (0..100 max)     │
                  │  3. Risk Engine (Source of Truth): Deterministic Sum       │
                  │  4. ML Indicator: Unsupervised IsolationForest (Indicator) │
                  │  5. Policy Engine: Authoritative Friction Mapping          │
                  │  6. Intent Extractor: Deterministic NLP Category Engine    │
                  │  7. Explanations: Plain-language English + Hindi           │
                  └─────────────────────────────┬──────────────────────────────┘
                                                │
                                                ▼
                  ┌────────────────────────────────────────────────────────────┐
                  │                  Judge Telemetry Panel                     │
                  │   - 1-Click Scenario Switcher (A, B, C, D)                 │
                  │   - Deterministic Decision Trace with Reason Codes         │
                  │   - Adaptive Friction Differentiator                       │
                  │   - Measured Latency (~10-15ms) & Telemetry Counts         │
                  └────────────────────────────────────────────────────────────┘
```

---

## 3. Seeded Personas & Canonical Demo Scenarios

### 4 Seeded Personas
1. **`U101` - Priya Sharma (Student)**: Budget ₹200–₹1,500, transacts in Bengaluru, frequent canteen & bookstore payments.
2. **`U102` - Vikram Verma (Salaried Professional)**: Monthly rent ₹50,000 to Landlord on 1st–5th, daily spends ₹300–₹3,000 in Mumbai/Pune.
3. **`U103` - Ramesh Patel (Shopkeeper / Merchant)**: Frequent daytime supplier payments ₹2,000–₹25,000 in Ahmedabad.
4. **`U104` - Ananya Rao (Freelancer / Consultant)**: Variable invoice transfers ₹5,000–₹40,000 in Hyderabad/Bengaluru.

### 4 Canonical Demo Scenarios
| Scenario | User & Transaction Details | Expected Risk Score | Policy Action | Outcome Description |
|---|---|---|---|---|
| **Scenario A (Safe)** | Vikram pays ₹850 to Daily Groceries at 11:30 AM from known iPhone. | **0 / 100 (`LOW`)** | **ALLOW** | Instant 1-tap seamless payment. Subtle *"Protected by IntentGuard"* badge. |
| **Scenario B (Legitimate Rent)** | Vikram pays ₹50,000 monthly rent to known Landlord at 10:15 AM. | **0 / 100 (`LOW`)** | **ALLOW** | Matches established recurring pattern. Calm, no scary block. |
| **Scenario C (Suspicious Context)** | Vikram pays ₹45,000 to new payee Amit Kumar at 2:07 AM from unknown device. | **77 / 100 (`HIGH`)** | **CONFIRM** | Intervention screen with 3 anomaly cards and context check. |
| **Scenario D (High Risk / ATO)** | Vikram pays ₹75,000 to new payee at 3:18 AM with 2 recent failed attempts. | **100 / 100 (`VERY_HIGH`)** | **ESCALATE** | Safety cooldown pause with verification checklist. |

---

## 4. 90-Second Judge Demo Script

1. **Open the App** (`http://localhost:3000`): Show the Paytm mobile simulator on the left and the Judge panel on the right.
2. **Run Scenario A (Safe ₹850)**:
   - Tap *Scenario A*. The phone shows ₹850 to Nature Basket.
   - Tap *Pay ₹850*. Instant green tick *"Payment Completed ✓"* with `< 15ms` measured latency.
3. **The Core Differentiator: Run Scenario B vs Scenario C (Same Amount, Different Context)**:
   - Tap *Scenario B* (₹50,000 Rent). Tap *Pay ₹50,000*. Notice it is **instantly approved** because IntentGuard recognized the monthly landlord pattern.
   - Tap *Scenario C* (₹45,000 Suspicious). Tap *Pay ₹45,000*. Notice the calm **Intervention Screen** appears:
     - 3 clear anomaly cards: New Recipient (+20), Higher than usual (+22), Unusual time (+15).
     - Tap *"Why this?"* to show the **Explainable Risk Decomposition** (77/100) and toggle between English and Hindi.
     - Tap *Review & Pay*, enter/select context *"My cousin asked me for hospital emergency expenses"*, and continue.
4. **Run Scenario D (High Risk / ATO)**:
   - Tap *Scenario D* (₹75,000 at 3:18 AM with 2 retries).
   - Observe the **Stepped-Up Security Cooldown** and checklist.
5. **Show "Your Trust Profile"**:
   - Tap *Trust Profile* in the mobile simulator to show how legitimate behavior is learned (House Rent ₹50,000/mo, Electricity ₹1,850/mo).

---

## 5. Quickstart & Local Setup

### Prerequisites
- Python 3.12+
- Node.js 18+ & npm

### Method 1: Local Development

#### Terminal 1: Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

#### Terminal 2: Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

### Method 2: Docker Compose (Full Stack)
```bash
docker-compose up --build
```

---

## 6. Running Automated Test Suite

```bash
# Run backend pytest suite (13 unit and integration tests)
python -m pytest backend/tests -v

# Run frontend production build validation
cd frontend
npm run build
```

---

## 7. What Would Be Required for Production

A production rollout within the Paytm ecosystem would require:
1. **NPCI & Paytm Risk Engine Integration**: Mutual TLS hook inside Paytm's transaction authorization pipeline.
2. **Feature Store Isolation**: Real-time Redis / Feast cluster for sub-10ms profile lookups.
3. **Data Protection & Privacy**: Compliance with India's Digital Personal Data Protection Act (DPDP 2023) and RBI 2FA directives.
4. **Model Governance & Monitoring**: Drift detection on IsolationForest anomaly thresholds and automated false-positive alerting.
5. **Multi-lingual Expansion**: Pre-cached voice and regional language assets for Indian languages (Tamil, Telugu, Bengali, Marathi, etc.).

---

## 8. Privacy, Safety & Security Boundaries

- **Zero Real Credentials**: No real UPI PINs, OTPs, bank accounts, or credentials are used or requested.
- **Synthetic Data**: All transaction logs, recipient names, and device fingerprints are generated synthetically for hackathon simulation.
- **Disclaimer**: *"Simulated hackathon experience. No real payments are processed."*
