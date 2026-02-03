"""
Phase 5: Fund Management API Routes
Projects, Contributions, Settings, and Statistics endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
import openpyxl
import os
import tempfile

from fund.models import fund_db
from auth.models import db as auth_db
from middleware.auth_middleware import (
    get_current_user, require_admin, require_super_admin,
    require_fund_admin_or_above, check_project_access
)
from auth.auth_config import (
    ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_FUND_ADMIN, ROLE_USER,
    VALID_ROLES, SUPPORTED_CURRENCIES, PAYMENT_MODES
)

# Create router
router = APIRouter(prefix="/api", tags=["fund-management"])


# =============================================================================
# Pydantic Models (Request/Response Schemas)
# =============================================================================

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    target_amount: float = Field(..., ge=0)
    target_currency: str = Field(default="BDT")


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    target_amount: Optional[float] = Field(None, ge=0)
    target_currency: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|paused|completed|cancelled|archived)$")


class ContributionCreate(BaseModel):
    project_id: str
    contributor_name: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., gt=0)
    currency: str = Field(default="BDT")
    payment_mode: str
    contribution_date: str  # YYYY-MM-DD format
    collection_notes: Optional[str] = None


class ContributionUpdate(BaseModel):
    contributor_name: Optional[str] = Field(None, min_length=1, max_length=200)
    amount: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = None
    payment_mode: Optional[str] = None
    contribution_date: Optional[str] = None
    collection_notes: Optional[str] = None
    payment_status: Optional[str] = Field(None, pattern="^(pending|completed|failed)$")


class SettingsUpdate(BaseModel):
    data_source_mode: Optional[str] = Field(None, pattern="^(excel|dynamic)$")
    default_currency: Optional[str] = None
    email_notifications_enabled: Optional[str] = Field(None, pattern="^(true|false)$")


class UserRoleUpdate(BaseModel):
    role: str


class ProjectAssignment(BaseModel):
    project_id: str


# =============================================================================
# Project Endpoints
# =============================================================================

@router.post("/projects")
async def create_project(
    project: ProjectCreate,
    current_user: dict = Depends(require_admin())
):
    """Create a new charity project (Admin/Super Admin only)"""
    if project.target_currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid currency. Supported: {', '.join(SUPPORTED_CURRENCIES)}"
        )
    
    result = fund_db.create_project(
        name=project.name,
        description=project.description,
        target_amount=project.target_amount,
        target_currency=project.target_currency,
        created_by=current_user['user_id']
    )
    
    return {"success": True, "project": result}


@router.get("/projects")
async def list_projects(
    include_archived: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """List all projects (all authenticated users)"""
    projects = fund_db.get_all_projects(include_archived=include_archived)
    
    # Add stats to each project
    for project in projects:
        stats = fund_db.get_project_stats(project['project_id'])
        if stats:
            project['total_raised'] = stats['total_raised']
            project['progress_percentage'] = stats['progress_percentage']
            project['total_contributions'] = stats['total_contributions']
    
    return {"success": True, "projects": projects}


@router.get("/projects/{project_id}")
async def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get project details (all authenticated users)"""
    project = fund_db.get_project_by_id(project_id)
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get full stats
    stats = fund_db.get_project_stats(project_id)
    
    return {"success": True, "project": project, "stats": stats}


