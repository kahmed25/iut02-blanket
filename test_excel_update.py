#!/usr/bin/env python3
"""
Test script to verify Excel file changes are reflected in the API
"""
import requests
import time
import json

API_URL = "http://localhost:8000/api/data"

def test_api():
    """Test the API and show current data"""
    try:
        print("=" * 60)
        print("Testing Excel File Updates")
        print("=" * 60)
        
        response = requests.get(API_URL, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success'):
                sheets = data['data']['sheets']
                
                print("\n✓ API is working!")
                print(f"\nAvailable sheets: {list(sheets.keys())}")
                
                # Show Sheet1 info
                if 'Sheet1' in sheets:
                    sheet1 = sheets['Sheet1']
                    row_count = len(sheet1.get('data', []))
                    print(f"\nSheet1 - Row count: {row_count}")
                    
                    if row_count > 0:
                        print("\nFirst 3 records:")
                        for i, record in enumerate(sheet1['data'][:3], 1):
                            name = record.get('Name', 'N/A')
                            amount = record.get('Amount (BDT)', 'N/A')
                            print(f"  {i}. {name}: {amount} BDT")
                
                # Show Sheet2 summary
                if 'Sheet2' in sheets:
                    sheet2 = sheets['Sheet2']
                    if sheet2.get('data'):
                        print(f"\nSheet2 - Summary keys: {list(sheet2['data'].keys())}")
                
                print("\n" + "=" * 60)
                print("INSTRUCTIONS:")
                print("=" * 60)
                print("1. Open the Excel file:")
                print("   /Users/rashedahmed/Documents/DEVOPSIS/IUT02/i.02 blanket distribution 2026.xlsx")
                print("\n2. Make a change (e.g., update a name or amount)")
                print("\n3. Save the Excel file")
                print("\n4. Refresh your browser at http://localhost:3000")
                print("   OR run this script again to see the changes")
                print("\n5. The backend reads the file on each request,")
                print("   so changes should appear immediately!")
                print("=" * 60)
                
            else:
                print("✗ API returned success=false")
        else:
            print(f"✗ API returned status code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to backend API")
        print("Make sure the backend is running:")
        print("  cd backend && python app.py")
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    test_api()

