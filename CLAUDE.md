# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IUT02 Care is a charity fund management platform for IUT Batch 02 alumni. It has two operational modes:
- **Excel Mode**: Legacy visualization of spreadsheet data
- **Dynamic Mode**: Database-driven fund management with CRUD operations

Production: https://www.idot02.com

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

# AWS Deployment
./deploy_lambda_phase10.sh             # Deploy Lambda function
./backend/setup_dynamodb_phase10.sh    # Create DynamoDB tables
./backend/setup_s3_media.sh            # Setup S3 media bucket
```

## Architecture

```
Frontend (Next.js 14 + TypeScript + Tailwind)
    ↓ HTTPS
API Gateway → Lambda (Python 3.11)
    ↓
FastAPI App
    ├── auth/      → OAuth (Google/Facebook/Amazon) + JWT
    ├── fund/      → Projects, Contributions, Distributions CRUD
    └── middleware/ → JWT verification
    ↓
DynamoDB (prod) / SQLite (local)  +  S3 (media storage)
```

### Key Frontend Patterns

- **Static export**: Uses `output: 'export'` in next.config.js - no server-side features
- **Trailing slash**: All URLs end with `/` (configured in next.config.js)
- **Auth state**: AuthContext provider wraps app, use `useAuth()` hook
- **API calls**: Use `projectsApi`, `contributionsApi`, etc. from `services/fundApi.ts`

### Key Backend Patterns

- **Protected routes**: Use `Depends(get_current_user)` or `Depends(require_role([...]))`
- **Dual storage**: Models support both SQLite (local) and DynamoDB (AWS) via environment
- **Lambda entry**: `lambda_handler.py` uses Mangum adapter for FastAPI

## Role-Based Access Control

| Role | Permissions |
|------|-------------|
| `super_admin` | Full access + manage user roles |
| `admin` | Manage all projects and users |
| `fund_admin` | Manage assigned projects only |
| `user` | View-only access |

## Critical Gotchas

1. **React Hooks Order**: All `useEffect` calls must be before any conditional returns
   ```tsx
   // WRONG - will fail build
   if (loading) return <Loading />;
   useEffect(() => {}, []);

   // CORRECT
   useEffect(() => {}, []);
   if (loading) return <Loading />;
   ```

2. **CORS Headers**: Backend explicitly allows `Authorization` header in CORS config

3. **Environment Detection**: Backend uses `ENVIRONMENT=local|aws` to switch storage backends

4. **JWT in localStorage**: Frontend stores tokens via `tokenService`, not cookies

## Configuration

Backend environment variables (backend/.env):
- `ENVIRONMENT`: `local` or `aws`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: OAuth credentials
- `JWT_SECRET`, `JWT_ALGORITHM`: Token signing
- `FRONTEND_URL`: For OAuth redirects

Frontend environment variables (frontend/.env.local):
- `NEXT_PUBLIC_API_URL`: Backend URL (http://localhost:8000 for dev)

## AWS Resources

- **Region**: ap-southeast-1
- **Lambda**: `iut02-blanket-api`
- **DynamoDB Tables**: `iut02_users`, `iut02_sessions`, `iut02_projects`, `iut02_contributions`, `iut02_distributions`, `iut02_media`, `iut02_settings`
- **S3 Bucket**: `iut02-media-uploads`
- **Amplify App ID**: `d1js9a712g4lw` (auto-deploys from `dev` branch)
