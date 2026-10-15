import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.seed import seed_db

def reset():
    if os.getenv("ALLOW_DATABASE_DROP", "").lower() != "true":
        print("SAFETY GUARD: Database reset aborted. Dropping tables is blocked.")
        print("To override this locally, set ALLOW_DATABASE_DROP=true before running.")
        return
    print("Dropping all tables in PostgreSQL...")
    Base.metadata.drop_all(bind=engine)
    print("Recreating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Seeding database...")
    seed_db(only_if_empty=False)
    print("Database reset and seeded successfully!")

if __name__ == "__main__":
    reset()
