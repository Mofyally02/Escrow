#!/usr/bin/env python3
"""
Python version checker for ESCROW backend.
Ensures Python 3.11 is being used (required for pydantic-core, psycopg2-binary compatibility).
"""
import sys

REQUIRED_MAJOR = 3
REQUIRED_MINOR = 11
MIN_SUPPORTED_MINOR = 11
MAX_SUPPORTED_MINOR = 13  # Python 3.13 is supported with updated dependencies

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    version_str = f"{version.major}.{version.minor}.{version.micro}"
    
    print(f"Current Python version: {version_str}")
    
    # Check major version
    if version.major != REQUIRED_MAJOR:
        print(f"❌ ERROR: Python {REQUIRED_MAJOR}.x required, found {version.major}.x")
        print(f"\nPlease install Python {REQUIRED_MAJOR}.{REQUIRED_MINOR}:")
        print("  macOS: brew install python@3.11")
        print("  Ubuntu: sudo apt-get install python3.11 python3.11-venv")
        print("  Or use pyenv: pyenv install 3.11.9")
        return False
    
    # Check minor version
    if version.minor < MIN_SUPPORTED_MINOR:
        print(f"❌ ERROR: Python {REQUIRED_MAJOR}.{REQUIRED_MINOR}+ required, found {version_str}")
        print(f"\nPlease upgrade to Python {REQUIRED_MAJOR}.{REQUIRED_MINOR} or higher")
        return False
    
    if version.minor > MAX_SUPPORTED_MINOR:
        print(f"⚠️  WARNING: Python {version_str} detected")
        print(f"   Python {REQUIRED_MAJOR}.{MIN_SUPPORTED_MINOR}-{MAX_SUPPORTED_MINOR} is recommended")
        print(f"   Python 3.14+ may cause build failures with:")
        print(f"   - pydantic-core (Rust build issues)")
        print(f"   - psycopg2-binary (wheel build failures)")
        print(f"\n   Recommended: Use Python {REQUIRED_MAJOR}.{MAX_SUPPORTED_MINOR} or lower")
        print(f"\n   To install Python {REQUIRED_MAJOR}.{MAX_SUPPORTED_MINOR}:")
        print(f"   macOS: brew install python@3.13")
        print(f"   Ubuntu: sudo apt-get install python3.13 python3.13-venv")
        print(f"   pyenv: pyenv install 3.13.0 && pyenv local 3.13.0")
        return False
    
    if REQUIRED_MINOR <= version.minor <= MAX_SUPPORTED_MINOR:
        print(f"✅ Python {version_str} is compatible")
        if version.minor == MAX_SUPPORTED_MINOR:
            print(f"   Using latest supported version - great choice!")
        return True
    
    return True

if __name__ == "__main__":
    success = check_python_version()
    sys.exit(0 if success else 1)

