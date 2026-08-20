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
    wallet_balance = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    sponsor = relationship("User", foreign_keys=[sponsor_id], remote_side=[id], backref="sponsored_members")
    parent = relationship("User", foreign_keys=[parent_id], remote_side=[id])
    
    # We specify foreign_keys on the child relationships to resolve ambiguity
    left_child = relationship("User", foreign_keys=[left_child_id], remote_side=[id])
    right_child = relationship("User", foreign_keys=[right_child_id], remote_side=[id])
    
    orders = relationship("Order", back_populates="user")
    commissions = relationship("Commission", back_populates="user")


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
    type = Column(String, nullable=False) # 'direct_referral' or 'binary_matching'
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="commissions")
