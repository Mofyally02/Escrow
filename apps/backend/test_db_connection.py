"""Test database connection and verify tables"""
from app.core.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        # Test connection
        result = conn.execute(text("SELECT version()"))
        version = result.fetchone()[0]
        print("✅ Database connection successful")
        print(f"   PostgreSQL version: {version.split(',')[0]}")
        
        # Check tables
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """))
        tables = [row[0] for row in result]
        
        print(f"\n✅ Found {len(tables)} tables:")
        for table in tables:
            print(f"   - {table}")
        
        # Verify auth tables
        required_tables = ['users', 'otp_codes', 'refresh_tokens', 'audit_logs']
        missing = [t for t in required_tables if t not in tables]
        
        if missing:
            print(f"\n❌ Missing tables: {missing}")
        else:
            print(f"\n✅ All required auth tables present!")
        
        # Check enums
        result = conn.execute(text("""
            SELECT typname 
            FROM pg_type 
            WHERE typname IN ('role', 'otptype', 'auditaction')
            ORDER BY typname
        """))
        enums = [row[0] for row in result]
        
        print(f"\n✅ Found {len(enums)} enums:")
        for enum in enums:
            print(f"   - {enum}")
        
        print("\n✅ Database is ready for use!")
        
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    exit(1)

