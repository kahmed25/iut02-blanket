# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Step 2: Start Backend (Terminal 1)
```bash
./start_backend.sh
```
Or manually:
```bash
source venv/bin/activate
cd backend
python app.py
```

### Step 3: Start Frontend (Terminal 2)
```bash
./start_frontend.sh
```
Or manually:
```bash
cd frontend
npm run dev
```

### Step 4: Open Browser
Navigate to: **http://localhost:3000**

## ✅ Verify Everything Works

1. **Backend Health Check**: http://localhost:8000/health
2. **API Data**: http://localhost:8000/api/data
3. **API Images**: http://localhost:8000/api/images
4. **Frontend**: http://localhost:3000

## 📝 What You Should See

- **Header**: Title from Excel file
- **Summary Cards**: Statistics from Sheet2 (Target, Collection, Expenses, etc.)
- **Data Table**: Donation records from Sheet1
- **Image Gallery**: All images from the `images/` directory

## 🐛 Troubleshooting

### Backend won't start
- Check if port 8000 is available: `lsof -i :8000`
- Make sure venv is activated: `source venv/bin/activate`
- Verify Excel file exists: `ls -la "i.02 blanket distribution 2026.xlsx"`

### Frontend won't start
- Check if port 3000 is available: `lsof -i :3000`
- Install dependencies: `cd frontend && npm install`
- Check Node.js version: `node --version` (should be 18+)

### No data showing
- Check browser console for errors (F12)
- Verify backend is running: http://localhost:8000/health
- Check CORS settings in `backend/app.py`

### Images not showing
- Verify images are in `images/` directory
- Check image format (should be .jpg, .jpeg, .png, .gif, .webp)
- Test image URL: http://localhost:8000/images/[filename]

## 📚 Next Steps

Once Phase 1 is working:
- Test with different Excel files
- Customize the UI styling
- Prepare for Phase 2 (online data source)

