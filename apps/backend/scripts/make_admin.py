#!/usr/bin/env python3
"""
Script to set a user as admin or super_admin.
Usage:
    python scripts/make_admin.py <email> [role]
    
Examples:
    python scripts/make_admin.py user@example.com admin
    python scripts/make_admin.py user@example.com super_admin
"""
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.user import User, Role
from app.crud.user import get_user_by_email


def make_admin(email: str, role: str = "admin"):
    """
    Set a user's role to admin or super_admin.
    
    Args:
        email: User's email address
        role: Either 'admin' or 'super_admin' (default: 'admin')
    """
    db = SessionLocal()
    
    try:
        # Validate role
        if role not in ["admin", "super_admin"]:
            print(f"❌ Error: Role must be 'admin' or 'super_admin', got '{role}'")
            return False
        
        # Find user by email
        user = get_user_by_email(db, email)
        
        if not user:
            print(f"❌ Error: User with email '{email}' not found")
            return False
        
        # Set role
        role_enum = Role.ADMIN if role == "admin" else Role.SUPER_ADMIN
        old_role = user.role.value
        user.role = role_enum
        db.commit()
        
        print(f"✅ Successfully set user '{email}' role from '{old_role}' to '{role}'")
        print(f"   User ID: {user.id}")
        print(f"   Full Name: {user.full_name}")
        print(f"   New Role: {user.role.value}")
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {str(e)}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/make_admin.py <email> [role]")
        print("  role: 'admin' (default) or 'super_admin'")
        sys.exit(1)
    
    email = sys.argv[1]
    role = sys.argv[2] if len(sys.argv) > 2 else "admin"
    
    success = make_admin(email, role)
    sys.exit(0 if success else 1)

