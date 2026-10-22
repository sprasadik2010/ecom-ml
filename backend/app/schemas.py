import re
from pydantic import BaseModel, EmailStr, Field, field_validator
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
    phone_number: Optional[str] = None

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, description="Unique username (min 3 chars, no spaces)")
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password (min 6 chars, no spaces)")
    full_name: str
    phone_number: str
    sponsor_username: Optional[str] = None
    position: Optional[str] = "left" # 'left' or 'right'
    token: Optional[str] = None

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not v:
            raise ValueError("Username is required.")
        v = v.strip().lower()
        if ' ' in v or re.search(r'\s', v):
            raise ValueError("Username cannot contain spaces.")
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters long.")
        if not re.match(r'^[a-z0-9_]+$', v):
            raise ValueError("Username can only contain letters, numbers, and underscores.")
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not v:
            raise ValueError("Password is required.")
        if ' ' in v or re.search(r'\s', v):
            raise ValueError("Password cannot contain spaces.")
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        return v

class UserResponse(UserBase):
    id: int
    status: str
    is_admin: bool
    sponsor_id: Optional[int] = None
    parent_id: Optional[int] = None
    sponsor_username: Optional[str] = None
    parent_username: Optional[str] = None
    position: Optional[str] = None
    left_child_id: Optional[int] = None
    right_child_id: Optional[int] = None
    personal_sw: float
    pending_sw: float = 0.0
    left_leg_sw: float
    right_leg_sw: float
    total_left_sw: float
    total_right_sw: float
    total_matched_sw: float = 0.0
    left_100_nodes: int = 0
    right_100_nodes: int = 0
    wallet_balance: float
    current_level: int = 0
    level_name: str = "Member"
    created_at: datetime
    ref_token_left: Optional[str] = None
    ref_token_right: Optional[str] = None

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
    pending_sw: float = 0.0
    left_leg_sw: float
    right_leg_sw: float
    total_left_sw: float
    total_right_sw: float
    total_matched_sw: float = 0.0
    left_100_nodes: int = 0
    right_100_nodes: int = 0
    current_level: int = 0
    level_name: str = "Member"
    left_child: Optional["TreeNodeResponse"] = None
    right_child: Optional["TreeNodeResponse"] = None
    left_child_token: Optional[str] = None
    right_child_token: Optional[str] = None

    class Config:
        from_attributes = True


class LevelDefinitionResponse(BaseModel):
    level: int
    name: str
    target_nodes: int
    target_sw: float
    monthly_amount: float
    duration_months: int
    target_description: str



# --- Product Schemas ---
class ProductBase(BaseModel):
    product_code: Optional[str] = None
    name: str
    description: Optional[str] = None
    price: float
    sw: int
    image_url: Optional[str] = None
    images: Optional[List[str]] = Field(default_factory=list)
    colors: Optional[List[str]] = Field(default_factory=list)
    sizes: Optional[List[str]] = Field(default_factory=list)
    options: Optional[dict] = Field(default_factory=dict)
    category: Optional[str] = None
    stock: int

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    product_code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    sw: Optional[int] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = None
    colors: Optional[List[str]] = None
    sizes: Optional[List[str]] = None
    options: Optional[dict] = None
    category: Optional[str] = None
    stock: Optional[int] = None

class ProductResponse(ProductBase):
    id: int

    @field_validator('images', mode='before')
    @classmethod
    def parse_images(cls, v):
        if isinstance(v, str):
            try:
                import json
                data = json.loads(v)
                if isinstance(data, list):
                    return data
            except Exception:
                return [v] if v else []
        return v or []

    @field_validator('colors', mode='before')
    @classmethod
    def parse_colors(cls, v):
        if isinstance(v, str):
            try:
                import json
                data = json.loads(v)
                if isinstance(data, list):
                    return data
            except Exception:
                return []
        return v or []

    @field_validator('sizes', mode='before')
    @classmethod
    def parse_sizes(cls, v):
        if isinstance(v, str):
            try:
                import json
                data = json.loads(v)
                if isinstance(data, list):
                    return data
            except Exception:
                return []
        return v or []

    @field_validator('options', mode='before')
    @classmethod
    def parse_options(cls, v):
        if isinstance(v, str):
            try:
                import json
                data = json.loads(v)
                if isinstance(data, dict):
                    return data
            except Exception:
                return {}
        return v or {}

    class Config:
        from_attributes = True


# --- Order Schemas ---
class CartItemCreate(BaseModel):
    product_id: int
    quantity: int
    selected_color: Optional[str] = None
    selected_size: Optional[str] = None

