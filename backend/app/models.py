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
    
    # Direct relationship
    sponsor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Binary tree relationships
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    position = Column(String, nullable=True) # 'left' or 'right'
    
    left_child_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    right_child_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Volumes & Wallet
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
        return f.encrypt(f"{self.id}:left".encode('utf-8')).decode('utf-8')

    @property
    def ref_token_right(self):
        from .config import settings
        import hashlib
        import base64
        from cryptography.fernet import Fernet
        key_bytes = hashlib.sha256(settings.SECRET_KEY.encode('utf-8')).digest()
        fernet_key = base64.urlsafe_b64encode(key_bytes)
        f = Fernet(fernet_key)
        return f.encrypt(f"{self.id}:right".encode('utf-8')).decode('utf-8')

    @property
    def pending_sw(self) -> float:
        if not self.orders:
            return 0.0
        return sum(float(o.total_sw) for o in self.orders if o.status == "pending")

    @property
    def left_100_nodes(self) -> int:
        from sqlalchemy.orm import object_session
        session = object_session(self)
        if not session or not self.left_child_id:
            return 0
        from .mlm import get_user_qualified_nodes
        left, _ = get_user_qualified_nodes(session, self)
        return left

    @property
    def right_100_nodes(self) -> int:
        from sqlalchemy.orm import object_session
        session = object_session(self)
        if not session or not self.right_child_id:
            return 0
        from .mlm import get_user_qualified_nodes
        _, right = get_user_qualified_nodes(session, self)
        return right



class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String, unique=True, index=True, nullable=True) # Unique Product Code for search & identification
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    sw = Column(Integer, nullable=False) # Sales Wallet value
    image_url = Column(String, nullable=True)
    images = Column(Text, nullable=True) # JSON list of photo views / gallery URLs
    colors = Column(Text, nullable=True) # JSON list of available colors
    sizes = Column(Text, nullable=True)  # JSON list of available sizes
    options = Column(Text, nullable=True) # JSON dict of additional variant options
    category = Column(String, nullable=True)
    stock = Column(Integer, default=100)

    @property
    def images_list(self):
        import json
        if self.images:
            try:
                data = json.loads(self.images)
                if isinstance(data, list) and len(data) > 0:
                    return data
            except Exception:
                pass
        return [self.image_url] if self.image_url else []

    @property
    def colors_list(self):
        import json
        if self.colors:
            try:
                data = json.loads(self.colors)
                if isinstance(data, list):
                    return data
            except Exception:
                pass
        return []

    @property
    def sizes_list(self):
        import json
        if self.sizes:
            try:
                data = json.loads(self.sizes)
                if isinstance(data, list):
                    return data
            except Exception:
                pass
        return []


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
    status = Column(String, default="pending") # 'pending', 'completed', 'cancelled'
    
    # Payment & UPI Details
    payment_method = Column(String, default="upi_qr") # 'upi_qr', 'card', 'bank_transfer'
    upi_trans_id = Column(String, nullable=True)     # 12-digit UPI Reference / UTR
    upi_payer_vpa = Column(String, nullable=True)    # Payer's VPA / UPI ID (e.g. user@okaxis)
    payment_proof_url = Column(String, nullable=True) # Optional payment screenshot
    
    # Shipping & Postal Delivery Address
    shipping_name = Column(String, nullable=True)
    shipping_address = Column(String, nullable=True)
    shipping_city = Column(String, nullable=True)
    shipping_state = Column(String, nullable=True)
    shipping_zip = Column(String, nullable=True)
    shipping_phone = Column(String, nullable=True)
    
    # Postal Dispatch & Carrier Tracking
    dispatch_status = Column(String, default="pending") # 'pending', 'dispatched', 'in_transit', 'delivered', 'cancelled'
    courier_name = Column(String, default="Speed Post", nullable=True) # e.g. 'Speed Post', 'DTDC', etc.
    tracking_number = Column(String, nullable=True)     # Consignment Tracking / Postal Article No
    tracking_url = Column(String, nullable=True)        # Postal Tracking Web Portal URL
    dispatched_at = Column(DateTime, nullable=True)     # Timestamp when admin dispatched the parcel
    delivered_at = Column(DateTime, nullable=True)      # Timestamp when parcel was delivered
    dispatch_notes = Column(Text, nullable=True)        # Optional admin dispatch / dispatch remarks
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    @property
    def user_username(self):
        return self.user.username if self.user else None

    @property
    def user_full_name(self):
        return self.user.full_name if self.user else None

    @property
    def user_phone(self):
        return self.user.phone_number if self.user else None


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    sw = Column(Integer, nullable=False)
    selected_color = Column(String, nullable=True)
    selected_size = Column(String, nullable=True)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class Commission(Base):
    __tablename__ = "commissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False) # 'direct_referral', 'binary_matching', 'rank_level_reward', 'admin_adjustment', 'sponsor_matching_bonus'
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="commissions")


class UserRankReward(Base):
    __tablename__ = "user_rank_rewards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    level = Column(Integer, nullable=False) # 1, 2, 3, etc.
    level_name = Column(String, nullable=False) # e.g. "Level 1 (Associate)"
    monthly_amount = Column(Float, nullable=False) # e.g. 1000.0, 2000.0, etc.
    total_months = Column(Integer, nullable=False) # e.g. 2, 3, 4, etc.
    months_paid = Column(Integer, default=1, nullable=False) # Starts at 1 since month 1 paid on qualification
    status = Column(String, default="active", nullable=False) # 'active' or 'completed'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_payout_at = Column(DateTime, default=datetime.datetime.utcnow)
    next_payout_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="rank_rewards")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(Text, nullable=True)
    description = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class ImageUpload(Base):
    __tablename__ = "image_uploads"

    id = Column(Integer, primary_key=True, index=True)
    local_filename = Column(String, index=True, nullable=False)
    local_url = Column(String, nullable=False)
    imgbb_url = Column(String, nullable=True)
    imgbb_delete_url = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    status = Column(String, default="pending")  # 'pending', 'uploading', 'completed', 'failed'
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

