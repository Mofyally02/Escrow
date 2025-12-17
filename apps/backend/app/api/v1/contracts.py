"""
Contract API endpoints for generating and signing contracts.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user, require_buyer
from app.models.user import User
from app.models.transaction import TransactionState
from app.crud import transaction as transaction_crud, listing as listing_crud
from app.crud import user as user_crud
from app.schemas.contract import ContractSignRequest, ContractResponse
from app.core.pdf_generator import PDFContractGenerator
from app.core.events import AuditLogger
from app.models.audit_log import AuditAction
from app.utils.request_utils import get_client_ip

router = APIRouter()


@router.post("/{transaction_id}/generate", response_model=ContractResponse)
async def generate_contract(
    transaction_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """
    Generate contract PDF for a transaction.
    Only buyer can generate contract for their transaction.
    """
    transaction = transaction_crud.get_transaction_by_id(db, transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    if transaction.buyer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to generate contract for this transaction"
        )
    
    if transaction.state != TransactionState.FUNDS_HELD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract can only be generated after funds are held"
        )
    
    # Check if contract already exists
    if transaction.contract:
        return ContractResponse.model_validate(transaction.contract)
    
    # Get listing and seller details
    listing = listing_crud.get_listing_by_id(db, transaction.listing_id)
    seller = user_crud.get_user_by_id(db, transaction.seller_id)
    
    if not listing or not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing or seller not found"
        )
    
    # Generate PDF contract
    pdf_bytes, pdf_hash = PDFContractGenerator.generate_contract(
        seller_name=seller.full_name,
        seller_email=seller.email,
        buyer_name=current_user.full_name,
        buyer_email=current_user.email,
        listing_title=listing.title,
        platform=listing.platform,
        category=listing.category,
        purchase_price=transaction.amount_usd / 100.0
    )
    
    # Save PDF to storage
    pdf_url = PDFContractGenerator.save_pdf_to_storage(pdf_bytes, transaction_id)
    
    # Create contract record
    contract = transaction_crud.create_contract(
        db=db,
        transaction_id=transaction_id,
        pdf_hash=pdf_hash,
        pdf_url=pdf_url
    )
    
    # Log event
    ip_address = get_client_ip(request)
    AuditLogger.log_event(
        db=db,
        action=AuditAction.CONTRACT_GENERATED,
        user_id=current_user.id,
        ip_address=ip_address,
        details={
            "transaction_id": transaction_id,
            "contract_id": contract.id,
            "pdf_hash": pdf_hash
        },
        success=True
    )
    
    return ContractResponse.model_validate(contract)


@router.post("/{transaction_id}/sign", response_model=ContractResponse)
async def sign_contract(
    transaction_id: int,
    sign_data: ContractSignRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """
    Sign contract by typing full legal name.
    Name must match the buyer's registered full_name exactly.
    """
    transaction = transaction_crud.get_transaction_by_id(db, transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    if transaction.buyer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to sign contract for this transaction"
        )
    
    # Verify name matches exactly
    if sign_data.full_name.strip().lower() != current_user.full_name.strip().lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name must match your registered name exactly"
        )
    
    # Get contract
    if not transaction.contract:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract must be generated before signing"
        )
    
    if transaction.contract.is_signed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract already signed"
        )
    
    # Sign contract
    contract = transaction_crud.sign_contract(
        db=db,
        contract=transaction.contract,
        signed_by_name=sign_data.full_name.strip()
    )
    
    # Update transaction state
    transaction = transaction_crud.update_transaction_state(
        db=db,
        transaction=transaction,
        new_state=TransactionState.CONTRACT_SIGNED
    )
    
    # Log event
    ip_address = get_client_ip(request)
    AuditLogger.log_event(
        db=db,
        action=AuditAction.CONTRACT_SIGNED,
        user_id=current_user.id,
        ip_address=ip_address,
        details={
            "transaction_id": transaction_id,
            "contract_id": contract.id,
            "signed_by": sign_data.full_name
        },
        success=True
    )
    
    return ContractResponse.model_validate(contract)


@router.get("/{transaction_id}", response_model=ContractResponse)
async def get_contract(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Get contract for a transaction (only buyer can view)"""
    transaction = transaction_crud.get_transaction_by_id(db, transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    if transaction.buyer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this contract"
        )
    
    if not transaction.contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    return ContractResponse.model_validate(transaction.contract)

