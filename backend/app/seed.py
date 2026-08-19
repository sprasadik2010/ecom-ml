import logging
from sqlalchemy.orm import Session
from .database import engine, Base, SessionLocal
from .models import User, Product
from .auth import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# List of premium products to seed (E-commerce / Amazon look)
PRODUCTS = [
    {
        "name": "Vortex Pro Smart Watch",
        "description": "Premium health tracking smart watch with a vibrant AMOLED display, heart rate monitor, sleep tracking, and up to 7 days battery life. Water resistant up to 50m.",
        "price": 149.99,
        "sw": 100,
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=60",
        "stock": 150
    },
    {
        "name": "SyncWave ANC Wireless Headphones",
        "description": "Active Noise Cancelling over-ear headphones with high-fidelity audio, 40 hours of wireless playback, memory foam earcups, and crystal-clear voice calls.",
        "price": 99.99,
        "sw": 70,
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
        "stock": 200
    },
    {
        "name": "AuraGlow Smart LED Bedside Lamp",
        "description": "Dimmable smart bedside lamp compatible with voice control. Offers 16 million colors, schedule timers, and dynamic color-changing scenes for your bedroom or office.",
        "price": 39.99,
        "sw": 25,
        "category": "Smart Home",
        "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60",
        "stock": 180
    },
    {
        "name": "TerraShield Canvas Backpack",
        "description": "Vintage water-resistant waxed canvas backpack with padded laptop compartment, leather details, and ergonomic shoulder straps. Perfect for daily commute or weekend hiking.",
        "price": 69.99,
        "sw": 50,
        "category": "Apparel",
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60",
        "stock": 100
    },
    {
        "name": "NutraPure Organic Whey Protein",
        "description": "100% grass-fed organic whey protein isolate. 25g protein per serving, zero artificial sweeteners or fillers. Delicious chocolate fudge flavor. 2.2 lbs.",
        "price": 49.99,
        "sw": 40,
        "category": "Wellness",
        "image_url": "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=500&auto=format&fit=crop&q=60",
        "stock": 250
    },
    {
        "name": "FlexiFlex Non-Slip Yoga Mat",
        "description": "Extra thick 6mm eco-friendly TPE yoga mat with alignment lines, texture surface for superior grip, and carrying strap. Lightweight and durable.",
        "price": 29.99,
        "sw": 20,
        "category": "Wellness",
        "image_url": "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=500&auto=format&fit=crop&q=60",
        "stock": 120
    },
    {
        "name": "HydroGuard Double-Wall Flask",
        "description": "32oz vacuum-insulated stainless steel water bottle. Keeps drinks cold for up to 24 hours or hot for 12 hours. Sweat-proof finish and leak-proof straw lid.",
        "price": 19.99,
        "sw": 10,
        "category": "Wellness",
        "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60",
        "stock": 300
    },
    {
        "name": "AeroPosture Ergonomic Office Chair",
        "description": "Ergonomic mesh office chair with adjustable lumbar support, 3D armrests, headrest, tilt mechanism, and smooth-rolling nylon casters. Rated for up to 300 lbs.",
        "price": 199.99,
        "sw": 150,
        "category": "Smart Home",
        "image_url": "https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=500&auto=format&fit=crop&q=60",
        "stock": 50
    }
]

def seed_db():
    logger.info("Initializing tables...")
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # 1. Seed Root Administrator Member
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            logger.info("Seeding root user 'admin'...")
            admin = User(
                username="admin",
                email="admin@mlm-amazon.com",
                full_name="System Administrator",
                hashed_password=get_password_hash("admin123"),
                status="active", # Root user is active by default
                personal_sw=100.0,
                wallet_balance=0.0
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            logger.info("Root user 'admin' created successfully.")
        else:
            logger.info("Root user 'admin' already exists.")
            
        # 2. Seed Products
        logger.info("Seeding products catalog...")
        for p_data in PRODUCTS:
            product = db.query(Product).filter(Product.name == p_data["name"]).first()
            if not product:
                product = Product(**p_data)
                db.add(product)
                logger.info(f"Seeded product: {p_data['name']}")
            else:
                # Update details if changed
                for key, val in p_data.items():
                    setattr(product, key, val)
                db.add(product)
                
        db.commit()
        logger.info("Database seeding complete!")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
