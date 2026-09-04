import os
import sys

# Ensure backend root is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine, SessionLocal
from app.models import User, Order, OrderItem, Commission, UserRankReward

def cleanup_users():
    print("=" * 60)
    print("STARTING DATABASE USER CLEANUP")
    print("Preserving ONLY: 'admin' and 'rootuser'")
    print("=" * 60)

    db = SessionLocal()
    try:
        # 1. Fetch preserved users
        admin = db.query(User).filter(User.username == "admin").first()
        rootuser = db.query(User).filter(User.username == "rootuser").first()

        if not admin:
            print("WARNING: 'admin' user not found! Please check seed.")
        else:
            print(f"Found 'admin' (ID: {admin.id}, Email: {admin.email})")

        if not rootuser:
            print("WARNING: 'rootuser' user not found! Please check seed.")
        else:
            print(f"Found 'rootuser' (ID: {rootuser.id}, Email: {rootuser.email})")

        preserved_ids = [u.id for u in [admin, rootuser] if u]
        print(f"Preserved user IDs: {preserved_ids}")

        # 2. Count users to be removed
        total_users_before = db.query(User).count()
        users_to_delete = db.query(User).filter(~User.username.in_(["admin", "rootuser"])).all()
        delete_count = len(users_to_delete)
        delete_ids = [u.id for u in users_to_delete]

        print(f"Total users before cleanup: {total_users_before}")
        print(f"Users to delete: {delete_count}")

        # 3. Disconnect self-referencing foreign keys on all users
        print("\nStep 1: Clearing tree pointers and foreign key links...")
        db.execute(text("UPDATE users SET sponsor_id = NULL, parent_id = NULL, left_child_id = NULL, right_child_id = NULL"))
        db.commit()

        # 4. Remove dependent records for deleted users (orders, order items, commissions, rank rewards)
        print("Step 2: Removing dependent records (orders, commissions, rewards)...")
        if delete_ids:
            # Delete order items for orders of deleted users
            orders_to_delete = db.query(Order).filter(Order.user_id.in_(delete_ids)).all()
            order_ids_to_delete = [o.id for o in orders_to_delete]
            if order_ids_to_delete:
                db.query(OrderItem).filter(OrderItem.order_id.in_(order_ids_to_delete)).delete(synchronize_session=False)
                db.query(Order).filter(Order.id.in_(order_ids_to_delete)).delete(synchronize_session=False)

            # Delete commissions for deleted users
            db.query(Commission).filter(Commission.user_id.in_(delete_ids)).delete(synchronize_session=False)

            # Delete rank rewards for deleted users
            db.query(UserRankReward).filter(UserRankReward.user_id.in_(delete_ids)).delete(synchronize_session=False)

            db.commit()

        # 5. Delete non-preserved users
        print("Step 3: Deleting users...")
        if delete_ids:
            deleted_rows = db.query(User).filter(User.id.in_(delete_ids)).delete(synchronize_session=False)
            db.commit()
            print(f"Deleted {deleted_rows} user rows from database.")

        # 6. Reset tree & volume attributes on rootuser and admin to clean state
        print("Step 4: Resetting rootuser & admin tree state...")
        if rootuser:
            rootuser = db.query(User).filter(User.username == "rootuser").first()
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

        if admin:
            admin = db.query(User).filter(User.username == "admin").first()
            admin.sponsor_id = None
            admin.parent_id = None
            admin.position = None
            admin.left_child_id = None
            admin.right_child_id = None
            admin.personal_sw = 100.0
            admin.left_leg_sw = 0.0
            admin.right_leg_sw = 0.0
            admin.total_left_sw = 0.0
            admin.total_right_sw = 0.0
            admin.total_matched_sw = 0.0
            admin.wallet_balance = 0.0
            admin.current_level = 0
            admin.level_name = "Member"
            admin.status = "active"
            admin.is_admin = True

        db.commit()

        # 7. Verification
        total_users_after = db.query(User).count()
        remaining_users = db.query(User).all()

        print("\n" + "=" * 60)
        print(f"CLEANUP COMPLETE! Total users remaining: {total_users_after}")
        for u in remaining_users:
            print(f" - ID: {u.id} | Username: {u.username} | Email: {u.email} | Status: {u.status} | IsAdmin: {u.is_admin} | LeftChild: {u.left_child_id} | RightChild: {u.right_child_id}")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"ERROR during cleanup: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_users()
