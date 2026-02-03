"""
Migration Script: Import existing images from /images/ folder to Blanket Distribution project
Run this script once to migrate Phase 1-2 images to Phase 6 media system

Usage:
    cd backend
    python migrate_images.py
"""
import os
import sys
import shutil
import mimetypes
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from fund.models import fund_db

# Paths
BASE_DIR = Path(__file__).parent.parent
IMAGES_DIR = BASE_DIR / "images"
UPLOADS_DIR = Path(__file__).parent / "uploads"

# Supported image extensions
SUPPORTED_IMAGES = [".jpg", ".jpeg", ".png", ".gif", ".webp"]

# Admin user ID (will be used as uploaded_by)
# This should be the super_admin who originally set up the system
ADMIN_USER_ID = "system-migration"


def find_blanket_project():
    """Find the Blanket Distribution project"""
    projects = fund_db.get_all_projects(include_archived=True)
    
    for project in projects:
        name_lower = project['name'].lower()
        if 'blanket' in name_lower:
            return project
    
    return None


def get_super_admin_id():
    """Get the super admin user ID from auth database"""
    from auth.models import db as auth_db
    users = auth_db.get_all_users()
    
    for user in users:
        if user.get('role') == 'super_admin':
            return user['user_id']
    
    # Fallback
    return ADMIN_USER_ID


def migrate_images():
    """Migrate images from /images/ to Phase 6 media system"""
    print("=" * 60)
    print("Phase 6 Image Migration Script")
    print("=" * 60)
    
    # Check if images directory exists
    if not IMAGES_DIR.exists():
        print(f"❌ Images directory not found: {IMAGES_DIR}")
        return
    
    # Find Blanket Distribution project
    project = find_blanket_project()
    if not project:
        print("❌ Blanket Distribution project not found!")
        print("   Please create the project first via the admin panel.")
        return
    
    project_id = project['project_id']
    print(f"\n✓ Found project: {project['name']} ({project_id})")
    
    # Get admin user ID
    uploader_id = get_super_admin_id()
    print(f"✓ Using uploader ID: {uploader_id}")
    
    # Create uploads directory structure
    uploads_images_dir = UPLOADS_DIR / "images" / project_id
    uploads_images_dir.mkdir(parents=True, exist_ok=True)
    print(f"✓ Created uploads directory: {uploads_images_dir}")
    
    # Check for existing media
    existing_media = fund_db.get_media_by_project(project_id, "image")
    if existing_media:
        print(f"\n⚠️  Found {len(existing_media)} existing media items for this project.")
        response = input("   Continue and add more? (y/n): ")
        if response.lower() != 'y':
            print("   Migration cancelled.")
            return
    
    # Find all images
    images = []
    for file in IMAGES_DIR.iterdir():
        if file.is_file() and file.suffix.lower() in SUPPORTED_IMAGES:
            images.append(file)
    
    if not images:
        print(f"\n❌ No supported images found in {IMAGES_DIR}")
        return
    
    print(f"\n📁 Found {len(images)} images to migrate:")
    for img in images:
        print(f"   - {img.name} ({img.stat().st_size / 1024:.1f} KB)")
    
    # Confirm migration
    print()
    response = input("Proceed with migration? (y/n): ")
    if response.lower() != 'y':
        print("Migration cancelled.")
        return
    
    # Migrate each image
    print("\n🚀 Starting migration...")
    migrated = 0
    errors = []
    
    for idx, image_path in enumerate(images):
        try:
            # Generate unique filename
            import uuid
            file_ext = image_path.suffix.lower()
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            file_key = f"images/{project_id}/{unique_filename}"
            
            # Copy file to uploads
            dest_path = UPLOADS_DIR / file_key
            shutil.copy2(image_path, dest_path)
            
            # Get file info
            file_size = dest_path.stat().st_size
            mime_type = mimetypes.guess_type(image_path.name)[0] or "image/jpeg"
            
            # Create database record
            media = fund_db.create_media(
                project_id=project_id,
                media_type="image",
                file_name=image_path.name,
                file_key=file_key,
                file_size=file_size,
                mime_type=mime_type,
                uploaded_by=uploader_id,
                caption=f"Blanket Distribution 2026 - {image_path.stem}"
            )
            
            print(f"   ✓ Migrated: {image_path.name} → {media['media_id']}")
            migrated += 1
            
        except Exception as e:
            error_msg = f"Failed to migrate {image_path.name}: {str(e)}"
            print(f"   ❌ {error_msg}")
            errors.append(error_msg)
    
    # Summary
    print("\n" + "=" * 60)
    print("Migration Complete!")
    print("=" * 60)
    print(f"✓ Successfully migrated: {migrated} images")
    if errors:
        print(f"❌ Failed: {len(errors)} images")
        for err in errors:
            print(f"   - {err}")
    
    # Show how to access
    print(f"\n📍 Images are now available at:")
    print(f"   - API: GET /api/media/project/{project_id}")
    print(f"   - Static: /uploads/images/{project_id}/")


if __name__ == "__main__":
    migrate_images()
