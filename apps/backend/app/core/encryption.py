"""
Military-grade encryption for credential storage.

Uses AES-256-GCM with Argon2id key derivation.
Never logs keys or plaintext credentials.
"""
import os
import base64
import secrets
from typing import Optional, Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from argon2.low_level import hash_secret_raw, Type as Argon2Type
from app.core.config import settings


class EncryptionService:
    """AES-256-GCM encryption with Argon2id key derivation"""
    
    # Argon2id parameters (memory-hard, side-channel resistant)
    ARGON2_MEMORY_COST_KB = 65536  # 64 MB in KB (for argon2-cffi)
    ARGON2_ITERATIONS = 3  # Time cost (iterations)
    ARGON2_LANES = 4  # Parallelism (lanes)
    ARGON2_KEY_LENGTH = 32  # 256 bits for AES-256
    
    # AES-GCM parameters
    IV_LENGTH = 12  # 96 bits (recommended for GCM)
    TAG_LENGTH = 16  # 128 bits (GCM tag)
    
    @staticmethod
    def _derive_key(password: str, salt: bytes) -> bytes:
        """
        Derive encryption key using Argon2id.
        
        Args:
            password: User password + server pepper
            salt: Random salt for key derivation
            
        Returns:
            32-byte encryption key
        """
        # Use argon2-cffi's low-level API for key derivation
        # Argon2Type.ID = Argon2id variant (recommended for key derivation)
        # time_cost = iterations
        # memory_cost = memory in KB (65536 KB = 64 MB)
        # parallelism = lanes
        key = hash_secret_raw(
            secret=password.encode('utf-8'),
            salt=salt,
            time_cost=EncryptionService.ARGON2_ITERATIONS,
            memory_cost=EncryptionService.ARGON2_MEMORY_COST_KB,
            parallelism=EncryptionService.ARGON2_LANES,
            hash_len=EncryptionService.ARGON2_KEY_LENGTH,
            type=Argon2Type.ID  # Argon2id variant
        )
        return key
    
    @staticmethod
    def _get_server_pepper() -> str:
        """
        Get server-side pepper from environment.
        Falls back to secret key if pepper not set.
        """
        pepper = os.getenv("ENCRYPTION_PEPPER", "")
        if not pepper:
            # Fallback to JWT secret (not ideal, but better than nothing)
            pepper = settings.JWT_SECRET_KEY
        return pepper
    
    @staticmethod
    def encrypt(plaintext: str, user_password: str) -> Tuple[str, str, str]:
        """
        Encrypt plaintext using AES-256-GCM.
        
        Args:
            plaintext: Text to encrypt
            user_password: User's password (will be combined with server pepper)
            
        Returns:
            Tuple of (encrypted_data_base64, iv_base64, salt_base64, tag_base64)
        """
        # Generate random salt and IV
        salt = secrets.token_bytes(16)
        iv = secrets.token_bytes(EncryptionService.IV_LENGTH)
        
        # Combine user password with server pepper
        server_pepper = EncryptionService._get_server_pepper()
        combined_password = f"{user_password}:{server_pepper}"
        
        # Derive encryption key
        key = EncryptionService._derive_key(combined_password, salt)
        
        # Encrypt with AES-256-GCM
        aesgcm = AESGCM(key)
        ciphertext = aesgcm.encrypt(iv, plaintext.encode('utf-8'), None)
        
        # Extract tag (last 16 bytes of ciphertext)
        tag = ciphertext[-EncryptionService.TAG_LENGTH:]
        encrypted_data = ciphertext[:-EncryptionService.TAG_LENGTH]
        
        # Encode to base64 for storage
        encrypted_b64 = base64.b64encode(encrypted_data).decode('utf-8')
        iv_b64 = base64.b64encode(iv).decode('utf-8')
        salt_b64 = base64.b64encode(salt).decode('utf-8')
        tag_b64 = base64.b64encode(tag).decode('utf-8')
        
        return encrypted_b64, iv_b64, salt_b64, tag_b64
    
    @staticmethod
    def decrypt(
        encrypted_data_base64: str,
        iv_base64: str,
        salt_base64: str,
        tag_base64: str,
        user_password: str
    ) -> str:
        """
        Decrypt ciphertext using AES-256-GCM.
        
        Args:
            encrypted_data_base64: Encrypted data (base64)
            iv_base64: Initialization vector (base64)
            salt_base64: Salt for key derivation (base64)
            tag_base64: GCM authentication tag (base64)
            user_password: User's password
            
        Returns:
            Decrypted plaintext
            
        Raises:
            ValueError: If decryption fails (wrong password or tampered data)
        """
        try:
            # Decode from base64
            encrypted_data = base64.b64decode(encrypted_data_base64)
            iv = base64.b64decode(iv_base64)
            salt = base64.b64decode(salt_base64)
            tag = base64.b64decode(tag_base64)
            
            # Combine user password with server pepper
            server_pepper = EncryptionService._get_server_pepper()
            combined_password = f"{user_password}:{server_pepper}"
            
            # Derive encryption key
            key = EncryptionService._derive_key(combined_password, salt)
            
            # Reconstruct ciphertext (encrypted_data + tag)
            ciphertext = encrypted_data + tag
            
            # Decrypt with AES-256-GCM
            aesgcm = AESGCM(key)
            plaintext = aesgcm.decrypt(iv, ciphertext, None)
            
            return plaintext.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Decryption failed: {str(e)}")
    
    @staticmethod
    def generate_key_id() -> str:
        """Generate a unique key ID for key rotation tracking"""
        return base64.urlsafe_b64encode(secrets.token_bytes(16)).decode('utf-8')

