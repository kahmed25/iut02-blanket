"""
Excel file parser to convert Excel data to JSON format
"""
import pandas as pd
from pathlib import Path
from typing import Dict, List, Any
import json


def parse_excel(file_path: Path) -> Dict[str, Any]:
    """
    Parse Excel file and return structured JSON data
    
    Args:
        file_path: Path to the Excel file
        
    Returns:
        Dictionary containing parsed data from all sheets
    """
    try:
        excel_file = pd.ExcelFile(file_path)
        result = {
            "sheets": {},
            "metadata": {
                "file_name": file_path.name,
                "sheet_count": len(excel_file.sheet_names)
            }
        }
        
        # Parse each sheet
        for sheet_name in excel_file.sheet_names:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            result["sheets"][sheet_name] = parse_sheet(df, sheet_name)
        
        return result
    except Exception as e:
        raise Exception(f"Error parsing Excel file: {str(e)}")


def parse_sheet(df: pd.DataFrame, sheet_name: str) -> Dict[str, Any]:
    """
    Parse a single sheet and return structured data
    
    Args:
        df: Pandas DataFrame
        sheet_name: Name of the sheet
        
    Returns:
        Dictionary with parsed sheet data
    """
    # Clean the dataframe - remove completely empty rows and columns
    df = df.dropna(how='all').dropna(axis=1, how='all')
    
    # Reset index
    df = df.reset_index(drop=True)
    
    # Convert to records (list of dictionaries)
    records = []
    
    # For table data sheets (donation records, collection lists, etc.)
    # Check if this looks like a table with headers
    if True:  # Process all sheets as potential tables
        # The first row contains the title, second row is the header
        if len(df) > 0:
            # Use row 0 as header (it contains SN, Name, Payment Mode, etc.)
            header_row_idx = 0
            for idx, row in df.iterrows():
                row_values = [str(v).strip() for v in row.values if pd.notna(v)]
                if any(keyword in ' '.join(row_values).lower() 
                       for keyword in ['sn', 'name', 'payment', 'amount']):
                    header_row_idx = idx
                    break
            
            # Set the header
            new_columns = []
            for col in df.columns:
                val = df.iloc[header_row_idx][col]
                if pd.notna(val):
                    new_columns.append(str(val).strip())
                else:
                    new_columns.append(f"Column_{len(new_columns)}")
            
            # Create new dataframe starting from after header row
            df_new = df.iloc[header_row_idx + 1:].copy()
            df_new.columns = new_columns
            df_new = df_new.reset_index(drop=True)
            
            # Clean column names - remove 'Unnamed' and empty strings
            df_new.columns = [
                col if col and not col.startswith('Unnamed') and col != 'nan' 
                else f"Column_{i}" 
                for i, col in enumerate(df_new.columns)
            ]
            
            # Convert to records
            for _, row in df_new.iterrows():
                record = {}
                for col in df_new.columns:
                    value = row[col]
                    # Handle NaN and empty values
                    if pd.isna(value) or (isinstance(value, str) and value.strip() == ''):
                        record[col] = None
                    elif isinstance(value, float):
                        # Check for NaN, inf, -inf
                        import math
                        if math.isnan(value) or math.isinf(value):
                            record[col] = None
                        else:
                            record[col] = value
                    elif isinstance(value, (int,)):
                        record[col] = value
                    else:
                        record[col] = str(value).strip()
                
                # Only add records that have at least one non-empty value
                if any(v is not None and str(v).strip() != '' for v in record.values()):
                    records.append(record)
            
            # Convert columns to list of strings
            columns_list = [str(col) for col in df_new.columns]
            
            return {
                "type": "table",
                "columns": columns_list,
                "row_count": len(records),
                "data": records
            }
        else:
            # Empty sheet
            return {
                "type": "table",
                "columns": [],
                "row_count": 0,
                "data": []
            }
    
    # For Sheet2 (summary/statistics)
    elif sheet_name == "Sheet2":
        # Parse summary data - look for key-value pairs
        summary = {}
        
        # Look for pairs in the Target/Expense columns
        target_col = None
        expense_col = None
        
        # Find the Target and Expense columns
        for col in df.columns:
            col_str = str(col).strip()
            if 'Target' in col_str or '100000' in col_str:
                target_col = col
            if 'Expense' in col_str:
                expense_col = col
        
        # Parse rows looking for key-value pairs
        for idx, row in df.iterrows():
            # Check Target column area
            if target_col is not None:
                target_key = None
                target_value = None
                
                # Look for text in columns before Target
                for col_idx in range(len(df.columns)):
                    if df.columns[col_idx] == target_col:
                        # Check previous column for key
                        if col_idx > 0:
                            prev_val = row[df.columns[col_idx - 1]]
                            if pd.notna(prev_val):
                                target_key = str(prev_val).strip()
                        # Current column has the value
                        if pd.notna(row[target_col]) and isinstance(row[target_col], (int, float)):
                            import math
                            if not (math.isnan(row[target_col]) or math.isinf(row[target_col])):
                                target_value = float(row[target_col])
                        
                        if target_key and target_value is not None:
                            summary[target_key] = target_value
                        break
            
            # Check Expense column area
            if expense_col is not None:
                expense_key = None
                expense_value = None
                
                for col_idx in range(len(df.columns)):
                    if df.columns[col_idx] == expense_col:
                        # Check previous column for key
                        if col_idx > 0:
                            prev_val = row[df.columns[col_idx - 1]]
                            if pd.notna(prev_val):
                                expense_key = str(prev_val).strip()
                        # Check next column for value
                        if col_idx < len(df.columns) - 1:
                            next_val = row[df.columns[col_idx + 1]]
                            if pd.notna(next_val) and isinstance(next_val, (int, float)):
                                import math
                                if not (math.isnan(next_val) or math.isinf(next_val)):
                                    expense_value = float(next_val)
                        
                        if expense_key and expense_value is not None:
                            summary[expense_key] = expense_value
                        break
        
        return {
            "type": "summary",
            "data": summary,
            "raw_data": df.to_dict('records')
        }
    
    # Default: return as records
    else:
        df.columns = [str(col).strip() if pd.notna(col) else f"Column_{i}" 
                     for i, col in enumerate(df.columns)]
        records = df.to_dict('records')
        # Clean None values
        for record in records:
            for key, value in list(record.items()):
                if pd.isna(value):
                    record[key] = None
    
    return {
        "type": "table",
        "columns": list(df.columns) if len(df) > 0 else [],
        "row_count": len(records),
        "data": records
    }


def get_data_summary(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get summary statistics from parsed data
    
    Args:
        data: Parsed Excel data
        
    Returns:
        Summary statistics
    """
    summary = {
        "total_sheets": len(data.get("sheets", {})),
        "sheet_names": list(data.get("sheets", {}).keys())
    }
    
    return summary

