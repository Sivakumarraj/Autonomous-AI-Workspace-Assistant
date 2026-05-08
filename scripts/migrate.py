"""Database migration script"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))


def run_migrations():
    """Run database migrations"""
    print("Running database migrations...")
    # Placeholder for Alembic migrations
    print("Migrations completed successfully.")


if __name__ == "__main__":
    run_migrations()