class OrderCreate(BaseModel):
    items: List[CartItemCreate]
    shipping_name: Optional[str] = None
    shipping_address: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_zip: Optional[str] = None
    shipping_phone: Optional[str] = None

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: float
    sw: int
    selected_color: Optional[str] = None
    selected_size: Optional[str] = None
    product: ProductResponse

    class Config:
        from_attributes = True

class OrderCheckoutRequest(BaseModel):
    payment_method: Optional[str] = "upi_qr"
    upi_trans_id: Optional[str] = None
    upi_payer_vpa: Optional[str] = None
    payment_proof_url: Optional[str] = None
    shipping_name: Optional[str] = None
    shipping_address: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_zip: Optional[str] = None
    shipping_phone: Optional[str] = None

class OrderDispatchUpdate(BaseModel):
    dispatch_status: str = "dispatched" # 'pending', 'dispatched', 'in_transit', 'delivered', 'cancelled'
    courier_name: Optional[str] = "Speed Post"
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = "https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx"
    dispatch_notes: Optional[str] = None

class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    total_sw: int
    status: str
    payment_method: Optional[str] = "upi_qr"
    upi_trans_id: Optional[str] = None
    upi_payer_vpa: Optional[str] = None
    payment_proof_url: Optional[str] = None
    
    # Shipping details
    shipping_name: Optional[str] = None
    shipping_address: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_zip: Optional[str] = None
    shipping_phone: Optional[str] = None
    
    # Postal dispatch & tracking details
    dispatch_status: Optional[str] = "pending"
    courier_name: Optional[str] = "Speed Post"
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None
    dispatched_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    dispatch_notes: Optional[str] = None
    
    created_at: datetime
    items: List[OrderItemResponse]
    user_username: Optional[str] = None
    user_full_name: Optional[str] = None
    user_phone: Optional[str] = None

    class Config:
        from_attributes = True


class PaymentConfigResponse(BaseModel):
    upi_id: str
    upi_name: str


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


# --- Admin Action Schemas ---
class UserUpdateCredentials(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip().lower()
            if not v:
                return None
            if ' ' in v or re.search(r'\s', v):
                raise ValueError("Username cannot contain spaces.")
            if len(v) < 3:
                raise ValueError("Username must be at least 3 characters long.")
            if not re.match(r'^[a-z0-9_]+$', v):
                raise ValueError("Username can only contain letters, numbers, and underscores.")
            return v
        return None

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v != "":
            if ' ' in v or re.search(r'\s', v):
                raise ValueError("Password cannot contain spaces.")
            if len(v) < 6:
                raise ValueError("Password must be at least 6 characters long.")
            return v
        return None

class UserUpdateStatus(BaseModel):
    status: str # 'active' or 'inactive'

class UserUpdateWallet(BaseModel):
    amount: float # Positive to credit, negative to debit
    description: str

class OrderUpdateStatus(BaseModel):
    status: str # 'pending', 'completed', 'cancelled'

class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    total_sales_amount: float
    total_sales_sw: int
    total_commissions_amount: float
    recent_users: List[UserResponse]
    recent_orders: List[OrderResponse]


# --- Category Schemas ---
class CategoryBase(BaseModel):
    name: str
    image_url: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    image_url: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: int

    class Config:
        from_attributes = True


# --- Rank & Royalty Reward Schemas ---
class UserRankRewardResponse(BaseModel):
    id: int
    user_id: int
    level: int
    level_name: str
    monthly_amount: float
    total_months: int
    months_paid: int
    status: str
    created_at: datetime
    last_payout_at: Optional[datetime] = None
    next_payout_at: Optional[datetime] = None
    user_username: Optional[str] = None

    class Config:
        from_attributes = True


class RewardProcessResponse(BaseModel):
    processed_count: int
    total_disbursed: float
    message: str


# --- ImgBB Cloud Storage Schemas ---
class ImgBBSettingsResponse(BaseModel):
    api_key_configured: bool
    masked_key: str
    total_images: int
    completed_images: int
    pending_images: int
    failed_images: int

class ImgBBKeyUpdate(BaseModel):
    api_key: str

class ImgBBTestRequest(BaseModel):
    api_key: Optional[str] = None

class ImgBBTestResponse(BaseModel):
    success: bool
    message: str

class ImageUploadResponse(BaseModel):
    id: int
    local_filename: str
    local_url: str
    imgbb_url: Optional[str] = None
    file_size: Optional[int] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Password Reset Schemas ---
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not v:
            raise ValueError("Password is required.")
        if ' ' in v or re.search(r'\s', v):
            raise ValueError("Password cannot contain spaces.")
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        return v

class VerifyResetTokenResponse(BaseModel):
    valid: bool
    email: str
    username: str

class MessageResponse(BaseModel):
    message: str

