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
        "target_nodes": 1,
        "target_sw": 100.0,
        "monthly_amount": 1000.0,
        "duration_months": 2,
        "target_description": "Both child nodes reach 100 SW (100 SW each side)"
    },
    2: {
        "level": 2,
        "name": "Level 2 (Silver Star)",
        "target_nodes": 2,
        "target_sw": 200.0,
        "monthly_amount": 2000.0,
        "duration_months": 3,
        "target_description": "Any 2 nodes in each side reach 100 SW (200 SW each side)"
    },
    3: {
        "level": 3,
        "name": "Level 3 (Gold Star)",
        "target_nodes": 4,
        "target_sw": 400.0,
        "monthly_amount": 4000.0,
        "duration_months": 3,
        "target_description": "Any 4 nodes in each side reach 100 SW (400 SW each side)"
    },
    4: {
        "level": 4,
        "name": "Level 4 (Platinum Star)",
        "target_nodes": 8,
        "target_sw": 800.0,
        "monthly_amount": 8000.0,
        "duration_months": 3,
        "target_description": "Any 8 nodes in each side reach 100 SW (800 SW each side)"
    },
    5: {
        "level": 5,
        "name": "Level 5 (Diamond Star)",
        "target_nodes": 16,
        "target_sw": 1600.0,
        "monthly_amount": 16000.0,
        "duration_months": 3,
        "target_description": "Any 16 nodes in each side reach 100 SW (1,600 SW each side)"
    },
    6: {
        "level": 6,
        "name": "Level 6 (Double Diamond Star)",
        "target_nodes": 32,
        "target_sw": 3200.0,
        "monthly_amount": 32000.0,
        "duration_months": 3,
        "target_description": "Any 32 nodes in each side reach 100 SW (3,200 SW each side)"
    },
    7: {
        "level": 7,
        "name": "Level 7 (Triple Diamond Star)",
        "target_nodes": 64,
        "target_sw": 6400.0,
        "monthly_amount": 64000.0,
        "duration_months": 3,
        "target_description": "Any 64 nodes in each side reach 100 SW (6,400 SW each side)"
    },
    8: {
        "level": 8,
        "name": "Level 8 (Crown Diamond Star)",
        "target_nodes": 128,
        "target_sw": 12800.0,
        "monthly_amount": 128000.0,
        "duration_months": 3,
        "target_description": "Any 128 nodes in each side reach 100 SW (12,800 SW each side)"
    },
    9: {
        "level": 9,
        "name": "Level 9 (Royal Crown Diamond)",
        "target_nodes": 256,
        "target_sw": 25600.0,
        "monthly_amount": 256000.0,
        "duration_months": 3,
        "target_description": "Any 256 nodes in each side reach 100 SW (25,600 SW each side)"
    },
    10: {
        "level": 10,
        "name": "Level 10 (Crown Ambassador)",
        "target_nodes": 512,
        "target_sw": 51200.0,
        "monthly_amount": 512000.0,
        "duration_months": 3,
        "target_description": "Any 512 nodes in each side reach 100 SW (51,200 SW each side)"
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


def get_user_qualified_nodes(db: Session, user: User) -> tuple[int, int]:
    """
    Counts the number of downline nodes in the Left subtree and Right subtree
    that have accumulated at least 100 personal SW (personal_sw >= 100).
    Returns (left_100_nodes, right_100_nodes).
    """
    all_users = db.query(User).filter(User.is_admin == False).all()
    user_map = {u.id: u for u in all_users}
    
    def count_subtree(child_id: int | None) -> int:
        if not child_id or child_id not in user_map:
            return 0
        count = 0
        queue = [child_id]
        while queue:
            cid = queue.pop(0)
            u = user_map.get(cid)
            if not u:
                continue
            if (u.personal_sw or 0.0) >= 100.0:
                count += 1
            if u.left_child_id and u.left_child_id in user_map:
                queue.append(u.left_child_id)
            if u.right_child_id and u.right_child_id in user_map:
                queue.append(u.right_child_id)
        return count

    left_count = count_subtree(user.left_child_id)
    right_count = count_subtree(user.right_child_id)
    return left_count, right_count


def evaluate_and_award_levels(db: Session):
    """
    Evaluates rank/level qualifications across users based on:
    Strict qualified node targets (each node must have accumulated >= 100 personal SW):
       - Level 1: 1 node on each side (both child nodes reach 100 SW)
       - Level 2: 2 nodes on each side reach 100 SW (200 SW each side)
       - Level 3: 4 nodes on each side reach 100 SW (400 SW each side)
       - Level 4: 8 nodes on each side reach 100 SW (800 SW each side)
       - Level 5: 16 nodes on each side reach 100 SW (1,600 SW each side)
       - Level 6: 32 nodes on each side reach 100 SW (3,200 SW each side)
       - Level 7: 64 nodes on each side reach 100 SW (6,400 SW each side)
       - Level 8: 128 nodes on each side reach 100 SW (12,800 SW each side)
       - Level 9: 256 nodes on each side reach 100 SW (25,600 SW each side)
       - Level 10: 512 nodes on each side reach 100 SW (51,200 SW each side)
    """
    users = db.query(User).filter(User.is_admin == False).all()
    user_map = {u.id: u for u in users}

    def count_subtree(child_id: int | None) -> int:
        if not child_id or child_id not in user_map:
            return 0
        count = 0
        queue = [child_id]
        while queue:
            cid = queue.pop(0)
            u = user_map.get(cid)
            if not u:
                continue
            if (u.personal_sw or 0.0) >= 100.0:
                count += 1
            if u.left_child_id and u.left_child_id in user_map:
                queue.append(u.left_child_id)
            if u.right_child_id and u.right_child_id in user_map:
                queue.append(u.right_child_id)
        return count

    for u in users:
        curr_lvl = u.current_level or 0
        left_nodes = count_subtree(u.left_child_id)
        right_nodes = count_subtree(u.right_child_id)
        
        # Check and award all eligible levels sequentially
        for target_lvl in range(curr_lvl + 1, 11):
            target_cfg = LEVEL_CONFIG.get(target_lvl)
            if not target_cfg:
                break
            required_nodes = target_cfg.get("target_nodes", 1)
            
            # Level qualification strictly requires enough >=100 SW nodes on both left and right sides
            if left_nodes >= required_nodes and right_nodes >= required_nodes:
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

