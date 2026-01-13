# Testing Excel File Updates

## How to Test Excel File Changes

The backend reads the Excel file **on every API request**, so changes are reflected immediately without restarting the server.

### Quick Test Steps:

1. **Check current data:**
   ```bash
   cd /Users/rashedahmed/Documents/DEVOPSIS/IUT02
   source venv/bin/activate
   python test_excel_update.py
   ```

2. **Make a change to the Excel file:**
   - Open: `/Users/rashedahmed/Documents/DEVOPSIS/IUT02/i.02 blanket distribution 2026.xlsx`
   - Edit any cell (e.g., change a name or amount)
   - **Save the file** (important!)

3. **Verify the change:**
   - **Option A:** Refresh your browser at `http://localhost:3000`
   - **Option B:** Run the test script again:
     ```bash
     python test_excel_update.py
     ```
   - **Option C:** Check the API directly:
     ```bash
     curl http://localhost:8000/api/data | python3 -m json.tool | head -50
     ```

### What Happens:

- ✅ Backend reads the Excel file on **every request** (no caching)
- ✅ Changes appear **immediately** after saving the Excel file
- ✅ No need to restart the backend server
- ✅ Just refresh the browser to see updates

### Example Test:

1. Open Excel file
2. Change "Mahfuz" to "Mahfuz Updated" in Sheet1
3. Save the file
4. Refresh browser → You should see "Mahfuz Updated" in the table

### Troubleshooting:

- **Changes not showing?**
  - Make sure you **saved** the Excel file
  - Check if backend is running: `curl http://localhost:8000/health`
  - Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

- **Backend not running?**
  ```bash
  cd backend
  source ../venv/bin/activate
  python app.py
  ```

### Testing Different Scenarios:

1. **Add a new row** → Should appear in the table
2. **Change an amount** → Should update in charts and tables
3. **Modify Sheet2 summary** → Should update summary cards
4. **Add a new sheet** → Will automatically get a new tab

---

**Note:** The Excel file is read fresh on every API call, so there's no caching. Any changes you make will be immediately visible!

