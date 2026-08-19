import uvicorn
import sys
import os

# Add the current directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.seed import seed_db

if __name__ == "__main__":
    print("=" * 60)
    print("Initializing MLM E-commerce Database Tables & Seeding Catalog...")
    try:
        seed_db()
        print("Database initialized and seeded successfully!")
    except Exception as e:
        print(f"Warning/Error seeding database: {e}")
        print("Continuing server startup...")
        
    print("Starting FastAPI development server on http://localhost:8000...")
    print("=" * 60)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