@router.patch("/projects/{project_id}")
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    current_user: dict = Depends(require_admin())
):
    """Update a project (Admin/Super Admin only)"""
    existing = fund_db.get_project_by_id(project_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project_update.dict(exclude_unset=True)
    
    if 'target_currency' in update_data and update_data['target_currency'] not in SUPPORTED_CURRENCIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid currency. Supported: {', '.join(SUPPORTED_CURRENCIES)}"
        )
    
    success = fund_db.update_project(project_id, **update_data)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update project")
    
    updated = fund_db.get_project_by_id(project_id)
    return {"success": True, "project": updated}


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    current_user: dict = Depends(require_admin())
):
    """Delete a project and all its contributions (Admin/Super Admin only)"""
    existing = fund_db.get_project_by_id(project_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    success = fund_db.delete_project(project_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete project")
    
    return {"success": True, "message": "Project deleted"}


# =============================================================================
# Project Import Endpoints
# =============================================================================

@router.get("/projects/import/template")
async def download_import_template(
    with_example: bool = False,
    current_user: dict = Depends(require_admin())
):
    """Download project import Excel template (Admin/Super Admin only)"""
    template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates')
    
    if with_example:
        template_path = os.path.join(template_dir, 'project_import_example.xlsx')
    else:
        template_path = os.path.join(template_dir, 'project_import_template.xlsx')
    
    if not os.path.exists(template_path):
        raise HTTPException(status_code=404, detail="Template file not found")
    
    filename = 'project_import_example.xlsx' if with_example else 'project_import_template.xlsx'
    return FileResponse(
        template_path,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename=filename
    )


@router.post("/projects/import")
async def import_project(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin())
):
    """Import a project with contributions from Excel file (Admin/Super Admin only)"""
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an Excel file (.xlsx or .xls)"
        )
    
    # Save uploaded file temporarily
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
    try:
        content = await file.read()
        temp_file.write(content)
        temp_file.close()
        
        # Parse Excel file
        wb = openpyxl.load_workbook(temp_file.name)
        
        # Validate required sheets
        if 'Project Info' not in wb.sheetnames:
            raise HTTPException(
                status_code=400,
                detail="Missing 'Project Info' sheet in the Excel file"
            )
        
        # Parse Project Info sheet
        ws_project = wb['Project Info']
        project_data = {}
        
        for row in range(2, ws_project.max_row + 1):
            field = ws_project.cell(row=row, column=1).value
            value = ws_project.cell(row=row, column=2).value
            
            if field == 'Project Name':
                project_data['name'] = value
            elif field == 'Description':
                project_data['description'] = value
            elif field == 'Target Amount':
                project_data['target_amount'] = float(value) if value else 0
            elif field == 'Currency':
                project_data['currency'] = value or 'BDT'
            elif field == 'Status':
                project_data['status'] = value or 'active'
        
        # Validate required project fields
        if not project_data.get('name'):
            raise HTTPException(
                status_code=400,
                detail="Project Name is required in the 'Project Info' sheet"
            )
        
        if not project_data.get('target_amount'):
            raise HTTPException(
                status_code=400,
                detail="Target Amount is required in the 'Project Info' sheet"
            )
        
        # Validate and normalize currency (case-insensitive)
        currency_raw = project_data.get('currency', 'BDT')
        currency_matched = None
        for curr in SUPPORTED_CURRENCIES:
            if curr.upper() == currency_raw.upper():
                currency_matched = curr
                break
        if not currency_matched:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid currency. Supported: {', '.join(SUPPORTED_CURRENCIES)}"
            )
        project_data['currency'] = currency_matched
        
        # Validate and normalize status (case-insensitive)
        valid_statuses = ['active', 'paused', 'completed', 'cancelled', 'archived']
        status_raw = project_data.get('status', 'active').lower().strip()
        if status_raw not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Supported: {', '.join(valid_statuses)}"
            )
        project_data['status'] = status_raw
        
        # Create the project
        project = fund_db.create_project(
            name=project_data['name'],
            description=project_data.get('description'),
            target_amount=project_data['target_amount'],
            target_currency=project_data.get('currency', 'BDT'),
            created_by=current_user['user_id']
        )
        
        # Update status if not active
        if project_data.get('status') != 'active':
            fund_db.update_project(project['project_id'], status=project_data['status'])
        
        # Parse Contributions sheet if exists
        contributions_created = 0
        contributions_errors = []
        
        if 'Contributions' in wb.sheetnames:
            ws_contrib = wb['Contributions']
            
            # Start from row 3 (row 1 is header, row 2 is description)
            for row in range(3, ws_contrib.max_row + 1):
                contributor_name = ws_contrib.cell(row=row, column=1).value
                amount = ws_contrib.cell(row=row, column=2).value
                payment_mode = ws_contrib.cell(row=row, column=3).value
                payment_status = ws_contrib.cell(row=row, column=4).value or 'completed'
                contribution_date = ws_contrib.cell(row=row, column=5).value
                notes = ws_contrib.cell(row=row, column=6).value
                
                # Skip empty rows
                if not contributor_name and not amount:
                    continue
                
                # Validate required fields
                if not contributor_name:
                    contributions_errors.append(f"Row {row}: Contributor Name is required")
                    continue
                
                if not amount:
                    contributions_errors.append(f"Row {row}: Amount is required")
                    continue
                
                if not payment_mode:
                    contributions_errors.append(f"Row {row}: Payment Mode is required")
                    continue
                
                # Normalize payment mode
                payment_mode_normalized = payment_mode.strip()
                if payment_mode_normalized not in PAYMENT_MODES:
                    # Try to match case-insensitively
                    payment_mode_lower = payment_mode_normalized.lower()
                    matched = False
                    for pm in PAYMENT_MODES:
                        if pm.lower() == payment_mode_lower:
                            payment_mode_normalized = pm
                            matched = True
                            break
                    if not matched:
                        contributions_errors.append(f"Row {row}: Invalid payment mode '{payment_mode}'")
                        continue
                
                # Normalize payment status
                valid_payment_statuses = ['completed', 'pending', 'failed']
                if payment_status.lower() not in valid_payment_statuses:
                    payment_status = 'completed'
                else:
                    payment_status = payment_status.lower()
                
                # Handle contribution date
                if contribution_date:
                    if isinstance(contribution_date, datetime):
                        contribution_date_str = contribution_date.strftime('%Y-%m-%d')
                    elif isinstance(contribution_date, date):
                        contribution_date_str = contribution_date.strftime('%Y-%m-%d')
                    else:
                        contribution_date_str = str(contribution_date)
                else:
                    contribution_date_str = datetime.utcnow().strftime('%Y-%m-%d')
                
                try:
                    fund_db.create_contribution(
                        project_id=project['project_id'],
                        contributor_name=str(contributor_name).strip(),
                        amount=float(amount),
                        currency=project_data.get('currency', 'BDT'),
                        payment_mode=payment_mode_normalized,
                        contribution_date=contribution_date_str,
                        collection_notes=str(notes) if notes else None,
                        entry_type='manual',
                        entered_by=current_user['user_id'],
                        payment_status=payment_status
                    )
                    contributions_created += 1
                except Exception as e:
                    contributions_errors.append(f"Row {row}: {str(e)}")
        
        # Parse Distributions sheet if exists
        distributions_created = 0
        distributions_errors = []
        
        if 'Distributions' in wb.sheetnames:
            ws_dist = wb['Distributions']
            
            # Start from row 3 (row 1 is header, row 2 is description)
            for row in range(3, ws_dist.max_row + 1):
                institution_type = ws_dist.cell(row=row, column=1).value
                institution_name = ws_dist.cell(row=row, column=2).value
                amount = ws_dist.cell(row=row, column=3).value
                currency = ws_dist.cell(row=row, column=4).value or project_data.get('currency', 'BDT')
                distribution_date = ws_dist.cell(row=row, column=5).value
                notes = ws_dist.cell(row=row, column=6).value
                
                # Skip empty rows
                if not institution_type and not institution_name and not amount:
                    continue
                
                # Validate required fields
                if not institution_type:
                    distributions_errors.append(f"Row {row}: Institution Type is required")
                    continue
                
                if not institution_name:
                    distributions_errors.append(f"Row {row}: Institution Name is required")
                    continue
                
                if not amount:
                    distributions_errors.append(f"Row {row}: Amount is required")
                    continue
                
                if not distribution_date:
                    distributions_errors.append(f"Row {row}: Distribution Date is required")
                    continue
                
                # Normalize institution type (case-insensitive match)
                institution_type_normalized = str(institution_type).strip()
                matched_type = None
                for it in INSTITUTION_TYPES:
                    if it.lower() == institution_type_normalized.lower():
                        matched_type = it
                        break
                if not matched_type:
                    # Allow custom types, just use as-is
                    matched_type = institution_type_normalized
                
                # Validate currency
                if currency not in SUPPORTED_CURRENCIES:
                    distributions_errors.append(f"Row {row}: Invalid currency '{currency}'")
                    continue
                
                # Handle distribution date
                if isinstance(distribution_date, datetime):
                    distribution_date_str = distribution_date.strftime('%Y-%m-%d')
                elif isinstance(distribution_date, date):
                    distribution_date_str = distribution_date.strftime('%Y-%m-%d')
                else:
                    distribution_date_str = str(distribution_date)
                
                try:
                    fund_db.create_distribution(
                        project_id=project['project_id'],
                        institution_type=matched_type,
                        institution_name=str(institution_name).strip(),
                        distributed_amount=float(amount),
                        currency=currency,
                        distribution_date=distribution_date_str,
                        notes=str(notes) if notes else None,
                        distributed_by=current_user['user_id']
                    )
                    distributions_created += 1
                except Exception as e:
                    distributions_errors.append(f"Row {row}: {str(e)}")
        
        wb.close()
        
        # Build result message
        message_parts = [f"Project '{project_data['name']}' imported successfully"]
        if contributions_created > 0:
            message_parts.append(f"with {contributions_created} contributions")
        if distributions_created > 0:
            message_parts.append(f"and {distributions_created} distributions")
        
        return {
            "success": True,
            "project": project,
            "contributions_created": contributions_created,
            "contributions_errors": contributions_errors,
            "distributions_created": distributions_created,
            "distributions_errors": distributions_errors,
            "message": ' '.join(message_parts)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error parsing Excel file: {str(e)}"
        )
    finally:
        # Clean up temp file
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)


