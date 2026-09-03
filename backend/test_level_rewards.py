import sys
import os
import datetime

# Setup path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')


# Force SQLite for testing
os.environ["DATABASE_URL"] = "sqlite:///./test_level_rewards.db"

from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models import User, Product, Order, Commission, UserRankReward
from app.schemas import UserCreate, OrderCreate, CartItemCreate
from app import crud
from app.mlm import process_pending_monthly_rewards

def run_tests():
    print("=" * 70)
    print("RUNNING MLM BINARY MATCHING & LEVEL REWARDS VERIFICATION SUITE")
    print("=" * 70)
    
    # 1. Clean and create database
    if os.path.exists("./test_level_rewards.db"):
        os.remove("./test_level_rewards.db")
        
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 2. Seed products
        print("1. Seeding test catalog...")
        p100 = Product(name="100 SW Product", price=5000.0, sw=100, category="Test", stock=500)
        p50 = Product(name="50 SW Product", price=2500.0, sw=50, category="Test", stock=500)
        db.add(p100)
        db.add(p50)
        db.commit()
        db.refresh(p100)
        db.refresh(p50)
        
        # 3. Create Root user
        print("\n2. Creating Root Genealogy Node ('rootuser')...")
        root = User(
            username="rootuser",
            email="root@test.com",
            full_name="Root User",
            hashed_password="pw",
            status="active",
            personal_sw=100.0,
            is_admin=False
        )
        db.add(root)
        db.commit()
        db.refresh(root)
        
        # 4. Create Binary Network Structure:
        #             rootuser (Level ?)
        #            /                  \
        #        child_L (c1)         child_R (c2)
        #        /        \           /          \
        #      g1_LL     g1_LR      g1_RL       g1_RR
        #      /   \     /   \      /   \       /   \
        #    ...   ... ...   ...  ...   ...   ...   ...
        
        print("\n3. Creating binary downline structure (c1 on Left, c2 on Right)...")
        c1 = crud.create_user(db, UserCreate(
            username="c1", email="c1@test.com", password="pw", full_name="Child 1 (Left)",
            phone_number="+919876543210", sponsor_username="rootuser", position="left"
        ))
        c2 = crud.create_user(db, UserCreate(
            username="c2", email="c2@test.com", password="pw", full_name="Child 2 (Right)",
            phone_number="+919876543211", sponsor_username="rootuser", position="right"
        ))
        
        # Activate c1 and c2 with 100 personal SW
        c1.status = "active"
        c1.personal_sw = 100.0
        c2.status = "active"
        c2.personal_sw = 100.0
        db.add(c1)
        db.add(c2)
        db.commit()
        
        print("\n4. Testing 1:1 Matching for rootuser (50 SW on Left, 100 SW on Right)...")
        # Buy 50 SW under c1 (Left subtree)
        ord_c1_1 = crud.create_order(db, c1, OrderCreate(items=[CartItemCreate(product_id=p50.id, quantity=1)]))
        crud.complete_checkout(db, ord_c1_1)
        db.refresh(root)
        print(f"   Root leg volumes -> Left: {root.left_leg_sw} SW, Right: {root.right_leg_sw} SW, Wallet: INR {root.wallet_balance}")
        assert root.left_leg_sw == 50.0, "Root left leg should be 50 SW"
        assert root.right_leg_sw == 0.0, "Root right leg should be 0 SW"
        assert root.wallet_balance == 0.0, "No matching yet (0 matchable SW)"
        
        # Buy 100 SW under c2 (Right subtree)
        ord_c2_1 = crud.create_order(db, c2, OrderCreate(items=[CartItemCreate(product_id=p100.id, quantity=1)]))
        crud.complete_checkout(db, ord_c2_1)
        db.refresh(root)
        print(f"   Root leg volumes -> Left: {root.left_leg_sw} SW, Right: {root.right_leg_sw} SW, Matched: {root.total_matched_sw} SW, Wallet: INR {root.wallet_balance}")
        
        # 50 SW matched: 50 * 10 = INR 500
        # Remaining: Left = 0, Right = 50 carryover
        assert root.left_leg_sw == 0.0, "Root left leg should be 0 SW after match"
        assert root.right_leg_sw == 50.0, "Root right leg carryover should be 50 SW"
        assert root.total_matched_sw == 50.0, "Total matched SW should be 50"
        assert root.wallet_balance == 500.0, "Root wallet should be INR 500 (50 SW * 10)"
        print("   ✅ 1:1 Binary leg matching at INR 10/SW with carryforward works correctly!")
        
        # Buy another 50 SW under c1 (Left subtree) -> triggers 50 more matching SW -> Total matched = 100 SW!
        print("\n5. Purchasing 50 SW more on Left -> Root reaches 100 Matched SW -> Tests Level 1 Promotion...")
        ord_c1_2 = crud.create_order(db, c1, OrderCreate(items=[CartItemCreate(product_id=p50.id, quantity=1)]))
        crud.complete_checkout(db, ord_c1_2)
        db.refresh(root)
        
        print(f"   Root after 2nd match -> Matched: {root.total_matched_sw} SW, Level: {root.current_level} ({root.level_name}), Wallet: INR {root.wallet_balance}")
        # Matching commission: 50 SW * 10 = INR 500 (Wallet was 500 -> 1000)
        # PLUS Level 1 achievement: INR 1,000 Month 1 Royalty credited! -> Wallet = 1000 + 1000 = INR 2,000
        assert root.total_matched_sw == 100.0, "Total matched SW should be 100"
        assert root.current_level == 1, "Root should be promoted to Level 1"
        assert root.level_name == "Level 1 (Bronze Star)", "Level name should be Level 1 (Bronze Star)"
        assert root.wallet_balance == 2000.0, "Root wallet should be INR 2,000 (INR 1,000 matching + INR 1,000 Level 1 reward)"
        
        rewards_root = db.query(UserRankReward).filter(UserRankReward.user_id == root.id).all()
        assert len(rewards_root) == 1, "Should have 1 rank reward schedule"
        assert rewards_root[0].level == 1, "Reward level should be 1"
        assert rewards_root[0].monthly_amount == 1000.0, "Monthly amount should be INR 1,000"
        assert rewards_root[0].total_months == 2, "Total months should be 2"
        assert rewards_root[0].months_paid == 1, "Months paid should be 1"
        assert rewards_root[0].status == "active", "Reward status should be active"
        print("   ✅ Level 1 qualification and instant Month 1 reward (INR 1,000) verified successfully!")
        
        # 6. Test Level 2 Promotion:
        # To qualify rootuser for Level 2, both children (c1 and c2) must reach Level 1!
        # Let's qualify c1 for Level 1:
        # c1 needs 100 matched SW on its left & right legs.
        print("\n6. Creating downlines for c1 (c1_L, c1_R) and generating 100 matched SW for c1...")
        c1_L = crud.create_user(db, UserCreate(
            username="c1_L", email="c1_l@test.com", password="pw", full_name="c1 Left Child",
            phone_number="+919876543212", sponsor_username="c1", position="left"
        ))
        c1_R = crud.create_user(db, UserCreate(
            username="c1_R", email="c1_r@test.com", password="pw", full_name="c1 Right Child",
            phone_number="+919876543213", sponsor_username="c1", position="right"
        ))
        c1_L.status = "active"; c1_L.personal_sw = 100.0
        c1_R.status = "active"; c1_R.personal_sw = 100.0
        db.add(c1_L); db.add(c1_R); db.commit()
        
        # Purchase 100 SW under c1_L and 100 SW under c1_R
        ord_c1L = crud.create_order(db, c1_L, OrderCreate(items=[CartItemCreate(product_id=p100.id, quantity=1)]))
        crud.complete_checkout(db, ord_c1L)
        ord_c1R = crud.create_order(db, c1_R, OrderCreate(items=[CartItemCreate(product_id=p100.id, quantity=1)]))
        crud.complete_checkout(db, ord_c1R)
        
        db.refresh(c1)
        print(f"   c1 -> Matched SW: {c1.total_matched_sw}, Level: {c1.current_level} ({c1.level_name}), Wallet: INR {c1.wallet_balance}")
        assert c1.current_level == 1, "c1 should now be Level 1"
        assert c1.wallet_balance == 2000.0, "c1 wallet should be INR 2,000 (1000 matching + 1000 L1 reward)"
        print("   ✅ c1 successfully reached Level 1!")
        
        # Now let's qualify c2 for Level 1:
        print("\n7. Creating downlines for c2 (c2_L, c2_R) and generating 100 matched SW for c2...")
        c2_L = crud.create_user(db, UserCreate(
            username="c2_L", email="c2_l@test.com", password="pw", full_name="c2 Left Child",
            phone_number="+919876543214", sponsor_username="c2", position="left"
        ))
        c2_R = crud.create_user(db, UserCreate(
            username="c2_R", email="c2_r@test.com", password="pw", full_name="c2 Right Child",
            phone_number="+919876543215", sponsor_username="c2", position="right"
        ))

        c2_L.status = "active"; c2_L.personal_sw = 100.0
        c2_R.status = "active"; c2_R.personal_sw = 100.0
        db.add(c2_L); db.add(c2_R); db.commit()
        
        # Purchase 100 SW under c2_L and 100 SW under c2_R
        ord_c2L = crud.create_order(db, c2_L, OrderCreate(items=[CartItemCreate(product_id=p100.id, quantity=1)]))
        crud.complete_checkout(db, ord_c2L)
        ord_c2R = crud.create_order(db, c2_R, OrderCreate(items=[CartItemCreate(product_id=p100.id, quantity=1)]))
        crud.complete_checkout(db, ord_c2R)
        
        db.refresh(c2)
        print(f"   c2 -> Matched SW: {c2.total_matched_sw}, Level: {c2.current_level} ({c2.level_name}), Wallet: INR {c2.wallet_balance}")
        assert c2.current_level == 1, "c2 should now be Level 1"
        print("   ✅ c2 successfully reached Level 1!")
        
        # Now that both c1 and c2 are Level 1, rootuser should automatically promote to Level 2!
        db.refresh(root)
        print(f"\n8. Checking rootuser promotion after both children reached Level 1...")
        print(f"   Rootuser -> Level: {root.current_level} ({root.level_name}), Wallet: INR {root.wallet_balance}")
        assert root.current_level == 2, "rootuser should be promoted to Level 2!"
        assert root.level_name == "Level 2 (Silver Star)", "Level name should be Level 2 (Silver Star)"
        
        rewards_l2 = db.query(UserRankReward).filter(UserRankReward.user_id == root.id, UserRankReward.level == 2).first()
        assert rewards_l2 is not None, "Level 2 reward record should exist"
        assert rewards_l2.monthly_amount == 2000.0, "Level 2 monthly reward should be INR 2,000"
        assert rewards_l2.total_months == 3, "Level 2 duration should be 3 months"
        assert rewards_l2.months_paid == 1, "Month 1 should be disbursed immediately"
        print("   ✅ Rootuser automatically promoted to Level 2 (Silver Star) with INR 2,000 Month 1 Royalty credited!")
        
        # 7. Test Recurring Monthly Royalty Payout Processor
        print("\n9. Testing scheduled monthly payout processor (simulate 30 days passing)...")
        rewards_l2.next_payout_at = datetime.datetime.utcnow() - datetime.timedelta(days=1) # Set as due
        db.add(rewards_l2)
        db.commit()
        
        res = process_pending_monthly_rewards(db)
        print(f"   Monthly processor result: {res}")
        assert res["processed_count"] >= 1, "Should process at least 1 due monthly payment"
        
        db.refresh(rewards_l2)
        assert rewards_l2.months_paid == 2, "Months paid should now be 2 of 3"
        print(f"   Reward schedule updated: Months paid={rewards_l2.months_paid}/{rewards_l2.total_months}, Status={rewards_l2.status}")
        print("   ✅ Recurring monthly payouts processed and verified successfully!")
        
        print("\n" + "=" * 70)
        print("ALL TESTS PASSED! BINARY MATCHING & LEVEL REWARDS LOGIC FULLY VERIFIED.")
        print("=" * 70)
        
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()
        engine.dispose()
        try:
            if os.path.exists("./test_level_rewards.db"):
                os.remove("./test_level_rewards.db")
        except Exception:
            pass

if __name__ == "__main__":
    run_tests()
