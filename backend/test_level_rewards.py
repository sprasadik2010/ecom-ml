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
            username="c1_node", email="c1@test.com", password="password123", full_name="Child 1 (Left)",
            phone_number="+919876543210", sponsor_username="rootuser", position="left"
        ))
        c2 = crud.create_user(db, UserCreate(
            username="c2_node", email="c2@test.com", password="password123", full_name="Child 2 (Right)",
            phone_number="+919876543211", sponsor_username="rootuser", position="right"
        ))
        
        # Activate c1 and c2 (they start with 0 personal_sw, which will increase through orders)
        c1.status = "active"
        c1.personal_sw = 0.0
        c2.status = "active"
        c2.personal_sw = 0.0
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
        
        # 6. Test Level 2 Promotion based on Matched Points:
        # Root currently has 100 matched SW (and 0 left, 0 right carryover).
        # Purchasing 100 SW under c1 (Left) and 100 SW under c2 (Right) generates 100 more matched SW.
        # Total matched SW for root reaches 200 -> Qualifies root for Level 2 (Silver Star)!
        print("\n6. Purchasing 100 SW on Left (under c1) and 100 SW on Right (under c2)...")
        ord_c1_3 = crud.create_order(db, c1, OrderCreate(items=[CartItemCreate(product_id=p100.id, quantity=1)]))
        crud.complete_checkout(db, ord_c1_3)
        ord_c2_2 = crud.create_order(db, c2, OrderCreate(items=[CartItemCreate(product_id=p100.id, quantity=1)]))
        crud.complete_checkout(db, ord_c2_2)
        
        db.refresh(root)
        print(f"   Rootuser -> Matched SW: {root.total_matched_sw}, Level: {root.current_level} ({root.level_name}), Wallet: INR {root.wallet_balance}")
        assert root.total_matched_sw == 200.0, "Root should have 200 matched SW"
        assert root.current_level == 2, "rootuser should be promoted to Level 2 (Silver Star) at 200 matched SW!"
        assert root.level_name == "Level 2 (Silver Star)", "Level name should be Level 2 (Silver Star)"
        
        rewards_l2 = db.query(UserRankReward).filter(UserRankReward.user_id == root.id, UserRankReward.level == 2).first()
        assert rewards_l2 is not None, "Level 2 reward record should exist"
        assert rewards_l2.monthly_amount == 2000.0, "Level 2 monthly reward should be INR 2,000"
        assert rewards_l2.total_months == 3, "Level 2 duration should be 3 months"
        assert rewards_l2.months_paid == 1, "Month 1 should be disbursed immediately"
        print("   ✅ Rootuser automatically promoted to Level 2 (Silver Star) with INR 2,000 Month 1 Royalty credited!")
        
        # 7. Test Recurring Monthly Royalty Payout Processor
        print("\n7. Testing scheduled monthly payout processor (simulate 30 days passing)...")
        rewards_l2.next_payout_at = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1) # Set as due
        db.add(rewards_l2)
        db.commit()
        
        res = process_pending_monthly_rewards(db)
        print(f"   Monthly processor result: {res}")
        assert res["processed_count"] >= 1, "Should process at least 1 due monthly payment"
        
        db.refresh(rewards_l2)
        assert rewards_l2.months_paid == 2, "Months paid should now be 2 of 3"
        print(f"   Reward schedule updated: Months paid={rewards_l2.months_paid}/{rewards_l2.total_months}, Status={rewards_l2.status}")
        print("   ✅ Recurring monthly payouts processed and verified successfully!")

        # 8. Test Node-Based Multi-Level Tree Qualifications
        print("\n8. Testing Downline Node Qualification Tracking (get_user_qualified_nodes)...")
        from app.mlm import get_user_qualified_nodes
        left_n, right_n = get_user_qualified_nodes(db, root)
        print(f"   Rootuser downline nodes with >=100 personal SW -> Left: {left_n}, Right: {right_n}")
        assert left_n >= 1, "Root should have at least 1 qualified node on Left"
        assert right_n >= 1, "Root should have at least 1 qualified node on Right"

        # Create additional nodes under Left and Right downlines to test Level 2 and Level 3 node qualifications
        # Left leg nodes: c1 already has >= 100 SW. Add l_node2 under c1
        l2 = crud.create_user(db, UserCreate(
            username="l2_node", email="l2@test.com", password="password123", full_name="Left Child 2",
            phone_number="+919876543212", sponsor_username="c1_node", position="left"
        ))
        l2.status = "active"
        l2.personal_sw = 100.0
        db.add(l2)

        # Right leg nodes: c2 already has >= 100 SW. Add r_node2 under c2
        r2 = crud.create_user(db, UserCreate(
            username="r2_node", email="r2@test.com", password="password123", full_name="Right Child 2",
            phone_number="+919876543213", sponsor_username="c2_node", position="right"
        ))
        r2.status = "active"
        r2.personal_sw = 100.0
        db.add(r2)
        db.commit()

        left_n, right_n = get_user_qualified_nodes(db, root)
        print(f"   After adding l2 and r2 -> Root qualified nodes: Left={left_n}, Right={right_n}")
        assert left_n >= 2, "Root should have >=2 qualified nodes on Left (qualifies for Level 2)"
        assert right_n >= 2, "Root should have >=2 qualified nodes on Right (qualifies for Level 2)"
        print("   ✅ Downline 100-SW Node counting verified successfully!")

        # 9. Test LEVEL_CONFIG contains all 10 levels with correct target nodes, SW points, doubling amounts, and durations
        from app.mlm import LEVEL_CONFIG
        print("\n9. Verifying all 10 Level Configs and Node Requirements...")
        assert len(LEVEL_CONFIG) == 10, "Should have exactly 10 levels"
        expected_nodes = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]
        expected_sw = [100.0, 200.0, 400.0, 800.0, 1600.0, 3200.0, 6400.0, 12800.0, 25600.0, 51200.0]
        expected_amounts = [1000.0, 2000.0, 4000.0, 8000.0, 16000.0, 32000.0, 64000.0, 128000.0, 256000.0, 512000.0]
        expected_durations = [2, 3, 3, 3, 3, 3, 3, 3, 3, 3]

        for lvl_num in range(1, 11):
            cfg = LEVEL_CONFIG[lvl_num]
            assert cfg["level"] == lvl_num
            assert cfg["target_nodes"] == expected_nodes[lvl_num - 1], f"Level {lvl_num} target_nodes mismatch"
            assert cfg["target_sw"] == expected_sw[lvl_num - 1], f"Level {lvl_num} target_sw mismatch"
            assert cfg["monthly_amount"] == expected_amounts[lvl_num - 1], f"Level {lvl_num} amount mismatch"
            assert cfg["duration_months"] == expected_durations[lvl_num - 1], f"Level {lvl_num} duration mismatch"
            print(f"   Level {lvl_num:2d}: {cfg['name']:<28} -> Nodes: {cfg['target_nodes']:3d} / side | SW: {cfg['target_sw']:6,.0f} | ₹{cfg['monthly_amount']:7,.0f}/mo ({cfg['duration_months']} mos) | {cfg['target_description']}")
        print("   ✅ All 10 levels correctly configured with node targets (1, 2, 4, 8, ... 512) and doubling rewards!")

        
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
