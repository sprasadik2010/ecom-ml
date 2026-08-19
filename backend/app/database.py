import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()

DATABASE_URL = settings.DATABASE_URL
engine = None
SessionLocal = None

def init_db_connection():
    global engine, SessionLocal
    
    if DATABASE_URL.startswith("postgresql"):
        try:
            # Parse DB name and try connecting to default 'postgres' database to create the target db if needed
            db_name = DATABASE_URL.split("/")[-1].split("?")[0]
            base_url = DATABASE_URL.rsplit("/", 1)[0] + "/postgres"
            
            # Connect to 'postgres' to check / create db
            temp_engine = create_engine(base_url, connect_args={"connect_timeout": 3})
            with temp_engine.connect() as conn:
                # Isolate transaction
                conn.execute(text("commit"))
                result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname='{db_name}'"))
                if not result.fetchone():
                    conn.execute(text(f"CREATE DATABASE {db_name}"))
                    logger.info(f"Database '{db_name}' created successfully on PostgreSQL.")
            temp_engine.dispose()
            
            # Connect to actual database
            engine = create_engine(DATABASE_URL)
            # Verify actual database connection works
            with engine.connect() as conn:
                logger.info(f"Connected successfully to PostgreSQL database '{db_name}'.")
        except Exception as e:
            logger.warning(f"Failed to connect to PostgreSQL: {e}. Falling back to SQLite database.")
            # Fallback to SQLite
            engine = create_engine("sqlite:///./mlm.db", connect_args={"check_same_thread": False})
    else:
        connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
        engine = create_engine(DATABASE_URL, connect_args=connect_args)
        logger.info(f"Connected to database: {DATABASE_URL}")

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

init_db_connection()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