@router.post("/projects/import/preview")
async def preview_import(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin())
):
    """Preview project import without creating (Admin/Super Admin only)"""
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an Excel file (.xlsx or .xls)"
        )
    
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
    try:
        content = await file.read()
        temp_file.write(content)
        temp_file.close()
        
        wb = openpyxl.load_workbook(temp_file.name)
        
        if 'Project Info' not in wb.sheetnames:
            raise HTTPException(
                status_code=400,
                detail="Missing 'Project Info' sheet in the Excel file"
            )
        
        # Parse Project Info
        ws_project = wb['Project Info']
        project_data = {}
        validation_errors = []
        
        for row in range(2, ws_project.max_row + 1):
            field = ws_project.cell(row=row, column=1).value
            value = ws_project.cell(row=row, column=2).value
            
            if field == 'Project Name':
                project_data['name'] = value
            elif field == 'Description':
                project_data['description'] = value
            elif field == 'Target Amount':
                try:
                    project_data['target_amount'] = float(value) if value else 0
                except (ValueError, TypeError):
                    validation_errors.append("Target Amount must be a number")
                    project_data['target_amount'] = 0
            elif field == 'Currency':
                project_data['currency'] = value or 'BDT'
            elif field == 'Status':
                project_data['status'] = value or 'active'
        
        # Validate project
        if not project_data.get('name'):
            validation_errors.append("Project Name is required")
        
        if not project_data.get('target_amount'):
            validation_errors.append("Target Amount is required")
        
        # Validate and normalize currency (case-insensitive)
        currency_raw = project_data.get('currency', 'BDT')
        currency_matched = None
        for curr in SUPPORTED_CURRENCIES:
            if curr.upper() == currency_raw.upper():
                currency_matched = curr
                break
        if not currency_matched:
            validation_errors.append(f"Invalid currency. Supported: {', '.join(SUPPORTED_CURRENCIES)}")
        else:
            project_data['currency'] = currency_matched
        
        # Validate and normalize status (case-insensitive)
        valid_statuses = ['active', 'paused', 'completed', 'cancelled', 'archived']
        status_raw = (project_data.get('status') or 'active').lower().strip()
        if status_raw not in valid_statuses:
            validation_errors.append(f"Invalid status. Supported: {', '.join(valid_statuses)}")
        else:
            project_data['status'] = status_raw
        
        # Parse Contributions
        contributions_preview = []
        contributions_errors = []
        
        if 'Contributions' in wb.sheetnames:
            ws_contrib = wb['Contributions']
            
            for row in range(3, min(ws_contrib.max_row + 1, 103)):  # Preview max 100 rows
                contributor_name = ws_contrib.cell(row=row, column=1).value
                amount = ws_contrib.cell(row=row, column=2).value
                payment_mode = ws_contrib.cell(row=row, column=3).value
                payment_status = ws_contrib.cell(row=row, column=4).value or 'completed'
                contribution_date = ws_contrib.cell(row=row, column=5).value
                notes = ws_contrib.cell(row=row, column=6).value
                
                if not contributor_name and not amount:
                    continue
                
                row_errors = []
                if not contributor_name:
                    row_errors.append("Contributor Name required")
                if not amount:
                    row_errors.append("Amount required")
                if not payment_mode:
                    row_errors.append("Payment Mode required")
                elif payment_mode not in PAYMENT_MODES:
                    # Check case-insensitive
                    if not any(pm.lower() == payment_mode.lower() for pm in PAYMENT_MODES):
                        row_errors.append(f"Invalid payment mode: {payment_mode}")
                
                # Format date for preview
                date_str = ''
                if contribution_date:
                    if isinstance(contribution_date, (datetime, date)):
                        date_str = contribution_date.strftime('%Y-%m-%d')
                    else:
                        date_str = str(contribution_date)
                
                contributions_preview.append({
                    "row": row,
                    "contributor_name": contributor_name,
                    "amount": amount,
                    "payment_mode": payment_mode,
                    "payment_status": payment_status,
                    "contribution_date": date_str,
                    "notes": notes,
                    "errors": row_errors,
                    "valid": len(row_errors) == 0
                })
                
                if row_errors:
                    contributions_errors.append(f"Row {row}: {', '.join(row_errors)}")
        
        # Parse Distributions for preview
        distributions_preview = []
        distributions_errors = []
        
        if 'Distributions' in wb.sheetnames:
            ws_dist = wb['Distributions']
            
            for row in range(3, min(ws_dist.max_row + 1, 103)):  # Preview max 100 rows
                institution_type = ws_dist.cell(row=row, column=1).value
                institution_name = ws_dist.cell(row=row, column=2).value
                amount = ws_dist.cell(row=row, column=3).value
                currency = ws_dist.cell(row=row, column=4).value or project_data.get('currency', 'BDT')
                distribution_date = ws_dist.cell(row=row, column=5).value
                notes = ws_dist.cell(row=row, column=6).value
                
                if not institution_type and not institution_name and not amount:
                    continue
                
                row_errors = []
                if not institution_type:
                    row_errors.append("Institution Type required")
                if not institution_name:
                    row_errors.append("Institution Name required")
                if not amount:
                    row_errors.append("Amount required")
                if not distribution_date:
                    row_errors.append("Distribution Date required")
                # Validate currency case-insensitively
                if currency and not any(curr.upper() == currency.upper() for curr in SUPPORTED_CURRENCIES):
                    row_errors.append(f"Invalid currency: {currency}")
                
                # Format date for preview
                date_str = ''
                if distribution_date:
                    if isinstance(distribution_date, (datetime, date)):
                        date_str = distribution_date.strftime('%Y-%m-%d')
                    else:
                        date_str = str(distribution_date)
                
                distributions_preview.append({
                    "row": row,
                    "institution_type": institution_type,
                    "institution_name": institution_name,
                    "amount": amount,
                    "currency": currency,
                    "distribution_date": date_str,
                    "notes": notes,
                    "errors": row_errors,
                    "valid": len(row_errors) == 0
                })
                
                if row_errors:
                    distributions_errors.append(f"Row {row}: {', '.join(row_errors)}")
        
        wb.close()
        
        # Calculate summaries
        contrib_total_amount = sum(c['amount'] for c in contributions_preview if c['amount'] and c['valid'])
        contrib_valid_count = sum(1 for c in contributions_preview if c['valid'])
        
        dist_total_amount = sum(d['amount'] for d in distributions_preview if d['amount'] and d['valid'])
        dist_valid_count = sum(1 for d in distributions_preview if d['valid'])
        
        # Is valid if project is valid and at least has some data (contributions or distributions)
        has_valid_data = contrib_valid_count > 0 or dist_valid_count > 0 or (len(contributions_preview) == 0 and len(distributions_preview) == 0)
        is_valid = len(validation_errors) == 0 and has_valid_data
        
        return {
            "success": True,
            "project": project_data,
            "contributions": contributions_preview,
            "distributions": distributions_preview,
            "summary": {
                "total_contributions": len(contributions_preview),
                "valid_contributions": contrib_valid_count,
                "invalid_contributions": len(contributions_preview) - contrib_valid_count,
                "contributions_amount": contrib_total_amount,
                "total_distributions": len(distributions_preview),
                "valid_distributions": dist_valid_count,
                "invalid_distributions": len(distributions_preview) - dist_valid_count,
                "distributions_amount": dist_total_amount
            },
            "validation_errors": validation_errors,
            "contributions_errors": contributions_errors,
            "distributions_errors": distributions_errors,
            "is_valid": is_valid
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error parsing Excel file: {str(e)}"
        )
    finally:
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)


