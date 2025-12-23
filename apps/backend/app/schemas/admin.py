"""
Admin-specific schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional


class SuspendUserRequest(BaseModel):
    """Request to suspend a user account"""
    reason: str = Field(..., min_length=10, max_length=500, description="Reason for suspension")
    notes: Optional[str] = Field(None, max_length=1000, description="Additional notes (optional)")


class DeleteUserRequest(BaseModel):
    """Request to delete a user account"""
    reason: str = Field(..., min_length=10, max_length=500, description="Reason for deletion")
    confirm: bool = Field(..., description="Confirmation that user should be deleted")

