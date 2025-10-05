"""
Credential Manager - Layer 2: Integration + Sync Layer
Securely store and manage OAuth tokens and API keys with encryption.
"""
import logging
import os
import base64
from typing import Any, Dict, Optional

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.data_source import DataSource

logger = logging.getLogger(__name__)


class CredentialManager:
    """
    Securely store OAuth tokens and API keys.

    Security Requirements:
    - Encrypt credentials at rest (use Fernet)
    - Per-user encryption keys derived from master key + user_id
    - Never log credentials
    - Automatic key rotation support
    - Audit access to credentials
    """

    def __init__(self, master_key: Optional[str] = None):
        """
        Initialize credential manager.

        Args:
            master_key: Master encryption key (base64-encoded)
                       If not provided, reads from ENCRYPTION_MASTER_KEY env var
        """
        if master_key is None:
            master_key = os.getenv("ENCRYPTION_MASTER_KEY")

        if not master_key:
            # Generate a new key if none provided (for development only!)
            logger.warning("No ENCRYPTION_MASTER_KEY found, generating new key. DO NOT USE IN PRODUCTION!")
            master_key = Fernet.generate_key().decode('utf-8')

        self.master_key = master_key.encode('utf-8') if isinstance(master_key, str) else master_key

    def _derive_user_key(self, user_id: int) -> bytes:
        """
        Derive encryption key specific to user.

        Uses PBKDF2 to derive a user-specific key from master key + user_id.

        Args:
            user_id: User ID

        Returns:
            Derived encryption key
        """
        # Use user_id as salt
        salt = str(user_id).encode('utf-8').ljust(16, b'0')[:16]

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )

        key = base64.urlsafe_b64encode(kdf.derive(self.master_key))
        return key

    def encrypt(self, user_id: int, data: Dict[str, Any]) -> str:
        """
        Encrypt credentials for a user.

        Args:
            user_id: User ID
            data: Credentials dictionary

        Returns:
            Encrypted credentials (base64 string)
        """
        import json

        # Derive user-specific key
        key = self._derive_user_key(user_id)
        f = Fernet(key)

        # Serialize credentials
        credentials_json = json.dumps(data)

        # Encrypt
        encrypted = f.encrypt(credentials_json.encode('utf-8'))

        return encrypted.decode('utf-8')

    def decrypt(self, user_id: int, encrypted_data: str) -> Dict[str, Any]:
        """
        Decrypt credentials for a user.

        Args:
            user_id: User ID
            encrypted_data: Encrypted credentials

        Returns:
            Decrypted credentials dictionary
        """
        import json

        # Derive user-specific key
        key = self._derive_user_key(user_id)
        f = Fernet(key)

        # Decrypt
        decrypted = f.decrypt(encrypted_data.encode('utf-8'))

        # Deserialize
        credentials = json.loads(decrypted.decode('utf-8'))

        return credentials

    async def store_credentials(
        self,
        db: AsyncSession,
        user_id: int,
        integration_id: str,
        credentials: Dict[str, Any]
    ) -> int:
        """
        Store credentials for an integration.

        Args:
            db: Database session
            user_id: User ID
            integration_id: Integration identifier
            credentials: Credentials dictionary (access_token, refresh_token, etc.)

        Returns:
            Data source ID
        """
        # Encrypt credentials
        encrypted = self.encrypt(user_id, credentials)

        # Check if data source already exists
        result = await db.execute(
            select(DataSource).where(
                DataSource.user_id == user_id,
                DataSource.source_type == integration_id
            )
        )
        data_source = result.scalar_one_or_none()

        if data_source:
            # Update existing
            data_source.credentials = {"encrypted": encrypted}
            data_source.status = "active"
            data_source.is_active = True
            data_source.consecutive_failures = 0
        else:
            # Create new
            data_source = DataSource(
                user_id=user_id,
                name=integration_id.replace("_", " ").title(),
                source_type=integration_id,
                credentials={"encrypted": encrypted},
                status="active",
                is_active=True
            )
            db.add(data_source)

        await db.commit()
        await db.refresh(data_source)

        logger.info(f"Stored credentials for user {user_id}, integration {integration_id}")

        return data_source.id

    async def get_credentials(
        self,
        db: AsyncSession,
        user_id: int,
        integration_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get decrypted credentials for an integration.

        Args:
            db: Database session
            user_id: User ID
            integration_id: Integration identifier

        Returns:
            Decrypted credentials or None if not found
        """
        result = await db.execute(
            select(DataSource).where(
                DataSource.user_id == user_id,
                DataSource.source_type == integration_id,
                DataSource.is_active == True
            )
        )
        data_source = result.scalar_one_or_none()

        if not data_source:
            return None

        # Get encrypted credentials
        encrypted = data_source.credentials.get("encrypted")

        if not encrypted:
            logger.warning(f"No encrypted credentials found for user {user_id}, integration {integration_id}")
            return None

        # Decrypt
        try:
            credentials = self.decrypt(user_id, encrypted)
            return credentials
        except Exception as e:
            logger.error(f"Failed to decrypt credentials: {str(e)}")
            return None

    async def get_credentials_by_source_id(
        self,
        db: AsyncSession,
        data_source_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Get decrypted credentials by data source ID.

        Args:
            db: Database session
            data_source_id: Data source ID

        Returns:
            Decrypted credentials or None if not found
        """
        result = await db.execute(
            select(DataSource).where(DataSource.id == data_source_id)
        )
        data_source = result.scalar_one_or_none()

        if not data_source:
            return None

        encrypted = data_source.credentials.get("encrypted")

        if not encrypted:
            return None

        try:
            credentials = self.decrypt(data_source.user_id, encrypted)
            return credentials
        except Exception as e:
            logger.error(f"Failed to decrypt credentials: {str(e)}")
            return None

    async def delete_credentials(
        self,
        db: AsyncSession,
        user_id: int,
        integration_id: str
    ):
        """
        Delete credentials (when user disconnects integration).

        Args:
            db: Database session
            user_id: User ID
            integration_id: Integration identifier
        """
        result = await db.execute(
            select(DataSource).where(
                DataSource.user_id == user_id,
                DataSource.source_type == integration_id
            )
        )
        data_source = result.scalar_one_or_none()

        if data_source:
            data_source.is_active = False
            data_source.status = "disconnected"
            data_source.credentials = {}
            await db.commit()

            logger.info(f"Deleted credentials for user {user_id}, integration {integration_id}")

    async def refresh_and_update(
        self,
        db: AsyncSession,
        user_id: int,
        integration_id: str,
        new_credentials: Dict[str, Any]
    ):
        """
        Store refreshed tokens.

        Args:
            db: Database session
            user_id: User ID
            integration_id: Integration identifier
            new_credentials: New credentials (refreshed tokens)
        """
        await self.store_credentials(db, user_id, integration_id, new_credentials)


# Global credential manager instance
_credential_manager: Optional[CredentialManager] = None


def get_credential_manager() -> CredentialManager:
    """
    Get global credential manager instance.

    Returns:
        CredentialManager instance
    """
    global _credential_manager

    if _credential_manager is None:
        _credential_manager = CredentialManager()

    return _credential_manager


# Utility function to generate a new master key (for initial setup)
def generate_master_key() -> str:
    """
    Generate a new master encryption key.

    Returns:
        Base64-encoded master key

    Usage:
        key = generate_master_key()
        # Store in .env as ENCRYPTION_MASTER_KEY
    """
    key = Fernet.generate_key()
    return key.decode('utf-8')


if __name__ == "__main__":
    # Generate and print a new master key
    print("Generated Master Encryption Key:")
    print(generate_master_key())
    print("\nAdd this to your .env file as:")
    print("ENCRYPTION_MASTER_KEY=<key>")
