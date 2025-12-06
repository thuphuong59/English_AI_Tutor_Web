import os
import sys
from dotenv import load_dotenv, find_dotenv
from supabase import create_client, Client

# Load environment 
env_path = find_dotenv()
if not env_path:
    print(" ERROR: Could not find .env file. Please ensure it exists in the backend root directory.")
    sys.exit(1)

load_dotenv(dotenv_path=env_path)

# Get environment variables 
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # anon key (frontend / normal user)
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # service_role key (admin backend)

# Validate 
if not SUPABASE_URL:
    print(" ERROR: Missing SUPABASE_URL in .env")
    sys.exit(1)

if not SUPABASE_KEY:
    print(" ERROR: Missing SUPABASE_KEY in .env")
    sys.exit(1)

if not SUPABASE_SERVICE_KEY:
    print(" WARNING: Missing SUPABASE_SERVICE_KEY (some admin functions may fail).")

# Create clients 
try:
    # Client for normal user (anon key)
    db_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # Client for admin (service role)
    admin_supabase: Client = None
    if SUPABASE_SERVICE_KEY:
        admin_supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    print(" Supabase clients initialized successfully.")

except Exception as e:
    print(f" Failed to initialize Supabase client: {e}")
    sys.exit(1)