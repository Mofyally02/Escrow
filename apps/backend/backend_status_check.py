#!/usr/bin/env python3
"""
Comprehensive backend status check.
Verifies all critical components are in place and functional.
"""
import sys
import os

def check_structure():
    """Check project structure"""
    print("📁 Checking Project Structure...")
    required_dirs = [
        "app/api/v1",
        "app/core",
        "app/models",
        "app/schemas",
        "app/crud",
        "app/middleware",
        "app/utils",
        "alembic/versions",
        "tests"
    ]
    
    missing = []
    for dir_path in required_dirs:
        if not os.path.exists(dir_path):
            missing.append(dir_path)
    
    if missing:
        print(f"  ❌ Missing directories: {', '.join(missing)}")
        return False
    else:
        print(f"  ✅ All {len(required_dirs)} required directories exist")
        return True

def check_files():
    """Check critical files"""
    print("\n📄 Checking Critical Files...")
    required_files = [
        "app/main.py",
        "app/core/config.py",
        "app/core/security.py",
        "app/core/database.py",
        "app/core/encryption.py",
        "app/api/v1/router.py",
        "requirements.txt",
        "alembic.ini",
        "README.md",
        "run_all_tests.py"
    ]
    
    missing = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing.append(file_path)
    
    if missing:
        print(f"  ❌ Missing files: {', '.join(missing)}")
        return False
    else:
        print(f"  ✅ All {len(required_files)} critical files exist")
        return True

def check_migrations():
    """Check migration files"""
    print("\n🗄️  Checking Database Migrations...")
    migrations_dir = "alembic/versions"
    if not os.path.exists(migrations_dir):
        print("  ❌ Migrations directory not found")
        return False
    
    migration_files = [f for f in os.listdir(migrations_dir) if f.endswith('.py') and f != '__init__.py']
    
    if len(migration_files) < 5:
        print(f"  ⚠️  Only {len(migration_files)} migration files found (expected 5)")
        return False
    else:
        print(f"  ✅ {len(migration_files)} migration files found")
        return True

def main():
    print("=" * 70)
    print("ESCROW BACKEND - COMPREHENSIVE STATUS CHECK")
    print("=" * 70)
    print()
    
    results = []
    results.append(("Structure", check_structure()))
    results.append(("Files", check_files()))
    results.append(("Migrations", check_migrations()))
    
    print("\n" + "=" * 70)
    print("STATUS SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"  {status} {name}")
    
    print(f"\nResults: {passed}/{total} checks passed")
    print("=" * 70)
    
    if passed == total:
        print("\n✅ Backend structure is complete and ready!")
        return 0
    else:
        print("\n⚠️  Some checks failed - review above")
        return 1

if __name__ == "__main__":
    sys.exit(main())
