"""Database base configuration"""

from dataclasses import dataclass


@dataclass
class DatabaseConfig:
    url: str = "sqlite:///./workspace.db"
    echo: bool = False


db_config = DatabaseConfig()
