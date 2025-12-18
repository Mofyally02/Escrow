#!/usr/bin/env python3
"""
Script to list all users in the database.
Usage:
    python scripts/list_users.py
"""
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.user import User


def list_users():
    """List all users in the database"""
    db = SessionLocal()
    
    try:
        users = db.query(User).order_by(User.created_at.desc()).all()
        
        if not users:
            print("No users found in database.")
            return
        
        print(f"\n{'ID':<5} {'Email':<30} {'Name':<25} {'Role':<15} {'Active':<8} {'Created':<20}")
        print("-" * 120)
        
        for user in users:
            active = "✓" if user.is_active else "✗"
            created = user.created_at.strftime("%Y-%m-%d %H:%M") if user.created_at else "N/A"
            print(f"{user.id:<5} {user.email:<30} {user.full_name[:24]:<25} {user.role.value:<15} {active:<8} {created:<20}")
        
        print(f"\nTotal users: {len(users)}\n")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        db.close()


if __name__ == "__main__":
    list_users()

