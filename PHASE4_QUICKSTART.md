# Phase 4 Quick Start Guide

This is a simplified guide to get authentication running locally as quickly as possible.

## Prerequisites

- Python 3.8+ installed
- Node.js 18+ installed
- Have at least ONE OAuth provider account (Google, Facebook, or Amazon)

## Quick Setup (5 minutes)

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Get Google OAuth Credentials (Easiest Option)

1. Visit: https://console.cloud.google.com/
2. Create a new project (e.g., "IUT02-Auth")
3. Click "APIs & Services" → "Credentials"
4. Click "+ CREATE CREDENTIALS" → "OAuth 2.0 Client ID"
5. Configure consent screen if prompted (just add app name and your email)
6. Application type: **Web application**
7. Add Authorized redirect URI: `http://localhost:3000/auth/callback/google`
8. Click "Create"
9. Copy the **Client ID** and **Client Secret**

### 3. Configure Backend

Create `backend/.env` file:

```bash
cd backend
cat > .env << 'EOF'
ENVIRONMENT=local
JWT_SECRET_KEY=dev-secret-key-for-local-testing-only
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback/google

FRONTEND_URL=http://localhost:3000
EOF
```

**Replace** `your-client-id-here` and `your-client-secret-here` with your actual Google credentials!

### 4. Configure Frontend

```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm install
```

### 5. Start Backend

```bash
cd backend
python -m uvicorn app:app --reload
```

Leave this terminal running. You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 6. Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

You should see:
```
Ready on http://localhost:3000
```

## Test Authentication

1. **Open Browser:** http://localhost:3000/login

2. **You should see:** A login screen with a "Continue with Google" button

3. **Click the button:**
   - You'll be redirected to Google login
   - Sign in with your Google account
   - Grant permissions
   - You'll be redirected back to the app

4. **Success!** You should now be on the home page (`/`)

## Verify It Works

### Check Tokens in Browser Console

Press F12 to open DevTools, go to Console tab, and run:

```javascript
localStorage.getItem('iut02_access_token')
```

You should see a JWT token!

### Check Your User Data

In your terminal:

```bash
# Get the access token from browser console first
TOKEN="paste-your-token-here"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/auth/me
```

You should see your user info!

### Check Database

```bash
cd backend
sqlite3 auth.db "SELECT * FROM users;"
```

You should see your user record!

## Troubleshooting

### "No OAuth providers configured" Error

**Problem:** Environment variables not loaded

**Solution:**
```bash
cd backend
cat .env  # Make sure your credentials are there
# Restart the backend server
```

### "Failed to exchange code for token" Error

**Problem:** Redirect URI mismatch

**Solution:** 
- Go back to Google Cloud Console
- Make sure redirect URI is EXACTLY: `http://localhost:3000/auth/callback/google`
- No trailing slash!
- Must be http (not https) for localhost

### Backend won't start

**Problem:** Dependencies missing

**Solution:**
```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend won't start

**Problem:** Dependencies missing  

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## What's Next?

Now that auth is working locally, check out:

- **PHASE4_SETUP.md** - Full documentation with AWS deployment
- Test with Facebook/Amazon OAuth
- Deploy to AWS with DynamoDB

## Need Help?

Common issues:
1. **Port already in use:** Kill the process using port 8000 or 3000
2. **Module not found:** Reinstall dependencies
3. **Google OAuth error:** Double-check redirect URI matches exactly
4. **SQLite locked:** Delete `backend/auth.db` and restart backend

The authentication system is now fully functional! 🎉
