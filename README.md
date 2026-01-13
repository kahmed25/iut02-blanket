# Excel Data Visualization Application

A modern web application that reads data from Excel files and displays it in a beautiful, Sway-like presentation format.

## Features

- 📊 **Dynamic Data Loading**: Fetches data from Excel files on page load
- 🎨 **Beautiful UI**: Modern, responsive design with smooth animations
- 🖼️ **Image Gallery**: Displays images from local or online sources
- 📱 **Responsive**: Works on desktop, tablet, and mobile devices
- 🔄 **Real-time Updates**: No need to rebuild when data changes

## Project Structure

```
IUT02/
├── backend/              # FastAPI backend
│   ├── app.py           # Main FastAPI application
│   ├── excel_parser.py  # Excel parsing logic
│   ├── config.py       # Configuration settings
│   └── requirements.txt # Python dependencies
├── frontend/            # Next.js frontend
│   ├── app/            # Next.js app directory
│   ├── components/     # React components
│   ├── services/       # API service functions
│   └── package.json    # Node.js dependencies
├── images/             # Image files (served by backend)
├── venv/               # Python virtual environment
└── i.02 blanket distribution 2026.xlsx  # Excel data file
```

## Setup Instructions

### Prerequisites

- Python 3.8+ (with venv support)
- Node.js 18+ and npm
- Excel file: `i.02 blanket distribution 2026.xlsx`
- Image files in the `images/` directory

### Backend Setup

1. **Activate virtual environment** (if not already activated):
   ```bash
   cd /Users/rashedahmed/Documents/DEVOPSIS/IUT02
   source venv/bin/activate
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Start the backend server**:
   ```bash
   cd backend
   python app.py
   ```
   
   The API will be available at `http://localhost:8000`
   
   You can test it by visiting:
   - `http://localhost:8000/` - API root
   - `http://localhost:8000/api/data` - Excel data
   - `http://localhost:8000/api/images` - Image list
   - `http://localhost:8000/docs` - API documentation

### Frontend Setup

1. **Install Node.js dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   
   The frontend will be available at `http://localhost:3000`

### Running Both Servers

You'll need two terminal windows:

**Terminal 1 (Backend)**:
```bash
cd /Users/rashedahmed/Documents/DEVOPSIS/IUT02
source venv/bin/activate
cd backend
python app.py
```

**Terminal 2 (Frontend)**:
```bash
cd /Users/rashedahmed/Documents/DEVOPSIS/IUT02/frontend
npm run dev
```

Then open your browser to `http://localhost:3000`

## Configuration

### Backend Configuration

Edit `backend/config.py` to change:
- Excel file path
- Images directory
- API host and port
- CORS origins

### Frontend Configuration

Edit `frontend/services/api.ts` to change:
- API base URL (default: `http://localhost:8000`)

Or set environment variable:
```bash
export NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Excel File Format

The application expects Excel files with:
- **Sheet1**: Table data with headers (e.g., donation records)
- **Sheet2**: Summary/statistics data (key-value pairs)

The parser automatically detects:
- Column headers
- Data rows
- Summary statistics

## Image Handling

Place image files (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`) in the `images/` directory. They will be automatically served by the backend and displayed in the gallery.

## Development

### Backend Development

- API uses FastAPI with automatic documentation at `/docs`
- Excel parsing uses pandas and openpyxl
- Images are served as static files

### Frontend Development

- Built with Next.js 14 (App Router)
- Uses TypeScript for type safety
- Styled with Tailwind CSS
- Components are in `components/` directory

## Troubleshooting

### Backend Issues

1. **Excel file not found**:
   - Check that the file exists at the path specified in `config.py`
   - Verify the file name matches exactly

2. **Import errors**:
   - Make sure virtual environment is activated
   - Run `pip install -r backend/requirements.txt`

3. **Port already in use**:
   - Change the port in `config.py` or `app.py`
   - Or kill the process using port 8000

### Frontend Issues

1. **Cannot connect to API**:
   - Verify backend is running on port 8000
   - Check CORS settings in `backend/app.py`
   - Verify `NEXT_PUBLIC_API_URL` is set correctly

2. **Build errors**:
   - Run `npm install` again
   - Clear `.next` directory: `rm -rf .next`
   - Check Node.js version (requires 18+)

## Next Steps (Phase 2)

- Upload Excel file to GitHub/S3
- Update backend to fetch from URL
- Configure for online image hosting
- Prepare for AWS deployment

## License

Free and open source for internal use.

