#!/usr/bin/env python3
"""
Script to create a super admin user or update existing user to super_admin.
Usage:
    python scripts/create_super_admin.py <email> <password> [full_name]
    
Example:
    python scripts/create_super_admin.py admin@example.com "MyPassword123" "Admin User"
"""
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.user import User, Role
from app.crud.user import get_user_by_email, create_user
from app.schemas.user import UserCreate
from app.core.security import hash_password


def create_or_update_super_admin(email: str, password: str, full_name: str = None):
    """
    Create a new super admin user or update existing user to super_admin.
    
    Args:
        email: User's email address
        password: User's password
        full_name: User's full name (optional, defaults to email username)
    """
    db = SessionLocal()
    
    try:
        # Check if user already exists
        user = get_user_by_email(db, email)
        
        if user:
            # User exists - update to super_admin
            if user.role == Role.SUPER_ADMIN:
                print(f"✅ User '{email}' is already a super_admin")
                print(f"   User ID: {user.id}")
                print(f"   Full Name: {user.full_name}")
                print(f"   Role: {user.role.value}")
                return True
            
            old_role = user.role.value
            user.role = Role.SUPER_ADMIN
            
            # Update password if provided
            if password:
                user.hashed_password = hash_password(password)
                print(f"   Password updated")
            
            # Update full name if provided
            if full_name:
                user.full_name = full_name
                print(f"   Full name updated to: {full_name}")
            
            db.commit()
            db.refresh(user)
            
            print(f"✅ Successfully updated user '{email}' role from '{old_role}' to 'super_admin'")
            print(f"   User ID: {user.id}")
            print(f"   Full Name: {user.full_name}")
            print(f"   New Role: {user.role.value}")
            return True
        else:
            # User doesn't exist - create new super_admin
            if not full_name:
                # Extract name from email (part before @)
                full_name = email.split('@')[0].replace('.', ' ').title()
            
            # Generate unique phone number based on email hash
            import hashlib
            email_hash = hashlib.md5(email.encode()).hexdigest()[:10]
            unique_phone = f"+1{email_hash}"  # Format: +1 + 10 digits
            
            user_data = UserCreate(
                email=email,
                phone=unique_phone,  # Unique phone based on email hash
                full_name=full_name,
                password=password
            )
            
            user = create_user(db, user_data)
            
            # Set role to super_admin
            user.role = Role.SUPER_ADMIN
            # Mark email and phone as verified for admin users
            user.is_email_verified = True
            user.is_phone_verified = True
            user.is_active = True
            
            db.commit()
            db.refresh(user)
            
            print(f"✅ Successfully created super_admin user '{email}'")
            print(f"   User ID: {user.id}")
            print(f"   Full Name: {user.full_name}")
            print(f"   Email: {user.email}")
            print(f"   Role: {user.role.value}")
            print(f"   Email Verified: {user.is_email_verified}")
            print(f"   Phone Verified: {user.is_phone_verified}")
            print(f"   Active: {user.is_active}")
            print(f"\n📝 Note: Phone number is set to placeholder. User can update it later.")
            return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python scripts/create_super_admin.py <email> <password> [full_name]")
        print("\nExample:")
        print("  python scripts/create_super_admin.py admin@example.com 'MyPassword123' 'Admin User'")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    full_name = sys.argv[3] if len(sys.argv) > 3 else None
    
    success = create_or_update_super_admin(email, password, full_name)
    sys.exit(0 if success else 1)

