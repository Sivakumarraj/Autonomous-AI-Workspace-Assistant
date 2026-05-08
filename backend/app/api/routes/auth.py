"""
Authentication API routes
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.security import create_access_token, hash_password, verify_password

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    email: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Simple in-memory user store
users_db = {
    "admin": {
        "username": "admin",
        "password_hash": hash_password("admin123"),
        "email": "admin@nexusai.com",
    }
}


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    """Login and get access token"""
    user = users_db.get(data.username)
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": data.username})
    return TokenResponse(access_token=token)


@router.post("/register", response_model=TokenResponse)
async def register(data: RegisterRequest):
    """Register a new user"""
    if data.username in users_db:
        raise HTTPException(status_code=400, detail="Username already taken")

    users_db[data.username] = {
        "username": data.username,
        "password_hash": hash_password(data.password),
        "email": data.email,
    }
    token = create_access_token({"sub": data.username})
    return TokenResponse(access_token=token)
