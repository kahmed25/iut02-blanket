"""
User and Session models supporting both SQLite and DynamoDB
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pathlib import Path
from auth.auth_config import (
    DB_TYPE, REFRESH_TOKEN_EXPIRE_DAYS,
    ROLE_USER, ROLE_SUPER_ADMIN, is_super_admin
)

# SQLite imports (conditional)
if DB_TYPE == "sqlite":
    import sqlite3
    from auth.auth_config import SQLITE_DB_PATH

# DynamoDB imports (conditional)
if DB_TYPE == "dynamodb":
    import boto3
    from boto3.dynamodb.conditions import Key, Attr
    from botocore.exceptions import ClientError
    from auth.auth_config import DYNAMODB_REGION, DYNAMODB_USERS_TABLE, DYNAMODB_SESSIONS_TABLE


class DatabaseConnection:
    """Factory for database connections"""
    
    @staticmethod
    def get_connection():
        if DB_TYPE == "sqlite":
            return SQLiteDatabase()
        else:
            return DynamoDBDatabase()


class SQLiteDatabase:
    """SQLite database implementation for local development"""
    
    def __init__(self):
        self.db_path = SQLITE_DB_PATH
        self._init_db()
    
    def _init_db(self):
        """Initialize SQLite database with tables"""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Users table (with Phase 5 role support and email auth fields)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                email TEXT,
                username TEXT,
                provider TEXT NOT NULL,
                provider_id TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                assigned_projects TEXT DEFAULT '[]',
                password_hash TEXT,
                email_verified INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                last_login TEXT NOT NULL,
                UNIQUE(provider, provider_id)
            )
        """)
        
        # Add role column if it doesn't exist (migration for existing databases)
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'")
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN assigned_projects TEXT DEFAULT '[]'")
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        # Add email auth columns if they don't exist
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0")
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        # Sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                refresh_token TEXT UNIQUE NOT NULL,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )
        """)
        
        conn.commit()
        conn.close()
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    
    def get_user_by_provider(self, provider: str, provider_id: str) -> Optional[Dict[str, Any]]:
        """Get user by provider and provider_id"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT * FROM users WHERE provider = ? AND provider_id = ?",
            (provider, provider_id)
        )
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by user_id"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    
    def create_user(self, email: str, username: Optional[str], provider: str, provider_id: str) -> Dict[str, Any]:
        """Create new user with role assignment"""
        user_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        # Auto-assign super_admin role if email matches
        role = ROLE_SUPER_ADMIN if is_super_admin(email) else ROLE_USER
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(
            """
            INSERT INTO users (user_id, email, username, provider, provider_id, role, assigned_projects, created_at, last_login)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, email, username, provider, provider_id, role, '[]', now, now)
        )
        
        conn.commit()
        conn.close()
        
        return {
            "user_id": user_id,
            "email": email,
            "username": username,
            "provider": provider,
            "provider_id": provider_id,
            "role": role,
            "assigned_projects": [],
            "created_at": now,
            "last_login": now
        }
    
    def update_last_login(self, user_id: str):
        """Update user's last login timestamp"""
        now = datetime.utcnow().isoformat()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("UPDATE users SET last_login = ? WHERE user_id = ?", (now, user_id))
        
        conn.commit()
        conn.close()
    
    def create_session(self, user_id: str, refresh_token: str) -> Dict[str, Any]:
        """Create new session"""
        session_id = str(uuid.uuid4())
        now = datetime.utcnow()
        expires_at = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(
            """
            INSERT INTO sessions (session_id, user_id, refresh_token, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (session_id, user_id, refresh_token, expires_at.isoformat(), now.isoformat())
        )
        
        conn.commit()
        conn.close()
        
        return {
            "session_id": session_id,
            "user_id": user_id,
            "refresh_token": refresh_token,
            "expires_at": expires_at.isoformat(),
            "created_at": now.isoformat()
        }
    
    def get_session_by_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """Get session by refresh token"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM sessions WHERE refresh_token = ?", (refresh_token,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            session = dict(row)
            # Check if expired
            expires_at = datetime.fromisoformat(session["expires_at"])
            if expires_at < datetime.utcnow():
                self.delete_session(session["session_id"])
                return None
            return session
        return None
    
    def delete_session(self, session_id: str):
        """Delete session"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
        
        conn.commit()
        conn.close()
    
    def delete_session_by_token(self, refresh_token: str):
        """Delete session by refresh token"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM sessions WHERE refresh_token = ?", (refresh_token,))
        
        conn.commit()
        conn.close()
    
    def update_user_role(self, user_id: str, role: str) -> bool:
        """Update user's role"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("UPDATE users SET role = ? WHERE user_id = ?", (role, user_id))
        
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        
        return affected > 0
    
    def get_all_users(self) -> list:
        """Get all users (for admin)"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def assign_project_to_user(self, user_id: str, project_id: str) -> bool:
        """Assign a project to a fund admin"""
        import json
        
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        # Parse existing projects
        assigned = json.loads(user.get('assigned_projects', '[]') or '[]')
        if project_id not in assigned:
            assigned.append(project_id)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE users SET assigned_projects = ? WHERE user_id = ?",
            (json.dumps(assigned), user_id)
        )
        
        conn.commit()
        conn.close()
        return True
    
    def unassign_project_from_user(self, user_id: str, project_id: str) -> bool:
        """Remove a project assignment from a fund admin"""
        import json
        
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        assigned = json.loads(user.get('assigned_projects', '[]') or '[]')
        if project_id in assigned:
            assigned.remove(project_id)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE users SET assigned_projects = ? WHERE user_id = ?",
            (json.dumps(assigned), user_id)
        )
        
        conn.commit()
        conn.close()
        return True
    
    def create_email_user(self, email: str, username: str, password_hash: str) -> Dict[str, Any]:
        """Create new user with email/password authentication"""
        user_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        # Auto-assign super_admin role if email matches
        role = ROLE_SUPER_ADMIN if is_super_admin(email) else ROLE_USER
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(
            """
            INSERT INTO users (user_id, email, username, provider, provider_id, role, assigned_projects, password_hash, email_verified, created_at, last_login)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, email, username, 'email', email, role, '[]', password_hash, 1, now, now)
        )
        
        conn.commit()
        conn.close()
        
        return {
            "user_id": user_id,
            "email": email,
            "username": username,
            "provider": 'email',
            "provider_id": email,
            "role": role,
            "assigned_projects": [],
            "password_hash": password_hash,
            "email_verified": True,
            "created_at": now,
            "last_login": now
        }
    
    def update_email_user_fields(self, user_id: str, password_hash: str, email_verified: bool):
        """Update email user specific fields"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE users SET password_hash = ?, email_verified = ? WHERE user_id = ?",
            (password_hash, 1 if email_verified else 0, user_id)
        )
        
        conn.commit()
        conn.close()
    
    def update_user_password(self, user_id: str, password_hash: str):
        """Update user's password hash"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE users SET password_hash = ? WHERE user_id = ?",
            (password_hash, user_id)
        )
        
        conn.commit()
        conn.close()


class DynamoDBDatabase:
    """DynamoDB database implementation for AWS deployment"""
    
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name=DYNAMODB_REGION)
        self.users_table = self.dynamodb.Table(DYNAMODB_USERS_TABLE)
        self.sessions_table = self.dynamodb.Table(DYNAMODB_SESSIONS_TABLE)
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email. Uses GSI if present, falls back to scan."""
        try:
            response = self.users_table.query(
                IndexName='EmailIndex',
                KeyConditionExpression=Key('email').eq(email)
            )
            items = response.get('Items', [])
        except ClientError:
            # Fall back to scan if index not available
            response = self.users_table.scan(
                FilterExpression=Attr('email').eq(email)
            )
            items = response.get('Items', [])
        return items[0] if items else None
    
    def get_user_by_provider(self, provider: str, provider_id: str) -> Optional[Dict[str, Any]]:
        """Get user by provider and provider_id. Uses GSI if present, falls back to scan."""
        try:
            response = self.users_table.query(
                IndexName='ProviderIndex',
                KeyConditionExpression=Key('provider').eq(provider) & Key('provider_id').eq(provider_id)
            )
            items = response.get('Items', [])
        except ClientError:
            response = self.users_table.scan(
                FilterExpression=Attr('provider').eq(provider) & Attr('provider_id').eq(provider_id)
            )
            items = response.get('Items', [])
        return items[0] if items else None
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by user_id"""
        response = self.users_table.get_item(Key={'user_id': user_id})
        return response.get('Item')
    
    def create_user(self, email: str, username: Optional[str], provider: str, provider_id: str) -> Dict[str, Any]:
        """Create new user with role assignment"""
        user_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        # Auto-assign super_admin role if email matches
        role = ROLE_SUPER_ADMIN if is_super_admin(email) else ROLE_USER
        
        user = {
            'user_id': user_id,
            'email': email,
            'username': username,
            'provider': provider,
            'provider_id': provider_id,
            'role': role,
            'assigned_projects': [],
            'created_at': now,
            'last_login': now
        }
        
        self.users_table.put_item(Item=user)
        return user
    
    def update_last_login(self, user_id: str):
        """Update user's last login timestamp"""
        now = datetime.utcnow().isoformat()
        
        self.users_table.update_item(
            Key={'user_id': user_id},
            UpdateExpression='SET last_login = :last_login',
            ExpressionAttributeValues={':last_login': now}
        )
    
    def create_session(self, user_id: str, refresh_token: str) -> Dict[str, Any]:
        """Create new session"""
        session_id = str(uuid.uuid4())
        now = datetime.utcnow()
        expires_at = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
        # DynamoDB TTL expects Unix timestamp
        ttl = int(expires_at.timestamp())
        
        session = {
            'session_id': session_id,
            'user_id': user_id,
            'refresh_token': refresh_token,
            'expires_at': expires_at.isoformat(),
            'created_at': now.isoformat(),
            'ttl': ttl  # DynamoDB will auto-delete expired sessions
        }
        
        self.sessions_table.put_item(Item=session)
        return session
    
    def get_session_by_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """Get session by refresh token. Uses GSI if present, falls back to scan."""
        try:
            response = self.sessions_table.query(
                IndexName='RefreshTokenIndex',
                KeyConditionExpression=Key('refresh_token').eq(refresh_token)
            )
            items = response.get('Items', [])
        except ClientError:
            response = self.sessions_table.scan(
                FilterExpression=Attr('refresh_token').eq(refresh_token)
            )
            items = response.get('Items', [])
        
        if items:
            session = items[0]
            # Check if expired
            try:
                expires_at = datetime.fromisoformat(session.get('expires_at', ''))
                if expires_at < datetime.utcnow():
                    return None
            except Exception:
                pass
            return session
        return None
    
    def delete_session(self, session_id: str):
        """Delete session"""
        self.sessions_table.delete_item(Key={'session_id': session_id})
    
    def delete_session_by_token(self, refresh_token: str):
        """Delete session by refresh token"""
        session = self.get_session_by_token(refresh_token)
        if session:
            self.delete_session(session['session_id'])
    
    def update_user_role(self, user_id: str, role: str) -> bool:
        """Update user's role"""
        try:
            self.users_table.update_item(
                Key={'user_id': user_id},
                UpdateExpression='SET #role = :role',
                ExpressionAttributeNames={'#role': 'role'},
                ExpressionAttributeValues={':role': role}
            )
            return True
        except ClientError:
            return False
    
    def get_all_users(self) -> list:
        """Get all users (for admin)"""
        response = self.users_table.scan()
        items = response.get('Items', [])
        
        # Sort by created_at descending
        items.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return items
    
    def assign_project_to_user(self, user_id: str, project_id: str) -> bool:
        """Assign a project to a fund admin"""
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        # Get existing projects
        assigned = user.get('assigned_projects', [])
        if not isinstance(assigned, list):
            assigned = []
        
        if project_id not in assigned:
            assigned.append(project_id)
            
            try:
                self.users_table.update_item(
                    Key={'user_id': user_id},
                    UpdateExpression='SET assigned_projects = :projects',
                    ExpressionAttributeValues={':projects': assigned}
                )
                return True
            except ClientError:
                return False
        return True
    
    def unassign_project_from_user(self, user_id: str, project_id: str) -> bool:
        """Remove a project assignment from a fund admin"""
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        assigned = user.get('assigned_projects', [])
        if not isinstance(assigned, list):
            assigned = []
        
        if project_id in assigned:
            assigned.remove(project_id)
            
            try:
                self.users_table.update_item(
                    Key={'user_id': user_id},
                    UpdateExpression='SET assigned_projects = :projects',
                    ExpressionAttributeValues={':projects': assigned}
                )
                return True
            except ClientError:
                return False
        return True
    
    def create_email_user(self, email: str, username: str, password_hash: str) -> Dict[str, Any]:
        """Create new user with email/password authentication"""
        user_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        # Auto-assign super_admin role if email matches
        role = ROLE_SUPER_ADMIN if is_super_admin(email) else ROLE_USER
        
        user = {
            'user_id': user_id,
            'email': email,
            'username': username,
            'provider': 'email',
            'provider_id': email,
            'role': role,
            'assigned_projects': [],
            'password_hash': password_hash,
            'email_verified': True,
            'created_at': now,
            'last_login': now
        }
        
        self.users_table.put_item(Item=user)
        return user
    
    def update_email_user_fields(self, user_id: str, password_hash: str, email_verified: bool):
        """Update email user specific fields"""
        try:
            self.users_table.update_item(
                Key={'user_id': user_id},
                UpdateExpression='SET password_hash = :ph, email_verified = :ev',
                ExpressionAttributeValues={
                    ':ph': password_hash,
                    ':ev': email_verified
                }
            )
        except ClientError as e:
            print(f"Error updating email user fields: {e}")
    
    def update_user_password(self, user_id: str, password_hash: str):
        """Update user's password hash"""
        try:
            self.users_table.update_item(
                Key={'user_id': user_id},
                UpdateExpression='SET password_hash = :ph',
                ExpressionAttributeValues={':ph': password_hash}
            )
        except ClientError as e:
            print(f"Error updating password: {e}")


# Singleton database instance
db = DatabaseConnection.get_connection()
