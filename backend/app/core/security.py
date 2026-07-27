"""
Authentication primitives: signed JWTs and bcrypt password hashing.

The previous implementation returned a random SHA-256 digest as the "token" —
it carried no claims and nothing could verify it, so `verify_token` accepted
*any* non-empty string as an admin user. Both are real now.
"""

from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def create_access_token(
    data: dict, expires_delta: timedelta | None = None
) -> str:
    """Create a signed JWT carrying the given claims plus an expiry."""
    payload = dict(data)
    expire = datetime.now(UTC) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload.update({"exp": expire, "iat": datetime.now(UTC)})

    return jwt.encode(
        payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def verify_token(token: str) -> dict | None:
    """Decode and verify a JWT. Returns the claims, or None if invalid."""
    if not token:
        return None

    try:
        return jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError:
        logger.info("Rejected an expired token")
        return None
    except jwt.InvalidTokenError:
        logger.info("Rejected an invalid token")
        return None


def hash_password(password: str) -> str:
    """Hash a password with bcrypt."""
    # bcrypt silently truncates at 72 bytes; reject rather than accept a
    # password whose tail is ignored.
    encoded = password.encode("utf-8")
    if len(encoded) > 72:
        raise ValueError("Password must be at most 72 bytes")

    return bcrypt.hashpw(encoded, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Check a password against its bcrypt hash, in constant time."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False
