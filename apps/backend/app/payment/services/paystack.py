"""
Paystack payment integration for escrow payments.
"""
import hmac
import hashlib
import json
import requests
from typing import Optional, Dict, Any
from app.core.config import settings


class PaystackService:
    """Paystack payment service for escrow transactions"""
    
    BASE_URL = "https://api.paystack.co"
    
    def __init__(self):
        """Initialize Paystack client"""
        if not settings.PAYSTACK_SECRET_KEY:
            raise ValueError("PAYSTACK_SECRET_KEY not configured")
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
    
    def initialize_payment(
        self,
        email: str,
        amount: int,  # Amount in smallest currency unit (cents for KES/USD, kobo for NGN)
        reference: str,
        callback_url: Optional[str] = None,
        currency: str = "KES",  # Currency code (KES for Kenya, NGN for Nigeria, USD if enabled)
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Initialize a payment transaction.
        Returns authorization URL for buyer to complete payment.
        
        Args:
            email: Buyer's email
            amount: Amount in smallest currency unit (KES cents, NGN kobo, USD cents)
            reference: Unique transaction reference
            callback_url: Optional callback URL for redirect after payment
            currency: Currency code (KES for Kenya-based accounts, NGN for Nigeria, USD if enabled)
            metadata: Additional metadata
            
        Returns:
            Payment initialization response with authorization_url
            
        Note:
            - KES (Kenyan Shilling) is the default for Kenya-based Paystack accounts
            - Amount must be in smallest unit: KES cents, NGN kobo, USD cents
            - Currency must match what's enabled in your Paystack account settings
        """
        try:
            # Validate email before sending
            if not email or not email.strip():
                raise ValueError("Email is required")
            
            # Clean email
            email = email.strip().lower()
            
            url = f"{self.BASE_URL}/transaction/initialize"
            payload = {
                "email": email,
                "amount": amount,
                "reference": reference,
                "currency": currency,  # Add currency parameter
                "metadata": metadata or {}
            }
            if callback_url:
                payload["callback_url"] = callback_url
            
            response = requests.post(url, json=payload, headers=self.headers)
            
            # Check for errors in response
            if not response.ok:
                try:
                    error_data = response.json() if response.content else {}
                    error_message = error_data.get("message", f"HTTP {response.status_code}: {response.reason}")
                    # Log full error for debugging
                    if settings.DEBUG:
                        print(f"Paystack Error Response: {error_data}")
                except:
                    error_message = f"HTTP {response.status_code}: {response.reason}"
                
                # Provide more specific error messages
                if "email" in error_message.lower() or "invalid" in error_message.lower():
                    raise ValueError(f"Invalid email address: {error_message}")
                if "currency" in error_message.lower() or "not supported" in error_message.lower():
                    raise ValueError(f"Currency not supported: {error_message}. Please contact support.")
                raise ValueError(f"Payment initialization failed: {error_message}")
            
            response.raise_for_status()
            result = response.json()
            
            # Check if Paystack returned an error in the response data
            if not result.get("status", False):
                error_message = result.get("message", "Unknown error from Paystack")
                if "email" in error_message.lower():
                    raise ValueError(f"Invalid email address: {error_message}")
                if "currency" in error_message.lower() or "not supported" in error_message.lower():
                    raise ValueError(f"Currency not supported: {error_message}. Please contact support.")
                raise ValueError(f"Payment initialization failed: {error_message}")
            
            return result
        except requests.exceptions.RequestException as e:
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_message = error_data.get("message", str(e))
                except:
                    error_message = str(e)
                raise ValueError(f"Payment initialization failed: {error_message}")
            raise ValueError(f"Failed to initialize payment: {str(e)}")
        except Exception as e:
            raise ValueError(f"Failed to initialize payment: {str(e)}")
    
    def verify_transaction(self, reference: str) -> Dict[str, Any]:
        """
        Verify a transaction by reference.
        
        Args:
            reference: Transaction reference
            
        Returns:
            Transaction verification response
        """
        try:
            url = f"{self.BASE_URL}/transaction/verify/{reference}"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise ValueError(f"Failed to verify transaction: {str(e)}")
    
    def charge_authorization(
        self,
        authorization_code: str,
        email: str,
        amount: int,
        reference: str
    ) -> Dict[str, Any]:
        """
        Charge an authorization (manual capture).
        This is used to release funds to seller after buyer confirms access.
        
        Args:
            authorization_code: Authorization code from initial payment
            email: Buyer's email
            amount: Amount in kobo/cents
            reference: New reference for this charge
            
        Returns:
            Charge response
        """
        try:
            url = f"{self.BASE_URL}/transaction/charge_authorization"
            payload = {
                "authorization_code": authorization_code,
                "email": email,
                "amount": amount,
                "reference": reference
            }
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise ValueError(f"Failed to charge authorization: {str(e)}")
    
    def verify_webhook_signature(
        self,
        payload: str,
        signature: str
    ) -> bool:
        """
        Verify Paystack webhook signature using HMAC SHA512.
        
        Args:
            payload: Raw request body (string)
            signature: X-Paystack-Signature header value
            
        Returns:
            True if signature is valid
        """
        try:
            computed_signature = hmac.new(
                settings.PAYSTACK_SECRET_KEY.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha512
            ).hexdigest()
            
            return hmac.compare_digest(computed_signature, signature)
        except Exception:
            return False
    
    def parse_webhook_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse Paystack webhook event payload.
        
        Args:
            payload: Webhook payload dictionary
            
        Returns:
            Parsed event data
        """
        event_type = payload.get("event")
        data = payload.get("data", {})
        
        return {
            "event_type": event_type,
            "reference": data.get("reference"),
            "authorization_code": data.get("authorization", {}).get("authorization_code"),
            "customer_code": data.get("customer", {}).get("customer_code"),
            "amount": data.get("amount"),
            "status": data.get("status"),
            "gateway_response": data.get("gateway_response"),
            "paid_at": data.get("paid_at"),
            "data": data
        }
    
    def create_transfer_recipient(
        self,
        type: str,  # "nuban", "mobile_money", etc.
        name: str,
        account_number: str,
        bank_code: str,
        email: str
    ) -> Dict[str, Any]:
        """
        Create a transfer recipient for payout.
        
        Args:
            type: Recipient type (nuban, mobile_money, etc.)
            name: Recipient name
            account_number: Account number
            bank_code: Bank code (for nuban)
            email: Recipient email
            
        Returns:
            Transfer recipient response with recipient_code
        """
        try:
            url = f"{self.BASE_URL}/transferrecipient"
            payload = {
                "type": type,
                "name": name,
                "account_number": account_number,
                "bank_code": bank_code,
                "email": email
            }
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise ValueError(f"Failed to create transfer recipient: {str(e)}")
    
    def initiate_transfer(
        self,
        source: str,  # "balance"
        amount: int,  # Amount in kobo/cents
        recipient: str,  # Recipient code
        reference: str,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Initiate transfer to seller (payout).
        
        Args:
            source: Transfer source (usually "balance")
            amount: Amount in kobo/cents
            recipient: Recipient code
            reference: Unique transfer reference
            reason: Optional reason for transfer
            
        Returns:
            Transfer initiation response
        """
        try:
            url = f"{self.BASE_URL}/transfer"
            payload = {
                "source": source,
                "amount": amount,
                "recipient": recipient,
                "reference": reference,
                "reason": reason or "Escrow payout"
            }
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise ValueError(f"Failed to initiate transfer: {str(e)}")
    
    def verify_transfer(self, transfer_code: str) -> Dict[str, Any]:
        """
        Verify transfer status.
        
        Args:
            transfer_code: Transfer code from initiate_transfer
            
        Returns:
            Transfer verification response
        """
        try:
            url = f"{self.BASE_URL}/transfer/{transfer_code}"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise ValueError(f"Failed to verify transfer: {str(e)}")