# =============================================================================
# Contribution Endpoints
# =============================================================================

@router.post("/contributions")
async def create_contribution(
    contribution: ContributionCreate,
    current_user: dict = Depends(require_fund_admin_or_above())
):
    """Create a manual contribution entry (Fund Admin/Admin/Super Admin)"""
    # Check project exists
    project = fund_db.get_project_by_id(contribution.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check project access for fund admins
    if not await check_project_access(current_user, contribution.project_id):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to add contributions to this project"
        )
    
    # Validate currency and payment mode
    if contribution.currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid currency. Supported: {', '.join(SUPPORTED_CURRENCIES)}"
        )
    
    if contribution.payment_mode not in PAYMENT_MODES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid payment mode. Supported: {', '.join(PAYMENT_MODES)}"
        )
    
    result = fund_db.create_contribution(
        project_id=contribution.project_id,
        contributor_name=contribution.contributor_name,
        amount=contribution.amount,
        currency=contribution.currency,
        payment_mode=contribution.payment_mode,
        contribution_date=contribution.contribution_date,
        collection_notes=contribution.collection_notes,
        entry_type='manual',
        entered_by=current_user['user_id']
    )
    
    return {"success": True, "contribution": result}


@router.get("/contributions/{project_id}")
async def list_contributions(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """List all contributions for a project (all authenticated users)"""
    project = fund_db.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    contributions = fund_db.get_contributions_by_project(project_id)
    
    return {"success": True, "contributions": contributions}


@router.get("/contributions/by-contributor/{project_id}")
async def list_contributions_by_contributor(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """List contributions grouped by contributor with totals (all authenticated users)"""
    project = fund_db.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    contributors = fund_db.get_contributions_by_contributor(project_id)
    
    return {"success": True, "contributors": contributors}


@router.patch("/contributions/{contribution_id}")
async def update_contribution(
    contribution_id: str,
    contribution_update: ContributionUpdate,
    current_user: dict = Depends(require_fund_admin_or_above())
):
    """Update a contribution (Fund Admin for own entries, Admin for any)"""
    existing = fund_db.get_contribution_by_id(contribution_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Contribution not found")
    
    # Check project access
    if not await check_project_access(current_user, existing['project_id']):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to edit contributions for this project"
        )
    
    update_data = contribution_update.dict(exclude_unset=True)
    
    # Validate currency if being updated
    if 'currency' in update_data and update_data['currency'] not in SUPPORTED_CURRENCIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid currency. Supported: {', '.join(SUPPORTED_CURRENCIES)}"
        )
    
    # Validate payment mode if being updated
    if 'payment_mode' in update_data and update_data['payment_mode'] not in PAYMENT_MODES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid payment mode. Supported: {', '.join(PAYMENT_MODES)}"
        )
    
    success = fund_db.update_contribution(contribution_id, **update_data)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update contribution")
    
    updated = fund_db.get_contribution_by_id(contribution_id)
    return {"success": True, "contribution": updated}


