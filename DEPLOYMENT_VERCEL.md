# Deploying IntentGuard to Vercel 🚀

This repository is configured for immediate, zero-config deployment to [Vercel](https://vercel.com) using Python Serverless Functions.

---

## 1. Fast Deployment via Vercel Dashboard

1. Push your code to GitHub (already configured).
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
3. Configure the Project:
   - **Framework Preset**: Next.js (or Other if deploying backend standalone)
   - **Root Directory**: `./`
4. Add the following **Environment Variables** in the Vercel Project Settings:
   - `GROQ_API_KEY`: *(Your Groq API key for natural language verification)*
   - `TWILIO_ACCOUNT_SID`: *(Optional for phone/WhatsApp escalation)*
   - `TWILIO_AUTH_TOKEN`: *(Optional)*
   - `TWILIO_FROM_PHONE`: *(Optional)*
   - `TWILIO_WHATSAPP_FROM`: *(Optional, e.g. `whatsapp:+14155238886`)*
   - `DEMO_USER_PHONE_NUMBER`: *(Optional demo recipient phone)*
   - `DATABASE_URL`: `sqlite:////tmp/intentguard.db` *(Automatically handled if omitted)*
5. Click **Deploy**.

---

## 2. Deploying via Vercel CLI

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Deploy Preview
vercel

# Deploy Production
vercel --prod
```

---

## 3. Architecture & Routing on Vercel

```
Incoming Request
  ├── /api/v1/*        ──► api/index.py (FastAPI Serverless Function)
  ├── /docs            ──► FastAPI OpenAPI Interactive Documentation
  ├── /health          ──► Root Health Check Endpoint (200 OK)
  └── /*               ──► Next.js Frontend Dashboard (App Router)
```

- **Frontend API Connection**:
  In the frontend settings or environment variables, set:
  `NEXT_PUBLIC_API_URL=https://<your-vercel-deployment>.vercel.app/api/v1` (or leave empty to use relative `/api/v1` routing).
