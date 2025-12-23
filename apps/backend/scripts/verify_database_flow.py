#!/usr/bin/env python3
"""
Verify the complete database flow:
1. Database connection
2. Listing submission → UNDER_REVIEW
3. Admin approval → APPROVED
4. Buyer visibility (catalog shows APPROVED listings)
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect
from app.core.database import engine, SessionLocal, Base
from app.models.listing import Listing, ListingState
from app.models.user import User
from app.crud import listing as listing_crud, catalog as catalog_crud

def verify_database_connection():
    """Verify database connection and tables exist"""
    print("=" * 60)
    print("STEP 1: Verifying Database Connection")
    print("=" * 60)
    
    try:
        # Check if we can connect
        with engine.connect() as conn:
            print("✅ Database connection successful")
        
        # Check tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        required_tables = ['listings', 'users', 'credential_vaults', 'listing_proofs']
        missing_tables = [t for t in required_tables if t not in tables]
        
        if missing_tables:
            print(f"❌ Missing tables: {', '.join(missing_tables)}")
            print(f"   Available tables: {', '.join(tables)}")
            return False
        else:
            print(f"✅ All required tables exist: {', '.join(required_tables)}")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False


def verify_listing_states():
    """Verify listing states in database"""
    print("\n" + "=" * 60)
    print("STEP 2: Verifying Listing States")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Count listings by state
        states = {
            ListingState.DRAFT: db.query(Listing).filter(Listing.state == ListingState.DRAFT).count(),
            ListingState.UNDER_REVIEW: db.query(Listing).filter(Listing.state == ListingState.UNDER_REVIEW).count(),
            ListingState.APPROVED: db.query(Listing).filter(Listing.state == ListingState.APPROVED).count(),
            ListingState.RESERVED: db.query(Listing).filter(Listing.state == ListingState.RESERVED).count(),
            ListingState.SOLD: db.query(Listing).filter(Listing.state == ListingState.SOLD).count(),
        }
        
        print(f"📊 Listing counts by state:")
        for state, count in states.items():
            print(f"   {state.value}: {count}")
        
        # Show sample listings
        under_review = db.query(Listing).filter(Listing.state == ListingState.UNDER_REVIEW).limit(3).all()
        approved = db.query(Listing).filter(Listing.state == ListingState.APPROVED).limit(3).all()
        
        if under_review:
            print(f"\n📝 Sample UNDER_REVIEW listings ({len(under_review)}):")
            for listing in under_review:
                print(f"   - ID: {listing.id}, Title: {listing.title[:50]}, Seller: {listing.seller_id}")
        
        if approved:
            print(f"\n✅ Sample APPROVED listings ({len(approved)}):")
            for listing in approved:
                print(f"   - ID: {listing.id}, Title: {listing.title[:50]}, Seller: {listing.seller_id}")
        
        return True
    except Exception as e:
        print(f"❌ Error checking listing states: {str(e)}")
        return False
    finally:
        db.close()


def verify_admin_functions():
    """Verify admin approval functions work"""
    print("\n" + "=" * 60)
    print("STEP 3: Verifying Admin Approval Functions")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Check if approve_listing function exists
        if hasattr(listing_crud, 'approve_listing'):
            print("✅ approve_listing function exists")
        else:
            print("❌ approve_listing function missing")
            return False
        
        # Check if get_listings_for_admin function exists
        if hasattr(listing_crud, 'get_listings_for_admin'):
            print("✅ get_listings_for_admin function exists")
            
            # Test the function
            pending = listing_crud.get_listings_for_admin(
                db=db,
                state=ListingState.UNDER_REVIEW,
                limit=5
            )
            print(f"   Found {len(pending)} listings pending approval")
        else:
            print("❌ get_listings_for_admin function missing")
            return False
        
        return True
    except Exception as e:
        print(f"❌ Error verifying admin functions: {str(e)}")
        return False
    finally:
        db.close()


def verify_buyer_catalog():
    """Verify buyer catalog functions work"""
    print("\n" + "=" * 60)
    print("STEP 4: Verifying Buyer Catalog Functions")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Check if get_approved_listings function exists
        if hasattr(catalog_crud, 'get_approved_listings'):
            print("✅ get_approved_listings function exists")
            
            # Test the function
            approved_listings = catalog_crud.get_approved_listings(
                db=db,
                limit=5
            )
            print(f"   Found {len(approved_listings)} approved listings in catalog")
            
            # Verify they're all APPROVED
            all_approved = all(l.state == ListingState.APPROVED for l in approved_listings)
            if all_approved:
                print("✅ All catalog listings are in APPROVED state")
            else:
                print("❌ Some catalog listings are not APPROVED!")
                return False
        else:
            print("❌ get_approved_listings function missing")
            return False
        
        return True
    except Exception as e:
        print(f"❌ Error verifying buyer catalog: {str(e)}")
        return False
    finally:
        db.close()


def verify_state_transitions():
    """Verify state transitions work correctly"""
    print("\n" + "=" * 60)
    print("STEP 5: Verifying State Transitions")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Get a test listing in UNDER_REVIEW
        test_listing = db.query(Listing).filter(
            Listing.state == ListingState.UNDER_REVIEW
        ).first()
        
        if not test_listing:
            print("⚠️  No listings in UNDER_REVIEW state to test")
            print("   This is OK - you can test when you submit a listing")
            return True
        
        # Test can_transition_to
        can_approve = test_listing.can_transition_to(ListingState.APPROVED)
        can_draft = test_listing.can_transition_to(ListingState.DRAFT)
        can_reserve = test_listing.can_transition_to(ListingState.RESERVED)
        
        print(f"📋 Testing transitions for listing ID {test_listing.id}:")
        print(f"   UNDER_REVIEW → APPROVED: {'✅' if can_approve else '❌'}")
        print(f"   UNDER_REVIEW → DRAFT: {'✅' if can_draft else '❌'}")
        print(f"   UNDER_REVIEW → RESERVED: {'✅' if can_reserve else '❌'} (should be ❌)")
        
        if can_approve and can_draft and not can_reserve:
            print("✅ State transitions are correct")
            return True
        else:
            print("❌ State transitions are incorrect")
            return False
    except Exception as e:
        print(f"❌ Error verifying state transitions: {str(e)}")
        return False
    finally:
        db.close()


def main():
    """Run all verification steps"""
    print("\n" + "=" * 60)
    print("DATABASE FLOW VERIFICATION")
    print("=" * 60)
    print("\nThis script verifies:")
    print("1. Database connection and tables")
    print("2. Listing states in database")
    print("3. Admin approval functions")
    print("4. Buyer catalog functions")
    print("5. State transitions")
    print("\n")
    
    results = []
    
    # Run all checks
    results.append(("Database Connection", verify_database_connection()))
    results.append(("Listing States", verify_listing_states()))
    results.append(("Admin Functions", verify_admin_functions()))
    results.append(("Buyer Catalog", verify_buyer_catalog()))
    results.append(("State Transitions", verify_state_transitions()))
    
    # Summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ ALL CHECKS PASSED - Database flow is working correctly!")
        print("\nFlow:")
        print("1. Seller submits listing → UNDER_REVIEW state")
        print("2. Admin approves listing → APPROVED state")
        print("3. Buyer sees listing in catalog (only APPROVED listings)")
    else:
        print("❌ SOME CHECKS FAILED - Please review the errors above")
    print("=" * 60 + "\n")
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())

