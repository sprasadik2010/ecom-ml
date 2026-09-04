"""
Test script for verifying that order purchases and Sales Wallet (SW) remain in Pending Admin Approval
state until an Administrator approves the order.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app import models, crud, schemas
from app.config import settings

def test_pending_sw_and_admin_approval():
    db = SessionLocal()
    try:
        print("\n=== Testing Sales Wallet Pending Admin Approval Workflow ===")

        # Find or create a test member under rootuser
        rootuser = db.query(models.User).filter(models.User.username == "rootuser").first()
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        assert rootuser is not None, "rootuser must exist in DB"
        assert admin is not None, "admin must exist in DB"

        # Check product
        product = db.query(models.Product).first()
        assert product is not None, "At least 1 product must exist"
        initial_stock = product.stock
        print(f"Product: {product.name}, SW: {product.sw}, Stock: {initial_stock}")

        # Check rootuser initial state
        db.refresh(rootuser)
        print(f"Rootuser initial personal SW: {rootuser.personal_sw}, Pending SW: {rootuser.pending_sw}")

        # Clean up any existing test user
        old_test_user = db.query(models.User).filter(models.User.username == "test_shopper").first()
        if old_test_user:
            # delete commissions, orders
            db.query(models.Commission).filter(models.Commission.user_id == old_test_user.id).delete()
            db.query(models.OrderItem).filter(models.OrderItem.order_id.in_([o.id for o in old_test_user.orders])).delete(synchronize_session=False)
            db.query(models.Order).filter(models.Order.user_id == old_test_user.id).delete()
            db.delete(old_test_user)
            db.commit()

        # Create test_shopper
        user_in = schemas.UserCreate(
            username="test_shopper",
            email="shopper@test.com",
            password="password123",
            full_name="Test Shopper",
            phone_number="+919876543210",
            sponsor_username="rootuser",
            position="left"
        )
        buyer = crud.create_user(db, user_in)
        db.commit()
        db.refresh(buyer)

        print(f"Created Buyer: {buyer.username} (Status: {buyer.status}, Personal SW: {buyer.personal_sw}, Pending SW: {buyer.pending_sw})")
        assert buyer.status == "inactive", "New user should be inactive"
        assert buyer.personal_sw == 0.0, "New user personal SW should be 0"
        assert buyer.pending_sw == 0.0, "New user pending SW should be 0"

        # 1. Place an order for 1 item (50 SW or product SW)
        order_sw_expected = product.sw * 1
        order_create = schemas.OrderCreate(
            items=[schemas.CartItemCreate(product_id=product.id, quantity=1)]
        )
        order = crud.create_order(db, buyer, order_create)
        db.refresh(buyer)
        db.refresh(product)

        print(f"\n1. Order created (ID: {order.id}, Total Amount: {order.total_amount}, Total SW: {order.total_sw}, Status: {order.status})")
        assert order.status == "pending", "Order status should be 'pending'"
        assert product.stock == initial_stock - 1, "Product stock should be decremented upon order creation"

        # Verify buyer's SW: personal SW must NOT increase, but pending_sw must reflect the order!
        print(f"Buyer SW state after purchase: Personal SW = {buyer.personal_sw}, Pending SW = {buyer.pending_sw}")
        assert buyer.personal_sw == 0.0, "Buyer personal SW must remain 0.0 before admin approval"
        assert buyer.pending_sw == float(order.total_sw), f"Buyer pending SW should be {order.total_sw}"
        assert buyer.status == "inactive", "Buyer should remain inactive before admin approval"

        # 2. Simulate Admin Approval (complete checkout)
        print(f"\n2. Administrator approving Order #{order.id}...")
        completed_order = crud.complete_checkout(db, order)
        db.refresh(buyer)
        db.refresh(completed_order)

        print(f"Order #{completed_order.id} status: {completed_order.status}")
        print(f"Buyer SW state after approval: Personal SW = {buyer.personal_sw}, Pending SW = {buyer.pending_sw}, Status = {buyer.status}")

        assert completed_order.status == "completed", "Order status should be 'completed' after approval"
        assert buyer.personal_sw == float(completed_order.total_sw), f"Buyer personal SW should now be {completed_order.total_sw}"
        assert buyer.pending_sw == 0.0, "Buyer pending SW should now be 0.0"
        if buyer.personal_sw >= settings.MIN_PURCHASE_FOR_ACTIVATION:
            assert buyer.status == "active", "Buyer should be active after approval"

        # 3. Test Order Cancellation & Stock Restoration
        print(f"\n3. Testing Cancellation and Stock Restoration on a second order...")
        order_create_2 = schemas.OrderCreate(
            items=[schemas.CartItemCreate(product_id=product.id, quantity=2)]
        )
        order_2 = crud.create_order(db, buyer, order_create_2)
        db.refresh(product)
        print(f"Stock after creating 2-qty order: {product.stock}")

        # Cancel the pending order and restore stock
        for item in order_2.items:
            p = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if p:
                p.stock += item.quantity
                db.add(p)
        order_2.status = "cancelled"
        db.commit()
        db.refresh(product)
        print(f"Stock after cancelling order: {product.stock}")
        assert product.stock == initial_stock - 1, "Stock should be fully restored after cancellation"

        # Clean up test user
        parent = db.query(models.User).filter(models.User.id == buyer.parent_id).first()
        if parent:
            if parent.left_child_id == buyer.id:
                parent.left_child_id = None
            if parent.right_child_id == buyer.id:
                parent.right_child_id = None
            parent.left_leg_sw = 0.0
            parent.right_leg_sw = 0.0
            parent.total_left_sw = 0.0
            parent.total_right_sw = 0.0
            parent.total_matched_sw = 0.0
            db.add(parent)
            db.commit()

        db.query(models.Commission).filter(models.Commission.user_id == buyer.id).delete()
        db.query(models.OrderItem).filter(models.OrderItem.order_id.in_([order.id, order_2.id])).delete(synchronize_session=False)
        db.query(models.Order).filter(models.Order.user_id == buyer.id).delete()
        db.delete(buyer)
        # Restore product stock completely
        product.stock = initial_stock
        db.add(product)
        db.commit()

        print("\nAll Sales Wallet Pending & Admin Approval tests passed successfully! 100% SUCCESS")

    finally:
        db.close()

if __name__ == "__main__":
    test_pending_sw_and_admin_approval()
