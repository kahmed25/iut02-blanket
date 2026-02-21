# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**IUT02 Care** is a charity fund management platform for IUT Batch 02 alumni. It supports two operational modes:
- **Excel Mode**: Legacy visualization of Excel spreadsheet data
- **Dynamic Mode**: Full database-driven fund management with CRUD operations

### Key Business Features
- Multi-project charity management with donation targets
- Contribution tracking with payment modes (bKash, Nagad, Cash, Bank Transfer, etc.)
- Fund distribution tracking with proof uploads
- Role-based access control (Super Admin, Admin, Fund Admin, User)
- OAuth authentication (Google, Amazon) + Email/Password authentication

### URLs
- **Production**: https://www.idot02.com
- **Amplify Preview**: https://dev.d1js9a712g4lw.amplifyapp.com
- **Production API**: https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com

---

## Tech Stack

### Backend
- **Framework**: FastAPI 0.109 with Mangum adapter for Lambda
- **Database**: SQLite (local) / DynamoDB (AWS)
- **Auth**: OAuth 2.0 + JWT + Email/Password
- **File Storage**: Local uploads (dev) / S3 (prod)
- **Email**: AWS SES (login@devopz.ai)

### Frontend
- **Framework**: Next.js 14 (App Router) with static export
- **Language**: TypeScript
- **Styling**: Tailwind CSS (dark slate theme with emerald accents)
- **State**: React Context (AuthContext)
- **Build**: Static export to `out/` directory

### AWS Infrastructure (ap-southeast-1)
- **Hosting**: AWS Amplify (auto-deploy from `dev` branch)
- **API**: AWS Lambda + API Gateway (HTTP API)
- **Database**: DynamoDB (7 tables)
- **Storage**: S3 (`iut02-media-uploads`)
- **Email**: AWS SES

---

## Development Commands

```bash
# Backend (FastAPI on localhost:8000)
source venv/bin/activate
cd backend && python app.py

# Frontend (Next.js on localhost:3000)
cd frontend && npm run dev

# Quick start scripts
./start_backend.sh    # Activates venv and starts backend
./start_frontend.sh   # Starts frontend dev server

# Build and lint
cd frontend && npm run build   # Static export to out/
cd frontend && npm run lint    # ESLint

# Run single test
cd backend && python -m pytest tests/test_auth.py -v

# AWS Deployment
./deploy_lambda_phase10.sh             # Deploy Lambda function
./backend/setup_dynamodb_phase10.sh    # Create DynamoDB tables
./backend/setup_s3_media.sh            # Setup S3 media bucket

# Update Lambda environment variables (use complete-lambda-env.json as source of truth)
aws lambda update-function-configuration \
  --function-name iut02-blanket-api \
  --environment file://complete-lambda-env.json \
  --region ap-southeast-1
```

---

## Project Structure

```
IUT02/
├── backend/
│   ├── app.py                    # Main FastAPI app with routes
│   ├── config.py                 # Environment configuration
│   ├── lambda_handler.py         # AWS Lambda entry point (Mangum)
│   ├── auth/
│   │   ├── routes.py             # /auth/* OAuth endpoints
│   │   ├── email_auth.py         # /auth/email/* endpoints
│   │   ├── oauth_handlers.py     # Google, Facebook, Amazon handlers
│   │   ├── jwt_handler.py        # JWT create/verify
│   │   └── models.py             # User, Session models
│   ├── fund/
│   │   ├── routes.py             # /api/fund/* endpoints
│   │   ├── models.py             # Project, Contribution, Distribution models
│   │   └── media_routes.py       # Media upload/download
│   └── middleware/
│       └── auth_middleware.py    # JWT verification, role checking
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Homepage (auth redirect logic)
│   │   ├── layout.tsx            # Root layout with AuthProvider
│   │   ├── login/page.tsx        # Login page wrapper
│   │   ├── projects/[id]/page.tsx    # Project detail with tabs
│   │   └── help/                 # Help documentation pages
│   ├── auth/
│   │   ├── components/LoginScreen.tsx  # Login/Register/Verify UI
│   │   ├── context/AuthContext.tsx     # Global auth state
│   │   ├── hooks/useAuth.ts            # useAuth hook
│   │   └── services/
│   │       ├── authService.ts          # Auth API calls
│   │       └── tokenService.ts         # JWT localStorage
│   ├── components/
│   │   ├── Navigation.tsx        # Top nav with user dropdown
│   │   └── media/                # MediaGallery, MediaUploader
│   └── services/
│       └── fundApi.ts            # Fund management API calls
│
├── amplify.yml                   # Amplify build configuration
└── deploy_lambda_phase10.sh      # Lambda deployment script
```

---

## Architecture

