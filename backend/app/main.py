"""
Paytm IntentGuard Concept Prototype - Backend Application
FastAPI application entry point with CORS, auto-seed lifecycle, and OpenAPI docs.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database.connection import engine, Base, SessionLocal
from backend.app.api.routes import router
from backend.app.services.profile_service import ProfileService

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "An adaptive contextual security layer concept prototype for digital payments (UPI). "
        "Evaluates intent mismatch using robust personal baselines and applies proportionate friction.\n\n"
        "**Disclaimer**: Simulated hackathon experience. No real payments, UPI PINs, OTPs, or bank credentials are used."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        ProfileService.seed_default_personas(db)
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health"
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "project": settings.PROJECT_NAME,
        "version": "1.0.0"
    }

app.include_router(router, prefix=settings.API_V1_PREFIX)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
