import logging
from sqlalchemy.orm import Session
from .database import engine, Base, SessionLocal
from .models import User, Product, Category
from .auth import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import json

# List of premium products to seed (E-commerce / Amazon look)
PRODUCTS = [
    {
        "name": "Vortex Pro Smart Watch",
        "description": "Premium health tracking smart watch with a vibrant AMOLED display, heart rate monitor, sleep tracking, and up to 7 days battery life. Water resistant up to 50m.",
        "price": 12999.0,
        "sw": 100,
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80",
        "images": json.dumps([
            "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80"
        ]),
        "colors": json.dumps(["Space Gray", "Silver Stainless", "Midnight Blue", "Rose Gold"]),
        "sizes": json.dumps(["40mm", "44mm", "46mm"]),
        "stock": 150
    },
    {
        "name": "SyncWave ANC Wireless Headphones",
        "description": "Active Noise Cancelling over-ear headphones with high-fidelity audio, 40 hours of wireless playback, memory foam earcups, and crystal-clear voice calls.",
        "price": 7999.0,
        "sw": 70,
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
        "images": json.dumps([
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80"
        ]),
        "colors": json.dumps(["Matte Black", "Moonlight White", "Navy Blue"]),
        "sizes": json.dumps(["Standard Fit"]),
        "stock": 200
    },
    {
        "name": "AuraGlow Smart LED Bedside Lamp",
        "description": "Dimmable smart bedside lamp compatible with voice control. Offers 16 million colors, schedule timers, and dynamic color-changing scenes for your bedroom or office.",
        "price": 2499.0,
        "sw": 25,
        "category": "Smart Home",
        "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
        "images": json.dumps([
            "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800&auto=format&fit=crop&q=80"
        ]),
        "colors": json.dumps(["Warm Amber", "Cool White", "RGB Multi-color"]),
        "sizes": json.dumps(["Compact (8 inch)", "Standard (12 inch)"]),
        "stock": 180
    },
    {
        "name": "TerraShield Canvas Backpack",
        "description": "Vintage water-resistant waxed canvas backpack with padded laptop compartment, leather details, and ergonomic shoulder straps. Perfect for daily commute or weekend hiking.",
        "price": 3499.0,
        "sw": 50,
        "category": "Apparel",
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
        "images": json.dumps([
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=800&auto=format&fit=crop&q=80"
        ]),
        "colors": json.dumps(["Vintage Khaki", "Forest Green", "Charcoal Gray", "Deep Navy"]),
        "sizes": json.dumps(["20 Litre", "28 Litre", "35 Litre"]),
        "stock": 100
    },
    {
        "name": "NutraPure Organic Whey Protein",
        "description": "100% grass-fed organic whey protein isolate. 25g protein per serving, zero artificial sweeteners or fillers. Delicious chocolate fudge flavor. 2.2 lbs.",
        "price": 3999.0,
        "sw": 40,
        "category": "Wellness",
        "image_url": "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=800&auto=format&fit=crop&q=80",
        "images": json.dumps([
            "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&auto=format&fit=crop&q=80"
        ]),
        "colors": json.dumps(["Chocolate Fudge", "French Vanilla", "Café Mocha", "Strawberry Bliss"]),
        "sizes": json.dumps(["1 kg (2.2 lbs)", "2 kg (4.4 lbs)", "3 kg (6.6 lbs)"]),
        "stock": 250
    },
    {
        "name": "FlexiFlex Non-Slip Yoga Mat",
        "description": "Extra thick 6mm eco-friendly TPE yoga mat with alignment lines, texture surface for superior grip, and carrying strap. Lightweight and durable.",
        "price": 1499.0,
        "sw": 20,
        "category": "Wellness",
        "image_url": "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=800&auto=format&fit=crop&q=80",
        "images": json.dumps([
            "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop&q=80"
        ]),
        "colors": json.dumps(["Pastel Purple", "Teal Ocean", "Charcoal Black", "Blush Pink"]),
        "sizes": json.dumps(["Standard (6mm)", "Pro Comfort (8mm)"]),
        "stock": 120
    },
    {
        "name": "HydroGuard Double-Wall Flask",
        "description": "32oz vacuum-insulated stainless steel water bottle. Keeps drinks cold for up to 24 hours or hot for 12 hours. Sweat-proof finish and leak-proof straw lid.",
        "price": 999.0,
        "sw": 10,
        "category": "Wellness",
        "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
        "images": json.dumps([
            "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1559839914-ba2a6d708365?w=800&auto=format&fit=crop&q=80"
        ]),
        "colors": json.dumps(["Matte Black", "Ocean Blue", "Stainless Silver", "Sunset Coral"]),
        "sizes": json.dumps(["500 ml", "750 ml", "1000 ml"]),
        "stock": 300
    },
    {
        "name": "AeroPosture Ergonomic Office Chair",
        "description": "Ergonomic mesh office chair with adjustable lumbar support, 3D armrests, headrest, tilt mechanism, and smooth-rolling nylon casters. Rated for up to 300 lbs.",
        "price": 15999.0,
        "sw": 150,
        "category": "Smart Home",
        "image_url": "https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=800&auto=format&fit=crop&q=80",
        "images": json.dumps([
            "https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=800&auto=format&fit=crop&q=80"
        ]),
        "colors": json.dumps(["Onyx Black", "Storm Gray", "Midnight Blue"]),
        "sizes": json.dumps(["Standard", "High Back + Headrest"]),
        "stock": 50
    }
]

