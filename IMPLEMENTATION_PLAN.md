# Implementation Plan: Excel to Web Application

## Overview
Build a web application that reads data from an Excel file and displays it in a Sway-like presentation format. The solution should work locally first, then support online-hosted Excel files, and eventually deploy to AWS.

## Technology Stack

### Frontend
- **React** or **Next.js** (React-based framework with SSR capabilities)
  - Modern, component-based UI
  - Great for building interactive presentations
  - Easy to style with CSS/Tailwind

### Backend
- **Python Flask** or **FastAPI**
  - Lightweight and easy to deploy
  - Excellent Excel file handling libraries
  - RESTful API for data fetching

### Data Storage (Free & Open Source)
- **Option 1: GitHub/GitLab** (Recommended for Excel files)
  - Free public/private repositories
  - Version control built-in
  - Easy for non-technical users to update via web interface
  - Direct file access via raw URLs

- **Option 2: AWS S3** (For production)
  - Scalable and reliable
  - Can be made publicly readable
  - Cost-effective for static files

### Media Storage
- **Option 1: GitHub/GitLab** (For images)
  - Store images in repository
  - Access via raw URLs
  - Free and version-controlled

- **Option 2: AWS S3** (For production)
  - Store images in S3 bucket
  - Serve via CloudFront CDN for better performance

### Excel Processing
- **pandas** + **openpyxl** (Python libraries)
  - Read Excel files efficiently
  - Handle multiple sheets
  - Convert to JSON for frontend consumption

## Architecture

```
┌─────────────┐
│   User      │
│  Browser    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│      Frontend (React/Next.js)   │
│  - Fetches data from API        │
│  - Displays Sway-like UI        │
│  - Handles images               │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│   Backend API (Flask/FastAPI)   │
│  - Reads Excel file             │
│  - Converts to JSON             │
│  - Serves images                │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│   Data Source                   │
│  - Local: File system           │
│  - Online: GitHub/S3 URL        │
└─────────────────────────────────┘
```

## Implementation Steps

### Phase 1: Local Development
1. **Set up project structure**
   - Create frontend and backend directories
   - Initialize package.json and requirements.txt

2. **Backend Development**
   - Create Flask/FastAPI server
   - Implement Excel reader endpoint
   - Parse Excel file and convert to JSON
   - Serve static images from local directory

3. **Frontend Development**
   - Create React/Next.js application
   - Design Sway-like presentation UI
   - Fetch data from backend API
   - Display data in cards/sections format
   - Handle image rendering

4. **Testing**
   - Test with local Excel file
   - Test with local images
   - Verify data display accuracy

### Phase 2: Online Data Source
1. **Upload Excel to GitHub**
   - Create repository
   - Upload Excel file
   - Get raw file URL

2. **Upload Images to GitHub**
   - Upload images to repository
   - Organize in images folder
   - Get raw URLs

3. **Update Backend**
   - Add support for fetching Excel from URL
   - Download and cache Excel file
   - Update image paths to use GitHub URLs

### Phase 3: AWS Deployment
1. **Infrastructure Setup**
   - Deploy backend to AWS (EC2, ECS, or Lambda)
   - Set up S3 bucket for Excel and images
   - Configure CloudFront for CDN (optional)

2. **Update Configuration**
   - Point to S3 URLs instead of GitHub
   - Configure CORS if needed
   - Set up environment variables

## User-Friendly Data Updates

### For Non-Technical Users:
1. **GitHub Web Interface** (Easiest)
   - Users can edit Excel file directly in GitHub
   - Or upload new version via web interface
   - Changes are version-controlled

2. **Google Sheets Alternative** (If preferred)
   - Export to Excel format
   - Store in GitHub or S3
   - More familiar interface for users

3. **Admin Panel** (Future enhancement)
   - Simple web form to upload new Excel file
   - Automatic processing and deployment

## File Structure

```
project/
├── backend/
│   ├── app.py                 # Main Flask/FastAPI application
│   ├── excel_parser.py        # Excel reading logic
│   ├── requirements.txt       # Python dependencies
│   └── config.py             # Configuration (local/online URLs)
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API calls
│   │   └── App.js            # Main app component
│   ├── package.json
│   └── public/               # Static assets
├── data/                     # Local Excel file (dev)
├── images/                   # Local images (dev)
└── README.md
```

## Key Features

1. **Dynamic Data Loading**
   - Page fetches Excel data on load
   - No need to rebuild frontend when data changes

2. **Responsive Design**
   - Works on desktop, tablet, and mobile
   - Sway-like smooth scrolling and animations

3. **Image Handling**
   - Support for multiple image formats
   - Lazy loading for performance
   - Responsive image sizing

4. **Error Handling**
   - Graceful handling of missing data
   - Loading states
   - Error messages for failed fetches

## Deployment Considerations

### AWS Services to Use:
- **EC2/ECS** or **Lambda** for backend
- **S3** for file storage
- **CloudFront** for CDN (optional but recommended)
- **Route 53** for domain (if needed)
- **ALB** for load balancing (if using EC2/ECS)

### Cost Optimization:
- Use S3 for storage (very cheap)
- Consider Lambda for serverless (pay per request)
- CloudFront caching reduces backend load

## Next Steps

1. Examine Excel file structure
2. Set up project structure
3. Build backend API
4. Build frontend UI
5. Test locally
6. Set up GitHub repository for data
7. Test with online data source
8. Prepare for AWS deployment

