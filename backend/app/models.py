import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    status = Column(String, default="inactive") # 'active' or 'inactive'
    is_admin = Column(Boolean, default=False, nullable=False)
    
    # Direct MLM relationship
    sponsor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Binary MLM tree relationships
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    position = Column(String, nullable=True) # 'left' or 'right'
    
    left_child_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    right_child_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # MLM Volumes & Wallet
    personal_sw = Column(Float, default=0.0)
    left_leg_sw = Column(Float, default=0.0)
    right_leg_sw = Column(Float, default=0.0)
    total_left_sw = Column(Float, default=0.0)
    total_right_sw = Column(Float, default=0.0)
    total_matched_sw = Column(Float, default=0.0)
    wallet_balance = Column(Float, default=0.0)
    
    # Rank / Level Progression
    current_level = Column(Integer, default=0) # 0: Member, 1: Level 1, 2: Level 2, etc.
    level_name = Column(String, default="Member")
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    sponsor = relationship("User", foreign_keys=[sponsor_id], remote_side=[id], backref="sponsored_members")
    parent = relationship("User", foreign_keys=[parent_id], remote_side=[id])
    
    # We specify foreign_keys on the child relationships to resolve ambiguity
    left_child = relationship("User", foreign_keys=[left_child_id], remote_side=[id])
    right_child = relationship("User", foreign_keys=[right_child_id], remote_side=[id])
    
    orders = relationship("Order", back_populates="user")
    commissions = relationship("Commission", back_populates="user")
    rank_rewards = relationship("UserRankReward", back_populates="user", cascade="all, delete-orphan")

    @property
    def sponsor_username(self):
        return self.sponsor.username if self.sponsor else None

    @property
    def parent_username(self):
        return self.parent.username if self.parent else None

    @property
    def ref_token_left(self):
        from .config import settings
        import hashlib
        import base64
        from cryptography.fernet import Fernet
        key_bytes = hashlib.sha256(settings.SECRET_KEY.encode('utf-8')).digest()
        fernet_key = base64.urlsafe_b64encode(key_bytes)
        f = Fernet(fernet_key)
        return f.encrypt(f"{self.username}:left".encode('utf-8')).decode('utf-8')

    @property
    def ref_token_right(self):
        from .config import settings
        import hashlib
        import base64
        from cryptography.fernet import Fernet
        key_bytes = hashlib.sha256(settings.SECRET_KEY.encode('utf-8')).digest()
        fernet_key = base64.urlsafe_b64encode(key_bytes)
        f = Fernet(fernet_key)
        return f.encrypt(f"{self.username}:right".encode('utf-8')).decode('utf-8')

    @property
    def pending_sw(self) -> float:
        if not self.orders:
            return 0.0
        return sum(float(o.total_sw) for o in self.orders if o.status == "pending")



class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    sw = Column(Integer, nullable=False) # Sales Wallet value
    image_url = Column(String, nullable=True)
    category = Column(String, nullable=True)
    stock = Column(Integer, default=100)


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    image_url = Column(String, nullable=True)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_amount = Column(Float, nullable=False)
    total_sw = Column(Integer, nullable=False)
    status = Column(String, default="pending") # 'pending' or 'completed'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    sw = Column(Integer, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class Commission(Base):
    __tablename__ = "commissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False) # 'direct_referral', 'binary_matching', 'rank_level_reward', 'admin_adjustment'
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="commissions")


class UserRankReward(Base):
    __tablename__ = "user_rank_rewards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    level = Column(Integer, nullable=False) # 1, 2, 3, etc.
    level_name = Column(String, nullable=False) # e.g. "Level 1 (Bronze Star)"
    monthly_amount = Column(Float, nullable=False) # e.g. 1000.0, 2000.0, etc.
    total_months = Column(Integer, nullable=False) # e.g. 2, 3, 4, etc.
    months_paid = Column(Integer, default=1, nullable=False) # Starts at 1 since month 1 paid on qualification
    status = Column(String, default="active", nullable=False) # 'active' or 'completed'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_payout_at = Column(DateTime, default=datetime.datetime.utcnow)
    next_payout_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="rank_rewards")

