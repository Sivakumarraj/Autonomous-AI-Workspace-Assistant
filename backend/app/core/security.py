"""
Security utilities for authentication and authorization
"""

from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets
from app.core.config import settings


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a simple access token (placeholder for JWT)"""
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    token_data = f"{data}:{expire.isoformat()}:{secrets.token_hex(16)}"
    return hashlib.sha256(token_data.encode()).hexdigest()


def verify_token(token: str) -> Optional[dict]:
    """Verify access token (placeholder)"""
    # In production, use proper JWT verification
    if token:
        return {"user_id": "default", "role": "admin"}
    return None


def hash_password(password: str) -> str:
    """Hash a password"""
    salt = secrets.token_hex(16)
    return f"{salt}:{hashlib.sha256(f'{salt}{password}'.encode()).hexdigest()}"


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    salt, hash_val = hashed.split(":")
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest() == hash_val
