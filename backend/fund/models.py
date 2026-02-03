"""
Phase 5: Fund Management Models
Projects, Contributions, and App Settings for charity fund management
Supports both SQLite (local) and DynamoDB (AWS)
"""
import uuid
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from pathlib import Path

from auth.auth_config import (
    DB_TYPE,
    SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, PAYMENT_MODES
)

# SQLite imports (conditional)
if DB_TYPE == "sqlite":
    import sqlite3
    from auth.auth_config import SQLITE_FUND_DB_PATH

# DynamoDB imports (conditional)
if DB_TYPE == "dynamodb":
    import boto3
    from boto3.dynamodb.conditions import Key, Attr
    from decimal import Decimal
    from auth.auth_config import (
        DYNAMODB_REGION, DYNAMODB_PROJECTS_TABLE,
        DYNAMODB_CONTRIBUTIONS_TABLE, DYNAMODB_SETTINGS_TABLE,
        DYNAMODB_MEDIA_TABLE, DYNAMODB_DISTRIBUTIONS_TABLE,
        S3_MEDIA_BUCKET, S3_REGION
    )


class FundDatabaseConnection:
    """Factory for fund management database connections"""
    
    @staticmethod
    def get_connection():
        if DB_TYPE == "sqlite":
            return SQLiteFundDatabase()
        else:
            return DynamoDBFundDatabase()


