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
        
        # 3. Create Root member (admin) and rootuser
        print("\n2. Creating Root Member ('admin') and 'rootuser'...")
        admin = User(
            username="admin",
            email="admin@test.com",
            full_name="Root Admin",
            hashed_password="hashedpassword",
            status="active", # Admin starts active
            personal_sw=100.0,
            is_admin=True
        )
        db.add(admin)
        rootuser = User(
            username="rootuser",
            email="rootuser@test.com",
            full_name="Root User",
            hashed_password="hashedpassword",
            status="active",
            personal_sw=100.0,
            is_admin=False
        )
        db.add(rootuser)
        db.commit()
        db.refresh(admin)
        db.refresh(rootuser)
        print(f"   Root 'admin' created. ID={admin.id}, Status={admin.status}")
        print(f"   Root 'rootuser' created. ID={rootuser.id}, Status={rootuser.status}")
        
        # Try to register a user under 'admin' - should fail
        print("\n2b. Verifying that registering under 'admin' fails...")
        try:
            crud.create_user(db, UserCreate(
                username="invalid_user",
                email="invalid@test.com",
                password="password123",
                full_name="Invalid User",
                sponsor_username="admin",
                position="left"
            ))
            assert False, "Registration under admin should have failed"
        except ValueError as e:
            print(f"   Registration under admin failed correctly with error: {e}")
            assert "Admin cannot sponsor users" in str(e)
        
        # 4. Create User Left
        print("\n3. Registering 'user_left' under 'rootuser' in LEFT position...")
        u_left_data = UserCreate(
            username="user_left",
            email="left@test.com",
            password="password123",
            full_name="Left Member",
            sponsor_username="rootuser",
            position="left"
        )
        u_left = crud.create_user(db, u_left_data)
        print(f"   'user_left' registered. ID={u_left.id}, Parent ID={u_left.parent_id}, Position={u_left.position}")
        assert u_left.parent_id == rootuser.id, "Parent ID should be rootuser.id"
        assert u_left.position == "left", "Position should be left"
        assert rootuser.left_child_id == u_left.id, "Rootuser left child should be user_left.id"
        
        # 5. Create User Right
        print("\n4. Registering 'user_right' under 'rootuser' in RIGHT position...")
        u_right_data = UserCreate(
            username="user_right",
            email="right@test.com",
            password="password123",
            full_name="Right Member",
            sponsor_username="rootuser",
            position="right"
        )
        u_right = crud.create_user(db, u_right_data)
        print(f"   'user_right' registered. ID={u_right.id}, Parent ID={u_right.parent_id}, Position={u_right.position}")
        assert u_right.parent_id == rootuser.id, "Parent ID should be rootuser.id"
        assert u_right.position == "right", "Position should be right"
        assert rootuser.right_child_id == u_right.id, "Rootuser right child should be user_right.id"
        
        # Verify initial legs
        db.refresh(rootuser)
        print(f"   Rootuser leg SW initial state -> Left Leg: {rootuser.left_leg_sw}, Right Leg: {rootuser.right_leg_sw}")
        assert rootuser.left_leg_sw == 0, "Initial Left Leg SW should be 0"
        assert rootuser.right_leg_sw == 0, "Initial Right Leg SW should be 0"

        # 6. Purchase for User Left (100 SW)
        print("\n5. Simulating 100 SW purchase for 'user_left'...")
        order_data_left = OrderCreate(items=[CartItemCreate(product_id=prod1.id, quantity=1)]) # 100 SW
        order_left = crud.create_order(db, u_left, order_data_left)
        print(f"   Order created for 'user_left'. ID={order_left.id}, Amount=${order_left.total_amount}, SW={order_left.total_sw}")
        
        # Checkout order
        crud.complete_checkout(db, order_left)
        db.refresh(u_left)
        db.refresh(rootuser)
        
        print(f"   'user_left' status after purchase: {u_left.status} (Personal SW: {u_left.personal_sw})")
        assert u_left.status == "active", "user_left should become ACTIVE"
        assert u_left.personal_sw == 100.0, "user_left personal SW should be 100.0"
        
        print(f"   Rootuser Left Leg SW after purchase: {rootuser.left_leg_sw}")
        assert rootuser.left_leg_sw == 100.0, "Rootuser Left Leg SW should be 100.0"
        
        # Check Commission to rootuser for user_left (should get 10 INR per SW = 100 * 10 = 1000.0)
        commissions_root = db.query(Commission).filter(Commission.user_id == rootuser.id).all()
        print(f"   Rootuser commissions count: {len(commissions_root)}")
        match_com1 = next(c for c in commissions_root if c.type == "binary_matching")
        print(f"   Rootuser received Matching Commission of {match_com1.amount} INR")
        assert match_com1.amount == 1000.0, "Rootuser match commission should be 1000.0 (100 SW * 10)"
        assert rootuser.wallet_balance == 1000.0, "Rootuser wallet balance should be 1000.0"

        # 7. Purchase for User Right (150 SW)
        print("\n6. Simulating 150 SW purchase for 'user_right'...")
        order_data_right = OrderCreate(items=[
            CartItemCreate(product_id=prod1.id, quantity=1),
            CartItemCreate(product_id=prod2.id, quantity=1)
        ])
        order_right = crud.create_order(db, u_right, order_data_right)
        
        # Checkout order
        crud.complete_checkout(db, order_right)
        db.refresh(u_right)
        db.refresh(rootuser)
        
        print(f"   'user_right' status after purchase: {u_right.status} (Personal SW: {u_right.personal_sw})")
        assert u_right.status == "active", "user_right should become ACTIVE"
        
        # Check volumes propagated
        print(f"   Rootuser Leg Volumes -> Left Leg: {rootuser.left_leg_sw}, Right Leg: {rootuser.right_leg_sw}")
        assert rootuser.left_leg_sw == 100.0, "Left Leg SW should be 100.0"
        assert rootuser.right_leg_sw == 150.0, "Right Leg SW should be 150.0"
        
        # Rootuser matching commission from user_right purchase (150 SW * 10 = 1500 INR)
        # Total rootuser wallet balance = 1000 (initial) + 1500 = 2500 INR
        all_commissions = db.query(Commission).filter(Commission.user_id == rootuser.id).all()
        print(f"   Rootuser total commissions records count: {len(all_commissions)}")
        for c in all_commissions:
            print(f"   - Type: {c.type}, Amount: {c.amount} INR, Desc: {c.description}")
            
        assert len(all_commissions) == 2, "Should have 2 matching commissions"
        assert rootuser.wallet_balance == 2500.0, "Rootuser wallet balance should be 2500.0"
        
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
