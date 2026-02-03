#!/usr/bin/env python3
"""
Generate Excel import templates for project import feature.
Creates both empty template and example template with sample data.
"""

import openpyxl
from openpyxl.styles import Font, PatternFill, Border, Side
from openpyxl.utils import get_column_letter
import os

# Configuration
SUPPORTED_CURRENCIES = ["BDT", "USD", "CAD", "AUD", "EUR", "GBP"]
PAYMENT_MODES = ["Bkash", "Nagad", "Bank Transfer", "Cash", "Card", "Mobile Money", "Other"]
INSTITUTION_TYPES = [
    "School",
    "Orphanage", 
    "Hospital",
    "Community Center",
    "Religious Institution",
    "NGO",
    "Government Agency",
    "Individual/Family",
    "Other"
]


def create_project_info_sheet(wb, with_example=False):
    """Create Project Info sheet"""
    ws = wb.create_sheet("Project Info")
    
    # Define styles locally
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid")
    required_fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")
    
    # Headers
    ws['A1'] = "Field"
    ws['B1'] = "Value"
    ws['A1'].font = header_font
    ws['A1'].fill = header_fill
    ws['B1'].font = header_font
    ws['B1'].fill = header_fill
    
    # Fields
    fields = [
        ("Project Name", "Winter Blanket Distribution 2026" if with_example else ""),
        ("Description", "Providing warm blankets to families in need during winter season" if with_example else ""),
        ("Target Amount", 100000 if with_example else ""),
        ("Currency", "BDT" if with_example else "BDT"),
        ("Status", "active" if with_example else "active"),
    ]
    
    for i, (field, value) in enumerate(fields, start=2):
        ws[f'A{i}'] = field
        ws[f'B{i}'] = value
        if field in ["Project Name", "Target Amount"]:
            ws[f'A{i}'].fill = required_fill
    
    # Set column widths
    ws.column_dimensions['A'].width = 20
    ws.column_dimensions['B'].width = 50
    
    # Add notes
    ws['A8'] = "Notes:"
    ws['A9'] = f"- Supported currencies: {', '.join(SUPPORTED_CURRENCIES)}"
    ws['A10'] = "- Status options: active, paused, completed"
    ws['A11'] = "- Yellow fields are required"
    
    return ws


def create_contributions_sheet(wb, with_example=False):
    """Create Contributions sheet"""
    ws = wb.create_sheet("Contributions")
    
    # Define styles locally
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid")
    thin_border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # Headers
    headers = ["Contributor Name", "Amount", "Payment Mode", "Payment Status", "Date (YYYY-MM-DD)", "Notes"]
    for col, header in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.border = thin_border
    
    # Description row
    descriptions = ["(Required)", "(Required)", "(Required)", "(Optional: completed/pending/failed)", "(Optional)", "(Optional)"]
    for col, desc in enumerate(descriptions, start=1):
        cell = ws.cell(row=2, column=col, value=desc)
        cell.font = Font(italic=True, size=9)
    
    # Example data
    if with_example:
        example_data = [
            ("Ahmed Rahman", 5000, "Bkash", "completed", "2026-01-15", "Monthly donation"),
            ("Fatima Khan", 10000, "Bank Transfer", "completed", "2026-01-16", ""),
            ("Kabir Hossain", 2500, "Cash", "completed", "2026-01-17", "Collected at office"),
            ("Nadia Islam", 7500, "Nagad", "completed", "2026-01-18", ""),
            ("Rashid Ali", 3000, "Card", "completed", "2026-01-19", "Online payment"),
            ("Sadia Begum", 15000, "Bank Transfer", "completed", "2026-01-20", "Corporate donation"),
            ("Tariq Mahmud", 5000, "Bkash", "pending", "2026-01-21", "Awaiting confirmation"),
            ("Yasmin Akter", 2000, "Cash", "completed", "2026-01-22", ""),
        ]
        
        for row_num, data in enumerate(example_data, start=3):
            for col_num, value in enumerate(data, start=1):
                ws.cell(row=row_num, column=col_num, value=value)
    
    # Set column widths
    widths = [25, 15, 20, 20, 20, 35]
    for col, width in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(col)].width = width
    
    # Add notes below data
    note_row = 15 if with_example else 5
    ws[f'A{note_row}'] = "Notes:"
    ws[f'A{note_row + 1}'] = f"- Payment modes: {', '.join(PAYMENT_MODES)}"
    ws[f'A{note_row + 2}'] = "- Payment status defaults to 'completed' if not specified"
    ws[f'A{note_row + 3}'] = "- Date defaults to today if not specified"
    
    return ws