CATEGORIES = [
    {
        "name": "Apparel",
        "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=500&q=80"
    },
    {
        "name": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=500&q=80"
    },
    {
        "name": "Wellness",
        "image_url": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=500&q=80"
    },
    {
        "name": "Smart Home",
        "image_url": "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=500&q=80"
    }
]

def seed_db():
    logger.info("Initializing tables...")
    Base.metadata.create_all(bind=engine)
    
    # Safe migration for phone_number and is_admin columns
    from sqlalchemy import text
    db: Session = SessionLocal()
    try:
        db.execute(text("ALTER TABLE users ADD COLUMN phone_number VARCHAR"))
        db.commit()
        logger.info("Added phone_number column to users table during seeding.")
    except Exception as e:
        db.rollback()
        
    try:
        db.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE"))
        db.commit()
        logger.info("Added is_admin column to users table during seeding.")
    except Exception as e:
        db.rollback()

    # Migration for products table photo gallery views and variant options
    for col, col_type in [
        ("images", "TEXT"),
        ("colors", "TEXT"),
        ("sizes", "TEXT"),
        ("options", "TEXT"),
    ]:
        try:
            db.execute(text(f"ALTER TABLE products ADD COLUMN {col} {col_type}"))
            db.commit()
            logger.info(f"Added {col} column to products table during seeding.")
        except Exception:
            db.rollback()

    # Migration for order_items table selected variant options
    for col, col_type in [
        ("selected_color", "VARCHAR"),
        ("selected_size", "VARCHAR"),
    ]:
        try:
            db.execute(text(f"ALTER TABLE order_items ADD COLUMN {col} {col_type}"))
            db.commit()
            logger.info(f"Added {col} column to order_items table during seeding.")
        except Exception:
            db.rollback()

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
                phone_number="+919876543210",
                status="active", # Root user is active by default
                personal_sw=100.0,
                wallet_balance=0.0,
                is_admin=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            logger.info("Root user 'admin' created successfully.")
        else:
            logger.info("Root user 'admin' already exists.")

        # 1b. Seed Genealogy Mother Node (rootuser)
        rootuser = db.query(User).filter(User.username == "rootuser").first()
        if not rootuser:
            logger.info("Seeding root genealogy node 'rootuser'...")
            rootuser = User(
                username="rootuser",
                email="rootuser@mlm-amazon.com",
                full_name="Root User",
                hashed_password=get_password_hash("user@root.123"),
                phone_number="+919876543211",
                status="active", # Root user of tree is active by default
                personal_sw=100.0,
                wallet_balance=0.0,
                is_admin=False
            )
            db.add(rootuser)
            db.commit()
            db.refresh(rootuser)
            logger.info("Genealogy root user 'rootuser' created successfully.")
        else:
            logger.info("Genealogy root user 'rootuser' already exists.")
            
        # 2. Seed Categories
        logger.info("Seeding categories catalog...")
        for c_data in CATEGORIES:
            category = db.query(Category).filter(Category.name == c_data["name"]).first()
            if not category:
                category = Category(**c_data)
                db.add(category)
                logger.info(f"Seeded category: {c_data['name']}")
            else:
                category.image_url = c_data["image_url"]
                db.add(category)
        db.commit()
            
        # 3. Seed Products
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
