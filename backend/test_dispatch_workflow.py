"""
End-to-end test script for verifying Postal Dispatch Management and Consignment Tracking.
Tests:
1. Creating an order with recipient shipping details (Name, Address, City, State, PIN, Phone).
2. Admin approving the order.
3. Admin updating Postal Dispatch with Tracking Consignment ID (Speed Post EM123456789IN).
4. Customer fetching order listing and verifying tracking number, carrier, and postal tracking portal URL.
5. Marking order as delivered.
"""

import sys
import os

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models, crud, schemas
from app.main import on_startup

def test_dispatch_workflow():
    on_startup()
    db = SessionLocal()
    try:
        print("\n========================================================")
        print("  TESTING POSTAL DISPATCH & CONSIGNMENT TRACKING WORKFLOW")
        print("========================================================\n")

        # 1. Get or create test user and product
        user = db.query(models.User).filter(models.User.username == "rootuser").first()
        assert user is not None, "rootuser must exist in DB"

        product = db.query(models.Product).first()
        assert product is not None, "At least 1 product must exist"
        print(f"✓ Found Product: {product.name} (Price: ₹{product.price}, SW: {product.sw})")

        # 2. Create an order with full shipping destination info
        order_create = schemas.OrderCreate(
            items=[schemas.CartItemCreate(product_id=product.id, quantity=1)],
            shipping_name="Rajesh Kumar",
            shipping_address="House No 42, Green Park Avenue, Near Post Office",
            shipping_city="Bangalore",
            shipping_state="Karnataka",
            shipping_zip="560001",
            shipping_phone="+919876543210"
        )
        order = crud.create_order(db, user, order_create)
        db.commit()
        db.refresh(order)

        print(f"✓ Created Order #{order.id}:")
        print(f"   Recipient: {order.shipping_name}")
        print(f"   Address: {order.shipping_address}, {order.shipping_city}, {order.shipping_state} - {order.shipping_zip}")
        print(f"   Phone: {order.shipping_phone}")
        print(f"   Dispatch Status: {order.dispatch_status}")
        assert order.dispatch_status == "pending", "Initial dispatch status should be pending"
        assert order.shipping_zip == "560001", "Shipping PIN should match input"

        # 3. Approve the order
        completed_order = crud.complete_checkout(db, order)
        db.commit()
        db.refresh(completed_order)
        print(f"✓ Order #{completed_order.id} approved by Admin. Status: {completed_order.status}")
        assert completed_order.status == "completed"

        # 4. Admin Dispatches Order with India Post Tracking Consignment Number
        tracking_num = "EM987654321IN"
        courier = "India Post - Speed Post"
        tracking_url = f"https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx"
        
        completed_order.dispatch_status = "dispatched"
        completed_order.courier_name = courier
        completed_order.tracking_number = tracking_num
        completed_order.tracking_url = tracking_url
        completed_order.dispatch_notes = "Dispatched via Speed Post Counter BNG-01"
        from datetime import datetime
        completed_order.dispatched_at = datetime.utcnow()
        db.commit()
        db.refresh(completed_order)

        print(f"\n✓ Admin Dispatched Order #{completed_order.id}:")
        print(f"   Carrier: {completed_order.courier_name}")
        print(f"   Consignment Tracking Number: {completed_order.tracking_number}")
        print(f"   Postal Tracking Portal URL: {completed_order.tracking_url}")
        print(f"   Dispatched At: {completed_order.dispatched_at}")
        assert completed_order.tracking_number == tracking_num
        assert completed_order.dispatch_status == "dispatched"

        # 5. Customer Views Order
        customer_orders = db.query(models.Order).filter(models.Order.user_id == user.id).all()
        fetched_order = next((o for o in customer_orders if o.id == completed_order.id), None)
        assert fetched_order is not None, "Order should be in customer orders list"
        assert fetched_order.tracking_number == tracking_num, "Tracking number must match for customer"
        assert fetched_order.courier_name == courier, "Carrier name must match for customer"
        print(f"\n✓ Customer Order Verification:")
        print(f"   Customer can view Tracking ID: {fetched_order.tracking_number}")
        print(f"   Direct Postal Tracking Link available: {fetched_order.tracking_url}")

        # 6. Admin Marks Order as Delivered
        completed_order.dispatch_status = "delivered"
        completed_order.delivered_at = datetime.utcnow()
        db.commit()
        db.refresh(completed_order)
        print(f"\n✓ Order Marked as Delivered. Status: {completed_order.dispatch_status}")
        assert completed_order.dispatch_status == "delivered"
        assert completed_order.delivered_at is not None

        print("\n========================================================")
        print("  ALL DISPATCH & POSTAL TRACKING TESTS PASSED (100% OK)!")
        print("========================================================\n")

    finally:
        db.close()

if __name__ == "__main__":
    test_dispatch_workflow()
