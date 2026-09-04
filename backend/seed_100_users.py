import os
import sys
import datetime
import random

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import engine, Base, SessionLocal
from app.models import User, Product, Category, Order, OrderItem, Commission, UserRankReward
from app.schemas import UserCreate, OrderCreate, CartItemCreate
from app.auth import get_password_hash
from app import crud
from app.seed import PRODUCTS, CATEGORIES

# 100 Realistic user profiles (names)
NAMES = [
    ("Aarav", "Sharma"), ("Diya", "Patel"), ("Rahul", "Verma"), ("Priya", "Nair"),
    ("Vikram", "Singh"), ("Ananya", "Iyer"), ("Rohit", "Kumar"), ("Sneha", "Reddy"),
    ("Aditya", "Joshi"), ("Pooja", "Chopra"), ("Arjun", "Mehta"), ("Kavya", "Deshmukh"),
    ("Siddharth", "Gupta"), ("Riya", "Sen"), ("Karan", "Malhotra"), ("Tanvi", "Bhatia"),
    ("Manish", "Saxena"), ("Ishaan", "Kapoor"), ("Neha", "Pandey"), ("Varun", "Dhawan"),
    ("Shreya", "Ghoshal"), ("Rohan", "Mishra"), ("Meera", "Menon"), ("Vivek", "Oberoi"),
    ("Anushka", "Rao"), ("Gaurav", "Dubey"), ("Swati", "Kulkarni"), ("Harsh", "Vardhan"),
    ("Divya", "Agarwal"), ("Kunal", "Nayyar"), ("Pooja", "Hegde"), ("Tarun", "Khanna"),
    ("Simran", "Kaur"), ("Dev", "Patel"), ("Alia", "Bhatt"), ("Rishi", "Sunak"),
    ("Deepika", "Padukone"), ("Ranbir", "Kapoor"), ("Kareena", "Khan"), ("Saif", "Ali"),
    ("Shahid", "Kapoor"), ("Mira", "Rajput"), ("Ayushmann", "Khurrana"), ("Tahira", "Kashyap"),
    ("Rajkummar", "Rao"), ("Patralekha", "Paul"), ("Kartik", "Aaryan"), ("Sara", "Khan"),
    ("Janhvi", "Kapoor"), ("Ishaan", "Khatter"), ("Ananya", "Panday"), ("Aditya", "Roy"),
    ("Shraddha", "Kapoor"), ("Tiger", "Shroff"), ("Disha", "Patani"), ("Varun", "Sharma"),
    ("Sunny", "Kaushal"), ("Sharvari", "Wagh"), ("Vicky", "Kaushal"), ("Katrina", "Kaif"),
    ("Abhishek", "Bachchan"), ("Aishwarya", "Rai"), ("Amitabh", "Bachchan"), ("Jaya", "Bachchan"),
    ("Hrithik", "Roshan"), ("Saba", "Azad"), ("Farhan", "Akhtar"), ("Shibani", "Dandekar"),
    ("Sanjay", "Dutt"), ("Manyata", "Dutt"), ("Suniel", "Shetty"), ("Mana", "Shetty"),
    ("Ahan", "Shetty"), ("Athiya", "Shetty"), ("KL", "Rahul"), ("Hardik", "Pandya"),
    ("Natasa", "Stankovic"), ("Krunal", "Pandya"), ("Pankhuri", "Sharma"), ("Rohit", "Sharma"),
    ("Ritika", "Sajdeh"), ("Virat", "Kohli"), ("Anushka", "Sharma"), ("MS", "Dhoni"),
    ("Sakshi", "Dhoni"), ("Sachin", "Tendulkar"), ("Anjali", "Tendulkar"), ("Yuvraj", "Singh"),
    ("Hazel", "Keech"), ("Zaheer", "Khan"), ("Sagarika", "Ghatge"), ("Harbhajan", "Singh"),
    ("Geeta", "Basra"), ("Suresh", "Raina"), ("Priyanka", "Chaudhary"), ("Ravindra", "Jadeja"),
    ("Riva", "Solanki"), ("Jasprit", "Bumrah"), ("Sanjana", "Ganesan"), ("Shubman", "Gill")
]

