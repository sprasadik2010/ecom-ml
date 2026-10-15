import logging
import os
import time
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()

def clean_database_url(url: str) -> str:
    """
    Sanitizes and normalizes database connection URL for PostgreSQL:
    1. Trims surrounding whitespace and quotes.
    2. Rewrites legacy 'postgres://' to modern SQLAlchemy 'postgresql://'.
    3. Strips 'channel_binding' query parameter which causes:
       psycopg2.OperationalError: invalid connection option "channel_binding" on Linux/libpq.
    4. Ensures 'sslmode=require' is present for Neon cloud PostgreSQL.
    """
    if not url:
        return ""
    clean = url.strip().strip("'\"")
    if clean.startswith("postgres://"):
        clean = "postgresql+psycopg2://" + clean[len("postgres://"):]
    elif clean.startswith("postgresql://"):
        clean = "postgresql+psycopg2://" + clean[len("postgresql://"):]

    try:
        parsed = urlparse(clean)
        if parsed.scheme.startswith("postgresql"):
            query_params = parse_qs(parsed.query, keep_blank_values=True)
            # Remove channel_binding parameter for libpq compatibility on Linux / Render
            query_params.pop("channel_binding", None)
            
            # Ensure sslmode=require for Neon cloud connections
            if "neon.tech" in parsed.netloc and "sslmode" not in query_params:
                query_params["sslmode"] = ["require"]
                
            new_query = urlencode(query_params, doseq=True)
            clean = urlunparse((
                parsed.scheme,
                parsed.netloc,
                parsed.path,
                parsed.params,
                new_query,
                parsed.fragment
            ))
    except Exception as e:
        logger.warning(f"Could not parse query parameters in database URL: {e}")

    return clean


DATABASE_URL = clean_database_url(settings.DATABASE_URL)
engine = None
SessionLocal = None

def init_db_connection():
    global engine, SessionLocal
    
    # Allow SQLite ONLY if explicitly specified for local unit tests (e.g. test_mlm.db)
    if DATABASE_URL.startswith("sqlite"):
        logger.info(f"Using local test SQLite database: {DATABASE_URL}")
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        return

    # Strictly require PostgreSQL for production / application
    if not DATABASE_URL.startswith("postgresql"):
        err = f"Invalid DATABASE_URL scheme '{DATABASE_URL[:15]}...'. A PostgreSQL connection string is strictly required."
        logger.critical(err)
        raise ValueError(err)

    db_host = DATABASE_URL.split("@")[-1].split("/")[0]
    db_name = DATABASE_URL.split("/")[-1].split("?")[0]
    logger.info(f"Initializing connection to PostgreSQL host '{db_host}', database '{db_name}'...")

    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Test connections before using them
        pool_recycle=300,    # Recycle connections every 5 minutes
        pool_size=10,
        max_overflow=20
    )

    # Attempt connection with retries to account for Neon compute cold starts (wake-up time)
    max_retries = 5
    retry_delay = 2
    connected = False
    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            with engine.connect() as conn:
                res = conn.execute(text("SELECT 1;")).scalar()
                if res == 1:
                    logger.info(f"Successfully connected to PostgreSQL database '{db_name}' on attempt {attempt}.")
                    connected = True
                    break
        except Exception as e:
            last_error = e
            logger.warning(
                f"PostgreSQL connection attempt {attempt}/{max_retries} failed: {e}. "
                f"Retrying in {retry_delay}s (waiting for Neon compute to wake up)..."
            )
            time.sleep(retry_delay)

    if not connected:
        logger.critical(
            f"FATAL: Could not connect to PostgreSQL database '{db_name}' after {max_retries} attempts: {last_error}"
        )
        raise last_error

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

init_db_connection()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
