import os
from dotenv import load_dotenv

# Load .env file if present
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(dotenv_path=env_path)
load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:1q2w3e4r@localhost:5432/mlm_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkeyformlmproject12345!@#$")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    #Rules
    MIN_PURCHASE_FOR_ACTIVATION: float = float(os.getenv("MIN_PURCHASE_FOR_ACTIVATION", "1.0"))   # 1 SW to become active member

    # UPI Payment Configuration
    UPI_ID: str = os.getenv("UPI_ID", "merchant@okhdfcbank")
    UPI_NAME: str = os.getenv("UPI_NAME", "Business Store")

    # ImgBB Cloud Image Hosting
    IMGBB_API_KEY: str = os.getenv("IMGBB_API_KEY", "")

    # SMTP / Email Configuration for Password Reset & Notifications
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", os.getenv("SMTP_USER", "noreply@buyway.biz"))
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "BuyWay Store")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

settings = Settings()
