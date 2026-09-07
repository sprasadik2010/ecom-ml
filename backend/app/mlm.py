import datetime
import logging
from sqlalchemy.orm import Session
from .models import User, Commission, UserRankReward
from .config import settings

logger = logging.getLogger(__name__)

# Standard Level Definitions with Royalty Schemes (Levels 1 to 10)
LEVEL_CONFIG = {
    1: {
        "level": 1,
        "name": "Level 1 (Bronze Star)",
        "target_sw": 100.0,
        "monthly_amount": 1000.0,
        "duration_months": 2,
        "target_description": "100 Matched Sales Points on each side"
    },
    2: {
        "level": 2,
        "name": "Level 2 (Silver Star)",
        "target_sw": 200.0,
        "monthly_amount": 2000.0,
        "duration_months": 3,
        "target_description": "200 Matched Sales Points on each side"
    },
    3: {
        "level": 3,
        "name": "Level 3 (Gold Star)",
        "target_sw": 400.0,
        "monthly_amount": 4000.0,
        "duration_months": 3,
        "target_description": "400 Matched Sales Points on each side"
    },
    4: {
        "level": 4,
        "name": "Level 4 (Platinum Star)",
        "target_sw": 800.0,
        "monthly_amount": 8000.0,
        "duration_months": 3,
        "target_description": "800 Matched Sales Points on each side"
    },
    5: {
        "level": 5,
        "name": "Level 5 (Diamond Star)",
        "target_sw": 1600.0,
        "monthly_amount": 16000.0,
        "duration_months": 3,
        "target_description": "1,600 Matched Sales Points on each side"
    },
    6: {
        "level": 6,
        "name": "Level 6 (Double Diamond Star)",
        "target_sw": 3200.0,
        "monthly_amount": 32000.0,
        "duration_months": 3,
        "target_description": "3,200 Matched Sales Points on each side"
    },
    7: {
        "level": 7,
        "name": "Level 7 (Triple Diamond Star)",
        "target_sw": 6400.0,
        "monthly_amount": 64000.0,
        "duration_months": 3,
        "target_description": "6,400 Matched Sales Points on each side"
    },
    8: {
        "level": 8,
        "name": "Level 8 (Crown Diamond Star)",
        "target_sw": 12800.0,
        "monthly_amount": 128000.0,
        "duration_months": 3,
        "target_description": "12,800 Matched Sales Points on each side"
    },
    9: {
        "level": 9,
        "name": "Level 9 (Royal Crown Diamond)",
        "target_sw": 25600.0,
        "monthly_amount": 256000.0,
        "duration_months": 3,
        "target_description": "25,600 Matched Sales Points on each side"
    },
    10: {
        "level": 10,
        "name": "Level 10 (Crown Ambassador)",
        "target_sw": 51200.0,
        "monthly_amount": 512000.0,
        "duration_months": 3,
        "target_description": "51,200 Matched Sales Points on each side"
    }
}



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
            parent.left_leg_sw = (parent.left_leg_sw or 0.0) + sw_amount
            parent.total_left_sw = (parent.total_left_sw or 0.0) + sw_amount
            logger.info(f"Added {sw_amount} SW to Left Leg of {parent.username}. Unmatched Left SW: {parent.left_leg_sw}")
        elif child.id == parent.right_child_id:
            parent.right_leg_sw = (parent.right_leg_sw or 0.0) + sw_amount
            parent.total_right_sw = (parent.total_right_sw or 0.0) + sw_amount
            logger.info(f"Added {sw_amount} SW to Right Leg of {parent.username}. Unmatched Right SW: {parent.right_leg_sw}")
        
        db.add(parent)
        # Move one level up the tree
        child = parent
        parent_id = parent.parent_id


def award_level_promotion(db: Session, user: User, level: int):
    """
    Promotes a user to a new level and creates their monthly royalty reward schedule.
    Awards Month 1 payment immediately into their wallet.
    """
    cfg = LEVEL_CONFIG.get(level)
    if not cfg:
        return

    user.current_level = level
    user.level_name = cfg["name"]
    db.add(user)

    # Check if this user was already awarded this level to prevent duplicate rewards
    existing_reward = db.query(UserRankReward).filter(
        UserRankReward.user_id == user.id,
        UserRankReward.level == level
    ).first()

    if not existing_reward:
        now = datetime.datetime.utcnow()
        monthly_amount = cfg["monthly_amount"]
        duration_months = cfg["duration_months"]
        
        # Month 1 is disbursed immediately
        reward = UserRankReward(
            user_id=user.id,
            level=level,
            level_name=cfg["name"],
            monthly_amount=monthly_amount,
            total_months=duration_months,
            months_paid=1,
            status="completed" if duration_months <= 1 else "active",
            created_at=now,
            last_payout_at=now,
            next_payout_at=(now + datetime.timedelta(days=30)) if duration_months > 1 else None
        )
        db.add(reward)

        # Credit Month 1 payout
        user.wallet_balance = (user.wallet_balance or 0.0) + monthly_amount
        db.add(user)

        # Create Commission ledger entry
        commission = Commission(
            user_id=user.id,
            amount=monthly_amount,
            type="rank_level_reward",
            description=f"🎉 Achieved {cfg['name']}! Month 1 of {duration_months} monthly royalty (₹{monthly_amount:,.2f}) credited to wallet."
        )
        db.add(commission)
        logger.info(f"PROMOTED user {user.username} to {cfg['name']}. Month 1 royalty ₹{monthly_amount} credited.")


