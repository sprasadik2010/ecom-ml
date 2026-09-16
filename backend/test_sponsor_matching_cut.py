import os
import sys

# Setup path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

os.environ["DATABASE_URL"] = "sqlite:///./test_sponsor_cut.db"

from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models import User, Product, Order, Commission
from app.schemas import UserCreate, OrderCreate, CartItemCreate
from app import crud

def test_sponsor_matching_cut():
    print("=" * 70)
    print("TESTING 10% SW MATCHING CUT & 4-LEVEL UPLINE SPONSOR DISTRIBUTION")
    print("=" * 70)
    
    if os.path.exists("./test_sponsor_cut.db"):
        os.remove("./test_sponsor_cut.db")
        
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Seed Products
        p100 = Product(name="100 SW Product", price=5000.0, sw=100, category="Test", stock=500)
        p50 = Product(name="50 SW Product", price=2500.0, sw=50, category="Test", stock=500)
        db.add(p100)
        db.add(p50)
        db.commit()
        
        # 2. Create Root Admin and Root User
        admin = User(
            username="admin",
            email="admin@test.com",
            full_name="Root Admin",
            hashed_password="pw",
            status="active",
            personal_sw=100.0,
            is_admin=True
        )
        rootuser = User(
            username="rootuser",
            email="root@test.com",
            full_name="Root User",
            hashed_password="pw",
            status="active",
            personal_sw=100.0,
            is_admin=False
        )
        db.add(admin)
        db.add(rootuser)
        db.commit()
        db.refresh(rootuser)
        
        # 3. Create 5-tier sponsor hierarchy:
        # rootuser -> up4 -> up3 -> up2 -> up1 -> user1
        print("1. Creating 5-tier sponsor hierarchy (rootuser -> up4 -> up3 -> up2 -> up1 -> user1)...")
        up4 = crud.create_user(db, UserCreate(
            username="up4", email="up4@test.com", password="password123", full_name="Upline Level 4",
            phone_number="9876543201", sponsor_username="rootuser", position="left"
        ))
        up3 = crud.create_user(db, UserCreate(
            username="up3", email="up3@test.com", password="password123", full_name="Upline Level 3",
            phone_number="9876543202", sponsor_username="up4", position="left"
        ))
        up2 = crud.create_user(db, UserCreate(
            username="up2", email="up2@test.com", password="password123", full_name="Upline Level 2",
            phone_number="9876543203", sponsor_username="up3", position="left"
        ))
        up1 = crud.create_user(db, UserCreate(
            username="up1", email="up1@test.com", password="password123", full_name="Upline Level 1",
            phone_number="9876543204", sponsor_username="up2", position="left"
        ))
        user1 = crud.create_user(db, UserCreate(
            username="user1", email="user1@test.com", password="password123", full_name="User One",
            phone_number="9876543205", sponsor_username="up1", position="left"
        ))
        
        # Activate all uplines & user1
        for u in [up4, up3, up2, up1, user1]:
            u.status = "active"
            u.personal_sw = 100.0
            u.wallet_balance = 0.0
            db.add(u)
        db.commit()
        
        # 4. Create child nodes under user1: c_left and c_right
        print("2. Creating Left and Right children under user1...")
        c_left = crud.create_user(db, UserCreate(
            username="c_left", email="cleft@test.com", password="password123", full_name="Child Left",
            phone_number="9876543206", sponsor_username="user1", position="left"
        ))
        c_right = crud.create_user(db, UserCreate(
            username="c_right", email="cright@test.com", password="password123", full_name="Child Right",
            phone_number="9876543207", sponsor_username="user1", position="right"
        ))
        c_left.status = "active"
        c_right.status = "active"
        db.add(c_left)
        db.add(c_right)
        db.commit()
        
        # 5. Make purchases under c_left (100 SW) and c_right (100 SW)
        print("\n3. Placing 100 SW order on c_left (Left leg of user1)...")
        ord_left = crud.create_order(db, c_left, OrderCreate(items=[CartItemCreate(product_id=p100.id, quantity=1)]))
        crud.complete_checkout(db, ord_left)
        
        db.refresh(user1)
        print(f"   user1 after Left purchase: Left={user1.left_leg_sw} SW, Right={user1.right_leg_sw} SW, Wallet=₹{user1.wallet_balance}")
        assert user1.left_leg_sw == 100.0
        assert user1.right_leg_sw == 0.0
        assert user1.wallet_balance == 0.0
        
        print("\n4. Placing 100 SW order on c_right (Right leg of user1) -> Triggers 100 SW Match...")
        ord_right = crud.create_order(db, c_right, OrderCreate(items=[CartItemCreate(product_id=p100.id, quantity=1)]))
        crud.complete_checkout(db, ord_right)
        
        # 6. Verify User1 earnings
        db.refresh(user1)
        db.refresh(up1)
        db.refresh(up2)
        db.refresh(up3)
        db.refresh(up4)
        db.refresh(rootuser)
        
        print(f"\n5. Verifying Wallets & Deductions:")
        print(f"   - user1: Wallet = ₹{user1.wallet_balance} (Expected ₹900.0 from 100 SW match @ 90%)")
        print(f"   - up1 (Level 1 sponsor): Wallet = ₹{up1.wallet_balance} (Expected ₹20.0 = 2% of ₹1000)")
        print(f"   - up2 (Level 2 sponsor): Wallet = ₹{up2.wallet_balance} (Expected ₹20.0 = 2% of ₹1000)")
        print(f"   - up3 (Level 3 sponsor): Wallet = ₹{up3.wallet_balance} (Expected ₹20.0 = 2% of ₹1000)")
        print(f"   - up4 (Level 4 sponsor): Wallet = ₹{up4.wallet_balance} (Expected ₹20.0 = 2% of ₹1000)")
        
        # Check user1's net income: ₹900 net matching + ₹1,000 Level 1 reward = ₹1,900
        matching_comm = db.query(Commission).filter(Commission.user_id == user1.id, Commission.type == "binary_matching").first()
        assert matching_comm is not None
        assert matching_comm.amount == 900.0, f"user1 net matching commission should be ₹900.0, got {matching_comm.amount}"
        assert user1.wallet_balance == 1900.0, f"user1 should receive ₹900 net matching + ₹1000 Level 1 royalty (₹1900.0), got {user1.wallet_balance}"
        
        # Check 4 upline sponsors (₹20 each = 2% of ₹1000 gross)
        assert up1.wallet_balance == 20.0, f"up1 (L1) should receive 2% (₹20.0), got {up1.wallet_balance}"
        assert up2.wallet_balance == 20.0, f"up2 (L2) should receive 2% (₹20.0), got {up2.wallet_balance}"
        assert up3.wallet_balance == 20.0, f"up3 (L3) should receive 2% (₹20.0), got {up3.wallet_balance}"
        assert up4.wallet_balance == 20.0, f"up4 (L4) should receive 2% (₹20.0), got {up4.wallet_balance}"
        
        # Check commissions ledger records
        user1_comms = db.query(Commission).filter(Commission.user_id == user1.id).all()
        assert len(user1_comms) == 2, f"user1 should have 2 commissions (matching + rank reward), got {len(user1_comms)}"
        assert "2% TDA" in matching_comm.description
        assert "8% Sponsor Royalty" in matching_comm.description
        print(f"   user1 matching commission record: {matching_comm.description}")
        
        up1_comms = db.query(Commission).filter(Commission.user_id == up1.id).all()
        assert len(up1_comms) == 1
        assert up1_comms[0].type == "sponsor_matching_bonus"
        assert up1_comms[0].amount == 20.0
        assert "Level 1 Sponsor Match Bonus" in up1_comms[0].description
        assert "@user1" in up1_comms[0].description
        print(f"   up1 commission record: {up1_comms[0].description}")
        
        up4_comms = db.query(Commission).filter(Commission.user_id == up4.id).all()
        assert len(up4_comms) == 1
        assert up4_comms[0].type == "sponsor_matching_bonus"
        assert up4_comms[0].amount == 20.0
        assert "Level 4 Sponsor Match Bonus" in up4_comms[0].description
        print(f"   up4 commission record: {up4_comms[0].description}")
        
        print("\n" + "=" * 70)
        print("ALL SPONSOR MATCHING CUT & 4-LEVEL DISTRIBUTION TESTS PASSED!")
        print("=" * 70)
        
    finally:
        db.close()
        engine.dispose()
        if os.path.exists("./test_sponsor_cut.db"):
            try:
                os.remove("./test_sponsor_cut.db")
            except Exception:
                pass

if __name__ == "__main__":
    test_sponsor_matching_cut()
