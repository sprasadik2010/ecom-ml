import os
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:1q2w3e4r@localhost:5432/mlm_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkeyformlmproject12345!@#$")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # MLM Rules
    MIN_PURCHASE_FOR_ACTIVATION: float = 50.0   # 50 SW to become active member

settings = Settings()