def create_distributions_sheet(wb, with_example=False):
    """Create Distributions sheet"""
    ws = wb.create_sheet("Distributions")
    
    # Define styles locally
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid")
    thin_border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # Headers
    headers = ["Institution Type", "Institution Name", "Amount", "Currency", "Date (YYYY-MM-DD)", "Notes"]
    for col, header in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.border = thin_border
    
    # Description row
    descriptions = ["(Required)", "(Required)", "(Required)", "(Optional: defaults to BDT)", "(Required)", "(Optional)"]
    for col, desc in enumerate(descriptions, start=1):
        cell = ws.cell(row=2, column=col, value=desc)
        cell.font = Font(italic=True, size=9)
    
    # Example data
    if with_example:
        example_data = [
            ("School", "Dhaka Primary School", 25000, "BDT", "2026-01-25", "50 blankets distributed"),
            ("Orphanage", "Hope Children's Home", 30000, "BDT", "2026-01-26", "60 blankets for 60 children"),
            ("Community Center", "Mirpur Community Hall", 15000, "BDT", "2026-01-27", "30 blankets for elderly"),
            ("Individual/Family", "Flood Affected Families - Sylhet", 20000, "BDT", "2026-01-28", "40 blankets distributed"),
        ]
        
        for row_num, data in enumerate(example_data, start=3):
            for col_num, value in enumerate(data, start=1):
                ws.cell(row=row_num, column=col_num, value=value)
    
    # Set column widths
    widths = [25, 35, 15, 15, 20, 40]
    for col, width in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(col)].width = width
    
    # Add notes below data
    note_row = 12 if with_example else 5
    ws[f'A{note_row}'] = "Notes:"
    ws[f'A{note_row + 1}'] = f"- Institution types: {', '.join(INSTITUTION_TYPES)}"
    ws[f'A{note_row + 2}'] = f"- Supported currencies: {', '.join(SUPPORTED_CURRENCIES)}"
    ws[f'A{note_row + 3}'] = "- Currency defaults to project currency if not specified"
    
    return ws


def create_instructions_sheet(wb):
    """Create Instructions sheet"""
    ws = wb.create_sheet("Instructions")
    
    instructions = [
        "IUT02 Care - Project Import Template",
        "",
        "HOW TO USE THIS TEMPLATE:",
        "",
        "1. PROJECT INFO SHEET (Required)",
        "   - Fill in your project details",
        "   - Project Name and Target Amount are required",
        "   - Currency defaults to BDT if not specified",
        "   - Status defaults to 'active' if not specified",
        "",
        "2. CONTRIBUTIONS SHEET (Optional)",
        "   - Add contribution records for the project",
        "   - Contributor Name, Amount, and Payment Mode are required",
        "   - Leave empty if no contributions to import",
        "",
        "3. DISTRIBUTIONS SHEET (Optional)",
        "   - Add fund distribution records",
        "   - Institution Type, Institution Name, Amount, and Date are required",
        "   - Leave empty if no distributions to import",
        "",
        "SUPPORTED VALUES:",
        "",
        f"Currencies: {', '.join(SUPPORTED_CURRENCIES)}",
        "",
        f"Payment Modes: {', '.join(PAYMENT_MODES)}",
        "",
        f"Institution Types: {', '.join(INSTITUTION_TYPES)}",
        "",
        "Project Status: active, paused, completed",
        "",
        "Payment Status: completed, pending, failed",
        "",
        "TIPS:",
        "- Date format: YYYY-MM-DD (e.g., 2026-01-15)",
        "- Do not modify the header rows",
        "- You can delete example data rows",
        "- Empty rows will be skipped during import",
        "",
        "For help, contact the IUT02 Care admin team.",
    ]
    
    for i, line in enumerate(instructions, start=1):
        ws[f'A{i}'] = line
        if i == 1:
            ws[f'A{i}'].font = Font(bold=True, size=14)
        elif line.endswith(':') and not line.startswith(' '):
            ws[f'A{i}'].font = Font(bold=True)
    
    ws.column_dimensions['A'].width = 80
    
    return ws


def generate_templates():
    """Generate both empty and example templates"""
    templates_dir = os.path.join(os.path.dirname(__file__), 'templates')
    os.makedirs(templates_dir, exist_ok=True)
    
    # Generate empty template
    wb_empty = openpyxl.Workbook()
    # Remove default sheet
    wb_empty.remove(wb_empty.active)
    
    create_project_info_sheet(wb_empty, with_example=False)
    create_contributions_sheet(wb_empty, with_example=False)
    create_distributions_sheet(wb_empty, with_example=False)
    create_instructions_sheet(wb_empty)
    
    empty_path = os.path.join(templates_dir, 'project_import_template.xlsx')
    wb_empty.save(empty_path)
    print(f"✓ Created: {empty_path}")
    
    # Generate example template
    wb_example = openpyxl.Workbook()
    wb_example.remove(wb_example.active)
    
    create_project_info_sheet(wb_example, with_example=True)
    create_contributions_sheet(wb_example, with_example=True)
    create_distributions_sheet(wb_example, with_example=True)
    create_instructions_sheet(wb_example)
    
    example_path = os.path.join(templates_dir, 'project_import_example.xlsx')
    wb_example.save(example_path)
    print(f"✓ Created: {example_path}")
    
    print("\nTemplates generated successfully!")


if __name__ == "__main__":
    generate_templates()
