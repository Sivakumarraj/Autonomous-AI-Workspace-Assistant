"""Shared FastAPI dependencies."""


from fastapi import Header, HTTPException

from app.core.security import verify_token


def _extract_bearer(authorization: str | None) -> str | None:
    """Pull the token out of an `Authorization: Bearer <token>` header."""
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None

    return token.strip()


async def get_current_user(authorization: str | None = Header(None)) -> dict:
    """Require a valid JWT and return its claims."""
    token = _extract_bearer(authorization)

    if token is None:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    claims = verify_token(token)
    if claims is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return claims


async def optional_auth(
    authorization: str | None = Header(None),
) -> dict | None:
    """Return the claims if a valid token was supplied, otherwise None."""
    token = _extract_bearer(authorization)
    return verify_token(token) if token else None
