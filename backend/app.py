"""
FastAPI backend application for Excel data visualization
"""
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pathlib import Path
import uvicorn
import requests
import mimetypes

from config import (
    EXCEL_FILE_PATH, IMAGES_DIR, CORS_ORIGINS, API_HOST, API_PORT,
    EXCEL_SOURCE_TYPE, EXCEL_URL, IMAGES_SOURCE_TYPE, IMAGES_BASE_URL,
    CACHE_DIR, CACHE_EXPIRATION_SECONDS
)
from excel_parser import parse_excel, get_data_summary, fetch_excel_from_url, clear_excel_cache
import pandas as pd

# Import auth routes
from auth.routes import router as auth_router
from auth.email_auth import router as email_auth_router

# Import Phase 5 fund management routes
from fund.routes import router as fund_router

# Import Phase 6 media management routes
from fund.media_routes import router as media_router

app = FastAPI(
    title="Excel Data Visualization API",
    description="API for serving Excel data and images with authentication and fund management",
    version="3.0.0"
)

# CORS middleware - use environment-based origins
import os
# CORS origins - include all domains
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "https://www.idot02.com,https://dev.d1js9a712g4lw.amplifyapp.com,http://localhost:3000,http://localhost:8000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ],
)

# Include auth router
app.include_router(auth_router)
app.include_router(email_auth_router)

# Include Phase 5 fund management router
app.include_router(fund_router)

# Include Phase 6 media router
app.include_router(media_router)

# Mount static files for images (only for local mode)
if IMAGES_SOURCE_TYPE == "local" and IMAGES_DIR.exists():
    app.mount("/images", StaticFiles(directory=str(IMAGES_DIR)), name="images")

# Mount uploads directory for media (Phase 6)
# In AWS Lambda, use /tmp as the writable directory
import os
if os.getenv("ENVIRONMENT", "local") == "aws":
    # In AWS, use /tmp for uploads (S3 is used for actual storage)
    UPLOADS_DIR = Path("/tmp/uploads")
