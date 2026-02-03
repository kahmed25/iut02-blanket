"""
Import Excel data into Fund Management System
Creates a project and imports all contributions from the Excel file
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pandas as pd
from pathlib import Path
from datetime import datetime
from fund.models import fund_db
from auth.models import db as auth_db

# Excel file path
EXCEL_FILE = Path(__file__).parent.parent / "i.02 blanket distribution 2026.xlsx"

def import_excel_data():
    """Import Excel data as a project with contributions"""
    
    print(f"Reading Excel file: {EXCEL_FILE}")
    
    if not EXCEL_FILE.exists():
        print(f"ERROR: Excel file not found at {EXCEL_FILE}")
        return
    
    # Read the Excel file
    excel_file = pd.ExcelFile(EXCEL_FILE)
    print(f"Found sheets: {excel_file.sheet_names}")
    
    # Get the first sheet (should be the donations/contributions sheet)
    df = pd.read_excel(EXCEL_FILE, sheet_name=excel_file.sheet_names[0])
    
    # Find the header row (contains SN, Name, Payment Mode, Amount, etc.)
    header_row_idx = 0
    for idx, row in df.iterrows():
        row_values = [str(v).strip().lower() for v in row.values if pd.notna(v)]
        if any(keyword in ' '.join(row_values) for keyword in ['sn', 'name', 'payment', 'amount']):
            header_row_idx = idx
            break
    
    print(f"Header row found at index: {header_row_idx}")
    
    # Set the header
    new_columns = []
    for col in df.columns:
        val = df.iloc[header_row_idx][col]
        if pd.notna(val):
            new_columns.append(str(val).strip())
        else:
            new_columns.append(f"Column_{len(new_columns)}")
    
    # Create new dataframe starting from after header row
    df_data = df.iloc[header_row_idx + 1:].copy()
    df_data.columns = new_columns
    df_data = df_data.reset_index(drop=True)
    
    print(f"Columns found: {new_columns}")
    print(f"Total rows: {len(df_data)}")
    
    # Find column names (they might vary)
    name_col = None
    amount_col = None
    payment_col = None
    
    for col in df_data.columns:
        col_lower = col.lower()
        if 'name' in col_lower and 'sn' not in col_lower:
            name_col = col
        elif 'amount' in col_lower:
            amount_col = col
        elif 'payment' in col_lower:
            payment_col = col
    
    print(f"Name column: {name_col}")
    print(f"Amount column: {amount_col}")
    print(f"Payment column: {payment_col}")
    
    if not name_col or not amount_col:
        print("ERROR: Could not find required columns (Name, Amount)")
        return
    
    # Get current user (super admin) for creating the project
    # Try to find the super admin user
    super_admin = auth_db.get_user_by_email("khahmed.rashed@gmail.com")
    if not super_admin:
        print("WARNING: Super admin user not found, using 'system' as creator")
        creator_id = "system"
    else:
        creator_id = super_admin['user_id']
        print(f"Using creator: {super_admin['email']}")
    
    # Calculate total from Excel data
    total_amount = 0
    valid_contributions = []
    
    for idx, row in df_data.iterrows():
        name = row.get(name_col)
        amount = row.get(amount_col)
        payment_mode = row.get(payment_col, 'Cash') if payment_col else 'Cash'
        
        # Skip rows with no name or amount
        if pd.isna(name) or pd.isna(amount):
            continue
        
        # Skip if name is empty string
        if isinstance(name, str) and name.strip() == '':
            continue
            
        # Try to parse amount
        try:
            if isinstance(amount, str):
                amount = float(amount.replace(',', '').strip())
            else:
                amount = float(amount)
            
            if amount <= 0:
                continue
                
        except (ValueError, TypeError):
            continue
        
        # Clean up payment mode
        if pd.isna(payment_mode) or (isinstance(payment_mode, str) and payment_mode.strip() == ''):
            payment_mode = 'Cash'
        else:
            payment_mode = str(payment_mode).strip()
        
        total_amount += amount
        valid_contributions.append({
            'name': str(name).strip(),
            'amount': amount,
            'payment_mode': payment_mode
        })
    
    print(f"\nValid contributions found: {len(valid_contributions)}")
    print(f"Total amount: {total_amount:,.2f} BDT")
    
    # Create the project
    project_name = "Blanket Distribution Winter 2025"
    project_description = "Winter blanket distribution project for 2025. Imported from Excel data."
    
    # Check if project already exists
    existing_projects = fund_db.get_all_projects(include_archived=True)
    for p in existing_projects:
        if p['name'] == project_name:
            print(f"\nProject '{project_name}' already exists with ID: {p['project_id']}")
            print("Skipping project creation. Delete existing project first if you want to re-import.")
            return
    
    # Create project with target amount = total raised (since this is completed data)
    print(f"\nCreating project: {project_name}")
    project = fund_db.create_project(
        name=project_name,
        description=project_description,
        target_amount=total_amount,  # Set target to actual total
        target_currency="BDT",
        created_by=creator_id
    )
    
    project_id = project['project_id']
    print(f"Project created with ID: {project_id}")
    
    # Import contributions
    print(f"\nImporting {len(valid_contributions)} contributions...")
    
    success_count = 0
    error_count = 0
    contribution_date = datetime.now().strftime("%Y-%m-%d")
    
    for i, contrib in enumerate(valid_contributions):
        try:
            fund_db.create_contribution(
                project_id=project_id,
                contributor_name=contrib['name'],
                amount=contrib['amount'],
                currency="BDT",
                payment_mode=contrib['payment_mode'],
                contribution_date=contribution_date,
                entry_type="manual",
                entered_by=creator_id,
                payment_status="completed",
                collection_notes="Imported from Excel"
            )
            success_count += 1
            
            if (i + 1) % 10 == 0:
                print(f"  Imported {i + 1}/{len(valid_contributions)} contributions...")
                
        except Exception as e:
            error_count += 1
            print(f"  ERROR importing contribution for {contrib['name']}: {e}")
    
    print(f"\n=== Import Complete ===")
    print(f"Project: {project_name}")
    print(f"Project ID: {project_id}")
    print(f"Contributions imported: {success_count}")
    print(f"Errors: {error_count}")
    print(f"Total amount: {total_amount:,.2f} BDT")
    
    # Verify by getting project stats
    stats = fund_db.get_project_stats(project_id)
    if stats:
        print(f"\nVerification - Project Stats:")
        print(f"  Total raised: {stats['total_raised']:,.2f} BDT")
        print(f"  Contributors: {stats['unique_contributors']}")
        print(f"  Progress: {stats['progress_percentage']:.1f}%")


if __name__ == "__main__":
    import_excel_data()
