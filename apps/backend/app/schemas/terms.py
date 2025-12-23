"""
Terms of Service schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional


class TermsResponse(BaseModel):
    """Terms of Service response"""
    version: str = Field(..., description="Terms version")
    effective_date: str = Field(..., description="Date when terms became effective")
    content: str = Field(..., description="Full terms of service content (markdown)")
    platform_role_clause: str = Field(..., description="Platform role clause for contracts")
    last_updated: str = Field(..., description="ISO timestamp of last update")
    
    class Config:
        json_schema_extra = {
            "example": {
                "version": "1.0",
                "effective_date": "2025-12-21",
                "content": "# ESCROW Platform Terms of Service\n\n...",
                "platform_role_clause": "**Platform Role and Liability Disclaimer**\n\n...",
                "last_updated": "2025-12-21T12:00:00Z"
            }
        }

