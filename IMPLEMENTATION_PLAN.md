# Implementation Plan: Excel to Web Application

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Implementation Steps](#implementation-steps)
   - [Phase 1: Local Development](#phase-1-local-development) ✅
   - [Phase 2: Online Data Source](#phase-2-online-data-source) ✅
   - [Phase 3: AWS Deployment](#phase-3-aws-deployment-free-tier-optimized) ✅
   - [Phase 4: Modular Authentication System](#phase-4-modular-authentication-system) ✅
   - [Phase 5: Dynamic Charity Fund Management](#phase-5-dynamic-charity-fund-management) ✅
   - [Phase 6: Media Management System](#phase-6-media-management-system) ✅
   - [Phase 7: Distribution Management System](#phase-7-distribution-management-system) ✅
   - [Phase 8: Project Import & Advanced Features](#phase-8-project-import--advanced-features) ✅
   - [Phase 9: User Manual & Help System](#phase-9-user-manual--help-system) ✅
   - [Phase 10: AWS Production Deployment](#phase-10-aws-production-deployment) 🚀
5. [User-Friendly Data Updates](#user-friendly-data-updates)
6. [File Structure](#file-structure)
7. [Key Features](#key-features)
8. [Deployment Considerations](#deployment-considerations)
9. [Phase 4: Completion Summary](#phase-4-completion-summary-) ✅
10. [Phase 5: RBAC Implementation Decisions](#phase-5-rbac-implementation-decisions) ✅
11. [Phase 6: Media Management System](#phase-6-media-management-system) ✅
12. [Phase 7: Distribution Management System](#phase-7-distribution-management-system) ✅
13. [Phase 8: Project Import & Advanced Features](#phase-8-project-import--advanced-features) ✅
14. [Phase 9: User Manual & Help System](#phase-9-user-manual--help-system) ✅
15. [Phase 10: AWS Production Deployment](#phase-10-aws-production-deployment) 🚀
16. [Next Steps](#next-steps)

---

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

### Phase 4: Modular Authentication System

**Strategy**: Build a reusable authentication module with social login support that can be integrated into this and other projects.

#### 4.1 Authentication Module Design

**Module Structure** (Reusable across projects):
```
auth-module/
├── backend/
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── models.py              # User model, session model
│   │   ├── schemas.py             # Pydantic schemas for validation
│   │   ├── providers.py           # Social auth provider configs
│   │   ├── jwt_handler.py         # JWT token generation/validation
│   │   ├── oauth_handlers.py      # OAuth flow handlers
│   │   └── routes.py              # Auth endpoints
│   ├── middleware/
│   │   └── auth_middleware.py     # JWT verification middleware
│   └── config/
│       └── auth_config.py         # Environment-based configuration
├── frontend/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginScreen.tsx    # Main login UI
│   │   │   ├── SocialButton.tsx   # Social login buttons
│   │   │   └── ProtectedRoute.tsx # Route protection wrapper
│   │   ├── hooks/
│   │   │   ├── useAuth.ts         # Auth state management hook
│   │   │   └── useSocialLogin.ts  # Social login logic hook
│   │   ├── services/
│   │   │   ├── authService.ts     # API calls for authentication
│   │   │   └── tokenService.ts    # Token storage/retrieval
│   │   └── context/
│   │       └── AuthContext.tsx    # Global auth context provider
│   └── README.md                  # Integration guide
└── config.example.json            # Example configuration
```

#### 4.2 Backend Authentication Implementation

1. **Database Setup**
   - Choose database: AWS DynamoDB (free tier: 25GB storage, 200M requests/month)
   - Alternative: Amazon RDS Free Tier (PostgreSQL/MySQL, 20GB, 750 hours/month)
   - Tables:
     - `users`: user_id, email, username, provider, provider_id, created_at, last_login
     - `sessions`: session_id, user_id, token, expires_at, created_at

2. **Social Authentication Providers**
   - **Google OAuth 2.0**
     - Use Google Cloud Console to create OAuth client
     - Required scopes: profile, email
     - Implement authorization code flow
   - **Facebook Login**
     - Use Facebook Developer Portal for app setup
     - Required permissions: public_profile, email
     - Implement OAuth 2.0 flow
   - **Amazon (Login with Amazon)**
     - Use Amazon Developer Console
     - Required scopes: profile, postal_code
     - Implement OAuth 2.0 flow

3. **JWT Token Management**
   - Generate access tokens (short-lived: 15 minutes)
   - Generate refresh tokens (long-lived: 7 days)
   - Secure token storage using environment variables
   - Token rotation on refresh

4. **Backend Dependencies**
   ```
   fastapi
   python-jose[cryptography]  # JWT handling
   passlib[bcrypt]            # Password hashing (if adding email/password)
   python-multipart
   authlib                    # OAuth client library
   boto3                      # AWS DynamoDB/RDS access
   pydantic-settings          # Configuration management
   ```

5. **API Endpoints**
   - `POST /auth/login/{provider}` - Initiate OAuth flow
   - `GET /auth/callback/{provider}` - Handle OAuth callback
   - `POST /auth/refresh` - Refresh access token
   - `POST /auth/logout` - Invalidate session
   - `GET /auth/me` - Get current user info
   - `GET /auth/verify` - Verify token validity

#### 4.3 Frontend Authentication Implementation

1. **Login Screen UI**
   - Clean, modern design with social login buttons
   - Support for Google, Facebook, Amazon login
   - Responsive design (mobile, tablet, desktop)
   - Loading states and error handling
   - Redirect to original requested page after login

2. **Authentication Flow**
   - Redirect to provider's OAuth page
   - Handle callback with authorization code
   - Exchange code for tokens
   - Store tokens securely (httpOnly cookies or secure localStorage)
   - Set up axios/fetch interceptors for authenticated requests

3. **Protected Routes**
   - Wrap components requiring authentication
   - Automatic redirect to login if not authenticated
   - Token refresh on expiry
   - Handle token validation failures

4. **Frontend Dependencies**
   ```json
   {
     "@tanstack/react-query": "^5.x",  // Data fetching & caching
     "axios": "^1.x",                   // HTTP client
     "jwt-decode": "^4.x",              // Decode JWT tokens
     "react-router-dom": "^6.x"        // Routing
   }
   ```

#### 4.4 Security Best Practices

1. **Token Security**
   - Store refresh tokens in httpOnly cookies
   - Use secure flag for cookies in production
   - Implement CSRF protection
   - Set appropriate CORS policies

2. **OAuth Security**
   - Validate state parameter to prevent CSRF
   - Use PKCE (Proof Key for Code Exchange) for public clients
   - Validate redirect URIs strictly
   - Store client secrets in AWS Secrets Manager

3. **API Security**
   - Rate limiting on auth endpoints
   - Validate JWT signatures
   - Check token expiration
   - Implement token blacklisting for logout

#### 4.5 AWS Deployment (Authentication Services)

1. **DynamoDB Setup (Free Tier)**
   - Create `users` table (partition key: user_id)
   - Create `sessions` table (partition key: session_id, TTL: expires_at)
   - Enable auto-scaling for production
   - Free tier: 25GB storage + 25 WCU + 25 RCU

2. **AWS Secrets Manager**
   - Store OAuth client secrets
   - Store JWT signing key
   - Store database credentials
   - Free tier: 30-day trial, then ~$0.40/secret/month

3. **Lambda Functions**
   - Update existing Lambda to include auth routes
   - Or create separate Lambda for auth service
   - Configure environment variables for secrets

4. **API Gateway**
   - Add Lambda authorizer for protected routes
   - Configure CORS for auth endpoints
   - Set up custom domain (optional)

#### 4.6 Module Integration Guide

**For This Project:**
1. Install auth module dependencies
2. Import auth routes into main FastAPI app
3. Wrap protected API endpoints with auth middleware
4. Add AuthContext provider to frontend App.tsx
5. Wrap presentation routes with ProtectedRoute component
6. Configure OAuth provider credentials

**For Other Projects:**
1. Copy `auth-module/` directory to new project
2. Install dependencies from requirements.txt/package.json
3. Update `auth_config.py` with project-specific settings
4. Follow integration guide in module README
5. Customize login UI to match project branding

#### 4.7 Configuration Management

**Environment Variables:**
```bash
# OAuth Providers
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/callback/google

FACEBOOK_APP_ID=xxx
FACEBOOK_APP_SECRET=xxx
FACEBOOK_REDIRECT_URI=https://yourdomain.com/auth/callback/facebook

AMAZON_CLIENT_ID=xxx
AMAZON_CLIENT_SECRET=xxx
AMAZON_REDIRECT_URI=https://yourdomain.com/auth/callback/amazon

# JWT Configuration
JWT_SECRET_KEY=xxx  # Generate with: openssl rand -hex 32
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
DYNAMODB_REGION=us-east-1
DYNAMODB_USERS_TABLE=iut02-users
DYNAMODB_SESSIONS_TABLE=iut02-sessions

# Frontend
REACT_APP_API_URL=https://your-api-gateway-url
REACT_APP_AUTH_REDIRECT_URL=https://yourdomain.com
```

#### 4.8 Testing Strategy

1. **Unit Tests**
   - Test JWT token generation/validation
   - Test OAuth flow handlers
   - Test middleware authentication logic

2. **Integration Tests**
   - Test complete OAuth flows with providers
   - Test token refresh mechanism
   - Test protected route access

3. **E2E Tests**
   - Test login flow from UI to API
   - Test session persistence
   - Test logout and token invalidation

#### 4.9 Cost Analysis (Authentication)

**Additional Monthly Costs:**

**First 12 Months:**
- DynamoDB: $0.00 (under 25GB + 25 WCU/RCU free tier)
- Lambda (auth): $0.00 (included in existing 1M requests)
- AWS Secrets Manager: $0.00 (30-day trial, then ~$0.40/month)
- **Total: ~$0.40/month after trial** ✅

**After 12 Months (Low Traffic):**
- DynamoDB: $0.00 (always free tier)
- Lambda: $0.00 (included in free tier)
- Secrets Manager: ~$1.60/month (4 secrets)
- **Total: ~$1.60/month** ✅

#### 4.10 Implementation Checklist

**Backend Tasks:**
- [ ] Set up DynamoDB tables for users and sessions
- [ ] Create auth module structure with models and schemas
- [ ] Implement OAuth handlers for Google, Facebook, Amazon
- [ ] Implement JWT token generation and validation
- [ ] Create auth routes and middleware
- [ ] Store OAuth secrets in AWS Secrets Manager
- [ ] Add auth routes to main FastAPI application
- [ ] Test OAuth flows with each provider
- [ ] Deploy updated Lambda function

**Frontend Tasks:**
- [ ] Create auth module structure
- [ ] Design and build login screen UI
- [ ] Implement AuthContext and useAuth hook
- [ ] Implement social login buttons and flows
- [ ] Create ProtectedRoute component
- [ ] Add token storage and retrieval service
- [ ] Set up API interceptors for authentication
- [ ] Integrate auth module into main application
- [ ] Test complete authentication flow
- [ ] Deploy frontend with authentication

**Documentation:**
- [ ] Write module integration guide
- [ ] Document OAuth provider setup steps
- [ ] Create configuration examples
- [ ] Write security best practices guide
- [ ] Document troubleshooting common issues

## Phase 4: Completion Summary ✅

**Status: COMPLETE** (January 2026)

Phase 4 authentication system has been fully implemented and tested.

### What Was Built

#### Backend (`backend/auth/`)
- **OAuth 2.0 Providers**: Google, Facebook, Amazon Login
- **JWT Token System**: Access tokens (15 min), Refresh tokens (7 days)
- **Database Support**: SQLite (local dev), DynamoDB (AWS production)
- **API Endpoints**:
  - `GET /auth/login/{provider}` - Initiate OAuth
  - `GET /auth/callback/{provider}` - Handle callback
  - `POST /auth/refresh` - Refresh tokens
  - `POST /auth/logout` - Invalidate session
  - `GET /auth/me` - Current user info
  - `GET /auth/providers` - List configured providers

#### Frontend (`frontend/auth/`)
- **LoginScreen** - Social login UI with provider buttons
- **AuthContext** - Global auth state provider
- **useAuth hook** - Easy auth access in components
- **Protected pages** - Home and profile require authentication
- **OAuth callback handler** - Processes provider redirects

#### Key Features
- ✅ One-click social login
- ✅ User profile page with avatar dropdown
- ✅ Automatic token refresh
- ✅ Persistent sessions
- ✅ CSRF protection
- ✅ Modular, reusable code
- ✅ Free tier AWS compatible

### Related Documentation
- `PHASE4_COMPLETE.md` - Full implementation details
- `PHASE4_QUICKSTART.md` - 5-minute setup guide
- `PHASE4_SETUP.md` - Complete setup and AWS deployment

---

## Phase 5: Dynamic Charity Fund Management

**Status: COMPLETE** ✅ (January 2026)

**Strategy**: Build a dynamic fund management system that allows multiple charity projects with role-based access, while maintaining backward compatibility with Phase 2 Excel-based data.

### 5.1 Database Schema & Migration

Phase 5 introduces a structured database to manage multiple charity projects and contributions.

**Database Options:**
- **Local Development**: SQLite for local testing
- **AWS Production**: Amazon DynamoDB (Free Tier: 25GB storage)

**Tables to Implement:**

```
Projects Table:
├── project_id (PK)
├── name
├── description
├── target_amount
├── target_currency (BDT/USD/CAD/AUD/EUR)
├── status (Active/Archived)
├── created_by
└── created_at

Contributions Table:
├── contribution_id (PK)
├── project_id (FK)
├── contributor_name              ← Name of person contributing
├── user_id (FK, nullable)        ← If logged-in user made contribution
├── amount
├── currency (BDT/USD/CAD/AUD/EUR)
├── payment_mode (Mobile Money/Cash/Offline/Stripe/PayPal)
├── payment_status (Pending/Completed/Failed)
├── entry_type (Manual/Dynamic)
├── collection_notes              ← Optional notes about the contribution
├── entered_by (FK)               ← Fund Admin who entered (for manual)
├── contribution_date             ← Actual date of contribution
└── created_at                    ← Record creation timestamp

Contributor Totals View (Aggregated):
├── contributor_name
├── project_id
├── total_contributions           ← Sum of all contributions by this person
├── contribution_count            ← Number of times contributed
└── last_contribution_date

Users Table (Extended from Phase 4):
├── user_id (PK)
├── email
├── username
├── provider
├── provider_id
├── role (super_admin/admin/fund_admin/user)  ← NEW
├── assigned_projects[]           ← NEW (for Fund Admins, can have multiple)
├── created_at
└── last_login

App Settings Table (Global Configuration):
├── setting_key (PK)
├── setting_value
├── updated_by
└── updated_at

Example settings:
├── data_source_mode: "excel" | "dynamic"  ← Admin toggles this globally
├── default_currency: "BDT"
└── email_notifications_enabled: true
```

**Supported Currencies:**
- BDT (Bangladeshi Taka) — Primary
- USD (US Dollar)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)
- EUR (Euro)

**Payment Modes:**
- Mobile Money (bKash, Nagad, etc.)
- Cash
- Offline (Bank Transfer, Check)
- Stripe (Online)
- PayPal (Future)

### 5.2 Advanced RBAC Integration

Building on Phase 4's authentication system with role-based access control:

#### Role Hierarchy

| Role | Permissions |
|------|-------------|
| **Super Admin** | Hardcoded (`khahmed.rashed@gmail.com`). Can promote users to Admin/Fund Admin, all Admin permissions |
| **Admin** | Full authority: add/delete/archive projects, manage all properties, assign Fund Admins, toggle data source mode |
| **Fund Admin** | Restricted access to assigned project(s) only, enter manual contribution data. Can manage multiple projects |
| **Regular User** | Browse ongoing funds, view statistics/graphs after OAuth login |

#### Super Admin Setup
```python
# backend/auth/auth_config.py
SUPER_ADMIN_EMAIL = "khahmed.rashed@gmail.com"

# On login, check if user email matches and auto-assign super_admin role
def check_super_admin(user_email: str) -> bool:
    return user_email == SUPER_ADMIN_EMAIL
```

#### Role Assignment Flow
1. User registers via OAuth → assigned `user` role by default
2. Super Admin can promote any user to `admin` or `fund_admin`
3. Admin can assign Fund Admin to specific projects
4. Fund Admin receives email notification when assigned to a project

### 5.3 Frontend Implementation: Dual-Source Toggle

To maintain backward compatibility with Phase 2 (Excel) while introducing Phase 5 (Database):

**Data Source Toggle Logic:**
- Located in **Admin Dashboard only** (not user-accessible)
- Stored in `app_settings` table, fetched on app load
- **Global setting** — affects all users when Admin toggles

| Mode | Description | Data Source | UI |
|------|-------------|-------------|----|
| **Excel Mode** | Legacy mode | GitHub-hosted Excel file | Current homepage unchanged |
| **Dynamic Mode** | Real-time mode | DynamoDB/SQLite tables | New fund management UI |

**Excel → Database Import:**
When Admin switches from Excel to Dynamic mode for the first time:
1. Backend reads current Excel file
2. Parses contribution data
3. Creates a default project (e.g., "Blanket Distribution 2026")
4. Imports all Excel rows as contributions
5. Maps Excel columns to database fields

```python
# Import mapping (Excel → Database)
Excel Column          →  Database Field
"Name"                →  contributor_name
"Payment Mode"        →  payment_mode
"Amount"              →  amount
"Date"                →  contribution_date
"Notes" (if exists)   →  collection_notes
```

**UI Components (Dynamic Mode Only):**
- **Admin Dashboard**: Project CRUD, user role management, data source toggle
- **Collection Summary Page**: Total funds raised across all projects
- **Contribution Entry Form**: For Fund Admins to enter manual contributions
- **Make a Contribution Page**: For users to donate via Stripe
- **Statistics Page**: Charts similar to Excel mode (reuse existing chart components)

### 5.4 Backend API Enhancements

New FastAPI endpoints for fund management:

```
Project Management (Admin/Super Admin only):
├── POST   /api/projects                    - Create new project
├── GET    /api/projects                    - List all projects (all users)
├── GET    /api/projects/{id}               - Get project details
├── PATCH  /api/projects/{id}               - Edit/archive project
└── DELETE /api/projects/{id}               - Delete project

Contribution Management:
├── POST   /api/contributions               - Manual entry (Fund Admin) or Stripe webhook (Dynamic)
├── GET    /api/contributions/{project_id}  - List contributions for project
├── GET    /api/contributions/by-contributor/{project_id} - Grouped by contributor with totals
├── PATCH  /api/contributions/{id}          - Edit contribution (Fund Admin)
└── DELETE /api/contributions/{id}          - Delete contribution (Admin)

Statistics:
├── GET    /api/stats/{project_id}          - Project stats (total raised, progress, etc.)
├── GET    /api/stats/{project_id}/by-date  - Contributions over time
├── GET    /api/stats/{project_id}/by-mode  - Breakdown by payment mode
└── GET    /api/stats/summary               - All projects summary

User Role Management (Super Admin/Admin):
├── GET    /api/users                       - List all users (Admin)
├── PATCH  /api/users/{id}/role             - Update user role (Super Admin only)
├── POST   /api/users/{id}/assign-project   - Assign Fund Admin to project
└── DELETE /api/users/{id}/unassign-project - Remove Fund Admin from project

App Settings (Admin only):
├── GET    /api/settings                    - Get current settings
├── PATCH  /api/settings                    - Update settings (e.g., data_source_mode)
└── POST   /api/settings/import-excel       - Import Excel data to database

Payment (Stripe):
├── POST   /api/payments/create-intent      - Create Stripe PaymentIntent
├── POST   /api/payments/webhook            - Stripe webhook handler
└── GET    /api/payments/{contribution_id}  - Get payment status

Email Notifications:
└── (Internal) Send email when Fund Admin assigned to project
```

#### Manual Contribution Entry (Fund Admin)
```json
POST /api/contributions
{
  "project_id": "proj_123",
  "contributor_name": "John Doe",
  "amount": 5000,
  "currency": "BDT",
  "payment_mode": "Mobile Money",
  "contribution_date": "2026-01-31",
  "collection_notes": "Collected via bKash",
  "entry_type": "manual"
}
```

#### Dynamic Contribution (Stripe)
```json
// Created automatically via Stripe webhook
{
  "project_id": "proj_123",
  "contributor_name": "Jane Smith",
  "user_id": "user_456",
  "amount": 50,
  "currency": "USD",
  "payment_mode": "Stripe",
  "payment_status": "completed",
  "entry_type": "dynamic",
  "stripe_payment_id": "pi_xxx"
}
```

### 5.5 Environment Configuration (Dev & AWS)

#### Local Development Environment (macOS)

**SQLite Setup on Mac:**
- SQLite comes **pre-installed** on macOS — no installation needed
- Database files stored in `backend/` directory
- View/debug with built-in `sqlite3` CLI or [DB Browser for SQLite](https://sqlitebrowser.org/)

```bash
# Verify SQLite is available (should be pre-installed)
sqlite3 --version

# View database contents (after running backend)
sqlite3 backend/auth.db ".tables"
sqlite3 backend/fund_management.db ".tables"
```

**Database Files:**
```
backend/
├── auth.db              # Phase 4: users, sessions (existing)
└── fund_management.db   # Phase 5: projects, contributions (new)
```

**Environment Configuration:**
```bash
# backend/.env (Local/Mac)
ENVIRONMENT=local
DATABASE_TYPE=sqlite

# SQLite paths (relative to backend/)
SQLITE_AUTH_DB=./auth.db
SQLITE_FUND_DB=./fund_management.db

# Data source toggle
DATA_SOURCE_MODE=dynamic  # or "excel" for Phase 2 mode

# Payment (Sandbox)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**Local Stack (Mac):**
- SQLite for all tables (pre-installed on macOS, zero setup)
- Database files auto-created on first run
- Same Python codebase, environment-driven behavior
- Stripe test mode for payment testing
- Debug with `sqlite3` CLI or DB Browser app

**Useful SQLite Commands (Mac Terminal):**
```bash
# List all tables
sqlite3 backend/fund_management.db ".tables"

# View table schema
sqlite3 backend/fund_management.db ".schema projects"

# Query data
sqlite3 backend/fund_management.db "SELECT * FROM projects;"

# Export to CSV
sqlite3 -header -csv backend/fund_management.db "SELECT * FROM contributions;" > contributions.csv

# Reset database (delete and restart backend to recreate)
rm backend/fund_management.db
```

#### AWS Production Environment

```bash
# Lambda Environment Variables
ENVIRONMENT=aws
DATABASE_TYPE=dynamodb
DYNAMODB_REGION=us-east-1

# DynamoDB Tables
DYNAMODB_USERS_TABLE=iut02-users
DYNAMODB_SESSIONS_TABLE=iut02-sessions
DYNAMODB_PROJECTS_TABLE=iut02-projects
DYNAMODB_CONTRIBUTIONS_TABLE=iut02-contributions

# Data source toggle
DATA_SOURCE_MODE=dynamic

# Payment (Production)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**AWS Stack:**
- DynamoDB for all tables (serverless, auto-scaling)
- Lambda for backend (serverless, pay-per-use)
- Amplify for frontend (CDN, SSL included)
- Secrets Manager for credentials

#### Deployment Comparison

| Component | Local Development | AWS Production |
|-----------|-------------------|----------------|
| Backend | `python app.py` | AWS Lambda |
| Database | SQLite (`fund_management.db`) | DynamoDB (4 tables) |
| Frontend | `npm run dev` | AWS Amplify |
| Auth | SQLite (`auth.db`) | DynamoDB |
| Secrets | `.env` file | AWS Secrets Manager |
| Excel Data | Local file | GitHub Raw URL |
| Payment | Stripe Test Mode | Stripe Live Mode |

### 5.6 Cost Analysis (1,000-5,000 Users)

**Target Scale:**
- 1,000-5,000 registered users
- ~10-20 active charity projects
- ~500-2,000 contributions/month
- ~50,000-200,000 API requests/month

#### Monthly Cost Breakdown

| Service | Free Tier Limit | Your Usage (Est.) | Monthly Cost |
|---------|-----------------|-------------------|-------------|
| **Lambda** | 1M requests + 400K GB-sec | ~200K requests | **$0.00** |
| **API Gateway** | 1M requests (12 mo) | ~200K requests | **$0.00-$0.20** |
| **DynamoDB** | 25GB + 25 WCU/RCU | ~1GB, low WCU | **$0.00** |
| **Amplify** | 1000 build min + 15GB | ~5 builds, 5GB | **$0.00** |
| **Secrets Manager** | - | 5 secrets | **$2.00** |
| **Stripe** | No monthly fee | Per transaction | **2.9% + $0.30/txn** |
| **GitHub** | Unlimited public | Excel + Images | **$0.00** |

#### Total Estimated Costs

| Scenario | Users | Requests/mo | AWS Cost | Stripe Fees* |
|----------|-------|-------------|----------|-------------|
| **Low** | 1,000 | 50,000 | **$2.00/mo** | ~$3-5/mo |
| **Medium** | 3,000 | 150,000 | **$2.20/mo** | ~$15-30/mo |
| **High** | 5,000 | 200,000 | **$2.50/mo** | ~$30-60/mo |

*Stripe fees depend on donation volume (2.9% + $0.30 per transaction)

#### Why This Is Cost-Effective

1. **DynamoDB On-Demand** — Pay only for reads/writes, no idle costs
2. **Lambda** — No servers to manage, scales to zero when idle
3. **Free Tier Coverage** — 1K-5K users fits well within AWS free tier
4. **No RDS** — Avoiding managed databases saves ~$15-30/month
5. **GitHub for Static Data** — Free storage for Excel/images

#### Cost Optimization Tips

- Use DynamoDB **On-Demand** mode (not provisioned) for unpredictable traffic
- Enable **DAX caching** only if read-heavy (adds ~$0.04/hour)
- Keep Lambda memory at **256MB** (sufficient for API workloads)
- Use **HTTP API** (not REST API) for API Gateway — 70% cheaper

### 5.7 Integration with Phase 4 (Authentication)

All new charity management routes will:
- Use `ProtectedRoute` component (frontend)
- Use auth middleware (backend)
- Verify JWT token and user role before access
- Enforce RBAC on sensitive operations

**RBAC Middleware Example:**
```python
# backend/middleware/rbac_middleware.py
from functools import wraps
from fastapi import HTTPException

def require_role(*allowed_roles):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user=None, **kwargs):
            if current_user["role"] not in allowed_roles:
                raise HTTPException(status_code=403, detail="Insufficient permissions")
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

# Usage:
@app.post("/api/projects")
@require_role("super_admin", "admin")
async def create_project(project: ProjectCreate, current_user: dict = Depends(get_current_user)):
    ...
```

### 5.8 Stripe Integration

**Why Stripe:**
- Simple API, excellent documentation
- Supports international payments (USD, EUR, CAD, AUD)
- Test mode for development
- Webhook support for payment status updates
- Future: Can add more payment methods (Apple Pay, Google Pay)

**Stripe Flow:**
```
1. User clicks "Donate" on project page
2. Frontend calls POST /api/payments/create-intent
3. Backend creates Stripe PaymentIntent, returns client_secret
4. Frontend uses Stripe.js to collect card details
5. User submits payment
6. Stripe processes payment
7. Stripe sends webhook to POST /api/payments/webhook
8. Backend creates contribution record with payment_status=completed
9. Frontend shows success message
```

**Environment Variables:**
```bash
# Stripe (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_xxx          # Backend
STRIPE_PUBLISHABLE_KEY=pk_test_xxx     # Frontend
STRIPE_WEBHOOK_SECRET=whsec_xxx        # For webhook verification
```

**Frontend Dependencies:**
```bash
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

**Backend Dependencies:**
```bash
pip install stripe
```

**BDT Currency Note:**
Stripe does not directly support BDT. Options:
1. Accept donations in USD/EUR and note BDT equivalent
2. Use a Bangladesh payment gateway (bKash, SSLCommerz) in Phase 6
3. For now, manual entries handle BDT cash/Mobile Money donations

### 5.9 Email Notifications

**When to Send:**
- Fund Admin assigned to project → Email to Fund Admin
- (Future) Contribution received → Email to contributor
- (Future) Project target reached → Email to Admin

**Email Service Options:**
- **AWS SES** (Free tier: 62,000 emails/month from Lambda)
- **SendGrid** (Free tier: 100 emails/day)
- For now: Can skip email and add in Phase 6

### 5.10 Implementation Checklist

**Database Tasks:**
- [ ] Create Projects table schema (SQLite + DynamoDB)
- [ ] Create Contributions table schema with all fields
- [ ] Create App Settings table for global config
- [ ] Extend Users table with role and assigned_projects
- [ ] Add Super Admin auto-detection on login
- [ ] Create `setup_dynamodb_phase5.sh` script
- [ ] Build Excel → Database import function

**Backend Tasks:**
- [ ] Implement RBAC middleware (require_role decorator)
- [ ] Implement project CRUD endpoints
- [ ] Implement contribution endpoints (manual + Stripe)
- [ ] Implement contributor totals aggregation endpoint
- [ ] Implement statistics endpoints (by-date, by-mode)
- [ ] Create user role management endpoints (Super Admin)
- [ ] Implement app settings endpoints
- [ ] Integrate Stripe PaymentIntent API
- [ ] Implement Stripe webhook handler
- [ ] Add Excel import endpoint

**Frontend Tasks:**
- [ ] Build Admin Dashboard page
  - [ ] Project list with CRUD actions
  - [ ] User management table
  - [ ] Data source toggle switch
  - [ ] Excel import button
- [ ] Build Fund Admin Dashboard
  - [ ] Assigned projects list
  - [ ] Contribution entry form
  - [ ] Contributions list with edit/delete
- [ ] Build Donation page (public)
  - [ ] Project selection
  - [ ] Stripe payment form
  - [ ] Currency selector (USD/EUR/CAD/AUD)
- [ ] Build Statistics page (reuse existing charts)
- [ ] Update AuthContext with role and dataSourceMode
- [ ] Add role-based navigation (show/hide Admin menu)

**Stripe Integration:**
- [ ] Create Stripe account (test mode)
- [ ] Implement create-intent endpoint
- [ ] Set up Stripe webhook endpoint
- [ ] Build payment form with Stripe Elements
- [ ] Handle payment success/failure states
- [ ] Test with Stripe test cards

**Testing:**
- [ ] Test Super Admin auto-detection (your email)
- [ ] Test role promotion (user → admin → fund_admin)
- [ ] Test Fund Admin project assignment
- [ ] Test manual contribution entry
- [ ] Test Stripe payment flow (sandbox)
- [ ] Test Excel → Database import
- [ ] Test data source toggle
- [ ] Test contributor totals calculation

---

## Next Steps

### Completed Phases
1. ~~Examine Excel file structure~~ ✅
2. ~~Set up project structure~~ ✅
3. ~~Build backend API~~ ✅
4. ~~Build frontend UI~~ ✅
5. ~~Test locally~~ ✅
6. ~~Set up GitHub repository for data~~ ✅
7. ~~Test with online data source~~ ✅
8. ~~Prepare for AWS deployment~~ ✅
9. ~~**[Phase 4]** Design and implement modular authentication system~~ ✅
10. ~~**[Phase 4]** Integrate authentication with existing application~~ ✅
11. ~~**[Phase 4]** Test and deploy authentication module~~ ✅

### Phase 5 Tasks (Complete) ✅
12. ~~**[Phase 5]** Database: Create Projects, Contributions, App Settings tables~~ ✅
13. ~~**[Phase 5]** Backend: RBAC middleware + Super Admin detection~~ ✅
14. ~~**[Phase 5]** Backend: Project & Contribution CRUD APIs~~ ✅
15. ~~**[Phase 5]** Backend: Stripe integration (PaymentIntent + Webhook)~~ ✅
16. ~~**[Phase 5]** Backend: Excel → Database import~~ ✅
17. ~~**[Phase 5]** Frontend: Admin Dashboard (projects, users, settings)~~ ✅
18. ~~**[Phase 5]** Frontend: Fund Admin Dashboard (contribution entry)~~ ✅
19. ~~**[Phase 5]** Frontend: Donation page with Stripe~~ ✅
20. ~~**[Phase 5]** Frontend: Statistics page (reuse charts)~~ ✅
21. ~~**[Phase 5]** Testing: Full E2E test of all roles and flows~~ ✅
22. **[Phase 5]** Deploy to AWS (DynamoDB tables, Lambda update) - Pending

### Phase 6-8 (Complete) ✅
23. ~~**[Phase 6]** Media Management System~~ ✅
24. ~~**[Phase 7]** Distribution Management System~~ ✅
25. ~~**[Phase 8]** Project Import & Advanced Features~~ ✅

### Phase 9 Tasks (Complete) ✅
26. ~~**[Phase 9]** Help Center with comprehensive documentation~~ ✅
27. ~~**[Phase 9]** Navigation improvements (user dropdown, Help link)~~ ✅
28. ~~**[Phase 9]** Login page redesign with dark theme~~ ✅
29. ~~**[Phase 9]** Dashboard wave SVG fix for responsive layouts~~ ✅

### Phase 10 Tasks (In Progress) 🚀
30. **[Phase 10]** Create DynamoDB tables for fund management
31. **[Phase 10]** Implement DynamoDBFundDatabase class
32. **[Phase 10]** Create S3 bucket for media storage
33. **[Phase 10]** Update Lambda deployment script
34. **[Phase 10]** Deploy Lambda with new modules
35. **[Phase 10]** Create/Update API Gateway
36. **[Phase 10]** Deploy frontend to Amplify
37. **[Phase 10]** Update OAuth provider settings
38. **[Phase 10]** End-to-end testing

---

## Phase 5: RBAC Implementation Decisions

During Phase 5 implementation, the following role-based access control decisions were made:

### Role Definitions (Final)

| Role | Description | Access Level |
|------|-------------|-------------|
| **super_admin** | Single hardcoded user (khahmed.rashed@gmail.com) | Full system access |
| **admin** | Promoted by super_admin | Most admin features except user role changes |
| **fund_admin** | Assigned to specific projects | Manage contributions for assigned projects only |
| **user** | Default role for OAuth users | View-only access to public data |

### Permission Matrix (Implemented)

| Feature | super_admin | admin | fund_admin | user |
|---------|-------------|-------|------------|------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Project Details | ✅ | ✅ | ✅ | ✅ |
| View Fund Admins List | ✅ | ✅ | ✅ | ✅ |
| Create/Edit/Delete Projects | ✅ | ✅ | ❌ | ❌ |
| Add/Remove Fund Admins | ✅ | ✅ | ❌ | ❌ |
| Enter Contributions | ✅ | ✅ | ✅ (assigned only) | ❌ |
| Edit/Delete Contributions | ✅ | ✅ | ✅ (assigned only) | ❌ |
| View Admin Panel | ✅ | ✅ | ❌ | ❌ |
| Access Settings Tab | ✅ | ❌ | ❌ | ❌ |
| Change User Roles | ✅ | ❌ | ❌ | ❌ |
| Toggle Data Source Mode | ✅ | ✅ | ❌ | ❌ |
| Manage All Users | ✅ | ✅ | ❌ | ❌ |
| Preview as Other Roles | ✅ | ✅ | ❌ | ❌ |

### Key Implementation Decisions

1. **Super Admin Auto-Detection**
   - On OAuth login, if email matches `SUPER_ADMIN_EMAIL`, role is automatically set to `super_admin`
   - Implemented in `backend/auth/routes.py` callback handler

2. **Fund Admin Project Assignment**
   - Fund admins can be assigned to multiple projects
   - Stored as JSON array in `assigned_projects` column
   - Only super_admin and admin can assign/unassign fund admins

3. **Default Fund Admins**
   - super_admin and admin are implicit fund admins of ALL projects
   - They are NOT shown in the Fund Admins list (filtered out in frontend)
   - Only explicitly assigned fund_admin users appear in Fund Admins section

4. **Settings Tab Restriction**
   - Settings tab in Admin panel is ONLY visible to super_admin
   - Admin role cannot access app settings (data source mode, etc.)

5. **Preview Mode**
   - super_admin and admin can preview the app as any lower role
   - Preview mode uses `role` for permission checks, `actualRole` preserved for restoration
   - Fund admin cannot see "Add Fund Admin" button even when super_admin uses preview mode

6. **Fund Admin Visibility**
   - Fund Admins section is visible to ALL users (transparency)
   - But only admin/super_admin can add/remove fund admins
   - Displayed on both Fund Management page and individual Project Detail page

7. **Navigation Based on Role**
   - Admin/Fund Admin nav items only shown to appropriate roles
   - Fund Management shows for fund_admin, admin, super_admin
   - Admin Panel shows for admin, super_admin only

### API Endpoints RBAC

```
/api/users                    - super_admin, admin only
/api/users/{id}/role          - super_admin only
/api/users/{id}/assign-project    - super_admin, admin only
/api/users/{id}/unassign-project  - super_admin, admin only
/api/projects (POST/PATCH/DELETE) - super_admin, admin only
/api/projects (GET)           - all authenticated users
/api/contributions (POST)     - super_admin, admin, fund_admin (assigned)
/api/contributions (PATCH/DELETE) - super_admin, admin, fund_admin (assigned)
/api/settings                 - super_admin only
```

---

## Phase 6: Media Management System

**Status: COMPLETE** ✅ (January 2026)

**Objective**: Allow projects to have associated media content (images, videos, audio) for richer storytelling and impact demonstration.

### 6.1 Architecture Overview

```
Local Development:
┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend       │
│   Upload Form   │     │   FastAPI       │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Local Storage  │
                        │  uploads/       │
                        │  ├── images/    │
                        │  ├── videos/    │
                        │  └── audio/     │
                        └─────────────────┘

AWS Production:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API Gateway   │────▶│   Lambda        │
│                 │     │                 │     │   (Presigned)   │
└────────┬────────┘     └─────────────────┘     └────────┬────────┘
         │                                               │
         │ Direct Upload                                 │ Generate URL
         ▼                                               ▼
┌─────────────────┐                             ┌─────────────────┐
│   S3 Bucket     │◀────────────────────────────│   Presigned     │
│   iut02-media/  │                             │   Upload URL    │
│   ├── images/   │                             └─────────────────┘
│   ├── videos/   │
│   └── audio/    │         ┌─────────────────┐
└────────┬────────┘         │   CloudFront    │
         └─────────────────▶│   CDN           │────▶ Users
                            └─────────────────┘
```

### 6.2 Database Schema

```
Media Table:
├── media_id (PK)           - UUID
├── project_id (FK)         - Associated project
├── media_type              - image | video | audio
├── file_name               - Original filename
├── file_key                - Storage key (S3 key or local path)
├── file_size               - Size in bytes
├── mime_type               - e.g., image/jpeg, video/mp4
├── caption                 - Optional description
├── display_order           - For ordering in gallery
├── uploaded_by (FK)        - User who uploaded
├── created_at
└── updated_at
```

### 6.3 Supported File Types

| Type | Extensions | Max Size | Notes |
|------|------------|----------|-------|
| **Images** | jpg, jpeg, png, gif, webp | 10 MB | Auto-compress on upload |
| **Videos** | mp4, webm, mov | 100 MB | Consider transcoding for web |
| **Audio** | mp3, wav, ogg | 20 MB | For voice messages, audio stories |

### 6.4 API Endpoints

```
Media Management:
├── POST   /api/media/upload-url      - Get presigned upload URL (AWS)
├── POST   /api/media                  - Upload file directly (Local)
├── GET    /api/media/{project_id}     - List media for project
├── GET    /api/media/file/{media_id}  - Get media file/URL
├── PATCH  /api/media/{media_id}       - Update caption, order
├── DELETE /api/media/{media_id}       - Delete media
└── POST   /api/media/reorder          - Bulk update display order
```

### 6.5 Local Development Implementation

**Storage Location:**
```
backend/
├── uploads/
│   ├── images/
│   │   └── {project_id}/
│   │       └── {media_id}_{filename}
│   ├── videos/
│   │   └── {project_id}/
│   │       └── {media_id}_{filename}
│   └── audio/
│       └── {project_id}/
│           └── {media_id}_{filename}
```

**Backend (Local Mode):**
```python
from fastapi import UploadFile
import shutil

@app.post("/api/media")
async def upload_media(
    project_id: str,
    file: UploadFile,
    caption: str = None,
    current_user: dict = Depends(get_current_user)
):
    # Validate file type and size
    # Generate unique filename
    # Save to uploads/{type}/{project_id}/
    # Create media record in database
    # Return media metadata
```

**Serving Files:**
```python
from fastapi.staticfiles import StaticFiles

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

### 6.6 AWS Production Implementation

**S3 Bucket Structure:**
```
iut02-media/
├── images/
│   └── {project_id}/
│       └── {media_id}_{filename}
├── videos/
│   └── {project_id}/
│       └── {media_id}_{filename}
└── audio/
    └── {project_id}/
        └── {media_id}_{filename}
```

**Presigned URL Upload (Cost-Effective):**
```python
import boto3

@app.post("/api/media/upload-url")
async def get_upload_url(
    project_id: str,
    file_name: str,
    media_type: str,
    current_user: dict = Depends(get_current_user)
):
    s3 = boto3.client('s3')
    media_id = str(uuid.uuid4())
    key = f"{media_type}s/{project_id}/{media_id}_{file_name}"
    
    presigned_url = s3.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': 'iut02-media',
            'Key': key,
            'ContentType': get_content_type(file_name)
        },
        ExpiresIn=3600  # 1 hour
    )
    
    return {
        "upload_url": presigned_url,
        "media_id": media_id,
        "key": key
    }
```

**CloudFront CDN:**
- Create CloudFront distribution pointing to S3 bucket
- Enable caching for media files (long TTL)
- Use signed URLs for private content (optional)

### 6.7 Frontend Components

```
frontend/components/media/
├── MediaUploader.tsx        - Drag-drop upload component
├── MediaGallery.tsx         - Display project media
├── ImageViewer.tsx          - Lightbox for images
├── VideoPlayer.tsx          - Video player component
├── AudioPlayer.tsx          - Audio player component
└── MediaManager.tsx         - Admin media management
```

**MediaUploader Component:**
- Drag-and-drop support
- Progress indicator
- File type validation
- Preview before upload
- Multiple file upload

### 6.8 Cost Analysis

**S3 Storage Costs:**
| Storage | Size | Monthly Cost |
|---------|------|--------------|
| 1 GB | Small project | ~$0.02 |
| 10 GB | Medium usage | ~$0.23 |
| 50 GB | Heavy usage | ~$1.15 |

**CloudFront Transfer:**
| Data Out | Monthly Cost |
|----------|-------------|
| First 1 TB | $0.085/GB |
| 10 GB | ~$0.85 |
| 50 GB | ~$4.25 |

**Cost Optimization:**
1. **S3 Intelligent-Tiering** - Auto-moves infrequently accessed media to cheaper storage
2. **CloudFront Caching** - Reduces S3 requests, improves load times
3. **Presigned URLs** - Direct browser-to-S3 uploads (no Lambda bandwidth)
4. **Image Compression** - Reduce file sizes before storage
5. **Video Compression** - Use H.264/H.265 with reasonable bitrate
6. **File Size Limits** - Enforce max sizes to prevent abuse

**Estimated Monthly Cost (Moderate Usage):**
- S3 Storage (10GB): ~$0.23
- CloudFront (20GB transfer): ~$1.70
- S3 Requests: ~$0.05
- **Total: ~$2/month**

### 6.9 Implementation Checklist

**Backend:** ✅
- [x] Create Media table schema (SQLite + DynamoDB)
- [x] Implement local file upload endpoint
- [ ] Implement presigned URL endpoint (AWS) - Pending AWS deployment
- [x] Implement media CRUD endpoints
- [x] Add file type and size validation
- [ ] Create S3 bucket with proper permissions - Pending AWS deployment
- [ ] Set up CloudFront distribution - Pending AWS deployment
- [x] Add media cleanup on project deletion

**Frontend:** ✅
- [x] Build MediaUploader component
- [x] Build MediaGallery component
- [x] Build ImageViewer lightbox
- [x] Build VideoPlayer component (basic)
- [x] Build AudioPlayer component (basic)
- [x] Add media section to project detail page
- [x] Add media management to Fund Admin dashboard
- [x] Implement drag-and-drop upload

**Testing:** ✅
- [x] Test local file upload/download
- [ ] Test presigned URL upload (AWS) - Pending AWS deployment
- [ ] Test CloudFront delivery - Pending AWS deployment
- [x] Test file type restrictions
- [x] Test file size limits
- [x] Test media deletion

### 6.10 What Was Built

**Backend (`backend/fund/media_routes.py`):**
- `POST /api/media` - Upload media file (multipart form)
- `GET /api/media/project/{project_id}` - List project media with counts
- `GET /api/media/{media_id}` - Get media details
- `GET /api/media/file/{media_id}` - Get actual media file
- `PATCH /api/media/{media_id}` - Update caption/order
- `DELETE /api/media/{media_id}` - Delete media
- `POST /api/media/reorder/{project_id}` - Reorder media items
- `GET /api/media/config/supported` - Get supported file types

**Database (`backend/fund/models.py`):**
- Media table with CRUD operations
- Automatic display_order management
- Media count by type per project

**Frontend Components:**
- `MediaUploader.tsx` - Drag-drop upload with preview, validation, progress
- `MediaGallery.tsx` - Grid display, filter tabs, lightbox, delete support

**File Structure:**
```
backend/
├── uploads/
│   ├── images/{project_id}/{uuid}.ext
│   ├── videos/{project_id}/{uuid}.ext
│   └── audio/{project_id}/{uuid}.ext
├── fund/
│   ├── models.py (Media table)
│   └── media_routes.py
└── migrate_images.py

frontend/
├── components/media/
│   ├── MediaGallery.tsx
│   └── MediaUploader.tsx
├── services/fundApi.ts (Media API)
└── app/
    ├── projects/[id]/page.tsx (Media section)
    └── fund-admin/page.tsx (Media section)
```

**Migration:**
- 8 existing images migrated from `/images/` to Blanket Distribution project

---

---

## Phase 7: Distribution Management System

**Status: COMPLETE** ✅ (January 2026)

**Objective**: Track and manage how collected funds are distributed to beneficiary institutions (mosques, schools, orphanages, etc.).

### 7.1 Database Schema

```
Distributions Table:
├── distribution_id (PK)      - UUID
├── project_id (FK)           - Associated project
├── institution_type          - Mosque | School | Orphanage | Hospital | Other
├── institution_name          - Name of beneficiary institution
├── distributed_amount        - Amount distributed
├── currency                  - BDT | USD | etc.
├── proof_file_key            - S3 key or local path for proof document
├── proof_file_name           - Original filename
├── notes                     - Optional notes about distribution
├── distributed_by (FK)       - User who made the distribution
├── distribution_date         - When distribution occurred
├── created_at
└── updated_at
```

### 7.2 API Endpoints

```
Distribution Management:
├── POST   /api/distributions                    - Create distribution record
├── GET    /api/distributions/project/{project_id} - List distributions for project
├── GET    /api/distributions/{distribution_id}  - Get distribution details
├── PATCH  /api/distributions/{distribution_id}  - Update distribution
├── DELETE /api/distributions/{distribution_id}  - Delete distribution
├── GET    /api/distributions/stats/{project_id} - Get distribution statistics
└── POST   /api/distributions/{distribution_id}/proof - Upload proof document
```

### 7.3 Proof Upload

**Supported File Types:**
- Images: jpg, jpeg, png, gif, webp
- Documents: pdf

**Max File Size:** 10 MB

**Storage Structure:**
```
backend/uploads/distribution_proofs/
└── {distribution_id}_{filename}
```

### 7.4 Permission Matrix

| Feature | super_admin | admin | fund_admin | user |
|---------|-------------|-------|------------|------|
| View Distributions | ✅ | ✅ | ✅ | ✅ |
| Add Distribution | ✅ | ✅ | ✅ (assigned) | ❌ |
| Edit Distribution | ✅ | ✅ | ✅ (assigned) | ❌ |
| Delete Distribution | ✅ | ✅ | ✅ (assigned) | ❌ |
| Upload Proof | ✅ | ✅ | ✅ (assigned) | ❌ |

### 7.5 Frontend Implementation

**Project Detail Page - Distribution Tab:**
- Distribution list with institution type, name, amount, date
- Distribution form for adding new records
- Proof upload with drag-drop support
- Distribution statistics summary
- Lightbox for viewing proof documents

**Components:**
- Distribution tab in `frontend/app/projects/[id]/page.tsx`
- Distribution types in `frontend/services/fundApi.ts`
- `distributionsApi` methods for CRUD operations

### 7.6 Implementation Checklist

**Backend:** ✅
- [x] Create Distributions table schema in models.py
- [x] Implement distribution CRUD endpoints
- [x] Implement proof file upload endpoint
- [x] Add file type and size validation
- [x] Create distribution statistics endpoint

**Frontend:** ✅
- [x] Add Distribution tab to project detail page
- [x] Build distribution form component
- [x] Implement proof upload UI
- [x] Display distribution list with details
- [x] Show distribution statistics

---

## Phase 8: Project Import & Advanced Features

**Status: COMPLETE** ✅ (January 2026)

**Objective**: Allow admins to bulk import projects with contributions from Excel files, and add advanced analytics visualizations.

### 8.1 Project Import Feature

#### Excel Template Format

**Sheet 1: Project Info**
| Column | Description | Required |
|--------|-------------|----------|
| name | Project name | Yes |
| description | Project description | No |
| target_amount | Fundraising goal | No |
| currency | BDT, USD, etc. | Yes (default: BDT) |
| status | active, completed, paused | Yes (default: active) |

**Sheet 2: Contributions**
| Column | Description | Required |
|--------|-------------|----------|
| contributor_name | Donor name | Yes |
| amount | Contribution amount | Yes |
| payment_mode | Bkash, Nagad, Bank Transfer, Cash, Card, Other | Yes |
| payment_status | pending, completed, failed | No (default: completed) |
| contribution_date | Date (YYYY-MM-DD) | No (default: today) |
| notes | Additional notes | No |

**Sheet 3: Instructions**
- Detailed instructions for filling out the template

#### API Endpoints

```
Project Import:
├── GET  /api/projects/import/template       - Download empty template
├── GET  /api/projects/import/template?with_example=true - Download template with sample data
├── POST /api/projects/import/preview        - Preview import without creating
└── POST /api/projects/import                - Execute import
```

#### Template Files

```
backend/templates/
├── project_import_template.xlsx     - Empty template for users
└── project_import_example.xlsx      - Template with 8 sample contributions
```

#### Import Workflow

1. Admin downloads template (empty or with example)
2. Admin fills in project info and contributions
3. Admin uploads file to preview endpoint
4. Backend validates and returns preview with errors
5. Admin reviews preview and clicks Import
6. Backend creates project and all valid contributions
7. Admin redirected to new project page

#### Error Handling

- Invalid file type: Returns error
- Missing required fields: Row skipped, error reported
- Invalid payment mode: Normalized or row skipped
- Invalid date format: Defaults to today

### 8.2 Overview Analytics Tab

**Recharts Visualizations:**

| Chart | Type | Data Source |
|-------|------|-------------|
| Payment Mode Distribution | PieChart | /api/statistics/contributions-by-mode/{project_id} |
| Top Contributors | BarChart | /api/statistics/contributor-totals/{project_id} |
| Contribution Timeline | AreaChart | /api/statistics/contributions-by-date/{project_id} |
| Amount by Payment Mode | BarChart | /api/statistics/contributions-by-mode/{project_id} |

**API Response Format:**
```json
// contributions-by-date
{"data": [{"contribution_date": "2026-01-15", "total": 50000}]}

// contributions-by-mode
{"data": [{"payment_mode": "Bkash", "total": 75000}]}

// contributor-totals
{"contributors": [{"contributor_name": "John", "total_amount": 25000}]}
```

### 8.3 Frontend Implementation

**Import Project Page (`frontend/app/projects/import/page.tsx`):**
- Drag-and-drop file upload zone
- Template download buttons (empty + example)
- Preview table with validation status
- Error display for invalid rows
- Import button with progress feedback
- Auto-redirect to created project

**Navigation:**
- "Import Project" nav item visible to super_admin and admin only
- Located in `frontend/components/Navigation.tsx`

**Project Detail Overview Tab:**
- Summary cards (total raised, contributors, average donation)
- Four Recharts visualizations
- Uses `statsApi` methods from `frontend/services/fundApi.ts`

### 8.4 Implementation Checklist

**Backend:** ✅
- [x] Create Excel template generator script
- [x] Generate template files (empty + example)
- [x] Implement template download endpoint
- [x] Implement preview endpoint with validation
- [x] Implement import endpoint with transaction support
- [x] Add payment mode normalization

**Frontend:** ✅
- [x] Build Import Project page
- [x] Implement file upload with drag-drop
- [x] Display preview with validation
- [x] Add template download buttons
- [x] Add navigation item for Import
- [x] Fix Overview tab analytics API parsing
- [x] Configure Recharts visualizations

---

## Phase 9: User Manual & Help System

**Status: COMPLETE** ✅ (February 2026)

**Objective**: Provide comprehensive user documentation, contextual help, and an improved user experience with polished UI/UX.

### 9.1 Help Center Implementation

**Help Pages Created (`frontend/app/help/`):**

| Page | Route | Description |
|------|-------|-------------|
| Help Center Home | `/help` | Main help page with topic cards and FAQ |
| Getting Started | `/help/getting-started` | Quick start guide for new users |
| Projects Guide | `/help/projects` | Projects list and project detail documentation |
| Contributions Guide | `/help/contributions` | How to view and add contributions |
| Distributions Guide | `/help/distributions` | Fund distribution documentation |
| Media Gallery | `/help/media` | Media upload and gallery guide |
| Import Guide | `/help/import` | Excel import documentation |
| Admin Panel | `/help/admin` | Admin features documentation |
| Roles & Permissions | `/help/roles` | Complete RBAC matrix |

**Help Components (`frontend/components/help/`):**
- `HelpSidebar.tsx` - Navigation sidebar for help pages
- `HelpButton.tsx` - Floating help button (bottom-right) with contextual help

### 9.2 Navigation Improvements

**User Menu Dropdown:**
- Profile link moved to user dropdown menu
- Click username/avatar to access:
  - Profile page
  - Help Center
  - Logout

**Help Link:**
- Prominent Help link in main navigation bar
- Also available in user dropdown
- Emerald styling for visibility

**Mobile Navigation:**
- Updated mobile menu with Help link
- User section with avatar, profile link, and logout

### 9.3 Login Page Redesign

**Layout:**
- Dark theme (`#0f172a` background, `#1e293b` card)
- Centered card with logo on left, OAuth buttons on right
- Responsive: stacks vertically on mobile
- Clean, modern design matching app theme

**OAuth Buttons:**
- Google (white background)
- Facebook (blue #1877F2)
- Amazon (orange #FF9900)

**Branding:**
- IUT02 Care logo prominently displayed
- "Legacy of Innovation" tagline
- "Charity Fund Management System" subtitle

### 9.4 Dashboard Wave Fix

**Issue:** Wave SVG divider was overlapping content on different screen sizes.

**Solution:**
- Added responsive padding: `pb-32 sm:pb-36 md:pb-40`
- Wave container with responsive height: `h-16 sm:h-20 md:h-24`
- `preserveAspectRatio="none"` for proper SVG scaling
- `overflow-hidden` to contain wave within bounds

### 9.5 Implementation Checklist

**Help System:** ✅
- [x] Create HelpSidebar component
- [x] Create HelpButton floating component
- [x] Create help page layout with sidebar
- [x] Create main Help Center page
- [x] Create Getting Started guide
- [x] Create Projects documentation
- [x] Create Contributions guide
- [x] Create Distributions guide
- [x] Create Media guide
- [x] Create Import guide
- [x] Create Admin Panel documentation
- [x] Create Roles & Permissions matrix
- [x] Add Help link to Navigation
- [x] Integrate HelpButton in root layout

**Navigation:** ✅
- [x] Move Profile to user dropdown menu
- [x] Add Help to main nav and dropdown
- [x] Create user dropdown with avatar
- [x] Update mobile navigation

**Login Page:** ✅
- [x] Redesign with dark theme
- [x] Center layout with card
- [x] Add logo branding section
- [x] Style OAuth buttons
- [x] Responsive layout

**Dashboard:** ✅
- [x] Fix wave SVG overlap
- [x] Add responsive padding
- [x] Update hero section sizing

### 9.6 Files Modified/Created

**New Files:**
```
frontend/
├── components/help/
│   ├── HelpSidebar.tsx
│   └── HelpButton.tsx
├── app/help/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── getting-started/page.tsx
│   ├── projects/page.tsx
│   ├── contributions/page.tsx
│   ├── distributions/page.tsx
│   ├── media/page.tsx
│   ├── import/page.tsx
│   ├── admin/page.tsx
│   └── roles/page.tsx
```

**Modified Files:**
- `frontend/components/Navigation.tsx` - User dropdown, Help link
- `frontend/auth/components/LoginScreen.tsx` - Complete redesign
- `frontend/app/page.tsx` - Wave fix, responsive hero
- `frontend/app/layout.tsx` - Added HelpButton

---

---

## Phase 10: AWS Production Deployment

**Status: COMPLETED** ✅ (February 2026)

**Objective**: Deploy the complete IUT02 Charity Fund Management application to AWS, migrating from local SQLite to serverless DynamoDB architecture.

### 10.1 Architecture Comparison

**Current Local Architecture:**
- Backend: FastAPI on localhost:8000
- Frontend: Next.js on localhost:3000
- Auth Database: SQLite (`auth.db`)
- Fund Database: SQLite (`fund_management.db`)
- Media Storage: Local filesystem (`backend/uploads/`)

**Target AWS Architecture:**
- Backend: AWS Lambda + API Gateway (HTTP API)
- Frontend: AWS Amplify (CDN, SSL, auto-deploy)
- Auth Database: DynamoDB (`iut02-users`, `iut02-sessions`)
- Fund Database: DynamoDB (`iut02-projects`, `iut02-contributions`, `iut02-settings`, `iut02-media`, `iut02-distributions`)
- Media Storage: AWS S3 (`iut02-media-uploads`)
- Region: ap-southeast-1 (Singapore)

### 10.2 DynamoDB Tables

**Existing Tables (Phase 3-4):**
- `iut02-users` - User accounts with role and assigned_projects
- `iut02-sessions` - JWT refresh tokens with TTL

**New Tables (Phase 5-8):**

| Table | Primary Key | GSI | Purpose |
|-------|-------------|-----|--------|
| `iut02-projects` | project_id | StatusIndex (status, created_at) | Charity projects |
| `iut02-contributions` | contribution_id | ProjectIndex, ContributorIndex | Donation records |
| `iut02-settings` | setting_key | - | App configuration |
| `iut02-media` | media_id | ProjectIndex (project_id, display_order) | Media files metadata |
| `iut02-distributions` | distribution_id | ProjectIndex (project_id, distribution_date) | Fund distributions |

### 10.3 S3 Media Storage

**Bucket Configuration:**
- Name: `iut02-media-uploads`
- CORS: Allow frontend domain
- Access: Lambda IAM role
- Structure: `{project_id}/{media_type}/{filename}`

### 10.4 Lambda Environment Variables

```
ENVIRONMENT=aws
DATABASE_TYPE=dynamodb
DYNAMODB_REGION=ap-southeast-1
DYNAMODB_USERS_TABLE=iut02-users
DYNAMODB_SESSIONS_TABLE=iut02-sessions
DYNAMODB_PROJECTS_TABLE=iut02-projects
DYNAMODB_CONTRIBUTIONS_TABLE=iut02-contributions
DYNAMODB_SETTINGS_TABLE=iut02-settings
DYNAMODB_MEDIA_TABLE=iut02-media
DYNAMODB_DISTRIBUTIONS_TABLE=iut02-distributions
S3_MEDIA_BUCKET=iut02-media-uploads
FRONTEND_URL=https://dev.d1js9a712g4lw.amplifyapp.com
ALLOWED_ORIGINS=https://dev.d1js9a712g4lw.amplifyapp.com
```

### 10.5 IAM Permissions

**Lambda Execution Role Policies:**
- `AWSLambdaBasicExecutionRole` - CloudWatch Logs
- DynamoDB: `GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query`, `Scan` on `iut02-*`
- S3: `PutObject`, `GetObject`, `DeleteObject` on `iut02-media-uploads`

### 10.6 Deployment Steps

1. **Create DynamoDB Tables** - Run `setup_dynamodb_phase10.sh`
2. **Create S3 Bucket** - Run `setup_s3_media.sh`
3. **Implement DynamoDB Classes** - Complete `DynamoDBFundDatabase`
4. **Update IAM Role** - Add DynamoDB and S3 permissions
5. **Deploy Lambda** - Run `deploy_lambda.sh`
6. **Create API Gateway** - HTTP API with Lambda integration
7. **Deploy Amplify** - Connect to GitHub, auto-deploy
8. **Update OAuth** - Production redirect URIs
9. **Test E2E** - All features working
10. **Migrate Data** - Export SQLite to DynamoDB (optional)

### 10.7 Cost Estimate (Monthly)

| Service | Free Tier | Estimated |
|---------|-----------|--------|
| Lambda | 1M requests | $0.00 |
| API Gateway | 1M requests (12 mo) | $0.00-$0.50 |
| DynamoDB | 25GB, 25 WCU/RCU | $0.00 |
| S3 | 5GB storage | $0.00-$0.50 |
| Amplify | 1000 build min, 15GB | $0.00 |
| **Total** | | **~$0-1/month** |

### 10.8 Implementation Checklist

**DynamoDB Setup:**
- [x] Create `iut02-projects` table with GSI (StatusIndex)
- [x] Create `iut02-contributions` table with GSIs (ProjectIndex, ContributorIndex)
- [x] Create `iut02-settings` table
- [x] Create `iut02-media` table with GSI (ProjectIndex)
- [x] Create `iut02-distributions` table with GSI (ProjectIndex)

**DynamoDB Implementation:**
- [x] Implement `DynamoDBFundDatabase` project methods
- [x] Implement contribution methods
- [x] Implement settings methods
- [x] Implement media methods
- [x] Implement distribution methods
- [x] Implement statistics/aggregation queries

**S3 Setup:**
- [x] Create `iut02-media-uploads` bucket
- [x] Configure CORS
- [x] Update media routes for S3 upload/download

**Lambda Deployment:**
- [x] Update `deploy_lambda_phase10.sh` with new modules
- [x] Add all environment variables
- [x] Update IAM role permissions (DynamoDB + S3)
- [x] Deploy via S3 (54MB package)

**API Gateway:**
- [x] Create HTTP API (`v8l18mp5ja`)
- [x] Configure Lambda integration
- [x] Set up default route
- [x] API URL: `https://v8l18mp5ja.execute-api.ap-southeast-1.amazonaws.com`

**Frontend Deployment:**
- [x] Update Amplify environment variable with API URL
- [x] Trigger rebuild with new config
- [x] Domain: `https://dev.d1js9a712g4lw.amplifyapp.com`

**OAuth Configuration:**
- [ ] Update Google OAuth redirect URIs (requires manual setup)
- [ ] Update Facebook OAuth redirect URIs (optional)
- [ ] Update Amazon OAuth redirect URIs (optional)

**Testing:**
- [x] API Gateway responding
- [x] Auth providers endpoint working
- [ ] OAuth login working (requires OAuth config update)
- [ ] Project CRUD working
- [ ] Contribution CRUD working
- [ ] Media upload to S3 working
- [ ] Distribution CRUD working
- [ ] Help system accessible

---

### Future Enhancements (Phase 11+)
- Bangladesh payment gateway (bKash, SSLCommerz)
- Email notifications (AWS SES)
- Email/password login option
- Multi-factor authentication (MFA)
- Advanced analytics dashboard
- Audit logging
- Recurring donations support
- Export reports (PDF/CSV)
- Contributor receipt generation
- Video transcoding for multiple quality levels
- Image optimization/resizing service
- Dark mode toggle for entire app
- PWA support (offline access)
- Push notifications

