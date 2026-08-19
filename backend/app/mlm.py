import logging
from sqlalchemy.orm import Session
from .models import User, Commission
from .config import settings

logger = logging.getLogger(__name__)

def find_binary_placement(db: Session, sponsor_id: int, position: str) -> tuple[User, str]:
    """
    Traverses the binary tree starting from the sponsor, down the specified leg (left or right),
    and returns the parent node and side where the new member should be placed (spillover).
    """
    sponsor = db.query(User).filter(User.id == sponsor_id).first()
    if not sponsor:
        raise ValueError("Sponsor not found")

    current = sponsor
    target_position = position.lower()
    if target_position not in ["left", "right"]:
        target_position = "left"

    # Extreme leg spillover search
    if target_position == "left":
        while current.left_child_id is not None:
            current = db.query(User).filter(User.id == current.left_child_id).first()
        return current, "left"
    else:
        while current.right_child_id is not None:
            current = db.query(User).filter(User.id == current.right_child_id).first()
        return current, "right"


def propagate_volume(db: Session, buyer: User, sw_amount: float):
    """
    Propagates the Sales Wallet (SW) of a purchase up the binary parent chain.
    For each ancestor, increases left_leg_sw or right_leg_sw depending on which side the buyer resides.
    """
    if sw_amount <= 0:
        return

    logger.info(f"Propagating {sw_amount} SW from buyer {buyer.username} (ID: {buyer.id})")
    
    child = buyer
    parent_id = buyer.parent_id
    
    # Traverse up the binary tree parent by parent
    while parent_id is not None:
        parent = db.query(User).filter(User.id == parent_id).first()
        if not parent:
            break
            
        # Determine if the volume comes from the left or right branch of the parent
        if child.id == parent.left_child_id:
            parent.left_leg_sw += sw_amount
            parent.total_left_sw += sw_amount
            logger.info(f"Added {sw_amount} SW to Left Leg of {parent.username}. New Left SW: {parent.left_leg_sw}")
        elif child.id == parent.right_child_id:
            parent.right_leg_sw += sw_amount
            parent.total_right_sw += sw_amount
            logger.info(f"Added {sw_amount} SW to Right Leg of {parent.username}. New Right SW: {parent.right_leg_sw}")
        
        db.add(parent)
        # Move one level up the tree
        child = parent
        parent_id = parent.parent_id


def check_and_award_commissions(db: Session, buyer: User, order_sw: float):
    """
    Executes the MLM commission pipeline on order completion:
    1. Propagates leg volumes up the binary parent tree.
    2. Awards 10 INR per Sales Wallet (SW) to all active parents up to the root having nodes on both sides.
    """
    db.refresh(buyer)
    
    if order_sw <= 0:
        return

    # 1. Propagate volume up the binary tree
    propagate_volume(db, buyer, order_sw)
    db.flush() # Commit intermediate volume numbers so that queries are accurate
    
    # 2. Traverse up the parent chain and award SW matching commission
    current_parent_id = buyer.parent_id
    while current_parent_id is not None:
        parent = db.query(User).filter(User.id == current_parent_id).first()
        if not parent:
            break
            
        # Check if the parent has nodes on both sides (left child and right child must both exist)
        if parent.left_child_id is not None and parent.right_child_id is not None:
            # Check if parent is active to receive commission
            if parent.status == "active":
                commission_amount = order_sw * 10.0
                parent.wallet_balance += commission_amount
                db.add(parent)
                
                commission_record = Commission(
                    user_id=parent.id,
                    amount=commission_amount,
                    type="binary_matching", # Keep name for schema/compatibility but update description
                    description=f"Sales Wallet Match: Awarded 10 INR per SW on purchase of {order_sw} SW by {buyer.username}"
                )
                db.add(commission_record)
                logger.info(f"Awarded {commission_amount} INR SW commission to parent {parent.username}")
            else:
                logger.info(f"Parent {parent.username} is INACTIVE. Skipping commission matching.")
        else:
            logger.info(f"Parent {parent.username} does not have nodes on both sides. Skipping commission matching.")
            
        current_parent_id = parent.parent_id
