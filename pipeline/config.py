"""
Central configuration for the digest pipeline.
Loads from .env and provides defaults.
"""
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# Anthropic / Claude
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
CLAUDE_MODEL = os.getenv('CLAUDE_MODEL', 'claude-sonnet-4-20250514')

# Email (Resend)
RESEND_API_KEY = os.getenv('RESEND_API_KEY')
EMAIL_FROM = os.getenv('EMAIL_FROM', 'digest@yourdomain.com')

# Pipeline settings
MAX_ARTICLES_PER_SOURCE = 20
MAX_DIGEST_ITEMS = 25
TOP_N_STORIES = 5

# Categories (must match DB seed)
CATEGORIES = [
    'Models & Updates',
    'Products & Launches',
    'Funding & M&A',
    'Research & Papers',
    'Open Source & Tooling',
    'Infrastructure & Compute',
    'Policy & Regulation',
    'Industry Signals',
    'Vertical Watch',
    'Rumors & Unconfirmed',
]
