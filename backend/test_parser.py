#!/usr/bin/env python3
"""Test script to debug Excel parser"""
from excel_parser import parse_excel
from pathlib import Path
import traceback

try:
    file_path = Path('../i.02 blanket distribution 2026.xlsx')
    print(f"Testing file: {file_path}")
    print(f"File exists: {file_path.exists()}")
    
    data = parse_excel(file_path)
    print("✓ Parsing successful")
    print(f"  Sheets: {list(data['sheets'].keys())}")
    
except Exception as e:
    print(f"✗ Error: {e}")
    traceback.print_exc()

