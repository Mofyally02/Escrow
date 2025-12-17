"""
File validation utilities for proof file uploads.
"""
import re
from typing import Optional, Tuple
from fastapi import HTTPException, status


class FileValidator:
    """Validates uploaded proof files"""
    
    # Allowed file types
    ALLOWED_IMAGE_TYPES = {
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    }
    
    ALLOWED_DOCUMENT_TYPES = {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }
    
    ALLOWED_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_DOCUMENT_TYPES
    
    # File size limits (in bytes)
    MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
    MAX_DOCUMENT_SIZE = 20 * 1024 * 1024  # 20 MB
    MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB overall
    
    # Allowed file extensions
    ALLOWED_EXTENSIONS = {
        ".jpg", ".jpeg", ".png", ".gif", ".webp",  # Images
        ".pdf", ".doc", ".docx"  # Documents
    }
    
    @staticmethod
    def validate_file_name(file_name: str) -> Tuple[bool, Optional[str]]:
        """
        Validate file name.
        
        Returns:
            (is_valid, error_message)
        """
        if not file_name or len(file_name.strip()) == 0:
            return False, "File name cannot be empty"
        
        if len(file_name) > 255:
            return False, "File name too long (max 255 characters)"
        
        # Check for dangerous characters
        dangerous_chars = ['..', '/', '\\', '<', '>', ':', '"', '|', '?', '*']
        for char in dangerous_chars:
            if char in file_name:
                return False, f"File name contains invalid character: {char}"
        
        # Check extension
        if not any(file_name.lower().endswith(ext) for ext in FileValidator.ALLOWED_EXTENSIONS):
            return False, f"File extension not allowed. Allowed: {', '.join(FileValidator.ALLOWED_EXTENSIONS)}"
        
        return True, None
    
    @staticmethod
    def validate_file_size(file_size: int, mime_type: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        """
        Validate file size.
        
        Returns:
            (is_valid, error_message)
        """
        if file_size <= 0:
            return False, "File size must be greater than 0"
        
        if file_size > FileValidator.MAX_FILE_SIZE:
            return False, f"File too large. Maximum size: {FileValidator.MAX_FILE_SIZE / (1024 * 1024)} MB"
        
        # Additional check for images
        if mime_type in FileValidator.ALLOWED_IMAGE_TYPES:
            if file_size > FileValidator.MAX_IMAGE_SIZE:
                return False, f"Image too large. Maximum size: {FileValidator.MAX_IMAGE_SIZE / (1024 * 1024)} MB"
        
        # Additional check for documents
        if mime_type in FileValidator.ALLOWED_DOCUMENT_TYPES:
            if file_size > FileValidator.MAX_DOCUMENT_SIZE:
                return False, f"Document too large. Maximum size: {FileValidator.MAX_DOCUMENT_SIZE / (1024 * 1024)} MB"
        
        return True, None
    
    @staticmethod
    def validate_mime_type(mime_type: Optional[str]) -> Tuple[bool, Optional[str]]:
        """
        Validate MIME type.
        
        Returns:
            (is_valid, error_message)
        """
        if not mime_type:
            return True, None  # MIME type is optional
        
        if mime_type not in FileValidator.ALLOWED_TYPES:
            return False, f"MIME type not allowed. Allowed: {', '.join(FileValidator.ALLOWED_TYPES)}"
        
        return True, None
    
    @staticmethod
    def validate_file(
        file_name: str,
        file_size: int,
        mime_type: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate file comprehensively.
        
        Returns:
            (is_valid, error_message)
        """
        # Validate file name
        is_valid, error = FileValidator.validate_file_name(file_name)
        if not is_valid:
            return False, error
        
        # Validate file size
        is_valid, error = FileValidator.validate_file_size(file_size, mime_type)
        if not is_valid:
            return False, error
        
        # Validate MIME type
        is_valid, error = FileValidator.validate_mime_type(mime_type)
        if not is_valid:
            return False, error
        
        return True, None
    
    @staticmethod
    def sanitize_file_name(file_name: str) -> str:
        """
        Sanitize file name for safe storage.
        
        Removes dangerous characters and limits length.
        """
        # Remove path components
        file_name = file_name.split('/')[-1].split('\\')[-1]
        
        # Remove dangerous characters
        file_name = re.sub(r'[<>:"|?*]', '', file_name)
        
        # Limit length
        if len(file_name) > 255:
            name, ext = file_name.rsplit('.', 1) if '.' in file_name else (file_name, '')
            file_name = name[:250] + ('.' + ext if ext else '')
        
        return file_name

