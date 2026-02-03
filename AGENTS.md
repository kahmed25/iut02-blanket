# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Excel Data Visualization Application with OAuth authentication. A FastAPI backend parses Excel files and serves data to a Next.js frontend that displays it in a Sway-like presentation format.

## Development Commands

### Start Development Servers

**Backend** (Terminal 1):
```bash
source venv/bin/activate
cd backend
python app.py
```
Backend runs at http://localhost:8000. API docs at http://localhost:8000/docs.

**Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
```
Frontend runs at http://localhost:3000.

### Quick Start Scripts
```bash
./start_backend.sh   # Activates venv and starts backend
./start_frontend.sh  # Starts frontend dev server
```

### Linting
```bash
cd frontend && npm run lint
```

### Build Frontend
```bash
cd frontend && npm run build
```

### Test Excel Parser
```bash
cd backend
python test_parser.py
```

### Test Excel Updates
```bash
source venv/bin/activate
python test_excel_update.py
```

## Architecture

### Backend (`backend/`)
- **FastAPI** application with automatic OpenAPI docs
- **`app.py`**: Main application, routes, CORS setup, static file serving
- **`excel_parser.py`**: Excel parsing with pandas/openpyxl, in-memory caching, URL fetching
- **`config.py`**: Environment-based configuration (supports local files or remote URLs)
- **`auth/`**: Standalone OAuth 2.0 authentication module
  - `routes.py`: Auth endpoints (/auth/login, /auth/callback, /auth/me, etc.)
  - `oauth_handlers.py`: Google, Facebook, Amazon OAuth implementations
  - `jwt_handler.py`: JWT token creation/verification
  - `models.py`: SQLite (local) or DynamoDB (AWS) user/session storage
  - `auth_config.py`: Auth-specific environment configuration

### Frontend (`frontend/`)
- **Next.js 14** with App Router and TypeScript
- **`app/`**: Next.js pages
  - `page.tsx`: Main data visualization (protected)
  - `login/page.tsx`: OAuth login screen
  - `profile/page.tsx`: User profile (protected)
  - `auth/success/page.tsx`: OAuth callback handler
- **`components/`**: React components (DataTable, DonationChart, ImageGallery, SummaryCard, Tabs)
- **`services/api.ts`**: Backend API client
- **`auth/`**: Authentication module
  - `context/AuthContext.tsx`: Global auth state provider
  - `hooks/useAuth.ts`: Auth hook for components
  - `services/authService.ts`: Auth API calls
  - `services/tokenService.ts`: Token storage

### Data Flow
1. Excel file → `excel_parser.py` → JSON via `/api/data` endpoint
2. Frontend fetches from `/api/data` on page load
3. Images served from `/images/{filename}` (local or proxied from URL)
4. Excel file read on every request (no server restart needed for data changes)

## Configuration

### Backend Environment (`backend/.env`)
Key variables:
- `EXCEL_SOURCE_TYPE`: "local" or "url"
- `IMAGES_SOURCE_TYPE`: "local" or "url"
- `ENVIRONMENT`: "local" (SQLite) or "aws" (DynamoDB)
- OAuth credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, etc.
- `FRONTEND_URL`: For OAuth redirects

### Frontend Environment (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL`: Backend URL (default: http://localhost:8000)

## Key Patterns

### Adding a New API Endpoint
Add route in `backend/app.py` following existing patterns. For auth-protected endpoints, use the JWT middleware from `backend/middleware/auth_middleware.py`.

### Adding a New OAuth Provider
1. Create handler in `backend/auth/oauth_handlers.py` implementing `OAuthProvider` pattern
2. Add to `get_oauth_provider()` function
3. Add config variables to `backend/auth/auth_config.py`
4. Update frontend `LoginScreen.tsx` with new button

### Adding New React Components
Create in `frontend/components/` with TypeScript. Use Tailwind CSS for styling. Follow existing component patterns.

## AWS Deployment

Lambda deployment package in `lambda_deployment/`. Use `deploy_lambda.sh` for deployment. DynamoDB tables created via `backend/setup_dynamodb.sh`.
