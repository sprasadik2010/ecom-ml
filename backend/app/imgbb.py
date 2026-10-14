import os
import json
import logging
import base64
import requests
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from . import models
from .config import settings

logger = logging.getLogger(__name__)

# 1x1 transparent GIF used to verify ImgBB API Key connection
TINY_TEST_GIF_B64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"


def get_effective_imgbb_key(db: Session) -> str:
    """
    Returns the configured ImgBB API Key.
    Prioritizes DB SystemSetting, then environment/settings.
    """
    try:
        db_setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "imgbb_api_key").first()
        if db_setting and db_setting.value and db_setting.value.strip():
            return db_setting.value.strip()
    except Exception as e:
        logger.warning(f"Could not read imgbb_api_key from system_settings: {e}")

    if hasattr(settings, "IMGBB_API_KEY") and settings.IMGBB_API_KEY and settings.IMGBB_API_KEY.strip():
        return settings.IMGBB_API_KEY.strip()

    return os.getenv("IMGBB_API_KEY", "").strip()


def mask_api_key(key: str) -> str:
    """Returns a masked version of the key for safe UI display (e.g. 1a2b••••••9z)."""
    if not key:
        return ""
    clean = key.strip()
    if len(clean) <= 6:
        return "••••••"
    return f"{clean[:4]}{'•' * (len(clean) - 6)}{clean[-2:]}"


def resolve_image_url(db: Session, url: Optional[str]) -> Optional[str]:
    """
    If a URL points to a local /static/ file that has already completed upload to ImgBB,
    returns its public ImgBB CDN URL. Otherwise returns the original URL.
    """
    if not url or "/static/" not in url:
        return url
    try:
        filename = url.split("/static/")[-1].strip()
        match = db.query(models.ImageUpload).filter(
            models.ImageUpload.local_filename == filename,
            models.ImageUpload.status == "completed",
            models.ImageUpload.imgbb_url.isnot(None)
        ).first()
        if match and match.imgbb_url:
            return match.imgbb_url
    except Exception as e:
        logger.warning(f"Error resolving image URL: {e}")
    return url


