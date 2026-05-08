"""Database session management"""

from app.database.base import db_config


class DatabaseSession:
    """Simple database session placeholder"""

    def __init__(self):
        self.url = db_config.url

    async def connect(self):
        pass

    async def disconnect(self):
        pass

    async def execute(self, query: str, params: dict = None):
        pass


db_session = DatabaseSession()
