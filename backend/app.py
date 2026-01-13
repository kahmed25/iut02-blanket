"""
FastAPI backend application for Excel data visualization
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import uvicorn

from config import EXCEL_FILE_PATH, IMAGES_DIR, CORS_ORIGINS, API_HOST, API_PORT
from excel_parser import parse_excel, get_data_summary
import pandas as pd

app = FastAPI(
    title="Excel Data Visualization API",
    description="API for serving Excel data and images",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for images
if IMAGES_DIR.exists():
    app.mount("/images", StaticFiles(directory=str(IMAGES_DIR)), name="images")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Excel Data Visualization API",
        "version": "1.0.0",
        "endpoints": {
            "/api/data": "Get Excel data",
            "/api/summary": "Get data summary",
            "/images/{filename}": "Get image file"
        }
    }


@app.get("/api/data")
async def get_data():
    """
    Get parsed Excel data as JSON
    """
    try:
        if not EXCEL_FILE_PATH.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Excel file not found at {EXCEL_FILE_PATH}"
            )
        
        data = parse_excel(EXCEL_FILE_PATH)
        
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
        if not EXCEL_FILE_PATH.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Excel file not found at {EXCEL_FILE_PATH}"
            )
        
        data = parse_excel(EXCEL_FILE_PATH)
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
            "base_url": "/images"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing images: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "excel_file_exists": EXCEL_FILE_PATH.exists(),
        "images_dir_exists": IMAGES_DIR.exists()
    }


if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=API_HOST,
        port=API_PORT,
        reload=True
    )

