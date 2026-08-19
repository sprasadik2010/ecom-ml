import logging
from fastapi import FastAPI, Depends, HTTPException, status
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

@app.on_event("startup")
def on_startup():
    logger.info("Ensuring database tables are created...")
    Base.metadata.create_all(bind=engine)

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
