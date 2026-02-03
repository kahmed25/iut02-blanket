# Facebook OAuth Setup Guide

## Step 1: Login to Facebook Developers

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"Log In"** in top right
3. Log in with your Facebook account
4. If this is your first time, you'll need to:
   - Accept developer terms
   - Verify your account (email/phone)

## Step 2: Create Facebook App

1. After logging in, click **"My Apps"** in top right
2. Click **"Create App"** button (green button)
3. Choose **"Consumer"** as app type → Click **"Next"**
4. Fill in app details:
   - **App Name**: IUT02 (or your preferred name)
   - **App Contact Email**: Your email
5. Click **"Create App"**
6. Complete security check if prompted

## Step 3: Add Facebook Login Product

1. You'll see your app dashboard with various products
2. Scroll down to find **"Facebook Login"** card
3. Click **"Set Up"** button on the Facebook Login card
4. Choose **"Web"** as platform (click the Web icon)
5. Enter Site URL: `http://localhost:8000` → Click **"Save"** → Click **"Continue"**
6. You can skip the remaining quickstart steps by clicking **"Next"** through them

## Step 4: Configure OAuth Settings

1. In left sidebar, go to **"Facebook Login"** → **"Settings"**
2. Under **"Valid OAuth Redirect URIs"**, add:
   ```
   http://localhost:8000/auth/callback/facebook
   ```
3. Click **"Save Changes"** at bottom

## Step 5: Get App Credentials

1. In left sidebar, go to **"Settings"** → **"Basic"**
2. You'll see your credentials:
   - **App ID** - copy this (this is your Client ID)
   - **App Secret** - click **"Show"** button, complete security check, then copy it

## Step 6: Configure Backend .env

Add these to `/backend/.env`:

```bash
# Facebook OAuth
FACEBOOK_CLIENT_ID=your_app_id_here
FACEBOOK_CLIENT_SECRET=your_app_secret_here
FACEBOOK_REDIRECT_URI=http://localhost:8000/auth/callback/facebook
```

## Step 7: Restart Backend

```bash
# Stop current backend
lsof -ti:8000 | xargs kill -9

# Start backend
cd /Users/rashedahmed/Documents/Devopsis/IUT02/backend
source venv/bin/activate
python app.py &
```

## Step 8: Test

1. Go to `http://localhost:3000/login`
2. **"Continue with Facebook"** button should now be enabled (no "Not configured" badge)
3. Click it to test the login flow

## Important Notes

- Facebook apps start in **Development Mode** - only you and added test users can log in
- To allow anyone to log in, you need to switch to **Live Mode** (requires app review)
- For development/testing, Development Mode is fine
- To add test users: **"Roles"** → **"Test Users"** → **"Add"**

## Production Setup (for AWS deployment)

When deploying to production, update redirect URI in both:
1. Facebook app settings: `https://your-api-domain.com/auth/callback/facebook`
2. Backend .env: `FACEBOOK_REDIRECT_URI=https://your-api-domain.com/auth/callback/facebook`
