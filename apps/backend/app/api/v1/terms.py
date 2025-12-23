"""
Terms of Service API endpoint.
"""
from fastapi import APIRouter, HTTPException, status
from typing import Optional
from app.core.terms_of_service import TermsOfService
from app.schemas.terms import TermsResponse

router = APIRouter()


@router.get("/terms", response_model=TermsResponse)
async def get_terms_of_service(version: Optional[str] = None):
    """
    Get Terms of Service.
    
    Returns the current Terms of Service, or a specific version if requested.
    """
    try:
        terms_data = TermsOfService.get_terms(version=version)
        return TermsResponse(**terms_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve terms of service: {str(e)}"
        )


@router.get("/terms/platform-role")
async def get_platform_role_clause():
    """
    Get the platform role clause (for contracts and agreements).
    
    Returns the platform role acknowledgment clause that should be included
    in purchase contracts and seller agreements.
    """
    return {
        "clause": TermsOfService.get_platform_role_clause(),
        "version": TermsOfService.CURRENT_VERSION
    }

