import os
import sys

# Ensure repository root and backend are in Python path for Vercel Serverless Functions
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app

# Export FastAPI app for Vercel Serverless execution
__all__ = ["app"]
