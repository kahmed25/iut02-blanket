# IUT02 Care - Charity Fund Management Platform

[![Website](https://img.shields.io/badge/Website-idot02.com-14B8A6)](https://www.idot02.com)
[![AWS Amplify](https://img.shields.io/badge/Hosted%20on-AWS%20Amplify-FF9900)](https://aws.amazon.com/amplify/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)](https://fastapi.tiangolo.com)

**IUT02 Care** is a comprehensive charity fund management platform built by the alumni of IUT Batch 02. It enables transparent donation tracking, fund distribution management, and community engagement for charitable projects.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Changelog](#changelog)

---

## Features

### Core Features
- 🏦 **Project Management**: Create and manage multiple charity projects with targets and status tracking
- 💰 **Contribution Tracking**: Record donations with payment modes, dates, and contributor details
- 📊 **Analytics Dashboard**: Real-time statistics, progress tracking, and donation charts
- 📤 **Fund Distribution**: Track how funds are distributed to institutions with proof uploads
- 🖼️ **Media Gallery**: Upload and display images, videos, and audio for each project

### User Management
- 🔐 **OAuth 2.0 Authentication**: Google, Facebook, and Amazon login support
- 👥 **Role-Based Access Control (RBAC)**:
  - **Super Admin**: Full system access
  - **Admin**: Manage projects, users, and contributions
  - **Fund Admin**: Manage assigned projects only
  - **User**: View-only access to projects and contributions

### Data Modes
- 📋 **Excel Mode**: Legacy mode for viewing Excel spreadsheet data
- 🔄 **Dynamic Mode**: Database-driven fund management with full CRUD operations

### Additional Features
- 📱 **Responsive Design**: Mobile-first UI with Tailwind CSS
- 🌙 **Dark Theme**: Modern slate/emerald color scheme
- 📧 **Help System**: Integrated help documentation
- 🏷️ **Powered by Devopz**: Branding badge for attribution

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|----------|
| Next.js | 14 | React framework with App Router |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| React Hook Form | 7.x | Form handling |

### Backend
| Technology | Version | Purpose |
|------------|---------|----------|
| FastAPI | 0.109 | Python REST API framework |
| Pydantic | 2.x | Data validation |
| SQLite | 3.x | Local database (development) |
| DynamoDB | - | Production database (AWS) |
| Pandas | 2.x | Excel parsing |
| PyJWT | 2.x | JWT token handling |

### Infrastructure (AWS)
| Service | Purpose |
|---------|----------|
| AWS Amplify | Frontend hosting & CI/CD |
| AWS Lambda | Serverless backend |
| API Gateway | REST API management |
| DynamoDB | NoSQL database |
| S3 | Media file storage |
| Cognito | OAuth identity provider |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Next.js   │  │   Amplify   │  │  CloudFront │              │
│  │  App Router │──│   Hosting   │──│     CDN     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────┼────────────────────────────────────┐
│                         BACKEND                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ API Gateway │──│   Lambda    │──│   FastAPI   │              │
│  │   (REST)    │  │  (Python)   │  │    App      │              │
│  └─────────────┘  └─────────────┘  └──────┬──────┘              │
└────────────────────────────────────────────┼────────────────────┘
                                             │
┌────────────────────────────────────────────┼────────────────────┐
│                         DATA LAYER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  DynamoDB   │  │     S3      │  │   Cognito   │              │
│  │  (NoSQL)    │  │   (Media)   │  │   (Auth)    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
IUT02/
├── backend/                      # FastAPI backend
│   ├── app.py                   # Main application & routes
│   ├── config.py                # Environment configuration
│   ├── excel_parser.py          # Excel file parsing
│   ├── lambda_handler.py        # AWS Lambda entry point
│   ├── requirements.txt         # Python dependencies
│   ├── auth/                    # Authentication module
│   │   ├── routes.py            # Auth endpoints
│   │   ├── oauth_handlers.py    # OAuth provider handlers
│   │   ├── jwt_handler.py       # JWT token management
│   │   ├── models.py            # User/session models
│   │   └── auth_config.py       # Auth configuration
│   ├── fund/                    # Fund management module
│   │   ├── routes.py            # CRUD endpoints for projects/contributions
│   │   ├── models.py            # Database models (SQLite/DynamoDB)
│   │   └── media_routes.py      # Media upload endpoints
│   ├── middleware/              # Middleware
│   │   └── auth_middleware.py   # JWT verification
│   └── templates/               # Excel import templates
│
├── frontend/                     # Next.js frontend
│   ├── app/                     # App Router pages
│   │   ├── page.tsx             # Homepage (project listing)
│   │   ├── layout.tsx           # Root layout
│   │   ├── login/               # Login page
│   │   ├── profile/             # User profile
│   │   ├── admin/               # Admin dashboard
│   │   ├── fund-admin/          # Fund admin dashboard
│   │   ├── projects/            # Project pages
│   │   │   └── detail/          # Project detail view
│   │   └── help/                # Help documentation
│   ├── components/              # React components
│   │   ├── Navigation.tsx       # Main navigation
│   │   ├── DataTable.tsx        # Data table component
│   │   ├── DonationChart.tsx    # Charts for analytics
│   │   ├── ImageGallery.tsx     # Image gallery
│   │   ├── SummaryCard.tsx      # Statistics cards
│   │   ├── PoweredByDevopz.tsx  # Branding badge
│   │   ├── media/               # Media components
│   │   └── help/                # Help components
│   ├── services/                # API services
│   │   ├── api.ts               # Excel data API
│   │   └── fundApi.ts           # Fund management API
│   └── auth/                    # Auth module
│       ├── context/             # AuthContext provider
│       ├── hooks/               # useAuth hook
│       └── services/            # Token & auth services
│
├── deploy_lambda_phase10.sh     # Lambda deployment script
├── amplify.yml                  # Amplify build config
└── README.md                    # This file
```

---

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- AWS CLI (for deployment)
- SQLite (local development)

### Local Development

**1. Backend Setup**

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start backend server
python app.py
```

Backend runs at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

**2. Frontend Setup**

```bash
cd frontend
npm install

# Configure environment
cp .env.local.example .env.local
# Edit with API URL

# Start development server
npm run dev
```

Frontend runs at `http://localhost:3000`

### Quick Start Scripts

```bash
./start_backend.sh   # Start backend with venv
./start_frontend.sh  # Start frontend dev server
```

---

## Configuration

### Backend Environment Variables

```bash
# backend/.env

# Environment: local or aws
ENVIRONMENT=local

# Data source
EXCEL_SOURCE_TYPE=local  # local or url
IMAGES_SOURCE_TYPE=local # local or url

# OAuth Providers
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
FACEBOOK_APP_ID=xxx
FACEBOOK_APP_SECRET=xxx
AMAZON_CLIENT_ID=xxx
AMAZON_CLIENT_SECRET=xxx

# JWT
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:3000

# AWS (production)
AWS_REGION=ap-southeast-1
S3_BUCKET=iut02-media
```

### Frontend Environment Variables

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Production (AWS)

```bash
# frontend/.env.production
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.execute-api.region.amazonaws.com/prod
```

---

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login/{provider}` | GET | Initiate OAuth login |
| `/auth/callback/{provider}` | GET | OAuth callback |
| `/auth/me` | GET | Get current user |
| `/auth/logout` | POST | Logout user |
| `/auth/refresh` | POST | Refresh JWT token |

### Projects

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fund/projects` | GET | List all projects |
| `/api/fund/projects` | POST | Create project |
| `/api/fund/projects/{id}` | GET | Get project details |
| `/api/fund/projects/{id}` | PUT | Update project |
| `/api/fund/projects/{id}` | DELETE | Delete project |

### Contributions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fund/projects/{id}/contributions` | GET | List contributions |
| `/api/fund/projects/{id}/contributions` | POST | Add contribution |
| `/api/fund/contributions/{id}` | GET | Get contribution |
| `/api/fund/contributions/{id}` | PUT | Update contribution |
| `/api/fund/contributions/{id}` | DELETE | Delete contribution |

### Distributions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fund/projects/{id}/distributions` | GET | List distributions |
| `/api/fund/projects/{id}/distributions` | POST | Add distribution |
| `/api/fund/distributions/{id}` | PUT | Update distribution |
| `/api/fund/distributions/{id}` | DELETE | Delete distribution |

### Media

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fund/projects/{id}/media` | GET | List media files |
| `/api/fund/projects/{id}/media` | POST | Upload media |
| `/api/fund/media/{id}` | DELETE | Delete media |

### Statistics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fund/projects/{id}/stats` | GET | Project statistics |
| `/api/fund/stats/contributions-by-date` | GET | Contributions over time |
| `/api/fund/stats/contributions-by-mode` | GET | Contributions by payment mode |

### Settings & Users

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fund/settings` | GET | Get app settings |
| `/api/fund/settings` | PUT | Update settings |
| `/api/fund/users` | GET | List users (admin) |
| `/api/fund/users/{id}/role` | PUT | Update user role |

---

## Database Schema

### Users Table
```sql
user_id      TEXT PRIMARY KEY
email        TEXT UNIQUE NOT NULL
username     TEXT
provider     TEXT NOT NULL  -- google, facebook, amazon
role         TEXT DEFAULT 'user'  -- super_admin, admin, fund_admin, user
created_at   TEXT
last_login   TEXT
```

### Projects Table
```sql
project_id     TEXT PRIMARY KEY
name           TEXT NOT NULL
description    TEXT
target_amount  REAL NOT NULL
target_currency TEXT DEFAULT 'BDT'
status         TEXT DEFAULT 'active'  -- active, paused, completed, cancelled, archived
created_by     TEXT REFERENCES users(user_id)
created_at     TEXT
updated_at     TEXT
```

### Contributions Table
```sql
contribution_id   TEXT PRIMARY KEY
project_id        TEXT REFERENCES projects(project_id)
contributor_name  TEXT NOT NULL
user_id           TEXT REFERENCES users(user_id)
amount            REAL NOT NULL
currency          TEXT DEFAULT 'BDT'
payment_mode      TEXT NOT NULL
payment_status    TEXT DEFAULT 'completed'
entry_type        TEXT DEFAULT 'manual'
collection_notes  TEXT
entered_by        TEXT REFERENCES users(user_id)
contribution_date TEXT
created_at        TEXT
updated_at        TEXT
```

### Distributions Table
```sql
distribution_id    TEXT PRIMARY KEY
project_id         TEXT REFERENCES projects(project_id)
institution_type   TEXT NOT NULL
institution_name   TEXT NOT NULL
distributed_amount REAL NOT NULL
currency           TEXT DEFAULT 'BDT'
proof_file_key     TEXT
proof_file_name    TEXT
notes              TEXT
distributed_by     TEXT REFERENCES users(user_id)
distribution_date  TEXT
created_at         TEXT
updated_at         TEXT
```

### Media Table
```sql
media_id       TEXT PRIMARY KEY
project_id     TEXT REFERENCES projects(project_id)
media_type     TEXT NOT NULL  -- image, video, audio
file_name      TEXT NOT NULL
file_key       TEXT NOT NULL
file_size      INTEGER
mime_type      TEXT
caption        TEXT
display_order  INTEGER DEFAULT 0
uploaded_by    TEXT REFERENCES users(user_id)
created_at     TEXT
updated_at     TEXT
```

---

## Authentication

### OAuth 2.0 Flow

1. User clicks "Login with Google/Facebook/Amazon"
2. Redirect to provider's OAuth consent screen
3. User authorizes, provider redirects back with auth code
4. Backend exchanges code for tokens
5. Backend creates/updates user, issues JWT
6. Frontend stores JWT in localStorage
7. JWT included in Authorization header for API calls

### Role Hierarchy

| Role | Projects | Contributions | Users | Settings |
|------|----------|---------------|-------|----------|
| Super Admin | Full | Full | Full | Full |
| Admin | Full | Full | Full | Read |
| Fund Admin | Assigned only | Assigned only | None | None |
| User | Read only | Read only | None | None |

---

## Deployment

### AWS Amplify (Frontend)

Connected to GitHub repo, auto-deploys on push to `dev` branch.

**Amplify Console Settings:**
- App ID: `d1js9a712g4lw`
- Region: `ap-southeast-1`
- Branch: `dev`
- Domain: `www.idot02.com`

**Redirect Rules:**
- `/` → `/login/` (302)
- `/<*>` → `/index.html` (404-200)

### AWS Lambda (Backend)

```bash
# Deploy Lambda function
./deploy_lambda_phase10.sh
```

### DynamoDB Tables

```bash
# Create DynamoDB tables
./backend/setup_dynamodb_phase10.sh
```

Tables created:
- `iut02_users`
- `iut02_sessions`
- `iut02_projects`
- `iut02_contributions`
- `iut02_distributions`
- `iut02_media`
- `iut02_settings`
- `iut02_user_project_access`

### S3 Media Bucket

```bash
# Setup S3 bucket for media uploads
./backend/setup_s3_media.sh
```

---

## Changelog

### February 15, 2026
- ✅ Added PoweredByDevopz branding component
- ✅ Fixed auto-redirect to login for unauthenticated users
- ✅ Updated Amplify redirect rules

### February 3, 2026
- ✅ Phase 10: Complete fund management with distributions
- ✅ Media upload support (local and S3)
- ✅ Full RBAC implementation

### January 31, 2026
- ✅ Phase 5-7: Dynamic fund management mode
- ✅ Project CRUD operations
- ✅ Contribution tracking

### January 20, 2026
- ✅ Phase 4: OAuth authentication (Google, Facebook, Amazon)
- ✅ JWT-based session management

### January 12, 2026
- ✅ Phase 1-3: Initial Excel visualization app
- ✅ FastAPI backend with Excel parsing
- ✅ Next.js frontend with charts and gallery

---

## Contact

**IUT02 Care** - Community charity platform by IUT Batch 02 alumni.

Powered by [devopz.ai](https://devopz.ai)

---

Co-Authored-By: Warp <agent@warp.dev>