def seed_100_users():
    print("=" * 70)
    print("STARTING SEEDING OF 100 NETWORK USERS & COMMISSIONS PIPELINE")
    print("=" * 70)
    
    # 1. Ensure all tables are created
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    try:
        # Safe migration for new columns if on Postgres
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN total_matched_sw FLOAT DEFAULT 0.0"))
            db.commit()
        except Exception:
            db.rollback()
            
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN current_level INTEGER DEFAULT 0"))
            db.commit()
        except Exception:
            db.rollback()
            
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN level_name VARCHAR DEFAULT 'Member'"))
            db.commit()
        except Exception:
            db.rollback()
            
        # 2. Seed Categories
        print("1. Verifying categories catalog...")
        for c_data in CATEGORIES:
            cat = db.query(Category).filter(Category.name == c_data["name"]).first()
            if not cat:
                cat = Category(**c_data)
                db.add(cat)
        db.commit()

        # 3. Seed Products
        print("2. Verifying products catalog...")
        for p_data in PRODUCTS:
            prod = db.query(Product).filter(Product.name == p_data["name"]).first()
            if not prod:
                prod = Product(**p_data)
                db.add(prod)
        db.commit()
        
        all_products = db.query(Product).all()
        print(f"   Available Products: {len(all_products)} items loaded.")
        
        # 4. Seed Root Administrator
        print("\n3. Verifying Root Admin and Mother Node (rootuser)...")
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@mlm-amazon.com",
                full_name="System Administrator",
                hashed_password=get_password_hash("admin123"),
                phone_number="+919876543210",
                status="active",
                personal_sw=100.0,
                wallet_balance=0.0,
                is_admin=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("   Created 'admin' user.")
            
        # 5. Seed Genealogy Root Mother Node
        rootuser = db.query(User).filter(User.username == "rootuser").first()
        if not rootuser:
            rootuser = User(
                username="rootuser",
                email="rootuser@mlm-amazon.com",
                full_name="Root User",
                hashed_password=get_password_hash("password123"),
                phone_number="+919876543211",
                status="active",
                personal_sw=100.0,
                wallet_balance=0.0,
                is_admin=False
            )
            db.add(rootuser)
            db.commit()
            db.refresh(rootuser)
            print("   Created 'rootuser' genealogy mother node.")
            
        # 6. Build Breadth-First Binary Network of 100 Users
        print("\n4. Constructing Binary Tree with 100 Structured Downline Members...")
        
        # Queue of available parents for binary tree placement
        # We start with rootuser
        parent_queue = [rootuser]
        
        # Keep track of all created users
        created_users = []
        
        default_hashed_pw = get_password_hash("password123")
        
        for i in range(100):
            first_name, last_name = NAMES[i]
            username = f"{first_name.lower()}_{last_name.lower()}{i+1}"
            email = f"{username}@testmlm.com"
            phone = f"+9198{i:08d}"
            
            # Check if user already exists
            existing = db.query(User).filter(User.username == username).first()
            if existing:
                created_users.append(existing)
                # Ensure existing node is in queue if it has open slots
                if existing.left_child_id is None or existing.right_child_id is None:
                    parent_queue.append(existing)
                continue
                
            # Pop the first parent from queue that has an open slot
            target_parent = None
            slot_position = None
            
            while parent_queue:
                candidate = parent_queue[0]
                db.refresh(candidate)
                if candidate.left_child_id is None:
                    target_parent = candidate
                    slot_position = "left"
                    break
                elif candidate.right_child_id is None:
                    target_parent = candidate
                    slot_position = "right"
                    # Once right child is filled, candidate has both children, so pop candidate from queue
                    parent_queue.pop(0)
                    break
                else:
                    parent_queue.pop(0)
                    
            if not target_parent:
                # Fallback: sponsor from rootuser
                target_parent, slot_position = crud.find_binary_placement(db, rootuser.id, "left")
                
            new_user = User(
                username=username,
                email=email,
                full_name=f"{first_name} {last_name}",
                hashed_password=default_hashed_pw,
                phone_number=phone,
                sponsor_id=target_parent.id,
                parent_id=target_parent.id,
                position=slot_position,
                status="inactive",
                personal_sw=0.0,
                left_leg_sw=0.0,
                right_leg_sw=0.0,
                total_left_sw=0.0,
                total_right_sw=0.0,
                total_matched_sw=0.0,
                wallet_balance=0.0,
                current_level=0,
                level_name="Member"
            )
            db.add(new_user)
            db.flush()
            
            # Link to parent node
            if slot_position == "left":
                target_parent.left_child_id = new_user.id
            else:
                target_parent.right_child_id = new_user.id
            db.add(target_parent)
            db.commit()
            db.refresh(new_user)
            
            created_users.append(new_user)
            parent_queue.append(new_user)
            
            if (i + 1) % 20 == 0 or (i + 1) == 100:
                print(f"   - Created {i + 1} / 100 users (Latest: @{username} placed {slot_position} of @{target_parent.username})")
                
        print(f"\n✅ Total Network Users Seeded: {len(created_users)}", flush=True)
        
        # 7. Simulate Product Purchases across downlines
        # Let's activate users and generate matching volume from bottom to top
        print("\n5. Simulating E-commerce Purchases, 1:1 Binary Matching & Rank Promotions...", flush=True)
        
        # Choose products with good SW values
        watch_prod = next((p for p in all_products if p.sw == 100), all_products[0])
        headphone_prod = next((p for p in all_products if p.sw == 70), all_products[0])
        backpack_prod = next((p for p in all_products if p.sw == 50), all_products[0])
        lamp_prod = next((p for p in all_products if p.sw == 25), all_products[0])
        
        # We simulate purchases for 80 of the 100 users so that there is a mix of active, inactive, and multi-tier matched users
        orders_created = 0
        
        # Traverse users in reverse order (bottom up) so that volume bubbles up naturally
        users_to_process = list(reversed(created_users[:85]))
        
        for idx, u in enumerate(users_to_process):
            try:
                # Refresh user instance from DB
                user_record = db.query(User).filter(User.id == u.id).first()
                if not user_record:
                    continue
                    
                existing_orders = db.query(Order).filter(Order.user_id == user_record.id).count()
                if existing_orders > 0:
                    continue
                    
                # Pick products to buy: 50 SW, 100 SW, or 150 SW
                choice = random.choice([1, 2, 3, 4])
                items = []
                if choice == 1:
                    items.append(CartItemCreate(product_id=watch_prod.id, quantity=1)) # 100 SW
                elif choice == 2:
                    items.append(CartItemCreate(product_id=backpack_prod.id, quantity=1)) # 50 SW
                elif choice == 3:
                    items.append(CartItemCreate(product_id=headphone_prod.id, quantity=1)) # 70 SW
                    items.append(CartItemCreate(product_id=lamp_prod.id, quantity=1)) # 25 SW
                else:
                    items.append(CartItemCreate(product_id=watch_prod.id, quantity=1)) # 100 SW
                    items.append(CartItemCreate(product_id=backpack_prod.id, quantity=1)) # 50 SW
                    
                order = crud.create_order(db, user_record, OrderCreate(items=items))
                crud.complete_checkout(db, order)
                orders_created += 1
                
                if orders_created % 10 == 0 or idx == len(users_to_process) - 1:
                    print(f"   - Processed {orders_created} orders (Latest buyer: @{user_record.username})", flush=True)
            except Exception as order_err:
                db.rollback()
                print(f"   [Notice] Order for user {u.username} encountered: {order_err}. Retrying with fresh session...", flush=True)
                db.close()
                db = SessionLocal()
            
        print(f"\n   Total Orders Created & Volume Propagated: {orders_created}", flush=True)
        
        # 8. Summary of Results
        total_users_count = db.query(User).filter(User.is_admin == False).count()
        active_users_count = db.query(User).filter(User.status == "active", User.is_admin == False).count()
        total_orders_count = db.query(Order).count()
        total_commissions_count = db.query(Commission).count()
        total_rewards_count = db.query(UserRankReward).count()
        
        # Check users who achieved ranks
        ranked_users = db.query(User).filter(User.current_level > 0).order_by(User.current_level.desc()).all()
        
        print("\n" + "=" * 70, flush=True)
        print("SEEDING SUMMARY & NETWORK METRICS", flush=True)
        print("=" * 70, flush=True)
        print(f"Total Members:             {total_users_count}", flush=True)
        print(f"Active Members (>=50 SW):  {active_users_count}", flush=True)
        print(f"Total Orders Processed:    {total_orders_count}", flush=True)
        print(f"Commission Transactions:   {total_commissions_count}", flush=True)
        print(f"Active Rank Royalty Plans: {total_rewards_count}", flush=True)
        print("-" * 70, flush=True)
        print("TOP RANK ACHIEVERS:", flush=True)
        for ru in ranked_users[:15]:
            print(f" - @{ru.username:<20} | {ru.full_name:<20} | {ru.level_name:<24} | Matched: {ru.total_matched_sw:>5.0f} SW | Wallet: INR {ru.wallet_balance:>9.2f}", flush=True)
        print("-" * 70, flush=True)
        print("TEST LOGIN CREDENTIALS:", flush=True)
        print(" • Administrator:       Username: admin           Password: admin123", flush=True)
        print(" • Mother Node:         Username: rootuser        Password: password123", flush=True)
        if ranked_users:
            print(f" • Top Ranked Member:   Username: {ranked_users[0].username:<14}  Password: password123", flush=True)
            if len(ranked_users) > 1:
                print(f" • Level 1/2 Member:    Username: {ranked_users[1].username:<14}  Password: password123", flush=True)
        print(f" • Standard Member:     Username: {created_users[0].username:<14}  Password: password123", flush=True)
        print("=" * 70, flush=True)
        
    except Exception as e:
        db.rollback()
        print(f"\nERROR DURING SEEDING: {e}", flush=True)
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_100_users()