```
User Browser
    ↓
AWS Amplify (CDN + SSL)
    ↓
Next.js Static Pages (frontend/out/)
    ↓ API calls (fetch)
API Gateway (HTTP API)
    ↓
AWS Lambda (Python 3.11, Mangum adapter)
    ↓
FastAPI Application
    ├── auth/      → OAuth + Email Auth + JWT
    ├── fund/      → Projects, Contributions, Distributions
    └── middleware/ → JWT verification, RBAC
    ↓
DynamoDB (7 tables) + S3 (media)
```

---

## Configuration

### Backend (`backend/.env`)

```bash
ENVIRONMENT=local                 # local or aws
DATABASE_TYPE=sqlite              # sqlite or dynamodb

# OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
AMAZON_CLIENT_ID=xxx
AMAZON_CLIENT_SECRET=xxx

# JWT
JWT_SECRET=your-secret
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Frontend URL for OAuth redirects
FRONTEND_URL=http://localhost:3000

# AWS (production only)
AWS_REGION=ap-southeast-1
DYNAMODB_TABLE_PREFIX=iut02_
S3_BUCKET=iut02-media-uploads
SES_FROM_EMAIL=login@devopz.ai
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Amplify Build (`amplify.yml`)

**CRITICAL**: The `.env.production` file must be created in the `preBuild` phase before `npm ci` runs:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - echo "NEXT_PUBLIC_API_URL=https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com" > .env.production
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/out
    files:
      - '**/*'
```

---

## Role-Based Access Control

| Role | Description | Permissions |
|------|-------------|-------------|
| `super_admin` | Hardcoded (khahmed.rashed@gmail.com) | Full access, manage user roles |
| `admin` | Promoted by super_admin | Manage all projects, users (not roles) |
| `fund_admin` | Assigned to specific projects | Manage contributions for assigned projects |
| `user` | Default for new OAuth users | View-only access |

### Frontend Role Check
```tsx
const { user } = useAuth();
const isAdmin = ['super_admin', 'admin'].includes(user?.role);
const isFundAdmin = user?.role === 'fund_admin';
```

### Backend Role Check
```python
from middleware.auth_middleware import require_role

@app.post("/api/fund/projects")
async def create_project(
    data: ProjectCreate,
    user: dict = Depends(require_role(["admin", "super_admin"]))
):
    ...
```

---

## API Endpoints

### Authentication
- `GET /auth/login/{provider}` - Initiate OAuth (google/amazon)
- `GET /auth/callback/{provider}` - OAuth callback
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh JWT
- `GET /auth/providers` - List configured providers

### Email Authentication
- `POST /auth/email/register` - Register with email/password
- `POST /auth/email/verify` - Verify email with 6-digit code
- `POST /auth/email/login` - Login with email/password
- `POST /auth/email/forgot-password` - Request password reset
- `POST /auth/email/reset-password` - Reset password with token

### Fund Management
- `GET/POST /api/fund/projects` - List/Create projects
- `GET/PUT/DELETE /api/fund/projects/{id}` - Project CRUD
- `GET/POST /api/fund/projects/{id}/contributions` - Contributions
- `GET/POST /api/fund/projects/{id}/distributions` - Distributions
- `GET/POST/DELETE /api/fund/projects/{id}/media` - Media files
- `GET/PUT /api/fund/settings` - App settings
- `GET/PUT /api/fund/users` - User management

---

## Critical Gotchas & Learnings

### 1. React Hooks Order (Build Failure)

All `useEffect` hooks must be called **before** any conditional returns:

```tsx
// WRONG - will fail build with "Hook called conditionally" error
if (loading) return <Loading />;
useEffect(() => {}, []);

// CORRECT - hooks first, then conditionals
useEffect(() => {}, []);
if (loading) return <Loading />;
```

### 2. Amplify Redirect Rules (Login Loop Issue)

Amplify redirect rules execute at the **server level before React loads**. If you have a rule like:
```json
{"source": "/", "target": "/login/", "status": "302"}
```
This will redirect ALL users to login, even authenticated ones, because React hasn't loaded yet to check auth state.

**Fix**: Remove server-side redirects for auth. Handle auth redirects in React:
```tsx
useEffect(() => {
  if (!authLoading && !isAuthenticated) {
    router.replace('/login');
  }
}, [authLoading, isAuthenticated, router]);
```

**To update Amplify redirect rules**:
```bash
aws amplify update-app --app-id d1js9a712g4lw --custom-rules '[{"source": "/<*>", "target": "/index.html", "status": "404-200"}]'
```

### 3. Amplify Build Phase Context

Each Amplify build phase starts from the **root directory**. Directory context does NOT persist between phases:

