"""
Phase 6: Media Management API Routes
Upload, retrieve, update, and delete media for projects
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field
from typing import Optional, List
from pathlib import Path
import shutil
import mimetypes
import os
import logging

from fund.models import fund_db
from middleware.auth_middleware import (
    get_current_user, require_admin, require_fund_admin_or_above
)
from auth.auth_config import ENVIRONMENT, S3_MEDIA_BUCKET, S3_REGION

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/media", tags=["media"])

# Configuration
BASE_DIR = Path(__file__).parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"

# S3 client for AWS environment
s3_client = None
if ENVIRONMENT != "local":
    try:
        import boto3
        s3_client = boto3.client('s3', region_name=S3_REGION)
        logger.info(f"S3 client initialized for bucket: {S3_MEDIA_BUCKET}")
    except Exception as e:
        logger.error(f"Failed to initialize S3 client: {e}")

# Supported file types with max sizes (in bytes)
SUPPORTED_MEDIA = {
    "image": {
        "extensions": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
        "mimes": ["image/jpeg", "image/png", "image/gif", "image/webp"],
        "max_size": 10 * 1024 * 1024  # 10 MB
    },
    "video": {
        "extensions": [".mp4", ".webm", ".mov"],
        "mimes": ["video/mp4", "video/webm", "video/quicktime"],
        "max_size": 100 * 1024 * 1024  # 100 MB
    },
    "audio": {
        "extensions": [".mp3", ".wav", ".ogg"],
        "mimes": ["audio/mpeg", "audio/wav", "audio/ogg"],
        "max_size": 20 * 1024 * 1024  # 20 MB
    }
}


def get_media_type(filename: str, content_type: str) -> Optional[str]:
    """Determine media type from filename extension or content type"""
    ext = Path(filename).suffix.lower()
    
    for media_type, config in SUPPORTED_MEDIA.items():
        if ext in config["extensions"] or content_type in config["mimes"]:
            return media_type
    return None


def validate_file(filename: str, content_type: str, file_size: int) -> tuple[str, str]:
    """Validate file and return (media_type, error_message)"""
    media_type = get_media_type(filename, content_type)
    
    if not media_type:
        supported_exts = []
        for config in SUPPORTED_MEDIA.values():
            supported_exts.extend(config["extensions"])
        return None, f"Unsupported file type. Allowed: {', '.join(supported_exts)}"
    
    max_size = SUPPORTED_MEDIA[media_type]["max_size"]
    if file_size > max_size:
        max_mb = max_size / (1024 * 1024)
        return None, f"File too large. Max size for {media_type}: {max_mb:.0f} MB"
    
    return media_type, None


def ensure_upload_dirs():
    """Create upload directories if they don't exist"""
    for media_type in SUPPORTED_MEDIA.keys():
        (UPLOADS_DIR / f"{media_type}s").mkdir(parents=True, exist_ok=True)


def get_media_url(file_key: str) -> str:
    """Get the appropriate URL for a media file based on environment"""
    if ENVIRONMENT != "local" and s3_client:
        return f"https://{S3_MEDIA_BUCKET}.s3.{S3_REGION}.amazonaws.com/{file_key}"
    return f"/uploads/{file_key}"


# =============================================================================
# Pydantic Models
# =============================================================================

class MediaUpdate(BaseModel):
    caption: Optional[str] = None
    display_order: Optional[int] = Field(None, ge=0)


class MediaReorderItem(BaseModel):
    media_id: str
    display_order: int = Field(..., ge=0)


class MediaReorder(BaseModel):
    items: List[MediaReorderItem]


# =============================================================================
# Media Endpoints
# =============================================================================

