from pydantic import BaseModel, EmailStr
from typing import List, Optional, ForwardRef
from datetime import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None


# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    sponsor_username: Optional[str] = None
    position: Optional[str] = "left" # 'left' or 'right'

class UserResponse(UserBase):
    id: int
    status: str
    sponsor_id: Optional[int] = None
    parent_id: Optional[int] = None
    position: Optional[str] = None
    left_child_id: Optional[int] = None
    right_child_id: Optional[int] = None
    personal_sw: float
    left_leg_sw: float
    right_leg_sw: float
    total_left_sw: float
    total_right_sw: float
    wallet_balance: float
    created_at: datetime

    class Config:
        from_attributes = True


# --- Tree Node Schema (Self-referential) ---
class TreeNodeResponse(BaseModel):
    id: int
    username: str
    full_name: str
    status: str
    position: Optional[str] = None
    personal_sw: float
    left_leg_sw: float
    right_leg_sw: float
    total_left_sw: float
    total_right_sw: float
    left_child: Optional["TreeNodeResponse"] = None
    right_child: Optional["TreeNodeResponse"] = None

    class Config:
        from_attributes = True


# --- Product Schemas ---
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    sw: int
    image_url: Optional[str] = None
    category: Optional[str] = None
    stock: int

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True


# --- Order Schemas ---
class CartItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    items: List[CartItemCreate]

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: float
    sw: int
    product: ProductResponse

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    total_sw: int
    status: str
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True


# --- Commission Schemas ---
class CommissionResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    type: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
