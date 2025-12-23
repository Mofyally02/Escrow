"""
Script to create a default seller agreement.
Run this to create an initial seller agreement that can be edited by admins.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.legal_document import LegalDocument, DocumentType
from app.crud import legal_document as legal_document_crud
from datetime import datetime

def create_default_seller_agreement():
    """Create a default seller agreement"""
    db = SessionLocal()
    
    try:
        # Check if seller agreement already exists
        existing = legal_document_crud.get_current_document_by_type(db, DocumentType.SELLER_AGREEMENT)
        if existing:
            print(f"Seller agreement already exists: {existing.title} (v{existing.version})")
            print("To create a new one, unpublish the current version first.")
            return
        
        # Default seller agreement content
        default_content = """# Seller Agreement

## 1. Platform Role Acknowledgment

By using this platform, you acknowledge that:

- **Escrow acts solely as a neutral escrow agent and marketplace facilitator**
- Escrow does not own, operate, access, or control any freelance account at any time
- Escrow administrators will never receive or view account passwords
- Verification is performed using provided proof materials only
- Escrow does not log into or interfere with accounts

## 2. Account Listing Requirements

As a seller, you agree to:

- Provide accurate and truthful information about your account
- Submit valid ownership proof (screenshots, earnings, reviews)
- Ensure account credentials are correct and functional
- Not list accounts that violate platform terms of service
- Accept that accounts may be rejected during admin review

## 3. Credential Security

- Credentials are encrypted with AES-256-GCM immediately upon submission
- Encryption key is derived from your password + server pepper
- Admins cannot see plaintext credentials
- Credentials are revealed only once after full escrow payment
- You must not alter account details after credential submission

## 4. Transaction Process

- Listing is locked when buyer initiates purchase
- Funds are held in escrow until buyer confirms account access
- You will receive payment only after buyer accepts ownership
- Platform commission applies as disclosed
- All transactions are final after completion

## 5. Prohibited Activities

You agree NOT to:

- List fake or fraudulent accounts
- Provide incorrect credentials
- Alter account details after submission
- Attempt to access accounts after sale
- Engage in any fraudulent activity

## 6. Liability and Disputes

- You are responsible for account accuracy and legitimacy
- Escrow is not liable for account performance after transfer
- Disputes must be raised during the verification window
- All actions are logged for audit purposes

## 7. Agreement Updates

- You will be notified of material changes to this agreement
- Continued use after updates constitutes acceptance
- Previous versions remain binding for existing transactions

---

**By signing below, you acknowledge that you have read, understood, and agree to be bound by this Seller Agreement.**

**Effective Date:** {effective_date}
**Version:** 1.0
""".format(effective_date=datetime.utcnow().strftime('%Y-%m-%d'))
        
        # Create the document
        from app.schemas.legal_document import LegalDocumentCreate
        document_data = LegalDocumentCreate(
            title="Seller Agreement",
            document_type=DocumentType.SELLER_AGREEMENT,
            content_markdown=default_content,
            version="1.0",
            slug="seller-agreement"
        )
        
        document = legal_document_crud.create_legal_document(
            db=db,
            document_data=document_data,
            published_by_id=None  # System-created
        )
        
        # Publish it immediately
        document = legal_document_crud.publish_legal_document(
            db=db,
            document=document,
            published_by_id=None  # System-created
        )
        
        print(f"✅ Created and published default seller agreement:")
        print(f"   Title: {document.title}")
        print(f"   Version: {document.version}")
        print(f"   Slug: {document.slug}")
        print(f"   Published: {document.published_at}")
        
    except Exception as e:
        print(f"❌ Error creating seller agreement: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_default_seller_agreement()

