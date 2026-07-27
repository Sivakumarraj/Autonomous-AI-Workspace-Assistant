"""Auth Service - Authentication business logic"""


from app.core.security import create_access_token, hash_password, verify_password


class AuthService:
    def __init__(self):
        self.users: dict[str, dict] = {}

    async def authenticate(self, username: str, password: str) -> str | None:
        """Authenticate a user and return a token"""
        user = self.users.get(username)
        if user and verify_password(password, user["password_hash"]):
            return create_access_token({"sub": username})
        return None

    async def register(self, username: str, password: str, email: str) -> dict:
        """Register a new user"""
        self.users[username] = {
            "username": username,
            "password_hash": hash_password(password),
            "email": email,
        }
        return {"username": username, "email": email}


auth_service = AuthService()
