#!/usr/bin/env python3
"""
Quick script to examine Excel file structure
"""
import sys

try:
    import pandas as pd
    import openpyxl
    
    file_path = 'i.02 blanket distribution 2026.xlsx'
    
    # Get sheet names
    excel_file = pd.ExcelFile(file_path)
    print("=" * 60)
    print("EXCEL FILE ANALYSIS")
    print("=" * 60)
    print(f"\nSheet Names: {excel_file.sheet_names}")
    
    # Analyze each sheet
    for sheet_name in excel_file.sheet_names:
        print(f"\n{'='*60}")
        print(f"SHEET: {sheet_name}")
        print(f"{'='*60}")
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        print(f"Shape: {df.shape[0]} rows x {df.shape[1]} columns")
        print(f"\nColumns:")
        for i, col in enumerate(df.columns, 1):
            print(f"  {i}. {col}")
        print(f"\nFirst 5 rows:")
        print(df.head().to_string())
        print(f"\nData types:")
        print(df.dtypes)
        
except ImportError:
    print("Required libraries not installed.")
    print("Install with: pip install pandas openpyxl")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

