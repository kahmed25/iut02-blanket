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

### Phase 3: AWS Deployment (Free Tier Optimized)

**Strategy**: Minimize costs by using AWS Free Tier and keeping data on GitHub

1. **Backend Deployment (AWS Lambda - FREE)**
   - Add Mangum adapter for Lambda compatibility
   - Create lambda_handler.py wrapper
   - Package dependencies in deployment zip
   - Deploy to Lambda function (256MB memory, 30s timeout)
   - Configure environment variables for GitHub URLs
   - Free tier: 1M requests/month + 400K GB-seconds compute

2. **API Gateway Setup (HTTP API - FREE for 12 months)**
   - Create HTTP API (cheaper than REST API)
   - Integrate with Lambda function
   - Configure CORS for frontend domain
   - Use default .execute-api.amazonaws.com domain
   - Free tier: 1M requests/month for first 12 months

3. **Frontend Deployment (AWS Amplify - FREE)**
   - Configure Next.js for static export
   - Create amplify.yml build configuration
   - Connect Amplify to GitHub repository
   - Auto-deploy from dev branch
   - Free tier: 1000 build minutes/month + 15GB served/month
   - Built-in CDN and free SSL certificate

4. **Data Storage (GitHub - FREE)**
   - Keep Excel file in GitHub repository
   - Keep images in GitHub repository
   - Backend fetches from GitHub raw URLs (Phase 2 already supports this)
   - No S3 storage costs
   - Version control included

5. **Deployment Scripts**
   - Create deploy_lambda.sh for backend deployment
   - Create amplify.yml for frontend build config
   - Environment configuration files

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

### AWS Services Used (Free Tier Optimized):
- **AWS Lambda**: Serverless backend (always free tier: 1M requests/month)
- **API Gateway HTTP API**: API endpoint (free for 12 months: 1M requests/month)
- **AWS Amplify**: Frontend hosting + CDN (always free tier: 1000 build min, 15GB served/month)
- **GitHub**: Data storage for Excel & images (always free for public repos)
- **NO S3**: Saves storage costs by using GitHub
- **NO CloudFront**: Amplify has built-in CDN
- **NO EC2**: Serverless approach, no server management

### Detailed Cost Analysis:

#### Monthly Costs for Low Traffic POC (10,000 requests/month)

**First 12 Months:**
- AWS Lambda: $0.00 (under 1M requests free tier)
- API Gateway HTTP API: $0.00 (under 1M requests free tier)
- AWS Amplify: $0.00 (under 1000 build min & 15GB served)
- GitHub: $0.00 (public repository)
- Data Transfer: $0.00 (within 100GB free tier)
- **Total: $0.00/month** ✅

**After 12 Months:**
- AWS Lambda: $0.00 (always free under 1M requests)
- API Gateway HTTP API: ~$0.01/month ($1 per 1M requests)
- AWS Amplify: $0.00 (always free under limits)
- GitHub: $0.00 (public repository)
- Data Transfer: $0.00 (within free tier)
- **Total: ~$0.01/month** ✅

#### Cost Breakdown by Traffic Level (After 12 Months)

| Monthly Traffic | Lambda Cost | API Gateway | Amplify | Total/Month |
|----------------|-------------|-------------|---------|-------------|
| 1,000 requests | $0.00 | $0.00 | $0.00 | **$0.00** |
| 10,000 requests | $0.00 | $0.01 | $0.00 | **$0.01** |
| 100,000 requests | $0.00 | $0.10 | $0.00 | **$0.10** |
| 1,000,000 requests | $0.00 | $1.00 | $0.00 | **$1.00** |

#### Free Tier Limits:
- **Lambda**: 1M requests + 400,000 GB-seconds compute/month (always free)
- **API Gateway HTTP API**: 1M requests/month (free for 12 months, then $1/million)
- **Amplify**: 1000 build minutes + 15GB served + 5GB stored/month (always free)
- **GitHub**: Unlimited for public repositories (always free)
- **Data Transfer**: 100GB out/month (always free)

### Cost Optimization Strategies:
- Keep data on GitHub (no S3 costs)
- Use HTTP API instead of REST API (50% cheaper)
- Use smallest Lambda memory size (256MB)
- Cache data in Lambda (reduce GitHub requests)
- Use Amplify instead of separate CloudFront
- Stay within free tier limits for POC usage

## Next Steps

1. Examine Excel file structure
2. Set up project structure
3. Build backend API
4. Build frontend UI
5. Test locally
6. Set up GitHub repository for data
7. Test with online data source
8. Prepare for AWS deployment

