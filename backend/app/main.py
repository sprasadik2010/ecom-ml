import logging
import os
import shutil
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import timedelta

from .database import get_db, engine, Base
from . import models, schemas, crud, auth
from .config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI App
app = FastAPI(title="Binary MLM E-commerce API", version="1.0.0")

# Setup static files directory for local image uploads
static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.on_event("startup")
def on_startup():
    logger.info("Ensuring database tables are created...")
    Base.metadata.create_all(bind=engine)
    
    # Safe SQLite/PostgreSQL migration for is_admin column
    from sqlalchemy import text
    from .database import SessionLocal
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE"))
        db.commit()
        logger.info("Added is_admin column to users table.")
    except Exception as e:
        db.rollback()
        # Column already exists

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the Binary MLM E-commerce API!", "version": "1.0.0"}


# --- Auth Endpoints ---

@app.post("/auth/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if username or email already exists
    db_user = crud.get_user_by_username(db, user_data.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered.")
        
    db_email = crud.get_user_by_email(db, user_data.email)
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered.")
        
    try:
        new_user = crud.create_user(db, user_data)
        return new_user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error during registration: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during registration.")


@app.post("/auth/login", response_model=schemas.Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# --- User Endpoints ---

@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# Helper to verify if target is in current user's downline tree
def is_user_in_downline(db: Session, current_user_id: int, target_user_id: int) -> bool:
    if current_user_id == target_user_id:
        return True
    
    target_user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not target_user:
        return False
        
    # Traverse up from target user to see if current_user is in the ancestor chain
    curr = target_user
    while curr.parent_id is not None:
        if curr.parent_id == current_user_id:
            return True
        curr = db.query(models.User).filter(models.User.id == curr.parent_id).first()
        if not curr:
            break
            
    return False


@app.get("/users/tree", response_model=schemas.TreeNodeResponse)
def get_downline_tree(
    username: Optional[str] = None, 
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Returns the binary genealogy tree starting from current user, 
    or starting from a specified downline username.
    """
    target_user = current_user
    
    if username and username.lower() != current_user.username.lower():
        target_user = crud.get_user_by_username(db, username)
        if not target_user:
            raise HTTPException(status_code=404, detail=f"User '{username}' not found.")
            
        # Verify permissions: target user must be in the downline of the logged-in user
        if not is_user_in_downline(db, current_user.id, target_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Access Denied: '{username}' is not in your downline binary tree."
            )
            
    tree = crud.get_genealogy_tree(db, target_user.id, current_depth=0)
    if not tree:
        raise HTTPException(status_code=404, detail="Tree structure could not be retrieved.")
    return tree


# --- Product Endpoints ---

@app.get("/products", response_model=List[schemas.ProductResponse])
def read_products(category: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_products(db, category=category)


@app.get("/products/{product_id}", response_model=schemas.ProductResponse)
def read_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# --- Order Endpoints ---

@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(
    order_data: schemas.OrderCreate, 
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        order = crud.create_order(db, current_user, order_data)
        return order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error placing order: {e}")
        raise HTTPException(status_code=500, detail="Error placing order.")


@app.post("/orders/{order_id}/checkout", response_model=schemas.OrderResponse)
def checkout_order(
    order_id: int, 
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Checkout simulation. Validates the order belongs to the user,
    completes checkout, triggers volume propagation, and awards commissions.
    """
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized checkout.")
    if order.status == "completed":
        raise HTTPException(status_code=400, detail="Order already checked out.")
        
    try:
        completed_order = crud.complete_checkout(db, order)
        return completed_order
    except Exception as e:
        logger.error(f"Checkout transaction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Checkout processing failed: {str(e)}")


@app.get("/orders/my", response_model=List[schemas.OrderResponse])
def get_my_orders(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    orders = db.query(models.Order).filter(models.Order.user_id == current_user.id).order_by(models.Order.created_at.desc()).all()
    return orders


# --- Commission Endpoints ---

@app.get("/commissions/my", response_model=List[schemas.CommissionResponse])
def get_my_commissions(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return crud.get_user_commissions(db, current_user.id)


# --- Admin Endpoints ---

@app.get("/admin/stats", response_model=schemas.AdminStatsResponse)
def get_admin_stats(
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(models.User).count()
    active_users = db.query(models.User).filter(models.User.status == "active").count()
    inactive_users = db.query(models.User).filter(models.User.status == "inactive").count()
    
    completed_orders = db.query(models.Order).filter(models.Order.status == "completed").all()
    total_sales_amount = sum(order.total_amount for order in completed_orders)
    total_sales_sw = sum(order.total_sw for order in completed_orders)
    
    commissions = db.query(models.Commission).all()
    total_commissions_amount = sum(c.amount for c in commissions)
    
    recent_users = db.query(models.User).order_by(models.User.created_at.desc()).limit(5).all()
    recent_orders = db.query(models.Order).order_by(models.Order.created_at.desc()).limit(5).all()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "total_sales_amount": total_sales_amount,
        "total_sales_sw": total_sales_sw,
        "total_commissions_amount": total_commissions_amount,
        "recent_users": recent_users,
        "recent_orders": recent_orders
    }

@app.post("/admin/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def admin_create_product(
    product_data: schemas.ProductCreate,
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    product = models.Product(**product_data.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@app.put("/admin/products/{product_id}", response_model=schemas.ProductResponse)
def admin_update_product(
    product_id: int,
    product_data: schemas.ProductUpdate,
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in product_data.dict(exclude_unset=True).items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product

@app.delete("/admin/products/{product_id}")
def admin_delete_product(
    product_id: int,
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    return {"message": f"Product '{product.name}' deleted successfully"}

@app.get("/admin/users", response_model=List[schemas.UserResponse])
def admin_get_users(
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    return db.query(models.User).order_by(models.User.id.asc()).all()

@app.put("/admin/users/{user_id}/status", response_model=schemas.UserResponse)
def admin_update_user_status(
    user_id: int,
    status_data: schemas.UserUpdateStatus,
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if status_data.status not in ["active", "inactive"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'active' or 'inactive'.")
        
    user.status = status_data.status
    db.commit()
    db.refresh(user)
    return user

@app.put("/admin/users/{user_id}/wallet", response_model=schemas.UserResponse)
def admin_adjust_user_wallet(
    user_id: int,
    wallet_data: schemas.UserUpdateWallet,
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.wallet_balance += wallet_data.amount
    
    if wallet_data.amount != 0:
        commission = models.Commission(
            user_id=user.id,
            amount=wallet_data.amount,
            type="admin_adjustment",
            description=wallet_data.description
        )
        db.add(commission)
        
    db.commit()
    db.refresh(user)
    return user

@app.get("/admin/orders", response_model=List[schemas.OrderResponse])
def admin_get_orders(
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).all()

@app.put("/admin/orders/{order_id}/status", response_model=schemas.OrderResponse)
def admin_update_order_status(
    order_id: int,
    status_data: schemas.OrderUpdateStatus,
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if status_data.status not in ["pending", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status.")
        
    if status_data.status == "completed" and order.status != "completed":
        order = crud.complete_checkout(db, order)
    else:
        order.status = status_data.status
        db.commit()
        
    db.refresh(order)
    return order

@app.get("/admin/commissions", response_model=List[schemas.CommissionResponse])
def admin_get_commissions(
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    return db.query(models.Commission).order_by(models.Commission.created_at.desc()).all()


@app.post("/admin/upload")
def admin_upload_image(
    request: Request,
    file: UploadFile = File(...),
    current_admin: models.User = Depends(auth.get_current_admin)
):
    """
    Saves an uploaded image locally under the static directory
    and returns its public absolute URL path.
    """
    static_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
    os.makedirs(static_path, exist_ok=True)
    
    # Save with a safe file name
    clean_filename = "".join(c for c in file.filename if c.isalnum() or c in "._-").strip()
    if not clean_filename:
        clean_filename = "uploaded_product_image"
        
    file_path = os.path.join(static_path, clean_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        logger.info(f"Image uploaded successfully: {clean_filename}")
        
        # Build absolute URL dynamically using request.base_url
        base_url = str(request.base_url).rstrip("/")
        return {"image_url": f"{base_url}/static/{clean_filename}"}
    except Exception as e:
        logger.error(f"Error copying upload buffer: {e}")
        raise HTTPException(status_code=500, detail="Could not save file buffer locally.")


# --- Category Management Endpoints ---

@app.get("/categories", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).order_by(models.Category.name.asc()).all()


@app.post("/admin/categories", response_model=schemas.CategoryResponse)
def admin_create_category(
    category_data: schemas.CategoryCreate,
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    # Check if category with the same name already exists
    existing = db.query(models.Category).filter(models.Category.name == category_data.name).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Category with name '{category_data.name}' already exists."
        )
    
    category = models.Category(
        name=category_data.name,
        image_url=category_data.image_url
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@app.put("/admin/categories/{category_id}", response_model=schemas.CategoryResponse)
def admin_update_category(
    category_id: int,
    category_data: schemas.CategoryUpdate,
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found.")
        
    if category_data.name is not None:
        # Check if name is taken by another category
        existing = db.query(models.Category).filter(
            models.Category.name == category_data.name,
            models.Category.id != category_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Category with name '{category_data.name}' already exists."
            )
        category.name = category_data.name
        
    if category_data.image_url is not None:
        category.image_url = category_data.image_url
        
    db.commit()
    db.refresh(category)
    return category


@app.delete("/admin/categories/{category_id}")
def admin_delete_category(
    category_id: int,
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found.")
        
    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully"}