def evaluate_and_award_levels(db: Session):
    """
    Evaluates rank/level qualifications across users based on total_matched_sw.
    Users qualify for levels sequentially as their total matched sales points increase.
    
    Level Targets (Points on each side / Matched Points):
    - Level 1: >= 100 matched SW
    - Level 2: >= 200 matched SW
    - Level 3: >= 400 matched SW
    - Level 4: >= 800 matched SW
    - Level 5: >= 1,600 matched SW
    - Level 6: >= 3,200 matched SW
    - Level 7: >= 6,400 matched SW
    - Level 8: >= 12,800 matched SW
    - Level 9: >= 25,600 matched SW
    - Level 10: >= 51,200 matched SW
    """
    users = db.query(User).filter(User.is_admin == False).all()
    
    for u in users:
        curr_lvl = u.current_level or 0
        matched_sw = u.total_matched_sw or 0.0
        
        # Check and award all eligible levels sequentially
        for target_lvl in range(curr_lvl + 1, 11):
            target_cfg = LEVEL_CONFIG.get(target_lvl)
            if not target_cfg:
                break
            required_sw = target_cfg.get("target_sw", 0.0)
            if matched_sw >= required_sw:
                award_level_promotion(db, u, target_lvl)
            else:
                break



def check_and_award_commissions(db: Session, buyer: User, order_sw: float):
    """
    Executes the complete MLM commission and rank progression pipeline on order checkout:
    1. Propagates leg volumes (SW) up the binary parent tree.
    2. Performs 1:1 binary leg matching:
       For each active parent, pairs Left Leg SW and Right Leg SW.
       Awards ₹10 per matching point (matched_sw * 10).
       Deducts matched volume from legs while preserving unmatched carryforward.
       Accumulates total_matched_sw.
    3. Evaluates hierarchical level/rank promotions (Level 1 to Level 6) and creates monthly royalty schedules.
    """
    db.refresh(buyer)
    
    if order_sw <= 0:
        return

    # 1. Propagate volume up the binary tree
    propagate_volume(db, buyer, order_sw)
    db.flush() # Commit intermediate volume numbers so that queries are accurate
    
    # 2. Traverse up the parent chain and perform 1:1 binary matching
    current_parent_id = buyer.parent_id
    while current_parent_id is not None:
        parent = db.query(User).filter(User.id == current_parent_id).first()
        if not parent:
            break
            
        # Matching happens on points in left leg and right leg
        unmatched_left = parent.left_leg_sw or 0.0
        unmatched_right = parent.right_leg_sw or 0.0
        matchable_sw = min(unmatched_left, unmatched_right)
        
        if matchable_sw > 0:
            if parent.status == "active":
                commission_amount = matchable_sw * 10.0
                parent.wallet_balance = (parent.wallet_balance or 0.0) + commission_amount
                
                # Deduct matched sales points from unmatched legs
                parent.left_leg_sw = unmatched_left - matchable_sw
                parent.right_leg_sw = unmatched_right - matchable_sw
                
                # Increment cumulative matched sales points
                parent.total_matched_sw = (parent.total_matched_sw or 0.0) + matchable_sw
                db.add(parent)
                
                commission_record = Commission(
                    user_id=parent.id,
                    amount=commission_amount,
                    type="binary_matching",
                    description=f"Team Match: {matchable_sw:g} matching SW paired @ ₹10 = ₹{commission_amount:,.2f}"
                )
                db.add(commission_record)
                logger.info(f"Awarded ₹{commission_amount} binary matching commission to parent {parent.username} ({matchable_sw} SW matched).")
            else:
                logger.info(f"Parent {parent.username} has {matchable_sw} matchable SW but is INACTIVE. Volume remains unmatched.")
        else:
            logger.info(f"Parent {parent.username} unmatched legs: Left={unmatched_left}, Right={unmatched_right} (0 matched).")
            
        current_parent_id = parent.parent_id

    db.flush()

    # 3. Evaluate rank/level promotions across the network
    evaluate_and_award_levels(db)


def process_pending_monthly_rewards(db: Session) -> dict:
    """
    Processes scheduled recurring monthly payouts for users on active level royalties.
    Disburses monthly amounts to wallet and records commission ledger entries.
    """
    now = datetime.datetime.utcnow()
    active_rewards = db.query(UserRankReward).filter(
        UserRankReward.status == "active",
        UserRankReward.next_payout_at <= now,
        UserRankReward.months_paid < UserRankReward.total_months
    ).all()
    
    processed_count = 0
    total_disbursed = 0.0
    
    for reward in active_rewards:
        user = db.query(User).filter(User.id == reward.user_id).first()
        if not user:
            continue
            
        reward.months_paid += 1
        reward.last_payout_at = now
        
        # Credit monthly reward
        user.wallet_balance = (user.wallet_balance or 0.0) + reward.monthly_amount
        db.add(user)
        
        # Commission entry
        commission = Commission(
            user_id=user.id,
            amount=reward.monthly_amount,
            type="rank_level_reward",
            description=f"{reward.level_name} Monthly Royalty - Month {reward.months_paid} of {reward.total_months} (₹{reward.monthly_amount:,.2f})"
        )
        db.add(commission)
        
        if reward.months_paid >= reward.total_months:
            reward.status = "completed"
            reward.next_payout_at = None
        else:
            reward.next_payout_at = now + datetime.timedelta(days=30)
            
        db.add(reward)
        processed_count += 1
        total_disbursed += reward.monthly_amount
        logger.info(f"Processed Month {reward.months_paid} royalty for {user.username}: ₹{reward.monthly_amount}")
        
    db.commit()
    return {
        "processed_count": processed_count,
        "total_disbursed": total_disbursed
    }

