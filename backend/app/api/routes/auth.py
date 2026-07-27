"""
Authentication routes.

Tokens are real signed JWTs (see app/core/security.py). The application's other
routes are deliberately left public so the demo works without a login step —
protect them by adding `Depends(get_current_user)` from app/api/dependencies.py.

The user store is in-process and resets on restart. That is fine for a
single-operator demo; a real multi-user deployment needs a users table.
"""

from anyio import to_thread
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password

router = APIRouter()


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=72)
    email: str = ""


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int


class UserResponse(BaseModel):
    username: str
    email: str = ""


users_db: dict = {}


def _seed_default_user() -> None:
    """Create the demo admin account.

    Only in DEBUG: shipping a known admin/admin123 login to a public
    deployment would be an open door.
    """
    if not settings.DEBUG or "admin" in users_db:
        return

    users_db["admin"] = {
        "username": "admin",
        "password_hash": hash_password("admin123"),
        "email": "admin@nexusai.local",
    }


def _issue_token(username: str) -> TokenResponse:
    token = create_access_token({"sub": username})
    return TokenResponse(
        access_token=token,
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    """Exchange credentials for an access token."""
    user = users_db.get(data.username)

    # bcrypt is intentionally slow, so verify off the event loop.
    valid = user is not None and await to_thread.run_sync(
        verify_password, data.password, user["password_hash"]
    )

    if not valid:
        # Same message either way — distinguishing them reveals which usernames
        # exist.
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return _issue_token(data.username)


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: RegisterRequest):
    """Register a new user and return a token."""
    if data.username in users_db:
        raise HTTPException(status_code=409, detail="Username already taken")

    password_hash = await to_thread.run_sync(hash_password, data.password)
    users_db[data.username] = {
        "username": data.username,
        "password_hash": password_hash,
        "email": data.email,
    }

    return _issue_token(data.username)


@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)):
    """Return the authenticated user. Useful for verifying a token works."""
    username = current_user.get("sub", "")
    user = users_db.get(username)

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(username=user["username"], email=user["email"])
