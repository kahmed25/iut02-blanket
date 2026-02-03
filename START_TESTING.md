# ✅ Ready to Test Authentication!

Everything is configured and ready to go!

## Your Setup Status

✅ Backend is configured with Google OAuth  
✅ Frontend environment is set up  
✅ All dependencies are installed  
✅ Startup scripts are created  

## Start Testing in 2 Steps

### Step 1: Start Backend (Terminal 1)

```bash
cd /Users/rashedahmed/Documents/Devopsis/IUT02/backend
./start_backend.sh
```

You should see:
```
🚀 Starting IUT02 Backend Server with Authentication...

Backend will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs

Press Ctrl+C to stop the server

INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Keep this terminal running!**

### Step 2: Start Frontend (Terminal 2 - New Window)

Open a **new terminal window** and run:

```bash
cd /Users/rashedahmed/Documents/Devopsis/IUT02/frontend
./start_frontend.sh
```

You should see:
```
🚀 Starting IUT02 Frontend with Authentication...

Frontend will be available at: http://localhost:3000
Login page: http://localhost:3000/login

Local:        http://localhost:3000
✓ Ready in X.Xs
```

**Keep this terminal running too!**

---

## Test Login

### Option 1: Direct to Login Page

Open your browser and go to:
```
http://localhost:3000/login
```

### Option 2: Check Backend First

Open your browser and go to:
```
http://localhost:8000/
```

You should see API information with auth endpoints listed.

---

## Complete the Login Flow

1. Click "**Continue with Google**" button
2. Sign in with your Google account
3. Grant permissions when asked
4. You'll be redirected back to the app
5. **You're now logged in!** ✅

---

## Verify Authentication

### Check Tokens (Browser Console)

1. Press **F12** (or Cmd+Option+I on Mac)
2. Go to "Console" tab
3. Type:
   ```javascript
   localStorage.getItem('iut02_access_token')
   ```
4. You should see a JWT token!

### Check User Info (Terminal)

In a new terminal:

```bash
# Get your access token from browser console first, then:
TOKEN="paste-your-token-here"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/auth/me
```

You should see your user information!

### Check Database

```bash
cd /Users/rashedahmed/Documents/Devopsis/IUT02/backend
sqlite3 auth.db "SELECT email, provider, created_at FROM users;"
```

You should see your user record!

---

## Available Endpoints

### Authentication
- `http://localhost:8000/auth/providers` - List configured providers
- `http://localhost:8000/auth/me` - Get current user (requires auth)
- `http://localhost:8000/auth/login/google` - Start Google login

### Application
- `http://localhost:3000/` - Home page
- `http://localhost:3000/login` - Login page

### API Documentation
- `http://localhost:8000/docs` - Interactive API docs (Swagger)

---

## Stop Servers

When you're done testing:

1. **Backend**: Go to Terminal 1 and press `Ctrl+C`
2. **Frontend**: Go to Terminal 2 and press `Ctrl+C`

---

## Troubleshooting

### Port Already in Use

If you see "Address already in use" error:

**For Backend (port 8000):**
```bash
lsof -ti:8000 | xargs kill -9
```

**For Frontend (port 3000):**
```bash
lsof -ti:3000 | xargs kill -9
```

Then try starting the servers again.

### Backend Shows Errors

```bash
cd /Users/rashedahmed/Documents/Devopsis/IUT02/backend
pip3 install -r requirements.txt
```

### Frontend Shows Errors

```bash
cd /Users/rashedahmed/Documents/Devopsis/IUT02/frontend
rm -rf node_modules package-lock.json
npm install
```

---

## What's Configured

### Backend (.env)
- ✅ Google OAuth credentials configured
- ✅ JWT secret key set
- ✅ Local environment (SQLite database)
- ✅ Frontend URL configured

### Frontend (.env.local)
- ✅ API URL pointing to localhost:8000

---

## Next Steps After Testing

1. ✅ Test complete login flow
2. ✅ Verify user data in database
3. ✅ Test logout (if implemented in UI)
4. Add Facebook or Amazon OAuth (optional)
5. Deploy to AWS (when ready)

---

## Success! 🎉

You're all set to test the authentication system!

**Start with Step 1 above** and you'll be logged in within minutes.

Cost: **$0.00** - Everything is free for local testing!