class SQLiteFundDatabase:
    """SQLite database implementation for fund management (local development)"""
    
    def __init__(self):
        self.db_path = SQLITE_FUND_DB_PATH
        self._init_db()
    
    def _init_db(self):
        """Initialize SQLite database with fund management tables"""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Projects table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                project_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                target_amount REAL NOT NULL DEFAULT 0,
                target_currency TEXT NOT NULL DEFAULT 'BDT',
                status TEXT NOT NULL DEFAULT 'active',
                created_by TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        
        # Contributions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS contributions (
                contribution_id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                contributor_name TEXT NOT NULL,
                user_id TEXT,
                amount REAL NOT NULL,
                currency TEXT NOT NULL DEFAULT 'BDT',
                payment_mode TEXT NOT NULL,
                payment_status TEXT NOT NULL DEFAULT 'completed',
                entry_type TEXT NOT NULL DEFAULT 'manual',
                collection_notes TEXT,
                entered_by TEXT,
                stripe_payment_id TEXT,
                contribution_date TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects (project_id)
            )
        """)
        
        # App Settings table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS app_settings (
                setting_key TEXT PRIMARY KEY,
                setting_value TEXT NOT NULL,
                updated_by TEXT,
                updated_at TEXT NOT NULL
            )
        """)
        
        # Insert default settings if not exist
        cursor.execute("""
            INSERT OR IGNORE INTO app_settings (setting_key, setting_value, updated_at)
            VALUES ('data_source_mode', 'excel', ?)
        """, (datetime.utcnow().isoformat(),))
        
        cursor.execute("""
            INSERT OR IGNORE INTO app_settings (setting_key, setting_value, updated_at)
            VALUES ('default_currency', 'BDT', ?)
        """, (datetime.utcnow().isoformat(),))
        
        cursor.execute("""
            INSERT OR IGNORE INTO app_settings (setting_key, setting_value, updated_at)
            VALUES ('email_notifications_enabled', 'false', ?)
        """, (datetime.utcnow().isoformat(),))
        
        # Media table (Phase 6)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS media (
                media_id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                media_type TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_key TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                mime_type TEXT NOT NULL,
                caption TEXT,
                display_order INTEGER NOT NULL DEFAULT 0,
                uploaded_by TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects (project_id)
            )
        """)
        
        # Distributions table (Phase 7) - Track fund distributions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS distributions (
                distribution_id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                institution_type TEXT NOT NULL,
                institution_name TEXT NOT NULL,
                distributed_amount REAL NOT NULL,
                currency TEXT NOT NULL DEFAULT 'BDT',
                proof_file_key TEXT,
                proof_file_name TEXT,
                notes TEXT,
                distributed_by TEXT NOT NULL,
                distribution_date TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects (project_id)
            )
        """)
        
        conn.commit()
        conn.close()
    
    # =========================================================================
    # Project Operations
    # =========================================================================
    
    def create_project(self, name: str, description: str, target_amount: float,
                       target_currency: str, created_by: str) -> Dict[str, Any]:
        """Create a new charity project"""
        project_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO projects (project_id, name, description, target_amount, 
                                  target_currency, status, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (project_id, name, description, target_amount, target_currency, 
              'active', created_by, now, now))
        
        conn.commit()
        conn.close()
        
        return {
            "project_id": project_id,
            "name": name,
            "description": description,
            "target_amount": target_amount,
            "target_currency": target_currency,
            "status": "active",
            "created_by": created_by,
            "created_at": now,
            "updated_at": now
        }
    
    def get_project_by_id(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get project by ID"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM projects WHERE project_id = ?", (project_id,))
        row = cursor.fetchone()
        conn.close()
        
        return dict(row) if row else None
    
    def get_all_projects(self, include_archived: bool = False) -> List[Dict[str, Any]]:
        """Get all projects (excludes archived unless include_archived=True)"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if include_archived:
            cursor.execute("SELECT * FROM projects ORDER BY created_at DESC")
        else:
            # Show all non-archived projects: active, paused, completed
            cursor.execute("SELECT * FROM projects WHERE status != 'archived' ORDER BY created_at DESC")
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def update_project(self, project_id: str, **kwargs) -> bool:
        """Update project fields"""
        if not kwargs:
            return False
        
        allowed_fields = ['name', 'description', 'target_amount', 'target_currency', 'status']
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields}
        
        if not updates:
            return False
        
        updates['updated_at'] = datetime.utcnow().isoformat()
        
        set_clause = ', '.join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [project_id]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(f"UPDATE projects SET {set_clause} WHERE project_id = ?", values)
        
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        
        return affected > 0
    
    def delete_project(self, project_id: str) -> bool:
        """Delete a project (and its contributions)"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Delete contributions first
        cursor.execute("DELETE FROM contributions WHERE project_id = ?", (project_id,))
        
        # Delete project
        cursor.execute("DELETE FROM projects WHERE project_id = ?", (project_id,))
        
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        
        return affected > 0
    
    # =========================================================================
    # Contribution Operations
    # =========================================================================
    
    def create_contribution(self, project_id: str, contributor_name: str, amount: float,
                            currency: str, payment_mode: str, contribution_date: str,
                            entry_type: str = 'manual', user_id: str = None,
                            collection_notes: str = None, entered_by: str = None,
                            payment_status: str = 'completed', 
                            stripe_payment_id: str = None) -> Dict[str, Any]:
        """Create a new contribution"""
        contribution_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO contributions (contribution_id, project_id, contributor_name, user_id,
                                       amount, currency, payment_mode, payment_status, entry_type,
                                       collection_notes, entered_by, stripe_payment_id,
                                       contribution_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (contribution_id, project_id, contributor_name, user_id, amount, currency,
              payment_mode, payment_status, entry_type, collection_notes, entered_by,
              stripe_payment_id, contribution_date, now, now))
        
        conn.commit()
        conn.close()
        
        return {
            "contribution_id": contribution_id,
            "project_id": project_id,
            "contributor_name": contributor_name,
            "user_id": user_id,
            "amount": amount,
            "currency": currency,
            "payment_mode": payment_mode,
            "payment_status": payment_status,
            "entry_type": entry_type,
            "collection_notes": collection_notes,
            "entered_by": entered_by,
            "stripe_payment_id": stripe_payment_id,
            "contribution_date": contribution_date,
            "created_at": now,
            "updated_at": now
        }
    
    def get_contribution_by_id(self, contribution_id: str) -> Optional[Dict[str, Any]]:
        """Get contribution by ID"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM contributions WHERE contribution_id = ?", (contribution_id,))
        row = cursor.fetchone()
        conn.close()
        
        return dict(row) if row else None
    
    def get_contributions_by_project(self, project_id: str) -> List[Dict[str, Any]]:
        """Get all contributions for a project"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM contributions 
            WHERE project_id = ? 
            ORDER BY contribution_date DESC, created_at DESC
        """, (project_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def get_contributions_by_contributor(self, project_id: str) -> List[Dict[str, Any]]:
        """Get contributions grouped by contributor with totals"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                contributor_name,
                COUNT(*) as contribution_count,
                SUM(amount) as total_amount,
                currency,
                MAX(contribution_date) as last_contribution_date
            FROM contributions 
            WHERE project_id = ?
            GROUP BY contributor_name, currency
            ORDER BY total_amount DESC
        """, (project_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def update_contribution(self, contribution_id: str, **kwargs) -> bool:
        """Update contribution fields"""
        if not kwargs:
            return False
        
        allowed_fields = ['contributor_name', 'amount', 'currency', 'payment_mode',
                          'payment_status', 'collection_notes', 'contribution_date']
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields}
        
        if not updates:
            return False
        
        updates['updated_at'] = datetime.utcnow().isoformat()
        
        set_clause = ', '.join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [contribution_id]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(f"UPDATE contributions SET {set_clause} WHERE contribution_id = ?", values)
        
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        
        return affected > 0
    
    def delete_contribution(self, contribution_id: str) -> bool:
        """Delete a contribution"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM contributions WHERE contribution_id = ?", (contribution_id,))
        
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        
        return affected > 0
    
    # =========================================================================
    # Statistics Operations
    # =========================================================================
    
    def get_project_stats(self, project_id: str) -> Dict[str, Any]:
        """Get statistics for a project"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get project details
        cursor.execute("SELECT * FROM projects WHERE project_id = ?", (project_id,))
        project = cursor.fetchone()
        
        if not project:
            conn.close()
            return None
        
        project = dict(project)
        
        # Get contribution stats
        cursor.execute("""
            SELECT 
                COUNT(*) as total_contributions,
                COALESCE(SUM(amount), 0) as total_raised,
                COUNT(DISTINCT contributor_name) as unique_contributors
            FROM contributions 
            WHERE project_id = ? AND payment_status = 'completed'
        """, (project_id,))
        
        stats = dict(cursor.fetchone())
        conn.close()
        
        # Calculate progress
        target = project['target_amount'] or 1  # Avoid division by zero
        progress_percentage = min(100, (stats['total_raised'] / target) * 100)
        
        return {
            "project": project,
            "total_raised": stats['total_raised'],
            "total_contributions": stats['total_contributions'],
            "unique_contributors": stats['unique_contributors'],
            "target_amount": project['target_amount'],
            "target_currency": project['target_currency'],
            "progress_percentage": round(progress_percentage, 2)
        }
    
    def get_contributions_by_date(self, project_id: str) -> List[Dict[str, Any]]:
        """Get contributions grouped by date"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                DATE(contribution_date) as date,
                COUNT(*) as count,
                SUM(amount) as total
            FROM contributions 
            WHERE project_id = ? AND payment_status = 'completed'
            GROUP BY DATE(contribution_date)
            ORDER BY date ASC
        """, (project_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def get_contributions_by_payment_mode(self, project_id: str) -> List[Dict[str, Any]]:
        """Get contributions grouped by payment mode"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                payment_mode,
                COUNT(*) as count,
                SUM(amount) as total
            FROM contributions 
            WHERE project_id = ? AND payment_status = 'completed'
            GROUP BY payment_mode
            ORDER BY total DESC
        """, (project_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def get_all_projects_summary(self) -> Dict[str, Any]:
        """Get summary statistics for all projects"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get overall stats
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT p.project_id) as total_projects,
                COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.project_id END) as active_projects,
                COUNT(c.contribution_id) as total_contributions,
                COALESCE(SUM(c.amount), 0) as total_raised,
                COUNT(DISTINCT c.contributor_name) as unique_contributors
            FROM projects p
            LEFT JOIN contributions c ON p.project_id = c.project_id AND c.payment_status = 'completed'
        """)
        
        stats = dict(cursor.fetchone())
        conn.close()
        
        return stats
    
    # =========================================================================
    # App Settings Operations
    # =========================================================================
    
    def get_setting(self, key: str) -> Optional[str]:
        """Get a setting value"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT setting_value FROM app_settings WHERE setting_key = ?", (key,))
        row = cursor.fetchone()
        conn.close()
        
        return row[0] if row else None
    
    def get_all_settings(self) -> Dict[str, str]:
        """Get all settings"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM app_settings")
        rows = cursor.fetchall()
        conn.close()
        
        return {row['setting_key']: row['setting_value'] for row in rows}
    
    def update_setting(self, key: str, value: str, updated_by: str = None) -> bool:
        """Update a setting value"""
        now = datetime.utcnow().isoformat()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO app_settings (setting_key, setting_value, updated_by, updated_at)
            VALUES (?, ?, ?, ?)
        """, (key, value, updated_by, now))
        
        conn.commit()
        conn.close()
        
        return True
    
    def get_data_source_mode(self) -> str:
        """Get current data source mode (excel or dynamic)"""
        return self.get_setting('data_source_mode') or 'excel'
    
    def set_data_source_mode(self, mode: str, updated_by: str = None) -> bool:
        """Set data source mode"""
        if mode not in ['excel', 'dynamic']:
            return False
        return self.update_setting('data_source_mode', mode, updated_by)
    
    # =========================================================================
    # Media Operations (Phase 6)
    # =========================================================================
    
    def create_media(self, project_id: str, media_type: str, file_name: str,
                     file_key: str, file_size: int, mime_type: str,
                     uploaded_by: str, caption: str = None) -> Dict[str, Any]:
        """Create a new media record"""
        media_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get max display_order for this project
        cursor.execute("""
            SELECT COALESCE(MAX(display_order), -1) + 1 FROM media WHERE project_id = ?
        """, (project_id,))
        display_order = cursor.fetchone()[0]
        
        cursor.execute("""
            INSERT INTO media (media_id, project_id, media_type, file_name, file_key,
                              file_size, mime_type, caption, display_order, uploaded_by,
                              created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (media_id, project_id, media_type, file_name, file_key, file_size,
              mime_type, caption, display_order, uploaded_by, now, now))
        
        conn.commit()
        conn.close()
        
        return {
            "media_id": media_id,
            "project_id": project_id,
            "media_type": media_type,
            "file_name": file_name,
            "file_key": file_key,
            "file_size": file_size,
            "mime_type": mime_type,
            "caption": caption,
            "display_order": display_order,
            "uploaded_by": uploaded_by,
            "created_at": now,
            "updated_at": now
        }
    
    def get_media_by_id(self, media_id: str) -> Optional[Dict[str, Any]]:
        """Get media by ID"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM media WHERE media_id = ?", (media_id,))
        row = cursor.fetchone()
        conn.close()
        
        return dict(row) if row else None
    
    def get_media_by_project(self, project_id: str, media_type: str = None) -> List[Dict[str, Any]]:
        """Get all media for a project, optionally filtered by type"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if media_type:
            cursor.execute("""
                SELECT * FROM media 
                WHERE project_id = ? AND media_type = ?
                ORDER BY display_order ASC, created_at DESC
            """, (project_id, media_type))
        else:
            cursor.execute("""
                SELECT * FROM media 
                WHERE project_id = ?
                ORDER BY display_order ASC, created_at DESC
            """, (project_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def update_media(self, media_id: str, **kwargs) -> bool:
        """Update media fields"""
        if not kwargs:
            return False
        
        allowed_fields = ['caption', 'display_order']
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields}
        
        if not updates:
            return False
        
        updates['updated_at'] = datetime.utcnow().isoformat()
        
        set_clause = ', '.join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [media_id]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(f"UPDATE media SET {set_clause} WHERE media_id = ?", values)
        
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        
        return affected > 0
    
    def delete_media(self, media_id: str) -> bool:
        """Delete a media record"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM media WHERE media_id = ?", (media_id,))
        
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        
        return affected > 0
    
    def delete_media_by_project(self, project_id: str) -> int:
        """Delete all media for a project (used when deleting project)"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM media WHERE project_id = ?", (project_id,))
        
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        
        return affected
    
    def reorder_media(self, project_id: str, media_orders: List[Dict[str, int]]) -> bool:
        """Update display order for multiple media items
        media_orders: [{'media_id': 'xxx', 'display_order': 0}, ...]
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        now = datetime.utcnow().isoformat()
        
        for item in media_orders:
            cursor.execute("""
                UPDATE media SET display_order = ?, updated_at = ?
                WHERE media_id = ? AND project_id = ?
            """, (item['display_order'], now, item['media_id'], project_id))
        
        conn.commit()
        conn.close()
        
        return True
    
    def get_media_count_by_project(self, project_id: str) -> Dict[str, int]:
        """Get count of media by type for a project"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT media_type, COUNT(*) as count
            FROM media WHERE project_id = ?
            GROUP BY media_type
        """, (project_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        result = {'image': 0, 'video': 0, 'audio': 0, 'total': 0}
        for row in rows:
            result[row['media_type']] = row['count']
            result['total'] += row['count']
        
        return result
    
    # =========================================================================
    # Distribution Operations (Phase 7)
    # =========================================================================
    
    def create_distribution(self, project_id: str, institution_type: str, institution_name: str,
                           distributed_amount: float, currency: str, distributed_by: str,
                           distribution_date: str, proof_file_key: str = None,
                           proof_file_name: str = None, notes: str = None) -> Dict[str, Any]:
        """Create a new distribution record"""
        distribution_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO distributions (distribution_id, project_id, institution_type, institution_name,
                                       distributed_amount, currency, proof_file_key, proof_file_name,
                                       notes, distributed_by, distribution_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (distribution_id, project_id, institution_type, institution_name, distributed_amount,
              currency, proof_file_key, proof_file_name, notes, distributed_by, distribution_date, now, now))
        
        conn.commit()
        conn.close()
        
        return {
            "distribution_id": distribution_id,
            "project_id": project_id,
            "institution_type": institution_type,
            "institution_name": institution_name,
            "distributed_amount": distributed_amount,
            "currency": currency,
            "proof_file_key": proof_file_key,
            "proof_file_name": proof_file_name,
            "notes": notes,
            "distributed_by": distributed_by,
            "distribution_date": distribution_date,
            "created_at": now,
            "updated_at": now
        }
    
    def get_distribution_by_id(self, distribution_id: str) -> Optional[Dict[str, Any]]:
        """Get distribution by ID"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM distributions WHERE distribution_id = ?", (distribution_id,))
        row = cursor.fetchone()
        conn.close()
        
        return dict(row) if row else None
    
    def get_distributions_by_project(self, project_id: str) -> List[Dict[str, Any]]:
        """Get all distributions for a project"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM distributions 
            WHERE project_id = ? 
            ORDER BY distribution_date DESC, created_at DESC
        """, (project_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def update_distribution(self, distribution_id: str, **kwargs) -> bool:
        """Update distribution fields"""
        if not kwargs:
            return False
        
        allowed_fields = ['institution_type', 'institution_name', 'distributed_amount',
                          'currency', 'proof_file_key', 'proof_file_name', 'notes',
                          'distribution_date']
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields}
        
        if not updates:
            return False
        
        updates['updated_at'] = datetime.utcnow().isoformat()
        
        set_clause = ', '.join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [distribution_id]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(f"UPDATE distributions SET {set_clause} WHERE distribution_id = ?", values)
        
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        
        return affected > 0
    
    def delete_distribution(self, distribution_id: str) -> bool:
        """Delete a distribution record"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM distributions WHERE distribution_id = ?", (distribution_id,))
        
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        
        return affected > 0
    
    def delete_distributions_by_project(self, project_id: str) -> int:
        """Delete all distributions for a project (used when deleting project)"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM distributions WHERE project_id = ?", (project_id,))
        
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        
        return affected
    
    def get_distribution_stats(self, project_id: str) -> Dict[str, Any]:
        """Get distribution statistics for a project"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                COUNT(*) as total_distributions,
                COALESCE(SUM(distributed_amount), 0) as total_distributed,
                COUNT(DISTINCT institution_name) as unique_institutions
            FROM distributions 
            WHERE project_id = ?
        """, (project_id,))
        
        stats = dict(cursor.fetchone())
        conn.close()
        
        return stats


class DynamoDBFundDatabase:
    """DynamoDB database implementation for fund management (AWS deployment)"""
    
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name=DYNAMODB_REGION)
        self.projects_table = self.dynamodb.Table(DYNAMODB_PROJECTS_TABLE)
        self.contributions_table = self.dynamodb.Table(DYNAMODB_CONTRIBUTIONS_TABLE)
        self.settings_table = self.dynamodb.Table(DYNAMODB_SETTINGS_TABLE)
        self.media_table = self.dynamodb.Table(DYNAMODB_MEDIA_TABLE)
        self.distributions_table = self.dynamodb.Table(DYNAMODB_DISTRIBUTIONS_TABLE)
        self.s3_client = boto3.client('s3', region_name=S3_REGION)
    
    def _decimal_to_float(self, obj):
        """Convert Decimal types to float for JSON serialization"""
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, dict):
            return {k: self._decimal_to_float(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._decimal_to_float(i) for i in obj]
        return obj
    
    # =========================================================================
    # Project Operations
    # =========================================================================
    
    def create_project(self, name: str, description: str, target_amount: float,
                       target_currency: str, created_by: str) -> Dict[str, Any]:
        """Create a new charity project"""
        project_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        item = {
            'project_id': project_id,
            'name': name,
            'description': description or '',
            'target_amount': Decimal(str(target_amount)),
            'target_currency': target_currency,
            'status': 'active',
            'created_by': created_by,
            'created_at': now,
            'updated_at': now
        }
        
        self.projects_table.put_item(Item=item)
        
        return self._decimal_to_float(item)
    
    def get_project_by_id(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get project by ID"""
        response = self.projects_table.get_item(Key={'project_id': project_id})
        item = response.get('Item')
        return self._decimal_to_float(item) if item else None
    
    def get_all_projects(self, include_archived: bool = False) -> List[Dict[str, Any]]:
        """Get all projects (excludes archived unless include_archived=True)"""
        if include_archived:
            response = self.projects_table.scan()
        else:
            response = self.projects_table.scan(
                FilterExpression=Attr('status').ne('archived')
            )
        
        items = response.get('Items', [])
        # Sort by created_at descending
        items.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return [self._decimal_to_float(item) for item in items]
    
    def update_project(self, project_id: str, **kwargs) -> bool:
        """Update project fields"""
        if not kwargs:
            return False
        
        allowed_fields = ['name', 'description', 'target_amount', 'target_currency', 'status']
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields}
        
        if not updates:
            return False
        
        updates['updated_at'] = datetime.utcnow().isoformat()
        
        # Build update expression
        update_expr = 'SET ' + ', '.join([f'#{k} = :{k}' for k in updates.keys()])
        expr_names = {f'#{k}': k for k in updates.keys()}
        expr_values = {f':{k}': Decimal(str(v)) if isinstance(v, float) else v for k, v in updates.items()}
        
        try:
            self.projects_table.update_item(
                Key={'project_id': project_id},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values
            )
            return True
        except Exception:
            return False
    
    def delete_project(self, project_id: str) -> bool:
        """Delete a project and all its contributions"""
        try:
            # Delete contributions first
            self.delete_contributions_by_project(project_id)
            # Delete media
            self.delete_media_by_project(project_id)
            # Delete distributions
            self.delete_distributions_by_project(project_id)
            # Delete project
            self.projects_table.delete_item(Key={'project_id': project_id})
            return True
        except Exception:
            return False
    
    # =========================================================================
    # Contribution Operations
    # =========================================================================
    
    def create_contribution(self, project_id: str, contributor_name: str, amount: float,
                            currency: str, payment_mode: str, contribution_date: str,
                            entry_type: str = 'manual', user_id: str = None,
                            collection_notes: str = None, entered_by: str = None,
                            payment_status: str = 'completed', 
                            stripe_payment_id: str = None) -> Dict[str, Any]:
        """Create a new contribution"""
        contribution_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        item = {
            'contribution_id': contribution_id,
            'project_id': project_id,
            'contributor_name': contributor_name,
            'user_id': user_id or '',
            'amount': Decimal(str(amount)),
            'currency': currency,
            'payment_mode': payment_mode,
            'payment_status': payment_status,
            'entry_type': entry_type,
            'collection_notes': collection_notes or '',
            'entered_by': entered_by or '',
            'stripe_payment_id': stripe_payment_id or '',
            'contribution_date': contribution_date,
            'created_at': now,
            'updated_at': now
        }
        
        self.contributions_table.put_item(Item=item)
        
        return self._decimal_to_float(item)
    
    def get_contribution_by_id(self, contribution_id: str) -> Optional[Dict[str, Any]]:
        """Get contribution by ID"""
        response = self.contributions_table.get_item(Key={'contribution_id': contribution_id})
        item = response.get('Item')
        return self._decimal_to_float(item) if item else None
    
    def get_contributions_by_project(self, project_id: str) -> List[Dict[str, Any]]:
        """Get all contributions for a project"""
        response = self.contributions_table.query(
            IndexName='ProjectIndex',
            KeyConditionExpression=Key('project_id').eq(project_id),
            ScanIndexForward=False  # Descending order
        )
        return [self._decimal_to_float(item) for item in response.get('Items', [])]
    
    def get_contributions_by_contributor(self, project_id: str, contributor_name: str) -> List[Dict[str, Any]]:
        """Get contributions by contributor name for a project"""
        response = self.contributions_table.query(
            IndexName='ContributorIndex',
            KeyConditionExpression=Key('project_id').eq(project_id) & Key('contributor_name').eq(contributor_name)
        )
        return [self._decimal_to_float(item) for item in response.get('Items', [])]
    
    def update_contribution(self, contribution_id: str, **kwargs) -> bool:
        """Update contribution fields"""
        if not kwargs:
            return False
        
        allowed_fields = ['contributor_name', 'amount', 'currency', 'payment_mode',
                          'payment_status', 'collection_notes', 'contribution_date']
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields}
        
        if not updates:
            return False
        
        updates['updated_at'] = datetime.utcnow().isoformat()
        
        update_expr = 'SET ' + ', '.join([f'#{k} = :{k}' for k in updates.keys()])
        expr_names = {f'#{k}': k for k in updates.keys()}
        expr_values = {f':{k}': Decimal(str(v)) if isinstance(v, float) else v for k, v in updates.items()}
        
        try:
            self.contributions_table.update_item(
                Key={'contribution_id': contribution_id},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values
            )
            return True
        except Exception:
            return False
    
    def delete_contribution(self, contribution_id: str) -> bool:
        """Delete a contribution"""
        try:
            self.contributions_table.delete_item(Key={'contribution_id': contribution_id})
            return True
        except Exception:
            return False
    
    def delete_contributions_by_project(self, project_id: str) -> int:
        """Delete all contributions for a project"""
        contributions = self.get_contributions_by_project(project_id)
        count = 0
        for contrib in contributions:
            if self.delete_contribution(contrib['contribution_id']):
                count += 1
        return count
    
    # =========================================================================
    # Statistics Operations
    # =========================================================================
    
    def get_project_stats(self, project_id: str) -> Dict[str, Any]:
        """Get statistics for a project"""
        project = self.get_project_by_id(project_id)
        if not project:
            return None
        
        contributions = self.get_contributions_by_project(project_id)
        completed = [c for c in contributions if c.get('payment_status') == 'completed']
        
        total_raised = sum(c.get('amount', 0) for c in completed)
        total_contributions = len(completed)
        unique_contributors = len(set(c.get('contributor_name', '') for c in completed))
        target = project.get('target_amount', 0)
        progress = (total_raised / target * 100) if target > 0 else 0
        
        return {
            'total_raised': total_raised,
            'total_contributions': total_contributions,
            'unique_contributors': unique_contributors,
            'target_amount': target,
            'target_currency': project.get('target_currency', 'BDT'),
            'progress_percentage': round(progress, 2)
        }
    
    def get_contributions_by_date(self, project_id: str) -> List[Dict[str, Any]]:
        """Get contributions grouped by date"""
        contributions = self.get_contributions_by_project(project_id)
        completed = [c for c in contributions if c.get('payment_status') == 'completed']
        
        date_totals = {}
        for c in completed:
            date = c.get('contribution_date', '')[:10]  # Get YYYY-MM-DD
            if date not in date_totals:
                date_totals[date] = {'date': date, 'count': 0, 'total': 0}
            date_totals[date]['count'] += 1
            date_totals[date]['total'] += c.get('amount', 0)
        
        return sorted(date_totals.values(), key=lambda x: x['date'])
    
    def get_contributions_by_payment_mode(self, project_id: str) -> List[Dict[str, Any]]:
        """Get contributions grouped by payment mode"""
        contributions = self.get_contributions_by_project(project_id)
        completed = [c for c in contributions if c.get('payment_status') == 'completed']
        
        mode_totals = {}
        for c in completed:
            mode = c.get('payment_mode', 'Unknown')
            if mode not in mode_totals:
                mode_totals[mode] = {'payment_mode': mode, 'count': 0, 'total': 0}
            mode_totals[mode]['count'] += 1
            mode_totals[mode]['total'] += c.get('amount', 0)
        
        return sorted(mode_totals.values(), key=lambda x: x['total'], reverse=True)
    
    def get_all_projects_summary(self) -> Dict[str, Any]:
        """Get summary statistics for all projects"""
        projects = self.get_all_projects(include_archived=True)
        
        total_contributions = 0
        total_raised = 0
        unique_contributors = set()
        
        for project in projects:
            stats = self.get_project_stats(project['project_id'])
            if stats:
                total_contributions += stats.get('total_contributions', 0)
                total_raised += stats.get('total_raised', 0)
        
        return {
            'total_projects': len(projects),
            'active_projects': len([p for p in projects if p.get('status') == 'active']),
            'total_contributions': total_contributions,
            'total_raised': total_raised
        }
    
    # =========================================================================
    # Settings Operations
    # =========================================================================
    
    def get_setting(self, key: str) -> Optional[str]:
        """Get a setting value"""
        response = self.settings_table.get_item(Key={'setting_key': key})
        item = response.get('Item')
        return item.get('setting_value') if item else None
    
    def get_all_settings(self) -> Dict[str, str]:
        """Get all settings"""
        response = self.settings_table.scan()
        return {item['setting_key']: item['setting_value'] for item in response.get('Items', [])}
    
    def update_setting(self, key: str, value: str, updated_by: str = None) -> bool:
        """Update a setting value"""
        now = datetime.utcnow().isoformat()
        
        try:
            self.settings_table.put_item(Item={
                'setting_key': key,
                'setting_value': value,
                'updated_by': updated_by or '',
                'updated_at': now
            })
            return True
        except Exception:
            return False
    
    def get_data_source_mode(self) -> str:
        """Get current data source mode"""
        return self.get_setting('data_source_mode') or 'excel'
    
    def set_data_source_mode(self, mode: str, updated_by: str = None) -> bool:
        """Set data source mode"""
        if mode not in ['excel', 'dynamic']:
            return False
        return self.update_setting('data_source_mode', mode, updated_by)
    
    # =========================================================================
    # Media Operations (Phase 6)
    # =========================================================================
    
    def create_media(self, project_id: str, media_type: str, file_name: str,
                     file_key: str, file_size: int, mime_type: str,
                     uploaded_by: str, caption: str = None) -> Dict[str, Any]:
        """Create a new media record"""
        media_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        # Get max display_order
        existing = self.get_media_by_project(project_id)
        display_order = max([m.get('display_order', 0) for m in existing], default=-1) + 1
        
        item = {
            'media_id': media_id,
            'project_id': project_id,
            'media_type': media_type,
            'file_name': file_name,
            'file_key': file_key,
            'file_size': file_size,
            'mime_type': mime_type,
            'caption': caption or '',
            'display_order': display_order,
            'uploaded_by': uploaded_by,
            'created_at': now,
            'updated_at': now
        }
        
        self.media_table.put_item(Item=item)
        
        return self._decimal_to_float(item)
    
    def get_media_by_id(self, media_id: str) -> Optional[Dict[str, Any]]:
        """Get media by ID"""
        response = self.media_table.get_item(Key={'media_id': media_id})
        item = response.get('Item')
        return self._decimal_to_float(item) if item else None
    
    def get_media_by_project(self, project_id: str, media_type: str = None) -> List[Dict[str, Any]]:
        """Get all media for a project"""
        response = self.media_table.query(
            IndexName='ProjectIndex',
            KeyConditionExpression=Key('project_id').eq(project_id)
        )
        items = response.get('Items', [])
        
        if media_type:
            items = [i for i in items if i.get('media_type') == media_type]
        
        items.sort(key=lambda x: (x.get('display_order', 0), x.get('created_at', '')))
        return [self._decimal_to_float(item) for item in items]
    
    def update_media(self, media_id: str, **kwargs) -> bool:
        """Update media fields"""
        if not kwargs:
            return False
        
        allowed_fields = ['caption', 'display_order']
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields}
        
        if not updates:
            return False
        
        updates['updated_at'] = datetime.utcnow().isoformat()
        
        update_expr = 'SET ' + ', '.join([f'#{k} = :{k}' for k in updates.keys()])
        expr_names = {f'#{k}': k for k in updates.keys()}
        expr_values = {f':{k}': v for k, v in updates.items()}
        
        try:
            self.media_table.update_item(
                Key={'media_id': media_id},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values
            )
            return True
        except Exception:
            return False
    
    def delete_media(self, media_id: str) -> bool:
        """Delete a media record"""
        try:
            # Also delete from S3
            media = self.get_media_by_id(media_id)
            if media and media.get('file_key'):
                try:
                    self.s3_client.delete_object(Bucket=S3_MEDIA_BUCKET, Key=media['file_key'])
                except Exception:
                    pass  # Continue even if S3 delete fails
            
            self.media_table.delete_item(Key={'media_id': media_id})
            return True
        except Exception:
            return False
    
    def delete_media_by_project(self, project_id: str) -> int:
        """Delete all media for a project"""
        media_list = self.get_media_by_project(project_id)
        count = 0
        for media in media_list:
            if self.delete_media(media['media_id']):
                count += 1
        return count
    
    def reorder_media(self, project_id: str, media_orders: List[Dict[str, int]]) -> bool:
        """Update display order for multiple media items"""
        for item in media_orders:
            self.update_media(item['media_id'], display_order=item['display_order'])
        return True
    
    def get_media_count_by_project(self, project_id: str) -> Dict[str, int]:
        """Get count of media by type"""
        media_list = self.get_media_by_project(project_id)
        result = {'image': 0, 'video': 0, 'audio': 0, 'total': len(media_list)}
        for m in media_list:
            mtype = m.get('media_type', '')
            if mtype in result:
                result[mtype] += 1
        return result
    
    # =========================================================================
    # Distribution Operations (Phase 7)
    # =========================================================================
    
    def create_distribution(self, project_id: str, institution_type: str, institution_name: str,
                           distributed_amount: float, currency: str, distributed_by: str,
                           distribution_date: str, proof_file_key: str = None,
                           proof_file_name: str = None, notes: str = None) -> Dict[str, Any]:
        """Create a new distribution record"""
        distribution_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        item = {
            'distribution_id': distribution_id,
            'project_id': project_id,
            'institution_type': institution_type,
            'institution_name': institution_name,
            'distributed_amount': Decimal(str(distributed_amount)),
            'currency': currency,
            'proof_file_key': proof_file_key or '',
            'proof_file_name': proof_file_name or '',
            'notes': notes or '',
            'distributed_by': distributed_by,
            'distribution_date': distribution_date,
            'created_at': now,
            'updated_at': now
        }
        
        self.distributions_table.put_item(Item=item)
        
        return self._decimal_to_float(item)
    
    def get_distribution_by_id(self, distribution_id: str) -> Optional[Dict[str, Any]]:
        """Get distribution by ID"""
        response = self.distributions_table.get_item(Key={'distribution_id': distribution_id})
        item = response.get('Item')
        return self._decimal_to_float(item) if item else None
    
    def get_distributions_by_project(self, project_id: str) -> List[Dict[str, Any]]:
        """Get all distributions for a project"""
        response = self.distributions_table.query(
            IndexName='ProjectIndex',
            KeyConditionExpression=Key('project_id').eq(project_id),
            ScanIndexForward=False
        )
        return [self._decimal_to_float(item) for item in response.get('Items', [])]
    
    def update_distribution(self, distribution_id: str, **kwargs) -> bool:
        """Update distribution fields"""
        if not kwargs:
            return False
        
        allowed_fields = ['institution_type', 'institution_name', 'distributed_amount',
                          'currency', 'proof_file_key', 'proof_file_name', 'notes',
                          'distribution_date']
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields}
        
        if not updates:
            return False
        
        updates['updated_at'] = datetime.utcnow().isoformat()
        
        update_expr = 'SET ' + ', '.join([f'#{k} = :{k}' for k in updates.keys()])
        expr_names = {f'#{k}': k for k in updates.keys()}
        expr_values = {f':{k}': Decimal(str(v)) if isinstance(v, float) else v for k, v in updates.items()}
        
        try:
            self.distributions_table.update_item(
                Key={'distribution_id': distribution_id},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values
            )
            return True
        except Exception:
            return False
    
    def delete_distribution(self, distribution_id: str) -> bool:
        """Delete a distribution record"""
        try:
            self.distributions_table.delete_item(Key={'distribution_id': distribution_id})
            return True
        except Exception:
            return False
    
    def delete_distributions_by_project(self, project_id: str) -> int:
        """Delete all distributions for a project"""
        distributions = self.get_distributions_by_project(project_id)
        count = 0
        for dist in distributions:
            if self.delete_distribution(dist['distribution_id']):
                count += 1
        return count
    
    def get_distribution_stats(self, project_id: str) -> Dict[str, Any]:
        """Get distribution statistics for a project"""
        distributions = self.get_distributions_by_project(project_id)
        
        total_distributed = sum(d.get('distributed_amount', 0) for d in distributions)
        unique_institutions = len(set(d.get('institution_name', '') for d in distributions))
        
        return {
            'total_distributions': len(distributions),
            'total_distributed': total_distributed,
            'unique_institutions': unique_institutions
        }


# Singleton database instance
fund_db = FundDatabaseConnection.get_connection()