def upload_file_to_imgbb(file_path: str, api_key: str) -> dict:
    """
    Uploads a local image file to ImgBB REST API.
    Docs: https://api.imgbb.com/
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Image file does not exist on disk: {file_path}")

    url = "https://api.imgbb.com/1/upload"
    base_name = os.path.splitext(os.path.basename(file_path))[0]
    # Extract clean name by stripping timestamp prefix (e.g. 1728901234_shirt.jpg -> shirt)
    parts = base_name.split("_", 1)
    clean_title = parts[1] if (len(parts) == 2 and parts[0].isdigit()) else base_name
    upload_name = f"BuyWay_{clean_title}".strip("_")

    with open(file_path, "rb") as image_file:
        response = requests.post(
            url,
            params={"key": api_key},
            files={"image": image_file},
            data={"name": upload_name},
            timeout=45
        )

    if response.status_code != 200:
        error_msg = f"ImgBB API returned status {response.status_code}"
        try:
            err_data = response.json()
            if "error" in err_data and "message" in err_data["error"]:
                error_msg = f"ImgBB Error: {err_data['error']['message']}"
        except Exception:
            error_msg = f"{error_msg}: {response.text[:200]}"
        raise Exception(error_msg)

    result = response.json()
    if not result.get("success"):
        error_info = result.get("error", {}).get("message", "Unknown ImgBB failure.")
        raise Exception(f"ImgBB upload unsuccessful: {error_info}")

    return result["data"]


def test_imgbb_key(api_key: str) -> Tuple[bool, str]:
    """
    Tests if an ImgBB API key is active and valid by uploading a tiny 1x1 test image.
    """
    if not api_key or not api_key.strip():
        return False, "ImgBB API Key cannot be empty."

    url = "https://api.imgbb.com/1/upload"
    try:
        gif_bytes = base64.b64decode(TINY_TEST_GIF_B64)
        response = requests.post(
            url,
            params={"key": api_key.strip()},
            files={"image": ("test_verify.gif", gif_bytes, "image/gif")},
            data={"name": "test_verify"},
            timeout=20
        )
        if response.status_code == 200 and response.json().get("success"):
            return True, "ImgBB API Key verified successfully! Cloud connection active."
        
        try:
            data = response.json()
            err = data.get("error", {}).get("message", response.text)
            return False, f"ImgBB verification failed: {err}"
        except Exception:
            return False, f"ImgBB returned HTTP {response.status_code}: {response.text[:200]}"
    except Exception as e:
        return False, f"Network error communicating with ImgBB: {str(e)}"


def sync_image_url_in_database(db: Session, local_url: str, local_filename: str, imgbb_url: str):
    """
    Scans products and categories in the database and updates any references
    from local static URL/filename to the new ImgBB CDN URL.
    """
    try:
        # 1. Update Product primary image_url
        matching_products = db.query(models.Product).filter(
            (models.Product.image_url.contains(local_filename)) |
            (models.Product.image_url == local_url)
        ).all()
        for p in matching_products:
            p.image_url = imgbb_url

        # 2. Update Product gallery images JSON list
        all_products_with_gallery = db.query(models.Product).filter(
            models.Product.images.isnot(None),
            models.Product.images.contains(local_filename)
        ).all()
        for p in all_products_with_gallery:
            try:
                gallery = json.loads(p.images)
                if isinstance(gallery, list):
                    updated_gallery = [
                        imgbb_url if (local_filename in u or u == local_url) else u
                        for u in gallery
                    ]
                    p.images = json.dumps(updated_gallery)
            except Exception as e:
                logger.warning(f"Could not parse gallery JSON for product {p.id}: {e}")

        # 3. Update Category image_url
        matching_categories = db.query(models.Category).filter(
            (models.Category.image_url.contains(local_filename)) |
            (models.Category.image_url == local_url)
        ).all()
        for c in matching_categories:
            c.image_url = imgbb_url

        db.commit()
        logger.info(f"Database references for {local_filename} synchronized to ImgBB URL: {imgbb_url}")
    except Exception as e:
        db.rollback()
        logger.error(f"Error synchronizing image URL in database: {e}")


def background_upload_to_imgbb(upload_id: int):
    """
    Background worker task executed by FastAPI BackgroundTasks.
    Uploads the specified local image to ImgBB and synchronizes DB records.
    """
    from .database import SessionLocal
    db = SessionLocal()
    try:
        upload_record = db.query(models.ImageUpload).filter(models.ImageUpload.id == upload_id).first()
        if not upload_record:
            logger.warning(f"ImageUpload record #{upload_id} not found.")
            return

        api_key = get_effective_imgbb_key(db)
        if not api_key:
            upload_record.status = "pending"
            upload_record.error_message = "Pending ImgBB API Key configuration in Admin Settings."
            db.commit()
            logger.info(f"Image #{upload_id} kept as pending: No ImgBB API key configured.")
            return

        upload_record.status = "uploading"
        upload_record.error_message = None
        db.commit()

        static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
        file_path = os.path.join(static_dir, upload_record.local_filename)

        if not os.path.exists(file_path):
            upload_record.status = "failed"
            upload_record.error_message = f"Local file not found on server disk: {upload_record.local_filename}"
            db.commit()
            return

        imgbb_data = upload_file_to_imgbb(file_path, api_key)
        imgbb_url = imgbb_data.get("url") or imgbb_data.get("display_url")
        delete_url = imgbb_data.get("delete_url")

        upload_record.imgbb_url = imgbb_url
        upload_record.imgbb_delete_url = delete_url
        upload_record.status = "completed"
        upload_record.error_message = None
        db.commit()

        logger.info(f"Successfully uploaded image #{upload_id} to ImgBB: {imgbb_url}")

        # Auto-sync with existing products / categories
        sync_image_url_in_database(
            db=db,
            local_url=upload_record.local_url,
            local_filename=upload_record.local_filename,
            imgbb_url=imgbb_url
        )

    except Exception as e:
        logger.error(f"Background ImgBB upload failed for #{upload_id}: {e}")
        try:
            upload_record = db.query(models.ImageUpload).filter(models.ImageUpload.id == upload_id).first()
            if upload_record:
                upload_record.status = "failed"
                upload_record.error_message = str(e)
                db.commit()
        except Exception:
            pass
    finally:
        db.close()
