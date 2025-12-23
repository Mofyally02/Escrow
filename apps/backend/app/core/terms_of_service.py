"""
Terms of Service content and versioning.
"""
from datetime import datetime
from typing import Dict, Any


class TermsOfService:
    """Terms of Service content and management"""
    
    CURRENT_VERSION = "1.0"
    EFFECTIVE_DATE = "2025-12-21"
    
    PLATFORM_ROLE_CLAUSE = """
    **Platform Role and Liability Disclaimer**
    
    Escrow is not a broker, agent, or principal in any transaction. We provide escrow 
    services only. We do not warrant account performance before or after sale.
    
    Escrow acts exclusively as a neutral escrow agent and moderator. We hold funds and 
    facilitate secure handover, but the sale is strictly between seller and buyer.
    
    The platform never takes ownership of any freelance account. Escrow administrators 
    never receive or view account passwords. Verification is performed using provided 
    proof materials only. Escrow does not log into or interfere with accounts.
    """
    
    FULL_TERMS = f"""
# ESCROW Platform Terms of Service

**Version:** {CURRENT_VERSION}  
**Effective Date:** {EFFECTIVE_DATE}

## 1. Platform Role

Escrow is a neutral third-party escrow service and marketplace facilitator. We do not:

- Own, operate, access, or control any freelance account at any time
- Act as a broker, agent, or principal in transactions
- Warrant account performance before or after sale
- Log into or interfere with accounts
- Receive or view account passwords

## 2. Escrow Services

Escrow provides the following services:

- Secure payment escrow (funds held until buyer confirms access)
- Account listing verification (proof-based, no credential access)
- Digital contract generation and e-signature
- Encrypted credential storage and one-time release
- Transaction mediation and dispute resolution

## 3. User Responsibilities

### Sellers

- Must provide accurate account information
- Must provide proof materials (screenshots, videos) for verification
- Must not misrepresent account status or performance
- Confirm that Escrow administrators will never receive account passwords
- Understand that verification is performed using provided proof materials only

### Buyers

- Acknowledge that Escrow acts solely as an escrow agent
- Understand that all risk of platform policy violations passes to buyer upon credential release
- Acknowledge that account transfers may violate platform Terms of Service
- Assume all responsibility for account usage and compliance
- Save credentials immediately upon one-time reveal (credentials shown once only)

## 4. Account Verification

Account verification is performed using:

- Screenshots of profile, earnings, reviews
- Video screen recordings (optional for high-value accounts)
- Partial proof (e.g., last 4 digits of linked payout method)

**Escrow administrators never log into accounts or view passwords.**

## 5. Credential Security

- All credentials are encrypted with AES-256-GCM before storage
- Credentials are revealed one-time only to the buyer
- Credentials are decrypted in-memory and never logged
- Platform has no ability to access credentials after encryption

## 6. Payment and Escrow

- Funds are held in escrow until buyer confirms successful access
- Funds are released to seller only after buyer confirmation
- No refunds after funds are released and buyer confirms access
- All transactions are final after buyer confirmation

## 7. Dispute Resolution

- Disputes must be raised within 48 hours of credential release
- Escrow will mediate disputes in good faith
- Platform decisions are final

## 8. Limitation of Liability

Escrow is not liable for:

- Account performance before or after sale
- Platform policy violations (e.g., terms of service bans)
- Account access issues after credential release
- Any consequences arising from account transfers

## 9. Prohibited Activities

Users must not:

- Provide false or misleading information
- Attempt to access accounts without authorization
- Interfere with platform operations
- Violate any applicable laws or regulations

## 10. Account Termination

Escrow reserves the right to:

- Suspend or terminate accounts for violations
- Refuse service to any user
- Remove listings that violate policies

## 11. Changes to Terms

Escrow may update these terms at any time. Users will be notified of material changes.

## 12. Contact

For questions about these terms, contact: support@escrow.com

---

**By using the Escrow platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.**
"""
    
    @staticmethod
    def get_terms(version: str = None) -> Dict[str, Any]:
        """
        Get Terms of Service content.
        
        Args:
            version: Specific version to retrieve (defaults to current)
            
        Returns:
            Dictionary with terms content and metadata
        """
        return {
            "version": version or TermsOfService.CURRENT_VERSION,
            "effective_date": TermsOfService.EFFECTIVE_DATE,
            "content": TermsOfService.FULL_TERMS,
            "platform_role_clause": TermsOfService.PLATFORM_ROLE_CLAUSE,
            "last_updated": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def get_platform_role_clause() -> str:
        """Get the platform role clause for contracts and agreements"""
        return TermsOfService.PLATFORM_ROLE_CLAUSE

