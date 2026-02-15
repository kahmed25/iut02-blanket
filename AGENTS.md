# AGENTS.md - AI Assistant Context

This file provides comprehensive context for AI assistants (Warp, Claude, etc.) working with the IUT02 Care codebase.

---

## Project Overview

**IUT02 Care** is a charity fund management platform for IUT Batch 02 alumni. It supports two modes:
1. **Excel Mode**: Legacy visualization of Excel spreadsheet data
2. **Dynamic Mode**: Full database-driven fund management with CRUD operations

### Key Business Features
- Multi-project charity management with donation targets
- Contribution tracking with payment modes and dates
- Fund distribution tracking with proof uploads
- Role-based access control (Super Admin, Admin, Fund Admin, User)
- OAuth authentication (Google, Facebook, Amazon)

### Website
- **Production**: https://www.idot02.com
- **Amplify Preview**: https://dev.d1js9a712g4lw.amplifyapp.com

---

## Tech Stack

### Backend
- **Framework**: FastAPI 0.109
- **Database**: SQLite (local) / DynamoDB (AWS)
- **Auth**: OAuth 2.0 + JWT
- **File Storage**: Local uploads / S3
- **Excel Parsing**: Pandas + openpyxl

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Context (AuthContext)
- **Build**: Static export for Amplify

### Infrastructure (AWS)
- **Hosting**: AWS Amplify (frontend)
- **API**: AWS Lambda + API Gateway
- **Database**: DynamoDB
- **Storage**: S3 (media files)
- **Region**: ap-southeast-1

---

## Development Commands

```bash
# Backend
source venv/bin/activate
cd backend && python app.py              # Start backend (localhost:8000)
cd backend && python -m pytest           # Run tests

# Frontend
cd frontend && npm run dev               # Start dev server (localhost:3000)
cd frontend && npm run build             # Build for production
cd frontend && npm run lint              # Run ESLint

# Quick start
./start_backend.sh                       # Backend with venv
./start_frontend.sh                      # Frontend dev

# Deployment
./deploy_lambda_phase10.sh               # Deploy Lambda
./backend/setup_dynamodb_phase10.sh      # Create DynamoDB tables
./backend/setup_s3_media.sh              # Setup S3 bucket
```

---

## Project Structure

```
IUT02/
├── backend/
│   ├── app.py                    # Main FastAPI app with routes
│   ├── config.py                 # Environment configuration
│   ├── excel_parser.py           # Excel file parsing
│   ├── lambda_handler.py         # AWS Lambda entry point
│   ├── auth/
│   │   ├── routes.py             # /auth/* endpoints
│   │   ├── oauth_handlers.py     # Google, Facebook, Amazon handlers
│   │   ├── jwt_handler.py        # JWT create/verify
│   │   ├── models.py             # User, Session models
│   │   └── auth_config.py        # OAuth config
│   ├── fund/
│   │   ├── routes.py             # /api/fund/* endpoints (CRUD)
│   │   ├── models.py             # Project, Contribution, Distribution models
│   │   └── media_routes.py       # Media upload/download
│   └── middleware/
│       └── auth_middleware.py    # JWT verification middleware
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Homepage (project listing or Excel view)
│   │   ├── layout.tsx            # Root layout with AuthProvider
│   │   ├── login/page.tsx        # OAuth login buttons
│   │   ├── profile/page.tsx      # User profile
│   │   ├── admin/page.tsx        # Admin dashboard
│   │   ├── fund-admin/page.tsx   # Fund admin dashboard
│   │   ├── projects/detail/page.tsx  # Project detail with tabs
│   │   └── help/                 # Help documentation pages
│   ├── components/
│   │   ├── Navigation.tsx        # Top navigation bar
│   │   ├── DataTable.tsx         # Generic data table
│   │   ├── DonationChart.tsx     # Charts (recharts)
│   │   ├── SummaryCard.tsx       # Stats cards
│   │   ├── PoweredByDevopz.tsx   # Branding badge
│   │   ├── media/                # MediaGallery, MediaUploader
│   │   └── help/                 # HelpButton, HelpModal
│   ├── services/
│   │   ├── api.ts                # Excel data API calls
│   │   └── fundApi.ts            # Fund management API calls
│   └── auth/
│       ├── context/AuthContext.tsx   # Auth state provider
│       ├── hooks/useAuth.ts          # useAuth hook
│       └── services/
│           ├── authService.ts        # Auth API calls
│           └── tokenService.ts       # JWT storage
│
├── amplify.yml                   # Amplify build configuration
└── deploy_lambda_phase10.sh      # Lambda deployment script
```

---

## Configuration

### Backend (`backend/.env`)

