import os
import sys
import datetime
import random
import logging

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

logging.basicConfig(level=logging.WARNING)

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import engine, Base, SessionLocal
from app.models import User, Product, Category, Order, OrderItem, Commission, UserRankReward
from app.auth import get_password_hash
from app.seed import PRODUCTS, CATEGORIES
from app.mlm import LEVEL_CONFIG

FIRST_NAMES = [
    "Aarav", "Diya", "Rahul", "Priya", "Vikram", "Ananya", "Rohit", "Sneha", "Aditya", "Pooja",
    "Arjun", "Kavya", "Siddharth", "Riya", "Karan", "Tanvi", "Manish", "Ishaan", "Neha", "Varun",
    "Shreya", "Rohan", "Meera", "Vivek", "Anushka", "Gaurav", "Swati", "Harsh", "Divya", "Kunal",
    "Tarun", "Simran", "Dev", "Alia", "Rishi", "Deepika", "Ranbir", "Kareena", "Saif", "Shahid",
    "Mira", "Ayushmann", "Tahira", "Rajkummar", "Kartik", "Sara", "Janhvi", "Disha", "Sunny", "Sharvari"
]

LAST_NAMES = [
    "Sharma", "Patel", "Verma", "Nair", "Singh", "Iyer", "Kumar", "Reddy", "Joshi", "Chopra",
    "Mehta", "Deshmukh", "Gupta", "Sen", "Malhotra", "Bhatia", "Saxena", "Kapoor", "Pandey", "Dhawan",
    "Ghoshal", "Mishra", "Menon", "Oberoi", "Rao", "Dubey", "Kulkarni", "Vardhan", "Agarwal", "Nayyar"
]

def generate_300_names():
    names = []
    for last in LAST_NAMES:
        for first in FIRST_NAMES:
            names.append((first, last))
            if len(names) == 300:
                return names
    return names

