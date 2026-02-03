# Amazon OAuth Setup Guide (Login with Amazon)

## Step 1: Create Amazon Developer Account

1. Go to [Amazon Developer Console](https://developer.amazon.com/)
2. Click **Sign In** (top right)
3. Sign in with your Amazon account
4. If first time: Complete the developer registration
   - Accept developer agreement
   - Fill in developer profile

## Step 2: Create Security Profile

1. After logging in, go to **Login with Amazon** section
2. Click **"Create a New Security Profile"** button
3. Fill in the form:
   - **Security Profile Name**: IUT02
   - **Security Profile Description**: OAuth authentication for IUT02 app
   - **Consent Privacy Notice URL**: `http://localhost:3000/privacy` (can be placeholder for dev)
4. Click **"Save"**

## Step 3: Configure Web Settings

1. After creating the profile, click on the **gear icon** (⚙️) next to your profile
2. Select **"Web Settings"**
3. Click **"Edit"**
4. Add **Allowed Origins**:
   ```
   http://localhost:8000
   ```
5. Add **Allowed Return URLs**:
   ```
   http://localhost:8000/auth/callback/amazon
   ```
6. Click **"Save"**

## Step 4: Get Client Credentials

1. In the Security Profile page, you'll see:
   - **Client ID** - copy this
   - **Client Secret** - click **"Show Secret"**, then copy it

## Step 5: Configure Backend .env

Add these to `/backend/.env`:

```bash
# Amazon OAuth
AMAZON_CLIENT_ID=your_client_id_here
AMAZON_CLIENT_SECRET=your_client_secret_here
AMAZON_REDIRECT_URI=http://localhost:8000/auth/callback/amazon
```

## Step 6: Restart Backend

```bash
# Stop current backend
lsof -ti:8000 | xargs kill -9

# Start backend
cd /Users/rashedahmed/Documents/Devopsis/IUT02/backend
python3 app.py &
```

## Step 7: Test

1. Go to `http://localhost:3000/login`
2. **"Continue with Amazon"** button should now be enabled (orange button)
3. Click it to test the login flow

## Important Notes

- Login with Amazon works in development mode automatically for localhost
- No app review needed for testing
- Amazon only returns basic profile info (name, user_id, email)
- Email permission is included by default in the `profile` scope

## Production Setup (for AWS deployment)

When deploying to production:

1. In Security Profile → Web Settings:
   - **Allowed Origins**: `https://your-api-domain.com`
   - **Allowed Return URLs**: `https://your-api-domain.com/auth/callback/amazon`
2. Update backend .env:
   - `AMAZON_REDIRECT_URI=https://your-api-domain.com/auth/callback/amazon`
3. Update Privacy Notice URL to a real privacy policy page

## Troubleshooting

**Error: "Invalid redirect_uri"**
- Make sure `http://localhost:8000` is in Allowed Origins
- Make sure `http://localhost:8000/auth/callback/amazon` is in Allowed Return URLs
- Check that redirect URI in .env exactly matches

**Error: "Invalid client_id"**
- Double-check Client ID from Security Profile matches .env
- Make sure there are no extra spaces in the .env values
