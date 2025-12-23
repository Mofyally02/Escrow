"""
Listing draft endpoints.
Handles draft creation, updates, and submission.
"""
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user, require_seller
from app.models.user import User
from app.crud import listing_draft as draft_crud
from app.schemas.listing_draft import DraftResponse, DraftUpdateRequest, DraftSubmitRequest
from app.schemas.listing import ListingCreate
from app.crud import listing as listing_crud
from app.utils.request_utils import get_client_ip, get_user_agent
from app.core.events import AuditLogger

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/draft", response_model=DraftResponse)
async def get_draft(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller)
):
    """
    Get or create draft for current seller.
    Returns existing draft or creates empty one.
    """
    draft = draft_crud.get_or_create_draft(db, current_user.id)
    return DraftResponse.from_orm(draft)


@router.put("/draft", response_model=DraftResponse)
async def update_draft(
    request: Request,
    draft_data: DraftUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller)
):
    """
    Update draft data and step.
    Idempotent - can be called multiple times safely.
    Debounced on frontend.
    """
    draft = draft_crud.update_draft(
        db=db,
        seller_id=current_user.id,
        data=draft_data.data,
        step=draft_data.step
    )
    
    return DraftResponse.from_orm(draft)


@router.post("/draft/submit", status_code=status.HTTP_201_CREATED)
async def submit_draft(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller)
):
    """
    Submit draft as final listing.
    No request body required - uses draft data from database.
    Creates listing directly in UNDER_REVIEW state for admin approval.
    """
    # Get draft
    draft = draft_crud.get_draft(db, current_user.id)
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No draft found. Please create a listing first."
        )
    
    # Validate draft data
    draft_data = draft.data
    
    # #region agent log
    try:
        with open('/Users/mofyally/Documents/AI Projects/.cursor/debug.log', 'a') as f:
            f.write(json.dumps({
                "timestamp": __import__('time').time() * 1000,
                "location": "listing_drafts.py:78",
                "message": "Draft data retrieved",
                "data": {
                    "draft_id": draft.id,
                    "has_account_details": bool(draft_data.get("accountDetails")),
                    "has_credentials": bool(draft_data.get("credentials")),
                    "seller_agreement_acknowledged": draft_data.get("sellerAgreementAcknowledged"),
                    "account_details_keys": list(draft_data.get("accountDetails", {}).keys()) if draft_data.get("accountDetails") else [],
                    "credentials_keys": list(draft_data.get("credentials", {}).keys()) if draft_data.get("credentials") else []
                },
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "A"
            }) + '\n')
    except: pass
    # #endregion
    
    if not draft_data.get("accountDetails") or not draft_data.get("credentials"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete all required steps (Account Details and Credentials)"
        )
    
    if not draft_data.get("sellerAgreementAcknowledged"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must acknowledge the Seller Agreement"
        )
    
    # Build listing create request
    account_details = draft_data["accountDetails"]
    credentials = draft_data["credentials"]
    
    # #region agent log
    try:
        with open('/Users/mofyally/Documents/AI Projects/.cursor/debug.log', 'a') as f:
            f.write(json.dumps({
                "timestamp": __import__('time').time() * 1000,
                "location": "listing_drafts.py:95",
                "message": "Account details and credentials extracted",
                "data": {
                    "account_details": {k: (str(v)[:50] if not isinstance(v, (dict, list)) else type(v).__name__) for k, v in account_details.items()},
                    "credentials": {k: ("***" if k in ["password", "user_password"] else str(v)[:50] if not isinstance(v, (dict, list)) else type(v).__name__) for k, v in credentials.items()},
                    "price_usd_type": type(account_details.get("price_usd")).__name__,
                    "price_usd_value": account_details.get("price_usd")
                },
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "B"
            }) + '\n')
    except: pass
    # #endregion
    
    # Validate required fields before creating ListingCreate
    required_account_fields = ["title", "category", "platform", "price_usd"]
    missing_account_fields = [field for field in required_account_fields if not account_details.get(field)]
    if missing_account_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required account details: {', '.join(missing_account_fields)}"
        )
    
    required_credential_fields = ["username", "password", "user_password"]
    missing_credential_fields = [field for field in required_credential_fields if not credentials.get(field)]
    if missing_credential_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required credentials: {', '.join(missing_credential_fields)}"
        )
    
    # Type conversion helper
    def to_int(value, field_name: str, allow_none: bool = True):
        """Convert value to int, handling strings and floats"""
        if value is None:
            return None if allow_none else 0
        if isinstance(value, int):
            return value
        if isinstance(value, str):
            try:
                # Handle dollar amounts (e.g., "10.50" -> 1050 cents)
                if '.' in value:
                    return int(float(value) * 100)
                return int(value)
            except (ValueError, TypeError):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{field_name} must be a valid number"
                )
        if isinstance(value, float):
            return int(value)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} must be a number"
        )
    
    # Ensure price_usd is an integer (in cents)
    account_details["price_usd"] = to_int(account_details.get("price_usd"), "price_usd", allow_none=False)
    
    # Validate price is at least $10 (1000 cents)
    if account_details["price_usd"] < 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Price must be at least $10.00"
        )
    
    # Validate user_password length (required for encryption)
    user_password = credentials.get("user_password")
    if not user_password or len(user_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User password must be at least 8 characters long (required for credential encryption)"
        )
    
    # Convert optional numeric fields
    if account_details.get("monthly_earnings") is not None:
        account_details["monthly_earnings"] = to_int(account_details.get("monthly_earnings"), "monthly_earnings")
    if account_details.get("account_age_months") is not None:
        account_details["account_age_months"] = to_int(account_details.get("account_age_months"), "account_age_months")
    
    # #region agent log
    try:
        with open('/Users/mofyally/Documents/AI Projects/.cursor/debug.log', 'a') as f:
            f.write(json.dumps({
                "timestamp": __import__('time').time() * 1000,
                "location": "listing_drafts.py:130",
                "message": "Before ListingCreate validation",
                "data": {
                    "price_usd_final": account_details.get("price_usd"),
                    "price_usd_type_final": type(account_details.get("price_usd")).__name__,
                    "title": account_details.get("title"),
                    "category": account_details.get("category"),
                    "platform": account_details.get("platform"),
                    "username": credentials.get("username"),
                    "has_password": bool(credentials.get("password")),
                    "has_user_password": bool(credentials.get("user_password")),
                    "seller_agreement_acknowledged": draft_data.get("sellerAgreementAcknowledged")
                },
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "C"
            }) + '\n')
    except: pass
    # #endregion
    
    # Create listing data with validated fields
    try:
        # #region agent log
        try:
            with open('/Users/mofyally/Documents/AI Projects/.cursor/debug.log', 'a') as f:
                f.write(json.dumps({
                    "timestamp": __import__('time').time() * 1000,
                    "location": "listing_drafts.py:218",
                    "message": "Creating ListingCreate object",
                    "data": {
                        "title": account_details.get("title"),
                        "category": account_details.get("category"),
                        "platform": account_details.get("platform"),
                        "price_usd": account_details.get("price_usd"),
                        "price_usd_type": type(account_details.get("price_usd")).__name__,
                        "username": credentials.get("username"),
                        "has_password": bool(credentials.get("password")),
                        "has_user_password": bool(credentials.get("user_password")),
                        "user_password_length": len(credentials.get("user_password", "")) if credentials.get("user_password") else 0,
                        "seller_agreement_acknowledged": draft_data.get("sellerAgreementAcknowledged", False)
                    },
                    "sessionId": "debug-session",
                    "runId": "run1",
                    "hypothesisId": "G"
                }) + '\n')
        except: pass
        # #endregion
        
        listing_data = ListingCreate(
            title=account_details["title"],
            category=account_details["category"],
            platform=account_details["platform"],
            price_usd=account_details["price_usd"],
            description=account_details.get("description"),
            monthly_earnings=account_details.get("monthly_earnings"),
            account_age_months=account_details.get("account_age_months"),
            rating=account_details.get("rating"),
            username=credentials["username"],
            password=credentials["password"],
            recovery_email=credentials.get("recovery_email"),
            two_fa_secret=credentials.get("two_fa_secret"),
            user_password=credentials["user_password"],
            seller_agreement_acknowledged=draft_data.get("sellerAgreementAcknowledged", False)
        )
        
        # #region agent log
        try:
            with open('/Users/mofyally/Documents/AI Projects/.cursor/debug.log', 'a') as f:
                f.write(json.dumps({
                    "timestamp": __import__('time').time() * 1000,
                    "location": "listing_drafts.py:250",
                    "message": "ListingCreate object created successfully",
                    "data": {
                        "price_usd": listing_data.price_usd,
                        "title": listing_data.title
                    },
                    "sessionId": "debug-session",
                    "runId": "run1",
                    "hypothesisId": "G"
                }) + '\n')
        except: pass
        # #endregion
    except Exception as e:
        # #region agent log
        try:
            with open('/Users/mofyally/Documents/AI Projects/.cursor/debug.log', 'a') as f:
                f.write(json.dumps({
                    "timestamp": __import__('time').time() * 1000,
                    "location": "listing_drafts.py:160",
                    "message": "ListingCreate validation failed",
                    "data": {
                        "error_type": type(e).__name__,
                        "error_message": str(e),
                        "error_args": str(e.args) if hasattr(e, 'args') else None
                    },
                    "sessionId": "debug-session",
                    "runId": "run1",
                    "hypothesisId": "D"
                }) + '\n')
        except: pass
        # #endregion
        
        # Catch Pydantic validation errors
        from pydantic import ValidationError
        if isinstance(e, ValidationError):
            # Return validation errors in FastAPI format with input values
            errors = []
            for error in e.errors():
                error_dict = {
                    "loc": list(error.get("loc", [])),
                    "msg": str(error.get("msg", "")),
                    "type": str(error.get("type", ""))
                }
                # Include input value if available (helps debug what was sent)
                if "input" in error:
                    input_val = error.get("input")
                    # Don't log sensitive data, but log type and truncated value
                    if isinstance(input_val, str) and len(input_val) > 100:
                        error_dict["input"] = input_val[:100] + "..."
                    else:
                        error_dict["input"] = input_val
                errors.append(error_dict)
            
            # #region agent log
            try:
                with open('/Users/mofyally/Documents/AI Projects/.cursor/debug.log', 'a') as f:
                    f.write(json.dumps({
                        "timestamp": __import__('time').time() * 1000,
                        "location": "listing_drafts.py:314",
                        "message": "Pydantic ValidationError details",
                        "data": {
                            "errors": errors,
                            "error_count": len(errors)
                        },
                        "sessionId": "debug-session",
                        "runId": "run1",
                        "hypothesisId": "D"
                    }) + '\n')
            except: pass
            # #endregion
            
            logger.error(f"ListingCreate validation failed: {errors}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=errors
            )
        logger.error(f"ListingCreate creation failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid listing data: {str(e)}"
        )
    
    # Create listing in database
    try:
        # #region agent log
        try:
            with open('/Users/mofyally/Documents/AI Projects/.cursor/debug.log', 'a') as f:
                f.write(json.dumps({
                    "timestamp": __import__('time').time() * 1000,
                    "location": "listing_drafts.py:278",
                    "message": "About to create listing in database",
                    "data": {
                        "seller_id": current_user.id,
                        "has_listing_data": bool(listing_data),
                        "has_user_password": bool(credentials.get("user_password"))
                    },
                    "sessionId": "debug-session",
                    "runId": "run1",
                    "hypothesisId": "E"
                }) + '\n')
        except: pass
        # #endregion
        
        # Create listing directly in UNDER_REVIEW state (not DRAFT)
        # This ensures the listing goes directly to admin review
        from app.models.listing import ListingState
        listing = listing_crud.create_listing(
            db=db,
            seller_id=current_user.id,
            listing_data=listing_data,
            user_password=credentials.get("user_password"),
            initial_state=ListingState.UNDER_REVIEW  # Skip DRAFT, go directly to review
        )
        
        # #region agent log
        try:
            with open('/Users/mofyally/Documents/AI Projects/.cursor/debug.log', 'a') as f:
                f.write(json.dumps({
                    "timestamp": __import__('time').time() * 1000,
                    "location": "listing_drafts.py:299",
                    "message": "Listing created directly in UNDER_REVIEW state",
                    "data": {
                        "listing_id": listing.id,
                        "listing_state": listing.state.value,
                        "seller_id": listing.seller_id
                    },
                    "sessionId": "debug-session",
                    "runId": "run1",
                    "hypothesisId": "E"
                }) + '\n')
        except: pass
        # #endregion
        
        # Delete draft after successful submission (hard delete)
        # This ensures the draft is completely removed and allows creating new drafts
        try:
            draft_crud.delete_draft(db, current_user.id)
        except Exception as e:
            # Log but don't fail if draft deletion fails
            logger.warning(f"Failed to delete draft after listing creation: {str(e)}")
            # Try to delete any remaining draft to prevent future conflicts
            try:
                from app.models.listing_draft import ListingDraft
                remaining_draft = db.query(ListingDraft).filter(
                    ListingDraft.seller_id == current_user.id
                ).first()
                if remaining_draft:
                    db.delete(remaining_draft)
                    db.commit()
            except Exception as cleanup_error:
                logger.error(f"Failed to cleanup draft: {str(cleanup_error)}")
        
        # Log events
        ip_address = get_client_ip(request)
        AuditLogger.log_listing_created(db, current_user.id, listing.id, ip_address)
        AuditLogger.log_listing_submitted(db, current_user.id, listing.id, ip_address)
        
        from app.schemas.listing import ListingResponse
        # #region agent log
        try:
            with open('/Users/mofyally/Documents/AI Projects/.cursor/debug.log', 'a') as f:
                f.write(json.dumps({
                    "timestamp": __import__('time').time() * 1000,
                    "location": "listing_drafts.py:298",
                    "message": "Listing created successfully",
                    "data": {
                        "listing_id": listing.id,
                        "listing_state": listing.state.value,
                        "seller_id": listing.seller_id,
                        "title": listing.title
                    },
                    "sessionId": "debug-session",
                    "runId": "run1",
                    "hypothesisId": "E"
                }) + '\n')
        except: pass
        # #endregion
        
        # Use model_validate for Pydantic v2 compatibility
        try:
            return ListingResponse.model_validate(listing)
        except AttributeError:
            # Fallback for Pydantic v1
            return ListingResponse.from_orm(listing)
        except Exception as e:
            # #region agent log
            try:
                with open('/Users/mofyally/Documents/AI Projects/.cursor/debug.log', 'a') as f:
                    f.write(json.dumps({
                        "timestamp": __import__('time').time() * 1000,
                        "location": "listing_drafts.py:310",
                        "message": "ListingResponse serialization failed",
                        "data": {
                            "error_type": type(e).__name__,
                            "error_message": str(e),
                            "listing_id": listing.id
                        },
                        "sessionId": "debug-session",
                        "runId": "run1",
                        "hypothesisId": "F"
                    }) + '\n')
            except: pass
            # #endregion
            logger.error(f"Failed to serialize listing response: {str(e)}", exc_info=True)
            # Return basic response even if serialization fails
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Listing created but failed to serialize response: {str(e)}"
            )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/draft")
async def delete_draft(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller)
):
    """
    Delete draft (mark as submitted).
    Called when user wants to discard draft.
    """
    deleted = draft_crud.delete_draft(db, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No draft found"
        )
    return {"message": "Draft deleted successfully"}

