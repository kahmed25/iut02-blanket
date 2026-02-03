# Phase 4: Authentication System - Setup and Testing Guide

This guide will help you set up and test the authentication system in both local and AWS environments.

## Overview

Phase 4 adds a complete authentication system with:
- OAuth 2.0 login (Google, Facebook, Amazon)
- JWT token-based authentication
- SQLite database for local development
- DynamoDB support for AWS deployment
- Secure token management

## Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.8+
- OAuth credentials from providers (Google/Facebook/Amazon)

---

## Local Development Setup

### Step 1: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Configure OAuth Providers

You need to set up at least ONE OAuth provider to test authentication. Here's how:

#### Option A: Google OAuth (Recommended for Testing)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized redirect URIs: `http://localhost:3000/auth/callback/google`
7. Copy your Client ID and Client Secret

#### Option B: Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app → "Consumer" type
3. Add "Facebook Login" product
4. Settings → Valid OAuth Redirect URIs: `http://localhost:3000/auth/callback/facebook`
5. Copy your App ID and App Secret

#### Option C: Amazon OAuth

1. Go to [Amazon Developer Console](https://developer.amazon.com/)
2. Login with Amazon → Create a new Security Profile
3. Web Settings → Allowed Return URLs: `http://localhost:3000/auth/callback/amazon`
4. Copy your Client ID and Client Secret

### Step 3: Configure Backend Environment

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your OAuth credentials:

```env
# Environment
ENVIRONMENT=local

# JWT Configuration (generate a secret key)
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Add credentials for at least ONE provider:

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback/google

# Facebook OAuth (optional)
FACEBOOK_APP_ID=your-facebook-app-id-here
FACEBOOK_APP_SECRET=your-facebook-app-secret-here
FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/callback/facebook

# Amazon OAuth (optional)
AMAZON_CLIENT_ID=your-amazon-client-id-here
AMAZON_CLIENT_SECRET=your-amazon-client-secret-here
AMAZON_REDIRECT_URI=http://localhost:3000/auth/callback/amazon

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Generate JWT Secret Key:**
```bash
openssl rand -hex 32
```

### Step 4: Configure Frontend Environment

Create a `.env.local` file in the `frontend` directory:

```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

### Step 5: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 6: Start Backend Server

```bash
cd backend
python -m uvicorn app:app --reload --host localhost --port 8000
```

The backend should start at `http://localhost:8000`

Check the API is running:
```bash
curl http://localhost:8000/
```

You should see API information with auth endpoints listed.

### Step 7: Start Frontend Development Server

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend should start at `http://localhost:3000`

---

## Testing Authentication Locally

### Test 1: Check Available Providers

Visit: `http://localhost:8000/auth/providers`

You should see a list of providers with their configuration status:
```json
{
  "providers": [
    {"name": "google", "display_name": "Google", "configured": true},
    {"name": "facebook", "display_name": "Facebook", "configured": false},
    {"name": "amazon", "display_name": "Amazon", "configured": false}
  ]
}
```

### Test 2: Access Login Page

1. Open browser and go to: `http://localhost:3000/login`
2. You should see the login screen with buttons for configured providers
3. Only providers with credentials will show as enabled

### Test 3: Complete OAuth Flow

1. Click on a provider button (e.g., "Continue with Google")
2. You'll be redirected to the provider's login page
3. Sign in with your account
4. Grant permissions when prompted
5. You'll be redirected back to `http://localhost:3000/auth/success`
6. Then automatically redirected to the home page (`/`)
7. You're now authenticated!

### Test 4: Verify Authentication

Check the browser's localStorage:
```javascript
// Open browser console (F12) and run:
localStorage.getItem('iut02_access_token')
localStorage.getItem('iut02_refresh_token')
```

You should see JWT tokens stored.

### Test 5: Get User Information

```bash
# Replace YOUR_ACCESS_TOKEN with the token from localStorage
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" http://localhost:8000/auth/me
```

You should see your user information:
```json
{
  "user_id": "uuid-here",
  "email": "your@email.com",
  "username": "Your Name",
  "provider": "google",
  "created_at": "2026-01-20T...",
  "last_login": "2026-01-20T..."
}
```

### Test 6: Refresh Token

```bash
curl -X POST http://localhost:8000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "YOUR_REFRESH_TOKEN"}'
```

You should receive new access and refresh tokens.

### Test 7: Logout

```bash
curl -X POST http://localhost:8000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "YOUR_REFRESH_TOKEN"}'
```

### Test 8: Check Database

Local authentication uses SQLite. Check the database:

```bash
cd backend
sqlite3 auth.db

# In SQLite shell:
.tables
SELECT * FROM users;
SELECT * FROM sessions;
.quit
```

You should see your user record and active sessions.

---

## AWS Deployment Setup

### Step 1: Create DynamoDB Tables

Use the AWS Console or CLI to create two DynamoDB tables:

#### Users Table:
- Table name: `iut02-users`
- Partition key: `user_id` (String)
- Global Secondary Indexes:
  - **EmailIndex**: Partition key = `email` (String)
  - **ProviderIndex**: Partition key = `provider` (String), Sort key = `provider_id` (String)

#### Sessions Table:
- Table name: `iut02-sessions`
- Partition key: `session_id` (String)
- Global Secondary Index:
  - **RefreshTokenIndex**: Partition key = `refresh_token` (String)
- Enable TTL: Attribute name = `ttl`

**Quick Setup Script:**

Create `backend/setup_dynamodb.sh`:

```bash
#!/bin/bash

# Create Users table
aws dynamodb create-table \
  --table-name iut02-users \
  --attribute-definitions \
    AttributeName=user_id,AttributeType=S \
    AttributeName=email,AttributeType=S \
    AttributeName=provider,AttributeType=S \
    AttributeName=provider_id,AttributeType=S \
  --key-schema \
    AttributeName=user_id,KeyType=HASH \
  --global-secondary-indexes \
    "[
      {
        \"IndexName\": \"EmailIndex\",
        \"KeySchema\": [{\"AttributeName\":\"email\",\"KeyType\":\"HASH\"}],
        \"Projection\":{\"ProjectionType\":\"ALL\"},
        \"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
      },
      {
        \"IndexName\": \"ProviderIndex\",
        \"KeySchema\": [{\"AttributeName\":\"provider\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"provider_id\",\"KeyType\":\"RANGE\"}],
        \"Projection\":{\"ProjectionType\":\"ALL\"},
        \"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
      }
    ]" \
  --billing-mode PAY_PER_REQUEST

# Create Sessions table
aws dynamodb create-table \
  --table-name iut02-sessions \
  --attribute-definitions \
    AttributeName=session_id,AttributeType=S \
    AttributeName=refresh_token,AttributeType=S \
  --key-schema \
    AttributeName=session_id,KeyType=HASH \
  --global-secondary-indexes \
    "[
      {
        \"IndexName\": \"RefreshTokenIndex\",
        \"KeySchema\": [{\"AttributeName\":\"refresh_token\",\"KeyType\":\"HASH\"}],
        \"Projection\":{\"ProjectionType\":\"ALL\"},
        \"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
      }
    ]" \
  --billing-mode PAY_PER_REQUEST

# Enable TTL on sessions table
aws dynamodb update-time-to-live \
  --table-name iut02-sessions \
  --time-to-live-specification "Enabled=true, AttributeName=ttl"
```

Run:
```bash
chmod +x backend/setup_dynamodb.sh
./backend/setup_dynamodb.sh
```

### Step 2: Update OAuth Redirect URIs

For each provider you configured, update the redirect URIs to your production URL:

- Google: `https://your-domain.com/auth/callback/google`
- Facebook: `https://your-domain.com/auth/callback/facebook`
- Amazon: `https://your-domain.com/auth/callback/amazon`

### Step 3: Configure Lambda Environment Variables

Update your Lambda function with environment variables:

```bash
aws lambda update-function-configuration \
  --function-name your-lambda-function \
  --environment "Variables={
    ENVIRONMENT=aws,
    JWT_SECRET_KEY=your-production-secret-key,
    GOOGLE_CLIENT_ID=your-google-client-id,
    GOOGLE_CLIENT_SECRET=your-google-client-secret,
    GOOGLE_REDIRECT_URI=https://your-domain.com/auth/callback/google,
    FACEBOOK_APP_ID=your-facebook-app-id,
    FACEBOOK_APP_SECRET=your-facebook-app-secret,
    FACEBOOK_REDIRECT_URI=https://your-domain.com/auth/callback/facebook,
    AMAZON_CLIENT_ID=your-amazon-client-id,
    AMAZON_CLIENT_SECRET=your-amazon-client-secret,
    AMAZON_REDIRECT_URI=https://your-domain.com/auth/callback/amazon,
    FRONTEND_URL=https://your-domain.com,
    DYNAMODB_REGION=us-east-1,
    DYNAMODB_USERS_TABLE=iut02-users,
    DYNAMODB_SESSIONS_TABLE=iut02-sessions
  }"
```

### Step 4: Update Lambda IAM Role

Add DynamoDB permissions to your Lambda execution role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/iut02-users",
        "arn:aws:dynamodb:us-east-1:*:table/iut02-users/index/*",
        "arn:aws:dynamodb:us-east-1:*:table/iut02-sessions",
        "arn:aws:dynamodb:us-east-1:*:table/iut02-sessions/index/*"
      ]
    }
  ]
}
```

### Step 5: Deploy Backend

```bash
cd backend
./deploy_lambda.sh
```

### Step 6: Deploy Frontend

Update `frontend/.env.production`:

```env
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com
```

Deploy to Amplify:
```bash
cd frontend
npm run build
# Push to GitHub - Amplify will auto-deploy
```

---

## Testing in AWS

1. Visit your production URL: `https://your-domain.com/login`
2. Click a provider button
3. Complete OAuth flow
4. Verify you're redirected back and logged in
5. Check DynamoDB tables in AWS Console to see user and session records

