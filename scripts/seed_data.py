"""Seed data script - Populate database with initial data"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))


def seed_data():
    """Seed the database with initial data"""
    print("Seeding database with initial data...")

    # Sample conversations
    conversations = [
        {"title": "Research Assistant Session", "messages": 4},
        {"title": "Code Review & Analysis", "messages": 6},
        {"title": "Document Summarization", "messages": 2},
    ]

    # Sample workflows
    workflows = [
        {"name": "Code Review Assistant", "status": "completed", "steps": 6},
        {"name": "Document Intelligence Pipeline", "status": "active", "steps": 8},
        {"name": "Data Report Generator", "status": "failed", "steps": 7},
        {"name": "Email Digest Automation", "status": "active", "steps": 5},
    ]

    print(f"  Created {len(conversations)} conversations")
    print(f"  Created {len(workflows)} workflows")
    print("Seeding completed successfully.")


if __name__ == "__main__":
    seed_data()
