#!/usr/bin/env python3
"""
Script to mark all existing users in the database as email and phone verified.
This is a one-time operation to verify all accounts that were registered before
verification requirements were implemented.

Usage:
    python scripts/verify_all_existing_users.py
    
This script will:
- Find all users in the database
- Set is_email_verified = True for all users
- Set is_phone_verified = True for all users
- Display a summary of updated users
"""
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.audit_log import AuditLog, AuditAction
from datetime import datetime


def verify_all_existing_users():
    """
    Mark all existing users as email and phone verified.
    """
    db = SessionLocal()
    
    try:
        # Get all users
        users = db.query(User).all()
        
        if not users:
            print("ℹ️  No users found in the database.")
            return
        
        print(f"📋 Found {len(users)} user(s) in the database")
        print("\n" + "="*60)
        
        verified_count = 0
        already_verified_count = 0
        updated_users = []
        
        for user in users:
            email_was_verified = user.is_email_verified
            phone_was_verified = user.is_phone_verified
            
            # Update verification status
            user.is_email_verified = True
            user.is_phone_verified = True
            
            # Track what was updated
            if not email_was_verified or not phone_was_verified:
                verified_count += 1
                updated_users.append({
                    'id': user.id,
                    'email': user.email,
                    'phone': user.phone,
                    'full_name': user.full_name,
                    'role': user.role.value,
                    'email_was_verified': email_was_verified,
                    'phone_was_verified': phone_was_verified,
                })
            else:
                already_verified_count += 1
        
        # Commit all changes
        db.commit()
        
        # Create audit logs for updated users
        for user_info in updated_users:
            user = db.query(User).filter(User.id == user_info['id']).first()
            if user:
                # Log email verification
                if not user_info['email_was_verified']:
                    audit_log = AuditLog(
                        user_id=user.id,
                        action=AuditAction.EMAIL_VERIFIED,
                        details=f"Email verified via bulk verification script",
                        ip_address="127.0.0.1",
                        user_agent="verify_all_existing_users.py"
                    )
                    db.add(audit_log)
                
                # Log phone verification
                if not user_info['phone_was_verified']:
                    audit_log = AuditLog(
                        user_id=user.id,
                        action=AuditAction.PHONE_VERIFIED,
                        details=f"Phone verified via bulk verification script",
                        ip_address="127.0.0.1",
                        user_agent="verify_all_existing_users.py"
                    )
                    db.add(audit_log)
        
        db.commit()
        
        # Display summary
        print(f"\n✅ Verification Complete!")
        print(f"   Total users: {len(users)}")
        print(f"   Updated: {verified_count}")
        print(f"   Already verified: {already_verified_count}")
        
        if updated_users:
            print(f"\n📝 Updated Users:")
            print("-" * 60)
            for user_info in updated_users:
                changes = []
                if not user_info['email_was_verified']:
                    changes.append("email")
                if not user_info['phone_was_verified']:
                    changes.append("phone")
                
                print(f"   ID: {user_info['id']}")
                print(f"   Email: {user_info['email']}")
                print(f"   Phone: {user_info['phone']}")
                print(f"   Name: {user_info['full_name']}")
                print(f"   Role: {user_info['role']}")
                print(f"   Verified: {', '.join(changes)}")
                print()
        
        print("="*60)
        print("✅ All existing users have been marked as verified!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()
    
    return True


if __name__ == "__main__":
    print("🚀 Starting bulk user verification...")
    print("="*60)
    
    # Confirm before proceeding
    response = input("\n⚠️  This will mark ALL users as email and phone verified.\n   Continue? (yes/no): ")
    
    if response.lower() not in ['yes', 'y']:
        print("❌ Operation cancelled.")
        sys.exit(0)
    
    success = verify_all_existing_users()
    
    if success:
        print("\n✅ Script completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Script failed!")
        sys.exit(1)