@router.post("")
async def upload_media(
    project_id: str = Form(...),
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    current_user: dict = Depends(require_fund_admin_or_above())
):
    """
    Upload a media file for a project.
    Fund Admins can only upload to their assigned projects.
    Uses S3 for storage in AWS, local filesystem in development.
    """
    # Check project exists
    project = fund_db.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check project access for fund_admin
    user_role = current_user.get('role', 'user')
    if user_role == 'fund_admin':
        assigned = current_user.get('assigned_projects', [])
        if isinstance(assigned, str):
            import json
            try:
                assigned = json.loads(assigned)
            except:
                assigned = []
        if project_id not in assigned:
            raise HTTPException(status_code=403, detail="You don't have access to this project")

    # Read file content to get size
    content = await file.read()
    file_size = len(content)

    # Validate file
    media_type, error = validate_file(file.filename, file.content_type, file_size)
    if error:
        raise HTTPException(status_code=400, detail=error)

    # Generate file key (path within uploads)
    import uuid
    file_ext = Path(file.filename).suffix.lower()
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_key = f"{media_type}s/{project_id}/{unique_filename}"

    # Get mime type
    mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"

    # Save file - use S3 in AWS, local filesystem in development
    if ENVIRONMENT != "local" and s3_client:
        try:
            # Upload to S3
            s3_client.put_object(
                Bucket=S3_MEDIA_BUCKET,
                Key=file_key,
                Body=content,
                ContentType=mime_type
            )
            logger.info(f"File uploaded to S3: {file_key}")
            # URL for S3 - use presigned URL or CloudFront in production
            url = f"https://{S3_MEDIA_BUCKET}.s3.{S3_REGION}.amazonaws.com/{file_key}"
        except Exception as e:
            logger.error(f"S3 upload failed: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to upload file to S3: {str(e)}")
    else:
        # Ensure directories exist (local)
        ensure_upload_dirs()

        # Create project directory
        project_dir = UPLOADS_DIR / f"{media_type}s" / project_id
        project_dir.mkdir(parents=True, exist_ok=True)

        # Save file locally
        file_path = UPLOADS_DIR / file_key
        with open(file_path, "wb") as f:
            f.write(content)

        url = f"/uploads/{file_key}"

    # Create database record
    media = fund_db.create_media(
        project_id=project_id,
        media_type=media_type,
        file_name=file.filename,
        file_key=file_key,
        file_size=file_size,
        mime_type=mime_type,
        uploaded_by=current_user['user_id'],
        caption=caption
    )

    # Add URL to response
    media['url'] = url

    return {"success": True, "media": media}


@router.get("/project/{project_id}")
async def list_project_media(
    project_id: str,
    media_type: Optional[str] = Query(None, pattern="^(image|video|audio)$"),
    current_user: dict = Depends(get_current_user)
):
    """Get all media for a project, optionally filtered by type"""
    # Check project exists
    project = fund_db.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    media_list = fund_db.get_media_by_project(project_id, media_type)

    # Add URLs to each media item
    for media in media_list:
        media['url'] = get_media_url(media['file_key'])
    
    # Get counts
    counts = fund_db.get_media_count_by_project(project_id)
    
    return {
        "success": True,
        "media": media_list,
        "counts": counts
    }


