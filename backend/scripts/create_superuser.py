#!/usr/bin/env python3
"""
Script to create a superuser for Krilin AI admin panel.
Usage: python scripts/create_superuser.py
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import all models to ensure relationships are configured
from app.models import user, conversation, goal, data_source, workflow, community
from app.database import AsyncSessionLocal
from app.utils.security import create_user


async def create_superuser():
    """Create a superuser interactively."""
    print("=== Krilin AI Superuser Creation ===\n")

    # Get user input
    email = input("Email address: ").strip()
    if not email:
        print("Error: Email is required")
        return

    full_name = input("Full name (optional): ").strip() or None

    # Get password with confirmation
    import getpass
    password = getpass.getpass("Password: ")
    password_confirm = getpass.getpass("Confirm password: ")

    if password != password_confirm:
        print("Error: Passwords don't match")
        return

    if len(password) < 8:
        print("Error: Password must be at least 8 characters")
        return

    # Create user in database
    async with AsyncSessionLocal() as db:
        from app.utils.security import get_user_by_email

        # Check if user already exists
        existing_user = await get_user_by_email(db, email)
        if existing_user:
            print(f"\nError: User with email {email} already exists")
            return

        # Create the user
        try:
            user = await create_user(
                db=db,
                email=email,
                password=password,
                full_name=full_name,
                preferences={}
            )

            print(f"\n✅ Superuser created successfully!")
            print(f"   Email: {user.email}")
            print(f"   ID: {user.id}")
            print(f"\nYou can now login to the admin panel at:")
            print(f"   http://localhost:8001/admin")

        except Exception as e:
            print(f"\n❌ Error creating user: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(create_superuser())
