"""
OTP delivery service for email and SMS.
Supports Africa's Talking (SMS) and Resend (Email) with fallbacks.
"""
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class OTPService:
    """Service for sending OTP codes via SMS and Email"""
    
    @staticmethod
    async def send_sms_otp(phone: str, code: str) -> bool:
        """
        Send OTP via SMS using Africa's Talking (primary) or Twilio (fallback)
        Returns True if sent successfully, False otherwise
        """
        try:
            # Try Africa's Talking first
            if settings.AFRICAS_TALKING_API_KEY and settings.AFRICAS_TALKING_USERNAME:
                return await OTPService._send_via_africas_talking(phone, code)
            
            # Fallback to Twilio
            if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
                return await OTPService._send_via_twilio(phone, code)
            
            # Development mode: log instead of sending
            if settings.ENVIRONMENT == "development":
                logger.info(f"[DEV] SMS OTP for {phone}: {code}")
                return True
            
            logger.warning("No SMS provider configured")
            return False
            
        except Exception as e:
            logger.error(f"Failed to send SMS OTP: {str(e)}")
            return False
    
    @staticmethod
    async def _send_via_africas_talking(phone: str, code: str) -> bool:
        """Send SMS via Africa's Talking API"""
        try:
            # Import here to avoid dependency if not used
            from africastalking.SMS import SMS
            
            sms = SMS(
                username=settings.AFRICAS_TALKING_USERNAME,
                api_key=settings.AFRICAS_TALKING_API_KEY
            )
            
            message = f"Your ESCROW verification code is {code}. Valid for 5 minutes."
            
            response = sms.send(message, [phone], sender_id=settings.AFRICAS_TALKING_SENDER_ID)
            
            if response.get("SMSMessageData", {}).get("Recipients", [{}])[0].get("statusCode") == "101":
                logger.info(f"SMS OTP sent to {phone} via Africa's Talking")
                return True
            else:
                logger.error(f"Africa's Talking API error: {response}")
                return False
                
        except ImportError:
            logger.warning("africastalking package not installed")
            return False
        except Exception as e:
            logger.error(f"Africa's Talking API error: {str(e)}")
            return False
    
    @staticmethod
    async def _send_via_twilio(phone: str, code: str) -> bool:
        """Send SMS via Twilio API (fallback)"""
        try:
            from twilio.rest import Client
            
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            
            message = client.messages.create(
                body=f"Your ESCROW verification code is {code}. Valid for 5 minutes.",
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone
            )
            
            if message.sid:
                logger.info(f"SMS OTP sent to {phone} via Twilio")
                return True
            else:
                return False
                
        except ImportError:
            logger.warning("twilio package not installed")
            return False
        except Exception as e:
            logger.error(f"Twilio API error: {str(e)}")
            return False
    
    @staticmethod
    async def send_email_otp(email: str, code: str, full_name: str = "User") -> bool:
        """
        Send OTP via Email using Resend (primary) or SMTP (fallback)
        Returns True if sent successfully, False otherwise
        """
        try:
            # Try Resend first
            if settings.RESEND_API_KEY:
                return await OTPService._send_via_resend(email, code, full_name)
            
            # Fallback to SMTP
            if settings.SMTP_HOST and settings.SMTP_USER:
                return await OTPService._send_via_smtp(email, code, full_name)
            
            # Development mode: log instead of sending
            if settings.ENVIRONMENT == "development":
                logger.info(f"[DEV] Email OTP for {email}: {code}")
                return True
            
            logger.warning("No email provider configured")
            return False
            
        except Exception as e:
            logger.error(f"Failed to send email OTP: {str(e)}")
            return False
    
    @staticmethod
    async def _send_via_resend(email: str, code: str, full_name: str) -> bool:
        """Send email via Resend API"""
        try:
            import resend
            
            resend.api_key = settings.RESEND_API_KEY
            
            params = {
                "from": f"{settings.RESEND_FROM_NAME} <{settings.RESEND_FROM_EMAIL}>",
                "to": [email],
                "subject": "Your ESCROW Verification Code",
                "html": f"""
                <html>
                    <body>
                        <h2>Hello {full_name},</h2>
                        <p>Your ESCROW verification code is:</p>
                        <h1 style="font-size: 32px; letter-spacing: 5px; color: #2563eb;">{code}</h1>
                        <p>This code is valid for 5 minutes.</p>
                        <p>If you didn't request this code, please ignore this email.</p>
                        <hr>
                        <p style="color: #6b7280; font-size: 12px;">ESCROW - Freelance Account Marketplace</p>
                    </body>
                </html>
                """
            }
            
            email_response = resend.Emails.send(params)
            
            if email_response.get("id"):
                logger.info(f"Email OTP sent to {email} via Resend")
                return True
            else:
                logger.error(f"Resend API error: {email_response}")
                return False
                
        except ImportError:
            logger.warning("resend package not installed")
            return False
        except Exception as e:
            logger.error(f"Resend API error: {str(e)}")
            return False
    
    @staticmethod
    async def _send_via_smtp(email: str, code: str, full_name: str) -> bool:
        """Send email via SMTP (fallback)"""
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Your ESCROW Verification Code"
            msg["From"] = settings.SMTP_USER
            msg["To"] = email
            
            html = f"""
            <html>
                <body>
                    <h2>Hello {full_name},</h2>
                    <p>Your ESCROW verification code is:</p>
                    <h1 style="font-size: 32px; letter-spacing: 5px; color: #2563eb;">{code}</h1>
                    <p>This code is valid for 5 minutes.</p>
                    <p>If you didn't request this code, please ignore this email.</p>
                </body>
            </html>
            """
            
            msg.attach(MIMEText(html, "html"))
            
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_USE_TLS:
                    server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            logger.info(f"Email OTP sent to {email} via SMTP")
            return True
            
        except Exception as e:
            logger.error(f"SMTP error: {str(e)}")
            return False
