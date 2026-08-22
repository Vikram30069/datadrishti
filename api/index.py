"""
Vercel Serverless Function entrypoint for FastAPI backend
"""
import os
import sys

# Add project root directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.main import app