@router.get("/{media_id}")
async def get_media(
    media_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get media details by ID"""
    media = fund_db.get_media_by_id(media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    # Add URL
    media['url'] = get_media_url(media['file_key'])

    return {"success": True, "media": media}


@router.get("/file/{media_id}")
async def get_media_file(media_id: str):
    """
    Get the actual media file.
    This is public to allow embedding in pages.
    In AWS, redirects to S3 URL. In local, serves from filesystem.
    """
    media = fund_db.get_media_by_id(media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    if ENVIRONMENT != "local" and s3_client:
        # In AWS, fetch from S3 and return
        try:
            response = s3_client.get_object(Bucket=S3_MEDIA_BUCKET, Key=media['file_key'])
            content = response['Body'].read()
            return Response(
                content=content,
                media_type=media['mime_type'],
                headers={
                    "Content-Disposition": f'inline; filename="{media["file_name"]}"'
                }
            )
        except Exception as e:
            logger.error(f"S3 get failed: {e}")
            raise HTTPException(status_code=404, detail="File not found in S3")
    else:
        # Local filesystem
        file_path = UPLOADS_DIR / media['file_key']
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        return FileResponse(
            path=file_path,
            media_type=media['mime_type'],
            filename=media['file_name']
        )


@router.patch("/{media_id}")
async def update_media(
    media_id: str,
    update: MediaUpdate,
    current_user: dict = Depends(require_fund_admin_or_above())
):
    """Update media caption or display order"""
    media = fund_db.get_media_by_id(media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    # Check project access for fund_admin
    user_role = current_user.get('role', 'user')
    if user_role == 'fund_admin':
        assigned = current_user.get('assigned_projects', [])
        if isinstance(assigned, str):
            import json
            try:
                assigned = json.loads(assigned)
            except:
                assigned = []
        if media['project_id'] not in assigned:
            raise HTTPException(status_code=403, detail="You don't have access to this media")
    
    update_data = update.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    success = fund_db.update_media(media_id, **update_data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update media")
    
    updated = fund_db.get_media_by_id(media_id)
    updated['url'] = get_media_url(updated['file_key'])

    return {"success": True, "media": updated}


@router.delete("/{media_id}")
async def delete_media(
    media_id: str,
    current_user: dict = Depends(require_fund_admin_or_above())
):
    """Delete a media file"""
    media = fund_db.get_media_by_id(media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    # Check project access for fund_admin
    user_role = current_user.get('role', 'user')
    if user_role == 'fund_admin':
        assigned = current_user.get('assigned_projects', [])
        if isinstance(assigned, str):
            import json
            try:
                assigned = json.loads(assigned)
            except:
                assigned = []
        if media['project_id'] not in assigned:
            raise HTTPException(status_code=403, detail="You don't have access to this media")
    
    # Delete file from storage
    if ENVIRONMENT != "local" and s3_client:
        # Delete from S3
        try:
            s3_client.delete_object(Bucket=S3_MEDIA_BUCKET, Key=media['file_key'])
            logger.info(f"Deleted from S3: {media['file_key']}")
        except Exception as e:
            logger.warning(f"Failed to delete from S3: {e}")
    else:
        # Delete from local disk
        file_path = UPLOADS_DIR / media['file_key']
        if file_path.exists():
            file_path.unlink()

    # Delete database record
    success = fund_db.delete_media(media_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete media record")
    
    return {"success": True, "message": "Media deleted"}


@router.post("/reorder/{project_id}")
async def reorder_media(
    project_id: str,
    reorder: MediaReorder,
    current_user: dict = Depends(require_fund_admin_or_above())
):
    """Reorder media items for a project"""
    # Check project exists
    project = fund_db.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check project access for fund_admin
    user_role = current_user.get('role', 'user')
    if user_role == 'fund_admin':
        assigned = current_user.get('assigned_projects', [])
        if isinstance(assigned, str):
            import json
            try:
                assigned = json.loads(assigned)
            except:
                assigned = []
        if project_id not in assigned:
            raise HTTPException(status_code=403, detail="You don't have access to this project")
    
    # Convert to list of dicts
    media_orders = [{"media_id": item.media_id, "display_order": item.display_order} for item in reorder.items]
    
    success = fund_db.reorder_media(project_id, media_orders)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to reorder media")
    
    return {"success": True, "message": "Media reordered"}


@router.get("/config/supported")
async def get_supported_media_types():
    """Get supported media types and their limits"""
    config = {}
    for media_type, settings in SUPPORTED_MEDIA.items():
        config[media_type] = {
            "extensions": settings["extensions"],
            "max_size_bytes": settings["max_size"],
            "max_size_mb": settings["max_size"] / (1024 * 1024)
        }
    return {"success": True, "supported_types": config}
