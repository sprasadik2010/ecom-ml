import sys
import os
import shutil

# Setup path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Force SQLite for testing
os.environ["DATABASE_URL"] = "sqlite:///./test_mlm.db"

from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models import User, Product, Order, Commission
from app.schemas import UserCreate, OrderCreate, CartItemCreate
from app import crud

def run_tests():
    print("=" * 60)
    print("RUNNING MLM BACKEND SYSTEM TESTS (SW EDITION)")
    print("=" * 60)
    
    # 1. Clean and create database
    if os.path.exists("./test_mlm.db"):
        os.remove("./test_mlm.db")
        
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 2. Seed a product
        print("1. Seeding test products...")
        prod1 = Product(name="Test Product A", price=100.0, sw=100, category="Test", stock=50)
        prod2 = Product(name="Test Product B", price=50.0, sw=50, category="Test", stock=50)
        db.add(prod1)
        db.add(prod2)
        db.commit()
        db.refresh(prod1)
        db.refresh(prod2)
        print(f"   Seeded product A: ID={prod1.id}, Price=${prod1.price}, SW={prod1.sw}")
        print(f"   Seeded product B: ID={prod2.id}, Price=${prod2.price}, SW={prod2.sw}")
        
        # 3. Create Root member (admin)
        print("\n2. Creating Root Member ('admin')...")
        admin = User(
            username="admin",
            email="admin@test.com",
            full_name="Root Admin",
            hashed_password="hashedpassword",
            status="active", # Admin starts active
            personal_sw=100.0
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"   Root 'admin' created. ID={admin.id}, Status={admin.status}")
        
        # 4. Create User Left
        print("\n3. Registering 'user_left' under 'admin' in LEFT position...")
        u_left_data = UserCreate(
            username="user_left",
            email="left@test.com",
            password="password123",
            full_name="Left Member",
            sponsor_username="admin",
            position="left"
        )
        u_left = crud.create_user(db, u_left_data)
        print(f"   'user_left' registered. ID={u_left.id}, Parent ID={u_left.parent_id}, Position={u_left.position}")
        assert u_left.parent_id == admin.id, "Parent ID should be admin.id"
        assert u_left.position == "left", "Position should be left"
        assert admin.left_child_id == u_left.id, "Admin left child should be user_left.id"
        
        # 5. Create User Right
        print("\n4. Registering 'user_right' under 'admin' in RIGHT position...")
        u_right_data = UserCreate(
            username="user_right",
            email="right@test.com",
            password="password123",
            full_name="Right Member",
            sponsor_username="admin",
            position="right"
        )
        u_right = crud.create_user(db, u_right_data)
        print(f"   'user_right' registered. ID={u_right.id}, Parent ID={u_right.parent_id}, Position={u_right.position}")
        assert u_right.parent_id == admin.id, "Parent ID should be admin.id"
        assert u_right.position == "right", "Position should be right"
        assert admin.right_child_id == u_right.id, "Admin right child should be user_right.id"
        
        # Verify initial legs
        db.refresh(admin)
        print(f"   Admin leg SW initial state -> Left Leg: {admin.left_leg_sw}, Right Leg: {admin.right_leg_sw}")
        assert admin.left_leg_sw == 0, "Initial Left Leg SW should be 0"
        assert admin.right_leg_sw == 0, "Initial Right Leg SW should be 0"

        # 6. Purchase for User Left (100 SW)
        # At this point admin has user_left and user_right created, so admin has nodes on both sides!
        # Wait, let's verify if admin has nodes on both sides.
        # Yes, left_child_id and right_child_id are both set!
        # So admin should receive 100 SW * 10 = 1000 INR commission for user_left's purchase.
        print("\n5. Simulating 100 SW purchase for 'user_left'...")
        order_data_left = OrderCreate(items=[CartItemCreate(product_id=prod1.id, quantity=1)]) # 100 SW
        order_left = crud.create_order(db, u_left, order_data_left)
        print(f"   Order created for 'user_left'. ID={order_left.id}, Amount=${order_left.total_amount}, SW={order_left.total_sw}")
        
        # Checkout order
        crud.complete_checkout(db, order_left)
        db.refresh(u_left)
        db.refresh(admin)
        
        print(f"   'user_left' status after purchase: {u_left.status} (Personal SW: {u_left.personal_sw})")
        assert u_left.status == "active", "user_left should become ACTIVE"
        assert u_left.personal_sw == 100.0, "user_left personal SW should be 100.0"
        
        print(f"   Admin Left Leg SW after purchase: {admin.left_leg_sw}")
        assert admin.left_leg_sw == 100.0, "Admin Left Leg SW should be 100.0"
        
        # Check Commission to admin for user_left (should get 10 INR per SW = 100 * 10 = 1000.0)
        commissions_admin = db.query(Commission).filter(Commission.user_id == admin.id).all()
        print(f"   Admin commissions count: {len(commissions_admin)}")
        match_com1 = next(c for c in commissions_admin if c.type == "binary_matching")
        print(f"   Admin received Matching Commission of {match_com1.amount} INR")
        assert match_com1.amount == 1000.0, "Admin match commission should be 1000.0 (100 SW * 10)"
        assert admin.wallet_balance == 1000.0, "Admin wallet balance should be 1000.0"

        # 7. Purchase for User Right (150 SW)
        print("\n6. Simulating 150 SW purchase for 'user_right'...")
        # Order 1 of product A (100 SW) and 1 of product B (50 SW) = 150 SW
        order_data_right = OrderCreate(items=[
            CartItemCreate(product_id=prod1.id, quantity=1),
            CartItemCreate(product_id=prod2.id, quantity=1)
        ])
        order_right = crud.create_order(db, u_right, order_data_right)
        
        # Checkout order
        crud.complete_checkout(db, order_right)
        db.refresh(u_right)
        db.refresh(admin)
        
        print(f"   'user_right' status after purchase: {u_right.status} (Personal SW: {u_right.personal_sw})")
        assert u_right.status == "active", "user_right should become ACTIVE"
        
        # Check volumes propagated
        print(f"   Admin Leg Volumes -> Left Leg: {admin.left_leg_sw}, Right Leg: {admin.right_leg_sw}")
        assert admin.left_leg_sw == 100.0, "Left Leg SW should be 100.0"
        assert admin.right_leg_sw == 150.0, "Right Leg SW should be 150.0"
        
        # Admin matching commission from user_right purchase (150 SW * 10 = 1500 INR)
        # Total admin wallet balance = 1000 (initial) + 1500 = 2500 INR
        all_commissions = db.query(Commission).filter(Commission.user_id == admin.id).all()
        print(f"   Admin total commissions records count: {len(all_commissions)}")
        for c in all_commissions:
            print(f"   - Type: {c.type}, Amount: {c.amount} INR, Desc: {c.description}")
            
        assert len(all_commissions) == 2, "Should have 2 matching commissions"
        assert admin.wallet_balance == 2500.0, "Admin wallet balance should be 2500.0"
        
        print("\n" + "=" * 60)
        print("ALL TESTS PASSED SUCCESSFULLY! BACKEND MLM SW ALGORITHMS ARE CORRECT.")
        print("=" * 60)
        
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()
        engine.dispose()
        # Clean up database
        try:
            if os.path.exists("./test_mlm.db"):
                os.remove("./test_mlm.db")
        except Exception:
            pass


if __name__ == "__main__":
    run_tests()