@router.delete("/contributions/{contribution_id}")
async def delete_contribution(
    contribution_id: str,
    current_user: dict = Depends(require_admin())
):
    """Delete a contribution (Admin/Super Admin only)"""
    existing = fund_db.get_contribution_by_id(contribution_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Contribution not found")
    
    success = fund_db.delete_contribution(contribution_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete contribution")
    
    return {"success": True, "message": "Contribution deleted"}


# =============================================================================
# Statistics Endpoints
# =============================================================================

@router.get("/stats/summary")
async def get_all_projects_summary(
    current_user: dict = Depends(get_current_user)
):
    """Get summary statistics for all projects (all authenticated users)"""
    summary = fund_db.get_all_projects_summary()
    return {"success": True, "summary": summary}


@router.get("/stats/{project_id}")
async def get_project_stats(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed statistics for a project (all authenticated users)"""
    stats = fund_db.get_project_stats(project_id)
    
    if not stats:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"success": True, "stats": stats}


@router.get("/stats/{project_id}/by-date")
async def get_contributions_by_date(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get contributions grouped by date for charts (all authenticated users)"""
    project = fund_db.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    data = fund_db.get_contributions_by_date(project_id)
    return {"success": True, "data": data}


@router.get("/stats/{project_id}/by-mode")
async def get_contributions_by_payment_mode(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get contributions grouped by payment mode for charts (all authenticated users)"""
    project = fund_db.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    data = fund_db.get_contributions_by_payment_mode(project_id)
    return {"success": True, "data": data}


# =============================================================================
# App Settings Endpoints
# =============================================================================

@router.get("/settings")
async def get_settings(
    current_user: dict = Depends(get_current_user)
):
    """Get app settings (all authenticated users)"""
    settings = fund_db.get_all_settings()
    return {"success": True, "settings": settings}


@router.patch("/settings")
async def update_settings(
    settings_update: SettingsUpdate,
    current_user: dict = Depends(require_admin())
):
    """Update app settings (Admin/Super Admin only)"""
    update_data = settings_update.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        fund_db.update_setting(key, value, current_user['user_id'])
    
    settings = fund_db.get_all_settings()
    return {"success": True, "settings": settings}


@router.get("/settings/data-source-mode")
async def get_data_source_mode(
    current_user: dict = Depends(get_current_user)
):
    """Get current data source mode (excel or dynamic)"""
    mode = fund_db.get_data_source_mode()
    return {"success": True, "mode": mode}


# =============================================================================
# User Role Management Endpoints
# =============================================================================

@router.get("/users")
async def list_users(
    current_user: dict = Depends(require_admin())
):
    """List all users (Admin/Super Admin only)"""
    users = auth_db.get_all_users()
    
    # Remove sensitive fields
    for user in users:
        user.pop('provider_id', None)
    
    return {"success": True, "users": users}


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role_update: UserRoleUpdate,
    current_user: dict = Depends(require_super_admin())
):
    """Update user role (Super Admin only)"""
    if role_update.role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Valid roles: {', '.join(VALID_ROLES)}"
        )
    
    # Cannot demote yourself if you're super admin
    if user_id == current_user['user_id'] and role_update.role != ROLE_SUPER_ADMIN:
        raise HTTPException(
            status_code=400,
            detail="Cannot demote your own super admin role"
        )
    
    user = auth_db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    success = auth_db.update_user_role(user_id, role_update.role)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update role")
    
    updated_user = auth_db.get_user_by_id(user_id)
    updated_user.pop('provider_id', None)
    
    return {"success": True, "user": updated_user}


@router.post("/users/{user_id}/assign-project")
async def assign_project_to_user(
    user_id: str,
    assignment: ProjectAssignment,
    current_user: dict = Depends(require_admin())
):
    """Assign a project to a Fund Admin (Admin/Super Admin only)"""
    user = auth_db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check user is a fund admin
    if user.get('role') != ROLE_FUND_ADMIN:
        raise HTTPException(
            status_code=400,
            detail="Can only assign projects to Fund Admin users"
        )
    
    # Check project exists
    project = fund_db.get_project_by_id(assignment.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    success = auth_db.assign_project_to_user(user_id, assignment.project_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to assign project")
    
    return {"success": True, "message": f"Project assigned to user"}


@router.delete("/users/{user_id}/unassign-project")
async def unassign_project_from_user(
    user_id: str,
    project_id: str,
    current_user: dict = Depends(require_admin())
):
    """Remove a project assignment from a Fund Admin (Admin/Super Admin only)"""
    user = auth_db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    success = auth_db.unassign_project_from_user(user_id, project_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to unassign project")
    
    return {"success": True, "message": "Project unassigned from user"}


# =============================================================================
# Configuration Info Endpoints
# =============================================================================

@router.get("/config/currencies")
async def get_supported_currencies():
    """Get list of supported currencies (public)"""
    return {"success": True, "currencies": SUPPORTED_CURRENCIES}


@router.get("/config/payment-modes")
async def get_payment_modes():
    """Get list of payment modes (public)"""
    return {"success": True, "payment_modes": PAYMENT_MODES}


@router.get("/config/roles")
async def get_valid_roles():
    """Get list of valid user roles (public)"""
    return {"success": True, "roles": VALID_ROLES}


# =============================================================================
# Distribution Endpoints (Phase 7)
# =============================================================================

# Institution types for distributions
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


class DistributionCreate(BaseModel):
    project_id: str
    institution_type: str = Field(..., min_length=1, max_length=100)
    institution_name: str = Field(..., min_length=1, max_length=200)
    distributed_amount: float = Field(..., gt=0)
    currency: str = Field(default="BDT")
    distribution_date: str  # YYYY-MM-DD format
    notes: Optional[str] = None


class DistributionUpdate(BaseModel):
    institution_type: Optional[str] = Field(None, min_length=1, max_length=100)
    institution_name: Optional[str] = Field(None, min_length=1, max_length=200)
    distributed_amount: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = None
    distribution_date: Optional[str] = None
    notes: Optional[str] = None


@router.post("/distributions")
async def create_distribution(
    distribution: DistributionCreate,
    current_user: dict = Depends(require_fund_admin_or_above())
):
    """Create a distribution record (Fund Admin/Admin/Super Admin)"""
    # Check project exists
    project = fund_db.get_project_by_id(distribution.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check project access for fund admins
    if not await check_project_access(current_user, distribution.project_id):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to add distributions to this project"
        )
    
    # Validate currency
    if distribution.currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid currency. Supported: {', '.join(SUPPORTED_CURRENCIES)}"
        )
    
    result = fund_db.create_distribution(
        project_id=distribution.project_id,
        institution_type=distribution.institution_type,
        institution_name=distribution.institution_name,
        distributed_amount=distribution.distributed_amount,
        currency=distribution.currency,
        distribution_date=distribution.distribution_date,
        notes=distribution.notes,
        distributed_by=current_user['user_id']
    )
    
    return {"success": True, "distribution": result}


@router.get("/distributions/{project_id}")
async def list_distributions(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """List all distributions for a project (all authenticated users)"""
    project = fund_db.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    distributions = fund_db.get_distributions_by_project(project_id)
    
    return {"success": True, "distributions": distributions}


@router.get("/distributions/stats/{project_id}")
async def get_distribution_stats(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get distribution statistics for a project (all authenticated users)"""
    project = fund_db.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    stats = fund_db.get_distribution_stats(project_id)
    
    return {"success": True, "stats": stats}


@router.get("/distribution/{distribution_id}")
async def get_distribution(
    distribution_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a single distribution by ID (all authenticated users)"""
    distribution = fund_db.get_distribution_by_id(distribution_id)
    
    if not distribution:
        raise HTTPException(status_code=404, detail="Distribution not found")
    
    return {"success": True, "distribution": distribution}


@router.patch("/distributions/{distribution_id}")
async def update_distribution(
    distribution_id: str,
    distribution_update: DistributionUpdate,
    current_user: dict = Depends(require_fund_admin_or_above())
):
    """Update a distribution (Fund Admin for own entries, Admin for any)"""
    existing = fund_db.get_distribution_by_id(distribution_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Distribution not found")
    
    # Check project access
    if not await check_project_access(current_user, existing['project_id']):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to edit distributions for this project"
        )
    
    update_data = distribution_update.dict(exclude_unset=True)
    
    # Validate currency if being updated
    if 'currency' in update_data and update_data['currency'] not in SUPPORTED_CURRENCIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid currency. Supported: {', '.join(SUPPORTED_CURRENCIES)}"
        )
    
    success = fund_db.update_distribution(distribution_id, **update_data)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update distribution")
    
    updated = fund_db.get_distribution_by_id(distribution_id)
    return {"success": True, "distribution": updated}


@router.post("/distributions/{distribution_id}/proof")
async def upload_distribution_proof(
    distribution_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_fund_admin_or_above())
):
    """Upload proof image for a distribution (Fund Admin/Admin/Super Admin)"""
    from pathlib import Path
    import uuid as uuid_module
    
    existing = fund_db.get_distribution_by_id(distribution_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Distribution not found")
    
    # Check project access
    if not await check_project_access(current_user, existing['project_id']):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to edit distributions for this project"
        )
    
    # Validate file type (only images allowed for proof)
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf']
    allowed_mimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_extensions and file.content_type not in allowed_mimes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Max 10MB
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max size: 10 MB")
    
    # Create upload directory
    BASE_DIR = Path(__file__).parent.parent
    UPLOADS_DIR = BASE_DIR / "uploads" / "proofs"
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    unique_filename = f"{uuid_module.uuid4()}{file_ext}"
    file_key = f"proofs/{unique_filename}"
    file_path = BASE_DIR / "uploads" / file_key
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Update distribution record
    success = fund_db.update_distribution(
        distribution_id,
        proof_file_key=file_key,
        proof_file_name=file.filename
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update proof")
    
    updated = fund_db.get_distribution_by_id(distribution_id)
    updated['proof_url'] = f"/uploads/{file_key}"
    
    return {"success": True, "distribution": updated}


@router.get("/distributions/{distribution_id}/proof")
async def get_distribution_proof(
    distribution_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get proof file for a distribution"""
    from fastapi.responses import FileResponse
    from pathlib import Path
    
    existing = fund_db.get_distribution_by_id(distribution_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Distribution not found")
    
    if not existing.get('proof_file_key'):
        raise HTTPException(status_code=404, detail="No proof file uploaded")
    
    BASE_DIR = Path(__file__).parent.parent
    file_path = BASE_DIR / "uploads" / existing['proof_file_key']
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Proof file not found")
    
    return FileResponse(
        path=file_path,
        filename=existing.get('proof_file_name', 'proof'),
        media_type='application/octet-stream'
    )


@router.delete("/distributions/{distribution_id}")
async def delete_distribution(
    distribution_id: str,
    current_user: dict = Depends(require_admin())
):
    """Delete a distribution (Admin/Super Admin only)"""
    existing = fund_db.get_distribution_by_id(distribution_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Distribution not found")
    
    success = fund_db.delete_distribution(distribution_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete distribution")
    
    return {"success": True, "message": "Distribution deleted"}


@router.get("/config/institution-types")
async def get_institution_types():
    """Get list of institution types (public)"""
    return {"success": True, "institution_types": INSTITUTION_TYPES}