```yaml
# WRONG - preBuild cd doesn't affect build phase
preBuild:
  commands:
    - cd frontend
    - npm ci
build:
  commands:
    - npm run build  # FAILS - runs in root, not frontend/

# CORRECT - cd in each phase
preBuild:
  commands:
    - cd frontend && npm ci
build:
  commands:
    - cd frontend && npm run build
```

### 4. Environment Variables in Static Export

Next.js static export bakes `NEXT_PUBLIC_*` variables at **build time**. You must:
1. Create `.env.production` before running `npm run build`
2. Do this in the Amplify `preBuild` phase before `npm ci`

### 5. CORS Authorization Header Warning

Firefox shows a warning: "CORS header 'Access-Control-Allow-Headers' value is '*' and not 'Authorization'". This is **cosmetic only** and doesn't block requests. The backend explicitly allows `Authorization` in CORS config.

### 6. Token Storage

JWTs are stored in `localStorage`, not cookies:
```typescript
// frontend/auth/services/tokenService.ts
localStorage.setItem('access_token', token);
localStorage.setItem('refresh_token', refreshToken);
```

### 7. Email Verification Flow

After registration:
1. User enters email/password/username
2. Backend creates unverified user, sends 6-digit code via SES
3. User enters code on verification screen
4. Backend verifies, marks user verified, returns JWT tokens
5. Frontend stores tokens, redirects to homepage

**Important**: Show success message for 2-3 seconds before redirect so user sees confirmation.

---

## AWS Resources

| Resource | Value |
|----------|-------|
| Region | ap-southeast-1 (Singapore) |
| Lambda Function | `iut02-blanket-api` |
| API Gateway | `hz0qnbuf64` |
| Amplify App ID | `d1js9a712g4lw` |
| S3 Media Bucket | `iut02-media-uploads` |
| SES From Email | `login@devopz.ai` |

### DynamoDB Tables
- `iut02_users` - User accounts with roles
- `iut02_sessions` - JWT refresh tokens with TTL
- `iut02_projects` - Charity projects
- `iut02_contributions` - Donations
- `iut02_distributions` - Fund distributions
- `iut02_media` - Media file metadata
- `iut02_settings` - App configuration

---

## Debugging Tips

### Check Lambda Logs
```bash
aws logs tail /aws/lambda/iut02-blanket-api --follow --region ap-southeast-1
```

### Test Backend API Directly
```python
import requests

# Test login
response = requests.post(
    "https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com/auth/email/login",
    json={"email": "test@example.com", "password": "Test123!"}
)
print(response.json())

# Test authenticated endpoint
token = response.json()["access_token"]
me = requests.get(
    "https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com/auth/me",
    headers={"Authorization": f"Bearer {token}"}
)
print(me.json())
```

### Update Lambda Environment Variables
```bash
aws lambda update-function-configuration \
    --function-name iut02-blanket-api \
    --environment "Variables={KEY=value}" \
    --region ap-southeast-1
```

### Trigger Amplify Rebuild
```bash
aws amplify start-job --app-id d1js9a712g4lw --branch-name dev --job-type RELEASE --region ap-southeast-1
```

---

## Implementation Phases (Complete)

1. **Phase 1-3**: Local development, online data source, AWS deployment
2. **Phase 4**: OAuth authentication (Google, Facebook, Amazon)
3. **Phase 5**: Dynamic fund management with RBAC
4. **Phase 6**: Media management system
5. **Phase 7**: Distribution management
6. **Phase 8**: Project import from Excel
7. **Phase 9**: Help system and UI polish
8. **Phase 10**: AWS production deployment (DynamoDB, S3)
9. **Phase 11**: Email authentication system (SES integration)

---

## Common Tasks

### Add New API Endpoint
1. Create route in `backend/fund/routes.py` or `backend/auth/routes.py`
2. Add model methods in `backend/fund/models.py` if needed
3. Add API function in `frontend/services/fundApi.ts`
4. Use in component with proper error handling

### Add New Page
1. Create `frontend/app/pagename/page.tsx`
2. Add to Navigation.tsx if needed
3. Add route protection with `useAuth()` hook

### Deploy Changes
1. **Frontend**: Push to `dev` branch (Amplify auto-deploys)
2. **Backend**: Run `./deploy_lambda_phase10.sh`
3. **Environment vars**: Update Lambda using `complete-lambda-env.json`:
   ```bash
   aws lambda update-function-configuration \
     --function-name iut02-blanket-api \
     --environment file://complete-lambda-env.json \
     --region ap-southeast-1
   ```

### Lambda Environment Configuration
The `complete-lambda-env.json` file contains all production environment variables for the Lambda function. This file is the source of truth for Lambda configuration and should be used when updating environment variables.

**Important**: This file contains sensitive credentials (OAuth secrets, JWT keys) and should NOT be committed to git. It's listed in `.gitignore`.