def seed_300_users():
    print("=" * 80, flush=True)
    print("STARTING DIRECT ZERO-ROUNDTRIP 300 NETWORK USERS & COMMISSIONS SEEDING", flush=True)
    print("=" * 80, flush=True)
    
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal(expire_on_commit=False)
    
    try:
        # 1. Categories
        print("1. Verifying categories catalog...", flush=True)
        for c_data in CATEGORIES:
            cat = db.query(Category).filter(Category.name == c_data["name"]).first()
            if not cat:
                cat = Category(**c_data)
                db.add(cat)
            else:
                cat.image_url = c_data.get("image_url", cat.image_url)
                db.add(cat)

        # 2. Products Catalog with ample stock
        print("2. Verifying products catalog (stock = 10,000)...", flush=True)
        for p_data in PRODUCTS:
            prod = db.query(Product).filter(Product.name == p_data["name"]).first()
            if not prod:
                prod = Product(**p_data)
                prod.stock = 10000
                db.add(prod)
            else:
                for key, val in p_data.items():
                    setattr(prod, key, val)
                prod.stock = 10000
                db.add(prod)
        db.commit()
        
        all_products = db.query(Product).all()
        print(f"   Catalog: {len(all_products)} products available with ample inventory.", flush=True)

        # 3. Clean up existing downline network data
        print("\n3. Resetting previous test data...", flush=True)
        users_to_delete = db.query(User).filter(~User.username.in_(["admin", "rootuser"])).all()
        del_ids = [u.id for u in users_to_delete]
        if del_ids:
            db.execute(text("UPDATE users SET sponsor_id = NULL, parent_id = NULL, left_child_id = NULL, right_child_id = NULL"))
            
            orders_to_delete = db.query(Order).filter(Order.user_id.in_(del_ids)).all()
            order_ids_to_del = [o.id for o in orders_to_delete]
            if order_ids_to_del:
                db.query(OrderItem).filter(OrderItem.order_id.in_(order_ids_to_del)).delete(synchronize_session=False)
                db.query(Order).filter(Order.id.in_(order_ids_to_del)).delete(synchronize_session=False)
                
            db.query(Commission).filter(Commission.user_id.in_(del_ids)).delete(synchronize_session=False)
            db.query(UserRankReward).filter(UserRankReward.user_id.in_(del_ids)).delete(synchronize_session=False)
            db.query(User).filter(User.id.in_(del_ids)).delete(synchronize_session=False)
            db.commit()
            print(f"   Cleaned {len(del_ids)} test users.", flush=True)

        # 4. Initialize Admin & Mother Node ('rootuser')
        print("\n4. Initializing Admin & Mother Node ('rootuser')...", flush=True)
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
        else:
            admin.is_admin = True
            admin.status = "active"
            db.add(admin)

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
                left_leg_sw=0.0,
                right_leg_sw=0.0,
                total_left_sw=0.0,
                total_right_sw=0.0,
                total_matched_sw=0.0,
                wallet_balance=0.0,
                current_level=0,
                level_name="Member",
                is_admin=False
            )
            db.add(rootuser)
        else:
            rootuser.sponsor_id = None
            rootuser.parent_id = None
            rootuser.position = None
            rootuser.left_child_id = None
            rootuser.right_child_id = None
            rootuser.personal_sw = 100.0
            rootuser.left_leg_sw = 0.0
            rootuser.right_leg_sw = 0.0
            rootuser.total_left_sw = 0.0
            rootuser.total_right_sw = 0.0
            rootuser.total_matched_sw = 0.0
            rootuser.wallet_balance = 0.0
            rootuser.current_level = 0
            rootuser.level_name = "Member"
            rootuser.status = "active"
            rootuser.is_admin = False
            db.query(Commission).filter(Commission.user_id == rootuser.id).delete(synchronize_session=False)
            db.query(UserRankReward).filter(UserRankReward.user_id == rootuser.id).delete(synchronize_session=False)
            db.add(rootuser)
            
        db.commit()
        db.refresh(rootuser)
        print(f"   Root Administrator ('admin') and Root Mother Node ('rootuser' ID: {rootuser.id}) ready.", flush=True)

        # 5. Pre-allocate ID Range for 300 Downline Users
        print("\n5. Pre-allocating ID range and mapping binary tree topology in memory...", flush=True)
        max_user_id = db.execute(text("SELECT COALESCE(MAX(id), 0) FROM users")).scalar()
        start_user_id = max_user_id + 1
        
        names_list = generate_300_names()
        default_hashed_pw = get_password_hash("password123")
        now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        
        tree_nodes = [rootuser]
        for i in range(300):
            uid = start_user_id + i
            first_name, last_name = names_list[i]
            username = f"{first_name.lower()}_{last_name.lower()}{i+1}"
            email = f"{username}@testmlm.com"
            phone = f"+9198{i:08d}"
            
            u = User(
                id=uid,
                username=username,
                email=email,
                full_name=f"{first_name} {last_name}",
                hashed_password=default_hashed_pw,
                phone_number=phone,
                status="inactive",
                personal_sw=0.0,
                left_leg_sw=0.0,
                right_leg_sw=0.0,
                total_left_sw=0.0,
                total_right_sw=0.0,
                total_matched_sw=0.0,
                wallet_balance=0.0,
                current_level=0,
                level_name="Member",
                is_admin=False,
                created_at=now - datetime.timedelta(days=random.randint(1, 30))
            )
            tree_nodes.append(u)
            
        left_child_map = {}
        right_child_map = {}
        for k in range(len(tree_nodes)):
            left_idx = 2 * k + 1
            right_idx = 2 * k + 2
            
            if left_idx < len(tree_nodes):
                left_child_map[tree_nodes[k].id] = tree_nodes[left_idx].id
            if right_idx < len(tree_nodes):
                right_child_map[tree_nodes[k].id] = tree_nodes[right_idx].id
                
            if k > 0:
                parent_idx = (k - 1) // 2
                tree_nodes[k].parent_id = tree_nodes[parent_idx].id
                tree_nodes[k].sponsor_id = tree_nodes[parent_idx].id
                tree_nodes[k].position = "left" if ((k - 1) % 2 == 0) else "right"
                
            tree_nodes[k].left_child_id = None
            tree_nodes[k].right_child_id = None

        print(f"   Binary tree geometry constructed across 8 levels for 300 users.", flush=True)

        # 6. Simulate Completed Purchases, Volume Propagation & 1:1 Binary Matching
        print("\n6. Simulating Completed Purchases (240 users) & Propagating MLM Commissions...", flush=True)
        watch_prod = next((p for p in all_products if p.sw == 100), all_products[0])
        headphone_prod = next((p for p in all_products if p.sw == 70), all_products[0])
        backpack_prod = next((p for p in all_products if p.sw == 50), all_products[0])
        chair_prod = next((p for p in all_products if p.sw == 150), all_products[0])
        lamp_prod = next((p for p in all_products if p.sw == 25), all_products[0])
        protein_prod = next((p for p in all_products if p.sw == 40), all_products[0])

        user_map = {u.id: u for u in tree_nodes}
        buyers = list(reversed(tree_nodes[1:241]))
        
        created_orders = []
        created_commissions = []
        
        for idx, buyer in enumerate(buyers):
            choice = (idx % 5) + 1
            items_spec = []
            
            if choice == 1:
                items_spec.append((watch_prod, 1)) # 100 SW (₹12,999)
            elif choice == 2:
                items_spec.append((backpack_prod, 1)) # 50 SW (₹3,499)
            elif choice == 3:
                items_spec.append((chair_prod, 1)) # 150 SW (₹15,999)
            elif choice == 4:
                items_spec.append((headphone_prod, 1)) # 70 SW (₹7,999)
                items_spec.append((protein_prod, 1)) # 40 SW (₹3,999) - Total 110 SW
            else:
                items_spec.append((watch_prod, 1)) # 100 SW
                items_spec.append((backpack_prod, 2)) # 100 SW - Total 200 SW
                
            tot_amount = sum(p.price * qty for p, qty in items_spec)
            tot_sw = sum(p.sw * qty for p, qty in items_spec)
            
            for p, qty in items_spec:
                p.stock -= qty
                
            order_items = [
                OrderItem(
                    product_id=p.id,
                    quantity=qty,
                    price=p.price,
                    sw=p.sw
                ) for p, qty in items_spec
            ]
            
            order = Order(
                user_id=buyer.id,
                total_amount=tot_amount,
                total_sw=tot_sw,
                status="completed",
                created_at=now - datetime.timedelta(days=random.randint(1, 25)),
                items=order_items
            )
            created_orders.append(order)
            
            buyer.personal_sw += tot_sw
            if buyer.personal_sw >= 50.0:
                buyer.status = "active"
                
            child = buyer
            curr_parent_id = buyer.parent_id
            
            while curr_parent_id is not None:
                parent = user_map.get(curr_parent_id)
                if not parent:
                    break
                    
                if child.id == left_child_map.get(parent.id) or child.position == "left":
                    parent.left_leg_sw = (parent.left_leg_sw or 0.0) + tot_sw
                    parent.total_left_sw = (parent.total_left_sw or 0.0) + tot_sw
                elif child.id == right_child_map.get(parent.id) or child.position == "right":
                    parent.right_leg_sw = (parent.right_leg_sw or 0.0) + tot_sw
                    parent.total_right_sw = (parent.total_right_sw or 0.0) + tot_sw
                    
                unmatched_left = parent.left_leg_sw or 0.0
                unmatched_right = parent.right_leg_sw or 0.0
                matchable_sw = min(unmatched_left, unmatched_right)
                
                if matchable_sw > 0 and parent.status == "active":
                    commission_amount = matchable_sw * 10.0
                    parent.wallet_balance = (parent.wallet_balance or 0.0) + commission_amount
                    parent.left_leg_sw = unmatched_left - matchable_sw
                    parent.right_leg_sw = unmatched_right - matchable_sw
                    parent.total_matched_sw = (parent.total_matched_sw or 0.0) + matchable_sw
                    
                    created_commissions.append(Commission(
                        user_id=parent.id,
                        amount=commission_amount,
                        type="binary_matching",
                        description=f"Team Match: {matchable_sw:g} matching SW paired @ ₹10 = ₹{commission_amount:,.2f}",
                        created_at=order.created_at
                    ))
                    
                child = parent
                curr_parent_id = parent.parent_id

        # 7. Hierarchical Rank / Level Promotions Evaluation & Month 1 Royalties
        print("\n7. Evaluating Rank Royalties (Levels 1-10) across Network...", flush=True)
        def count_qualified_subnodes(child_id: int | None) -> int:
            if not child_id or child_id not in user_map:
                return 0
            count = 0
            q = [child_id]
            while q:
                cid = q.pop(0)
                u = user_map.get(cid)
                if not u:
                    continue
                if (u.personal_sw or 0.0) >= 100.0:
                    count += 1
                lc = left_child_map.get(u.id)
                rc = right_child_map.get(u.id)
                if lc and lc in user_map:
                    q.append(lc)
                if rc and rc in user_map:
                    q.append(rc)
            return count

        created_rewards = []
        for u in tree_nodes:
            curr_lvl = u.current_level or 0
            left_nodes = count_qualified_subnodes(left_child_map.get(u.id))
            right_nodes = count_qualified_subnodes(right_child_map.get(u.id))
            
            for target_lvl in range(curr_lvl + 1, 11):
                target_cfg = LEVEL_CONFIG.get(target_lvl)
                if not target_cfg:
                    break
                req_nodes = target_cfg.get("target_nodes", 1)
                
                if left_nodes >= req_nodes and right_nodes >= req_nodes:
                    u.current_level = target_lvl
                    u.level_name = target_cfg["name"]
                    
                    monthly_amount = target_cfg["monthly_amount"]
                    duration_months = target_cfg["duration_months"]
                    
                    reward = UserRankReward(
                        user_id=u.id,
                        level=target_lvl,
                        level_name=target_cfg["name"],
                        monthly_amount=monthly_amount,
                        total_months=duration_months,
                        months_paid=1,
                        status="completed" if duration_months <= 1 else "active",
                        created_at=now,
                        last_payout_at=now,
                        next_payout_at=(now + datetime.timedelta(days=30)) if duration_months > 1 else None
                    )
                    created_rewards.append(reward)
                    
                    u.wallet_balance = (u.wallet_balance or 0.0) + monthly_amount
                    created_commissions.append(Commission(
                        user_id=u.id,
                        amount=monthly_amount,
                        type="rank_level_reward",
                        description=f"🎉 Achieved {target_cfg['name']}! Month 1 of {duration_months} monthly royalty (₹{monthly_amount:,.2f}) credited to wallet.",
                        created_at=now
                    ))
                else:
                    break

        # 8. Seed 25 Pending Purchase Orders for Admin Approval Testing
        print("\n8. Creating Pending Purchase Orders for Admin Approval Testing...", flush=True)
        pending_users = tree_nodes[241:266]
        for idx, pending_user in enumerate(pending_users):
            choice = (idx % 4) + 1
            items_spec = []
            if choice == 1:
                items_spec.append((watch_prod, 1)) # 100 SW
            elif choice == 2:
                items_spec.append((backpack_prod, 1)) # 50 SW
            elif choice == 3:
                items_spec.append((headphone_prod, 1)) # 70 SW
                items_spec.append((lamp_prod, 1)) # 25 SW
            else:
                items_spec.append((chair_prod, 1)) # 150 SW
                
            tot_amount = sum(p.price * qty for p, qty in items_spec)
            tot_sw = sum(p.sw * qty for p, qty in items_spec)
            
            order_items = [
                OrderItem(
                    product_id=p.id,
                    quantity=qty,
                    price=p.price,
                    sw=p.sw
                ) for p, qty in items_spec
            ]
            
            pending_order = Order(
                user_id=pending_user.id,
                total_amount=tot_amount,
                total_sw=tot_sw,
                status="pending",
                created_at=now - datetime.timedelta(hours=random.randint(1, 48)),
                items=order_items
            )
            created_orders.append(pending_order)

        # 9. Correct Insertion Order:
        # Step A: Insert 300 users first so all IDs exist
        print("\n9. Writing 300 downline users to database...", flush=True)
        db.add_all(tree_nodes[1:])
        db.flush()
        
        # Step B: Now update child pointers across all nodes
        print("   Linking left and right binary child pointers...", flush=True)
        for u in tree_nodes:
            u.left_child_id = left_child_map.get(u.id)
            u.right_child_id = right_child_map.get(u.id)

        print("   Writing orders, commissions, and rank rewards...", flush=True)
        db.add(rootuser)
        db.add_all(created_orders)
        db.add_all(created_commissions)
        db.add_all(created_rewards)
        db.commit()
        
        # Synchronize sequence
        new_max_user_id = db.execute(text("SELECT MAX(id) FROM users")).scalar()
        if new_max_user_id:
            try:
                db.execute(text(f"SELECT setval('users_id_seq', {new_max_user_id})"))
                db.commit()
            except Exception:
                db.rollback()
                
        print("   Database transaction committed successfully!", flush=True)

        # 10. Summary & Metrics Report
        total_members = db.query(User).filter(User.is_admin == False).count()
        active_members = db.query(User).filter(User.status == "active", User.is_admin == False).count()
        inactive_members = db.query(User).filter(User.status == "inactive", User.is_admin == False).count()
        
        total_orders_db = db.query(Order).count()
        completed_orders_db = db.query(Order).filter(Order.status == "completed").count()
        pending_orders_db = db.query(Order).filter(Order.status == "pending").count()
        
        total_commissions_db = db.query(Commission).count()
        total_comm_amount_db = sum(c.amount for c in db.query(Commission).all())
        total_rewards_db = db.query(UserRankReward).count()
        
        db.refresh(rootuser)
        ranked_users = db.query(User).filter(User.current_level > 0, User.is_admin == False).order_by(User.current_level.desc(), User.wallet_balance.desc()).all()

        print("\n" + "=" * 80, flush=True)
        print("SEEDING COMPLETE: 300 USERS NETWORK METRICS & COMMISSION REPORT", flush=True)
        print("=" * 80, flush=True)
        print(f"Total Network Members:       {total_members} (300 downline + 1 rootuser)")
        print(f"Active Members (>= 50 SW):   {active_members}")
        print(f"Inactive Members (0 SW):     {inactive_members}")
        print(f"Total Orders:                {total_orders_db} ({completed_orders_db} Completed, {pending_orders_db} Pending Approval)")
        print(f"Total Commission Ledger:     {total_commissions_db} payouts (₹{total_comm_amount_db:,.2f} total disbursed)")
        print(f"Active Rank Royalty Plans:   {total_rewards_db}")
        print("-" * 80, flush=True)
        print("ROOTUSER (GENEALOGY MOTHER NODE) METRICS:")
        print(f" • Username:                 {rootuser.username}")
        print(f" • Current Rank / Level:     {rootuser.level_name} (Level {rootuser.current_level})")
        print(f" • Personal Volume:          {rootuser.personal_sw} SW")
        print(f" • Total Left Leg Volume:    {rootuser.total_left_sw:,.0f} SW")
        print(f" • Total Right Leg Volume:   {rootuser.total_right_sw:,.0f} SW")
        print(f" • Total Matched Volume:     {rootuser.total_matched_sw:,.0f} SW")
        print(f" • Unmatched Carryforward:   Left: {rootuser.left_leg_sw:,.0f} SW | Right: {rootuser.right_leg_sw:,.0f} SW")
        print(f" • Total Wallet Income:      ₹{rootuser.wallet_balance:,.2f}")
        print("-" * 80, flush=True)
        print("TOP RANK ACHIEVERS IN NETWORK:")
        for ru in ranked_users[:15]:
            print(f" - @{ru.username:<24} | {ru.full_name:<20} | {ru.level_name:<26} | Matched: {ru.total_matched_sw:>6.0f} SW | Wallet: ₹{ru.wallet_balance:>10.2f}")
        print("-" * 80, flush=True)
        print("SAMPLE LOGIN CREDENTIALS FOR TESTING (Password for all accounts: password123):")
        print(" • Administrator:            Username: admin            (Password: admin123)")
        print(" • Mother Node (Top Earner): Username: rootuser         (Password: password123)")
        if len(ranked_users) > 1:
            print(f" • High Rank Leader:         Username: {ranked_users[1].username:<16} (Password: password123)")
        if len(ranked_users) > 3:
            print(f" • Mid Rank Leader:          Username: {ranked_users[3].username:<16} (Password: password123)")
        if pending_users:
            print(f" • User with Pending Order:  Username: {pending_users[0].username:<16} (Password: password123)")
        print(f" • Inactive/New Member:      Username: {tree_nodes[-1].username:<16} (Password: password123)")
        print("=" * 80, flush=True)

    except Exception as e:
        db.rollback()
        print(f"\nERROR DURING SEEDING: {e}", flush=True)
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_300_users()
