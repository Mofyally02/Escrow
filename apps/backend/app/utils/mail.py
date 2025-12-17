"""
Email utility functions (wrapper around OTP service)
"""
from app.core.otp import OTPService

async def send_verification_email(email: str, otp: str, full_name: str = "User") -> bool:
    """Send email verification OTP"""
    return await OTPService.send_email_otp(email, otp, full_name)