else:
    UPLOADS_DIR = Path(__file__).parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle CORS preflight requests"""
    return {"message": "OK"}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Excel Data Visualization API with Authentication & Fund Management",
        "version": "3.0.0 (Phase 5 - Fund Management)",
        "configuration": {
            "excel_source": EXCEL_SOURCE_TYPE,
            "images_source": IMAGES_SOURCE_TYPE
        },
        "endpoints": {
            "# Excel Data (Phase 1-2)": {
                "/api/data": "Get Excel data",
                "/api/summary": "Get data summary",
                "/api/images": "List available images",
                "/images/{filename}": "Get image file",
                "POST /api/cache/clear": "Clear cached data"
            },
            "# Authentication (Phase 4)": {
                "/auth/login/{provider}": "Initiate OAuth login",
                "/auth/callback/{provider}": "OAuth callback",
                "/auth/me": "Get current user",
                "/auth/refresh": "Refresh access token",
                "/auth/logout": "Logout",
                "/auth/providers": "Get available OAuth providers"
            },
            "# Email Authentication": {
                "POST /auth/email/login": "Login with email/password",
                "POST /auth/email/register": "Register with email/password",
                "POST /auth/email/verify": "Verify email with code",
                "POST /auth/email/forgot-password": "Send password reset link",
                "POST /auth/email/reset-password": "Reset password with token",
                "POST /auth/email/change-password": "Change password (logged in)"
            },
            "# Fund Management (Phase 5)": {
                "/api/projects": "CRUD for charity projects",
                "/api/contributions": "CRUD for contributions",
                "/api/stats": "Project statistics",
                "/api/settings": "App settings (data source mode)",
                "/api/users": "User role management",
                "/api/config": "Supported currencies and payment modes"
            },
            "# Media Management (Phase 6)": {
                "POST /api/media": "Upload media file",
                "GET /api/media/project/{project_id}": "List project media",
                "GET /api/media/{media_id}": "Get media details",
                "GET /api/media/file/{media_id}": "Get media file",
                "PATCH /api/media/{media_id}": "Update media caption/order",
                "DELETE /api/media/{media_id}": "Delete media",
                "POST /api/media/reorder/{project_id}": "Reorder media",
                "/uploads/{path}": "Static media files"
            }
        }
    }


@app.get("/api/data")
async def get_data():
    """
    Get parsed Excel data as JSON
    """
    try:
        # Fetch Excel data based on source type
        if EXCEL_SOURCE_TYPE == "url":
            # Fetch from URL
            excel_data = fetch_excel_from_url(EXCEL_URL, CACHE_DIR, CACHE_EXPIRATION_SECONDS)
            data = parse_excel(excel_data, is_url=True)
        else:
            # Read from local file
            if not EXCEL_FILE_PATH.exists():
                raise HTTPException(
                    status_code=404,
                    detail=f"Excel file not found at {EXCEL_FILE_PATH}"
                )
            data = parse_excel(EXCEL_FILE_PATH, is_url=False)
        
        # Clean NaN values for JSON serialization
        import math
        import numpy as np
        
        def clean_nan(obj):
            """Recursively clean NaN and inf values"""
            if isinstance(obj, dict):
                return {k: clean_nan(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_nan(item) for item in obj]
            elif isinstance(obj, float):
                if math.isnan(obj) or math.isinf(obj):
                    return None
                return obj
            elif isinstance(obj, (np.integer, np.floating)):
                val = float(obj)
                if math.isnan(val) or math.isinf(val):
                    return None
                return val
            elif pd.isna(obj):
                return None
            else:
                return obj
        
        cleaned_data = clean_nan(data)
        
        return {
            "success": True,
            "data": cleaned_data
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in /api/data: {error_details}", flush=True)  # Log to console
        # Return detailed error for debugging
        raise HTTPException(
            status_code=500,
            detail=f"Error reading Excel file: {str(e)}\n\n{error_details}"
        )


@app.get("/api/summary")
async def get_summary():
    """
    Get summary statistics of the Excel data
    """
    try:
        # Fetch Excel data based on source type
        if EXCEL_SOURCE_TYPE == "url":
            excel_data = fetch_excel_from_url(EXCEL_URL, CACHE_DIR, CACHE_EXPIRATION_SECONDS)
            data = parse_excel(excel_data, is_url=True)
        else:
            if not EXCEL_FILE_PATH.exists():
                raise HTTPException(
                    status_code=404,
                    detail=f"Excel file not found at {EXCEL_FILE_PATH}"
                )
            data = parse_excel(EXCEL_FILE_PATH, is_url=False)
        
        summary = get_data_summary(data)
        return {
            "success": True,
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading Excel file: {str(e)}"
        )


@app.get("/api/images")
async def list_images():
    """
    List all available images
    """
    try:
        if IMAGES_SOURCE_TYPE == "local":
            if not IMAGES_DIR.exists():
                return {
                    "success": True,
                    "images": []
                }
            
            image_files = [
                f.name for f in IMAGES_DIR.iterdir()
                if f.is_file() and f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']
            ]
            
            return {
                "success": True,
                "images": image_files,
                "base_url": "/images",
                "source": "local"
            }
        else:
            # For URL mode, return a list of known images
            # In a real scenario, you might fetch this from a manifest or API
            return {
                "success": True,
                "images": [],  # Populate based on your needs
                "base_url": "/images",
                "source": "url",
                "note": "Images are proxied from remote source"
            }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing images: {str(e)}"
        )


@app.get("/images/{filename}")
async def get_image(filename: str):
    """
    Get image file - serves from local or proxies from URL based on configuration
    """
    try:
        if IMAGES_SOURCE_TYPE == "url":
            # Proxy image from remote URL
            image_url = f"{IMAGES_BASE_URL}/{filename}"
            
            # Fetch image from URL
            response = requests.get(image_url, timeout=30)
            response.raise_for_status()
            
            # Determine content type
            content_type = response.headers.get('content-type', 'image/jpeg')
            if not content_type.startswith('image/'):
                # Guess from filename
                guessed_type = mimetypes.guess_type(filename)[0]
                if guessed_type:
                    content_type = guessed_type
            
            return Response(
                content=response.content,
                media_type=content_type,
                headers={
                    "Cache-Control": f"public, max-age={CACHE_EXPIRATION_SECONDS}"
                }
            )
        else:
            # Serve from local directory
            image_path = IMAGES_DIR / filename
            if not image_path.exists():
                raise HTTPException(status_code=404, detail="Image not found")
            
            return FileResponse(image_path)
            
    except requests.RequestException as e:
        raise HTTPException(
            status_code=502,
            detail=f"Error fetching image from remote source: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error serving image: {str(e)}"
        )


@app.post("/api/cache/clear")
async def clear_cache():
    """
    Clear all cached data (Excel files, images)
    """
    try:
        clear_excel_cache()
        
        # Clear disk cache
        if CACHE_DIR.exists():
            import shutil
            for file in CACHE_DIR.glob("*"):
                if file.is_file():
                    file.unlink()
        
        return {
            "success": True,
            "message": "Cache cleared successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error clearing cache: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    health_status = {
        "status": "healthy",
        "configuration": {
            "excel_source": EXCEL_SOURCE_TYPE,
            "images_source": IMAGES_SOURCE_TYPE
        }
    }
    
    if EXCEL_SOURCE_TYPE == "local":
        health_status["excel_file_exists"] = EXCEL_FILE_PATH.exists()
    else:
        health_status["excel_url"] = EXCEL_URL
    
    if IMAGES_SOURCE_TYPE == "local":
        health_status["images_dir_exists"] = IMAGES_DIR.exists()
    else:
        health_status["images_base_url"] = IMAGES_BASE_URL
    
    return health_status


if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=API_HOST,
        port=API_PORT,
        reload=True
    )

