"""
Verify that the migration includes all required auth tables.
"""
import sys
import re

migration_file = "alembic/versions/20241201_phase1_auth_tables.py"

required_tables = [
    "users",
    "otp_codes", 
    "refresh_tokens",
    "audit_logs"
]

required_indexes = [
    "ix_users_email",
    "ix_users_phone",
    "ix_otp_codes_user_id",
    "ix_refresh_tokens_token",
    "ix_audit_logs_user_id",
    "ix_audit_logs_action"
]

required_enums = [
    "role",
    "otptype",
    "auditaction"
]

print("🔍 Verifying Migration File")
print("=" * 50)

try:
    with open(migration_file, 'r') as f:
        content = f.read()
    
    print(f"✅ Migration file found: {migration_file}")
    print()
    
    # Check tables
    print("Checking tables...")
    for table in required_tables:
        if f"'{table}'" in content or f'"{table}"' in content:
            print(f"  ✅ {table}")
        else:
            print(f"  ❌ {table} - NOT FOUND")
    
    print()
    
    # Check indexes
    print("Checking indexes...")
    for index in required_indexes:
        if index in content:
            print(f"  ✅ {index}")
        else:
            print(f"  ❌ {index} - NOT FOUND")
    
    print()
    
    # Check enums
    print("Checking enums...")
    for enum in required_enums:
        if enum in content.lower():
            print(f"  ✅ {enum}")
        else:
            print(f"  ❌ {enum} - NOT FOUND")
    
    print()
    print("=" * 50)
    print("✅ Migration verification complete!")
    print()
    print("Next steps:")
    print("1. Start PostgreSQL (Docker Compose or local)")
    print("2. Run: alembic upgrade head")
    print("3. Verify tables: psql -U escrow -d escrow_dev -c '\\dt'")
    
except FileNotFoundError:
    print(f"❌ Migration file not found: {migration_file}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