---

## Troubleshooting

### "No OAuth providers configured" message

**Cause**: Environment variables not set correctly.

**Fix**:
1. Check `.env` file exists and has correct values
2. Restart backend server after changing `.env`
3. Verify with: `curl http://localhost:8000/auth/providers`

### "Failed to exchange code for token"

**Cause**: OAuth redirect URI mismatch.

**Fix**:
1. Ensure redirect URI in provider console matches exactly
2. For local: `http://localhost:3000/auth/callback/{provider}`
3. No trailing slashes, exact match required

### "Authentication required" when calling /auth/me

**Cause**: Invalid or expired access token.

**Fix**:
1. Check token exists in localStorage
2. Try refreshing the token
3. Log out and log in again

### SQLite database locked error

**Cause**: Multiple processes accessing the database.

**Fix**:
```bash
cd backend
rm auth.db
# Restart backend server
```

### DynamoDB access denied

**Cause**: Lambda role doesn't have DynamoDB permissions.

**Fix**: Add the DynamoDB policy shown in Step 4 of AWS deployment.

---

## Security Notes

1. **Never commit `.env` files** - they contain secrets
2. **Use strong JWT secret keys** in production (32+ characters)
3. **Enable HTTPS** in production (OAuth requires it)
4. **Rotate secrets** periodically
5. **Monitor** DynamoDB for suspicious activity
6. **Set up CloudWatch alarms** for failed authentication attempts

---

## Next Steps

- Protect existing API routes with authentication
- Add user profile page
- Implement role-based access control
- Add email/password authentication (optional)
- Set up session monitoring dashboard

---

## Support

If you encounter issues:
1. Check backend logs: `cd backend && python app.py`
2. Check frontend console: Browser DevTools (F12)
3. Verify environment variables are set
4. Test OAuth provider configuration separately

For AWS issues:
- Check Lambda logs in CloudWatch
- Verify DynamoDB table configuration
- Check IAM role permissions
