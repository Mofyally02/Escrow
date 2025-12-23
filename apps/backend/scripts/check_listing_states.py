"""
Script to check and fix listing states.
Useful for debugging why listings show as SOLD when they should be APPROVED.
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.listing import Listing, ListingState
from app.models.transaction import Transaction, TransactionState

def check_listing_states():
    """Check all listings and their states"""
    db: Session = SessionLocal()
    try:
        listings = db.query(Listing).all()
        
        print(f"\n=== Listing States Report ===")
        print(f"Total listings: {len(listings)}\n")
        
        state_counts = {}
        for listing in listings:
            state = listing.state.value
            state_counts[state] = state_counts.get(state, 0) + 1
            
            # Check for listings that should be APPROVED but aren't
            if state != 'approved':
                # Check if there's an active transaction
                transaction = db.query(Transaction).filter(
                    Transaction.listing_id == listing.id
                ).first()
                
                if transaction:
                    print(f"Listing {listing.id} ({listing.title}):")
                    print(f"  State: {state}")
                    print(f"  Transaction ID: {transaction.id}")
                    print(f"  Transaction State: {transaction.state.value}")
                    print()
                else:
                    print(f"⚠️  Listing {listing.id} ({listing.title}):")
                    print(f"   State: {state} (no active transaction)")
                    print(f"   This listing should probably be APPROVED")
                    print()
        
        print("\n=== State Summary ===")
        for state, count in sorted(state_counts.items()):
            print(f"{state}: {count}")
        
        # Check for orphaned SOLD listings (SOLD but no completed transaction)
        sold_listings = db.query(Listing).filter(
            Listing.state == ListingState.SOLD
        ).all()
        
        print(f"\n=== SOLD Listings Check ===")
        for listing in sold_listings:
            transaction = db.query(Transaction).filter(
                Transaction.listing_id == listing.id,
                Transaction.state == TransactionState.COMPLETED
            ).first()
            
            if not transaction:
                print(f"⚠️  Listing {listing.id} is SOLD but has no completed transaction")
                print(f"   This might be incorrect. Consider resetting to APPROVED.")
        
    finally:
        db.close()

if __name__ == "__main__":
    check_listing_states()

