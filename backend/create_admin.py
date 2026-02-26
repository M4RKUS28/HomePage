#!/usr/bin/env python3
"""
create_admin.py – manually create or promote an admin user.

Usage (run from the backend/ directory):

    python create_admin.py --username admin --email admin@example.com --password secret

The script uses the same async SQLAlchemy session as the app, so it reads
the same .env file and connects to the same PostgreSQL database.
"""
import argparse
import asyncio
import os
import sys

# Make 'src' importable when running from backend/
sys.path.insert(0, os.path.dirname(__file__))

from src.core.security import get_password_hash
from src.db.crud.user import create_user, get_user_by_email, get_user_by_username
from src.db.session import AsyncSessionLocal


async def create_admin(username: str, email: str, password: str) -> bool:
    """
    Create a new admin user or promote an existing user to admin.

    Returns True on success, False if the user already exists.
    """
    async with AsyncSessionLocal() as db:
        existing_by_username = await get_user_by_username(db, username)
        if existing_by_username:
            print(f"Error: A user with username '{username}' already exists.")
            return False

        existing_by_email = await get_user_by_email(db, email)
        if existing_by_email:
            print(f"Error: A user with email '{email}' already exists.")
            return False

        hashed = get_password_hash(password)
        user = await create_user(
            db,
            username=username,
            email=email,
            hashed_password=hashed,
            is_admin=True,
            is_active=True,
        )
        print(f"Admin user '{user.username}' (id={user.id}) created successfully.")
        return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Create an admin user for the FastAPI application."
    )
    parser.add_argument("--username", required=True, help="Admin username")
    parser.add_argument("--email",    required=True, help="Admin e-mail address")
    parser.add_argument("--password", required=True, help="Admin password (min. 8 chars)")

    args = parser.parse_args()

    if len(args.password) < 8:
        print("Error: Password must be at least 8 characters long.")
        sys.exit(1)

    success = asyncio.run(create_admin(args.username, args.email, args.password))
    sys.exit(0 if success else 1)
