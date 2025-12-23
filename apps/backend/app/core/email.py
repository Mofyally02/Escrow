"""
Email service for sending notifications to users.
Uses Resend.com API for email delivery.
"""
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(
    to: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    """
    Send email using Resend.com API.
    
    Args:
        to: Recipient email address
        subject: Email subject
        html_content: HTML email body
        text_content: Plain text email body (optional)
    
    Returns:
        True if email sent successfully, False otherwise
    """
    try:
        # Check if Resend API key is configured
        if not settings.RESEND_API_KEY:
            logger.warning(
                f"Resend API key not configured. Email to {to} would have been sent with subject: {subject}"
            )
            # In development, log the email instead of sending
            logger.info(f"Email content:\nTo: {to}\nSubject: {subject}\n{html_content}")
            return True  # Return True in dev mode to not break flow
        
        # Import resend only if API key is available
        try:
            import resend
        except ImportError:
            logger.error("Resend package not installed. Install with: pip install resend")
            return False
        
        resend.api_key = settings.RESEND_API_KEY
        
        params = {
            "from": f"{settings.RESEND_FROM_NAME} <{settings.RESEND_FROM_EMAIL}>",
            "to": [to],
            "subject": subject,
            "html": html_content,
        }
        
        if text_content:
            params["text"] = text_content
        
        email = resend.Emails.send(params)
        
        if email and hasattr(email, 'id'):
            logger.info(f"Email sent successfully to {to} (ID: {email.id})")
            return True
        else:
            logger.error(f"Failed to send email to {to}: {email}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending email to {to}: {str(e)}")
        return False


def send_account_suspended_email(
    user_email: str,
    user_name: str,
    reason: str,
    support_link: str = None
) -> bool:
    """
    Send account suspension notification email.
    
    Args:
        user_email: User's email address
        user_name: User's full name
        reason: Reason for suspension
        support_link: Link to contact support (defaults to frontend support page)
    
    Returns:
        True if email sent successfully, False otherwise
    """
    if support_link is None:
        support_link = f"{settings.FRONTEND_URL}/support"
    
    subject = "Account Suspended - ESCROW"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Suspended</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; border-left: 4px solid #dc3545;">
            <h1 style="color: #dc3545; margin-top: 0;">Account Suspended</h1>
            
            <p>Dear {user_name},</p>
            
            <p>We regret to inform you that your ESCROW account has been suspended.</p>
            
            <div style="background-color: #fff; border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #495057;">Reason for Suspension:</h3>
                <p style="margin-bottom: 0;">{reason}</p>
            </div>
            
            <h3 style="color: #495057;">Common Reasons for Account Suspension:</h3>
            <ul style="color: #6c757d;">
                <li>Violation of Terms of Service</li>
                <li>Suspicious or fraudulent activity</li>
                <li>Multiple failed payment attempts</li>
                <li>Reported by other users</li>
                <li>Security concerns</li>
            </ul>
            
            <p>If you believe this suspension is in error, or if you have questions about your account status, please contact our support team.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{support_link}" 
                   style="display: inline-block; background-color: #007bff; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                    Contact Support
                </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; margin-top: 30px; border-top: 1px solid #dee2e6; padding-top: 20px;">
                This is an automated message. Please do not reply to this email.
            </p>
            
            <p style="color: #6c757d; font-size: 12px; margin-top: 10px;">
                Best regards,<br>
                The ESCROW Team
            </p>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
Account Suspended - ESCROW

Dear {user_name},

We regret to inform you that your ESCROW account has been suspended.

Reason for Suspension:
{reason}

Common Reasons for Account Suspension:
- Violation of Terms of Service
- Suspicious or fraudulent activity
- Multiple failed payment attempts
- Reported by other users
- Security concerns

If you believe this suspension is in error, or if you have questions about your account status, please contact our support team.

Contact Support: {support_link}

This is an automated message. Please do not reply to this email.

Best regards,
The ESCROW Team
    """
    
    return send_email(user_email, subject, html_content, text_content)