```bash
ENVIRONMENT=local              # local or aws
EXCEL_SOURCE_TYPE=local        # local or url
IMAGES_SOURCE_TYPE=local       # local or url

# OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
FACEBOOK_APP_ID=xxx
FACEBOOK_APP_SECRET=xxx
AMAZON_CLIENT_ID=xxx
AMAZON_CLIENT_SECRET=xxx

# JWT
JWT_SECRET=your-secret
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Frontend
FRONTEND_URL=http://localhost:3000

# AWS (production)
AWS_REGION=ap-southeast-1
DYNAMODB_TABLE_PREFIX=iut02_
S3_BUCKET=iut02-media
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API Endpoints

### Authentication
- `GET /auth/login/{provider}` - Initiate OAuth (google/facebook/amazon)
- `GET /auth/callback/{provider}` - OAuth callback
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh JWT

### Projects
- `GET /api/fund/projects` - List all projects
- `POST /api/fund/projects` - Create project (admin+)
- `GET /api/fund/projects/{id}` - Get project
- `PUT /api/fund/projects/{id}` - Update project (admin+)
- `DELETE /api/fund/projects/{id}` - Delete project (admin+)

### Contributions
- `GET /api/fund/projects/{id}/contributions` - List contributions
- `POST /api/fund/projects/{id}/contributions` - Add contribution (fund_admin+)
- `PUT /api/fund/contributions/{id}` - Update contribution
- `DELETE /api/fund/contributions/{id}` - Delete contribution

### Distributions
- `GET /api/fund/projects/{id}/distributions` - List distributions
- `POST /api/fund/projects/{id}/distributions` - Add distribution (admin+)
- `PUT /api/fund/distributions/{id}` - Update distribution
- `DELETE /api/fund/distributions/{id}` - Delete distribution

### Media
- `GET /api/fund/projects/{id}/media` - List media
- `POST /api/fund/projects/{id}/media` - Upload media (multipart)
- `DELETE /api/fund/media/{id}` - Delete media

### Settings
- `GET /api/fund/settings` - Get app settings
- `PUT /api/fund/settings` - Update settings (admin+)
- `GET /api/fund/users` - List users (admin+)
- `PUT /api/fund/users/{id}/role` - Update user role (super_admin)

---

## Key Patterns

### Authentication Flow
```tsx
// Frontend: useAuth hook
const { user, isAuthenticated, loading, logout } = useAuth();

// Protected route pattern
if (!isAuthenticated) {
  router.replace('/login');
  return <Loading />;
}
```

### API Calls (Frontend)
```tsx
import { projectsApi, contributionsApi } from '@/services/fundApi';

// Get projects
const projects = await projectsApi.getAll();

// Create contribution
const contribution = await contributionsApi.create(projectId, {
  contributor_name: 'John Doe',
  amount: 1000,
  payment_mode: 'bKash',
});
```

### Protected Endpoints (Backend)
```python
from middleware.auth_middleware import get_current_user, require_role

@app.get("/api/fund/projects")
async def list_projects(user: dict = Depends(get_current_user)):
    # user is authenticated
    return projects

@app.post("/api/fund/projects")
async def create_project(
    data: ProjectCreate,
    user: dict = Depends(require_role(["admin", "super_admin"]))
):
    # user must be admin or super_admin
    return create_project(data, user)
```

### Data Modes
```tsx
// page.tsx checks data_source_mode from settings
const settings = await settingsApi.get();
const mode = settings.data_source_mode; // 'excel' or 'dynamic'

if (mode === 'dynamic') {
  // Show project listing from database
} else {
  // Show Excel data visualization
}
```

---

## Role-Based Access Control

| Role | Description | Permissions |
|------|-------------|-------------|
| `super_admin` | System owner | Full access, manage roles |
| `admin` | Administrator | Manage all projects, users |
| `fund_admin` | Project manager | Manage assigned projects only |
| `user` | Regular user | View-only access |

### Checking Roles (Frontend)
```tsx
const { user } = useAuth();
const isAdmin = ['super_admin', 'admin'].includes(user?.role);
const isFundAdmin = user?.role === 'fund_admin';
```

---

## Styling Guidelines

- **Framework**: Tailwind CSS
- **Theme**: Dark slate with emerald/teal accents
- **Colors**:
  - Background: `bg-slate-800`, `bg-slate-900`
  - Cards: `bg-slate-800` with `border-slate-700`
  - Primary accent: `emerald-400`, `emerald-500`
  - Text: `text-white`, `text-slate-300`, `text-slate-400`
- **Components**: Use existing patterns from `components/`

---

## AWS Deployment

### Amplify (Frontend)
- **App ID**: `d1js9a712g4lw`
- **Region**: `ap-southeast-1`
- **Branch**: `dev` (auto-deploy on push)
- **Domain**: `www.idot02.com`
- **Build**: `npm run build` → static export to `out/`

### Lambda (Backend)
- **Function**: `iut02-backend`
- **Runtime**: Python 3.9
- **Handler**: `lambda_handler.handler`
- **Deploy**: `./deploy_lambda_phase10.sh`

### DynamoDB Tables
- `iut02_users`
- `iut02_sessions`
- `iut02_projects`
- `iut02_contributions`
- `iut02_distributions`
- `iut02_media`
- `iut02_settings`
- `iut02_user_project_access`

### S3
- **Bucket**: `iut02-media`
- **Purpose**: Media file storage (images, videos, audio)

---

## Important Notes

1. **React Hooks Order**: All useEffect hooks must be called before any early returns
2. **Static Export**: Next.js uses `output: 'export'` - no server-side features
3. **Trailing Slash**: URLs end with `/` (configured in next.config.js)
4. **JWT Storage**: Tokens stored in localStorage via tokenService
5. **CORS**: Backend allows frontend URL in CORS origins
6. **Amplify Redirects**: `/` → `/login/` (302), `/<*>` → `/index.html` (404-200)

---

## Troubleshooting

### Build Fails with Hook Error
Ensure all `useEffect` calls are before any conditional returns:
```tsx
// WRONG
if (loading) return <Loading />;
useEffect(() => {}, []);  // Error: called conditionally

// CORRECT
useEffect(() => {}, []);
if (loading) return <Loading />;
```

### OAuth Redirect Issues
- Check `FRONTEND_URL` in backend/.env
- Verify callback URLs in OAuth provider console
- Ensure cookies/localStorage are enabled

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` matches backend
- Check CORS settings in backend/app.py
- Ensure backend is running

---

## Resources

- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [AWS Amplify](https://docs.amplify.aws)
- [DynamoDB](https://docs.aws.amazon.com/dynamodb)
