"""
API Dependencies for dependency injection
"""

from fastapi import Depends, HTTPException, Header
from typing import Optional
from app.core.security import verify_token


async def get_current_user(authorization: Optional[str] = Header(None)):
    """Get the current authenticated user from the token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.replace("Bearer ", "")
    user = verify_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    return user


async def optional_auth(authorization: Optional[str] = Header(None)):
    """Optional authentication - returns None if no token"""
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "")
    return verify_token(token)
