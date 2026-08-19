import logging
from typing import Optional, List
from sqlalchemy.orm import Session
from .models import User, Product, Order, OrderItem, Commission
from .schemas import UserCreate, OrderCreate
from .auth import get_password_hash
from .mlm import find_binary_placement, check_and_award_commissions
from .config import settings

logger = logging.getLogger(__name__)

# --- User CRUD ---
def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user_data: UserCreate) -> User:
    # 1. Determine the sponsor and parent placement in the binary tree
    user_count = db.query(User).count()
    
    sponsor = None
    parent = None
    actual_position = None
    
    if user_count > 0:
        # Determine the sponsor (default to first/admin user if not provided)
        sponsor_username = user_data.sponsor_username
        if not sponsor_username:
            sponsor = db.query(User).order_by(User.id.asc()).first()
            logger.info(f"Sponsor not specified. Defaulting to root user: {sponsor.username}")
        else:
            sponsor = get_user_by_username(db, sponsor_username)
            if not sponsor:
                raise ValueError(f"Referral sponsor with username '{sponsor_username}' does not exist.")
        
        # Determine binary parent using spillover logic
        parent, actual_position = find_binary_placement(db, sponsor.id, user_data.position)
        logger.info(f"Placing new user under parent {parent.username} on the {actual_position} leg.")
    else:
        # First user in system becomes the root node (no parent, no sponsor)
        logger.info("Database is empty. Registering the root user.")

    # 2. Create the user
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        sponsor_id=sponsor.id if sponsor else None,
        parent_id=parent.id if parent else None,
        position=actual_position,
        status="inactive",  # Starts inactive until first purchase
    )
    db.add(new_user)
    db.flush()  # Flushes database session to get the new_user.id
    
    # 3. Update the parent's child pointer
    if parent:
        if actual_position == "left":
            parent.left_child_id = new_user.id
        else:
            parent.right_child_id = new_user.id
        db.add(parent)
        
    db.commit()
    db.refresh(new_user)
    return new_user


# --- Product CRUD ---
def get_products(db: Session, skip: int = 0, limit: int = 100, category: Optional[str] = None) -> List[Product]:
    query = db.query(Product)
    if category:
        query = query.filter(Product.category == category)
    return query.offset(skip).limit(limit).all()

def get_product_by_id(db: Session, product_id: int) -> Optional[Product]:
    return db.query(Product).filter(Product.id == product_id).first()


# --- Order CRUD ---
def create_order(db: Session, user: User, order_data: OrderCreate) -> Order:
    # Compile order items and fetch pricing/SW points from Product Catalog
    total_amount = 0.0
    total_sw = 0
    order_items = []
    
    for item in order_data.items:
        product = get_product_by_id(db, item.product_id)
        if not product:
            raise ValueError(f"Product ID {item.product_id} not found.")
        if product.stock < item.quantity:
            raise ValueError(f"Insufficient stock for product '{product.name}'. Available: {product.stock}")
            
        # Deduct inventory stock
        product.stock -= item.quantity
        db.add(product)
        
        item_price = product.price * item.quantity
        item_sw = product.sw * item.quantity
        
        total_amount += item_price
        total_sw += item_sw
        
        order_item = OrderItem(
            product_id=product.id,
            quantity=item.quantity,
            price=product.price,
            sw=product.sw
        )
        order_items.append(order_item)
        
    # Create the Order
    order = Order(
        user_id=user.id,
        total_amount=total_amount,
        total_sw=total_sw,
        status="pending",
        items=order_items
    )
    
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def complete_checkout(db: Session, order: Order) -> Order:
    """
    Simulates payment success, marks the order as complete, updates member status (active),
    and initiates MLM commission calculations.
    """
    if order.status == "completed":
        return order
        
    order.status = "completed"
    db.add(order)
    
    # Update buyer's personal Sales Volume (SW)
    buyer = db.query(User).filter(User.id == order.user_id).first()
    buyer.personal_sw += order.total_sw
    
    # Activate user if personal SW meets threshold
    if buyer.status == "inactive" and buyer.personal_sw >= settings.MIN_PURCHASE_FOR_ACTIVATION:
        buyer.status = "active"
        logger.info(f"User {buyer.username} has reached {buyer.personal_sw} SW and is now an ACTIVE member.")
    
    db.add(buyer)
    db.flush()
    
    # Run the MLM commission matching and propagation pipeline
    check_and_award_commissions(db, buyer, order.total_sw)
    
    db.commit()
    db.refresh(order)
    return order


# --- Commissions CRUD ---
def get_user_commissions(db: Session, user_id: int) -> List[Commission]:
    return db.query(Commission).filter(Commission.user_id == user_id).order_by(Commission.created_at.desc()).all()


# --- MLM Tree Genealogy ---
def get_genealogy_tree(db: Session, root_user_id: int, current_depth: int = 0, max_depth: int = 4) -> Optional[dict]:
    """
    Recursively pulls downline tree info starting from a specific node up to max_depth levels.
    """
    if current_depth > max_depth:
        return None
        
    user = get_user_by_id(db, root_user_id)
    if not user:
        return None
        
    node = {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "status": user.status,
        "position": user.position,
        "personal_sw": user.personal_sw,
        "left_leg_sw": user.left_leg_sw,
        "right_leg_sw": user.right_leg_sw,
        "total_left_sw": user.total_left_sw,
        "total_right_sw": user.total_right_sw,
        "left_child": None,
        "right_child": None
    }
    
    if user.left_child_id:
        node["left_child"] = get_genealogy_tree(db, user.left_child_id, current_depth + 1, max_depth)
    if user.right_child_id:
        node["right_child"] = get_genealogy_tree(db, user.right_child_id, current_depth + 1, max_depth)
        
    return node
