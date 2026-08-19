import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.seed import seed_db

def reset():
    print("Dropping all tables in PostgreSQL...")
    Base.metadata.drop_all(bind=engine)
    print("Recreating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Seeding database with updated products and SW settings...")
    seed_db()
    print("Database reset and seeded successfully!")

if __name__ == "__main__":
    reset()
