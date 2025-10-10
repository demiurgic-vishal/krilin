"""
Files API for apps - Handle file uploads and storage.

Apps can use ctx.files to upload and manage files:
- Upload files
- Generate signed URLs
- List files
- Delete files
"""
import logging
import os
import uuid
from typing import Optional, Dict, Any, BinaryIO
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)


class FilesAPI:
    """
    Files API for file upload and management.

    Example usage in app code:
    ```python
    file_url = await ctx.files.upload(
        file_data,
        filename="receipt.pdf",
        metadata={"type": "receipt", "category": "food"}
    )
    ```
    """

    def __init__(self, user_id: int, app_id: str):
        self.user_id = user_id
        self.app_id = app_id

        # Base upload directory from config
        from app.config import settings
        self.base_upload_dir = Path(settings.upload_dir)

        # Create user and app-specific directory
        self.user_app_dir = self.base_upload_dir / f"user_{user_id}" / f"app_{app_id}"
        self.user_app_dir.mkdir(parents=True, exist_ok=True)

    async def upload(
        self,
        file_data: bytes,
        filename: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Upload a file and return its URL.

        Args:
            file_data: File data as bytes
            filename: Original filename
            metadata: Optional metadata to store with file

        Returns:
            str: URL to access the uploaded file

        Example:
            file_url = await ctx.files.upload(
                file_data=image_bytes,
                filename="profile.jpg",
                metadata={"type": "profile_picture"}
            )
        """
        try:
            # Generate unique filename to avoid conflicts
            file_ext = Path(filename).suffix
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            file_path = self.user_app_dir / unique_filename

            # Write file to disk
            with open(file_path, 'wb') as f:
                f.write(file_data)

            # TODO: Store metadata in database
            # TODO: Generate signed URL if using S3

            # For now, return local file path as URL
            file_url = f"/uploads/user_{self.user_id}/app_{self.app_id}/{unique_filename}"

            logger.info(
                f"File uploaded from app {self.app_id} for user {self.user_id}",
                extra={
                    "app_id": self.app_id,
                    "user_id": self.user_id,
                    "filename": filename,
                    "unique_filename": unique_filename,
                    "size_bytes": len(file_data)
                }
            )

            return file_url

        except Exception as e:
            logger.error(
                f"File upload error for app {self.app_id}: {str(e)}",
                extra={
                    "app_id": self.app_id,
                    "user_id": self.user_id,
                    "error": str(e)
                }
            )
            raise ValueError(f"Failed to upload file: {str(e)}")

    async def upload_from_path(
        self,
        file_path: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Upload a file from a local path.

        Args:
            file_path: Path to the file to upload
            metadata: Optional metadata

        Returns:
            str: URL to access the uploaded file

        Example:
            file_url = await ctx.files.upload_from_path(
                "/tmp/report.pdf",
                metadata={"type": "report"}
            )
        """
        with open(file_path, 'rb') as f:
            file_data = f.read()

        filename = Path(file_path).name
        return await self.upload(file_data, filename, metadata)

    async def list_files(
        self,
        limit: int = 100,
        file_type: Optional[str] = None
    ) -> list[Dict[str, Any]]:
        """
        List all files uploaded by this app.

        Args:
            limit: Maximum number of files to return
            file_type: Filter by file extension (e.g., ".pdf", ".jpg")

        Returns:
            list: List of file info dicts

        Example:
            files = await ctx.files.list_files(file_type=".pdf")
        """
        try:
            files = []
            for file_path in self.user_app_dir.iterdir():
                if file_path.is_file():
                    # Filter by type if specified
                    if file_type and not file_path.suffix == file_type:
                        continue

                    stat = file_path.stat()
                    files.append({
                        "filename": file_path.name,
                        "url": f"/uploads/user_{self.user_id}/app_{self.app_id}/{file_path.name}",
                        "size_bytes": stat.st_size,
                        "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                        "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat()
                    })

                    if len(files) >= limit:
                        break

            return files

        except Exception as e:
            logger.error(f"Failed to list files: {str(e)}")
            return []

    async def delete(self, filename: str) -> bool:
        """
        Delete a file.

        Args:
            filename: Name of the file to delete

        Returns:
            bool: True if deleted successfully

        Example:
            deleted = await ctx.files.delete("old_file.pdf")
        """
        try:
            file_path = self.user_app_dir / filename

            if file_path.exists() and file_path.is_file():
                file_path.unlink()
                logger.info(f"File deleted: {filename} from app {self.app_id}")
                return True
            else:
                logger.warning(f"File not found: {filename}")
                return False

        except Exception as e:
            logger.error(f"Failed to delete file: {str(e)}")
            return False

    async def get_url(self, filename: str, expires_in: int = 3600) -> str:
        """
        Get a URL to access a file.

        Args:
            filename: Name of the file
            expires_in: URL expiration time in seconds (for signed URLs)

        Returns:
            str: URL to access the file

        Example:
            url = await ctx.files.get_url("report.pdf", expires_in=7200)
        """
        # For local storage, just return the path
        # TODO: Generate signed URL if using S3
        return f"/uploads/user_{self.user_id}/app_{self.app_id}/{filename}"

    async def get_size(self, filename: str) -> int:
        """
        Get file size in bytes.

        Args:
            filename: Name of the file

        Returns:
            int: File size in bytes (0 if file doesn't exist)

        Example:
            size = await ctx.files.get_size("large_file.pdf")
        """
        try:
            file_path = self.user_app_dir / filename
            if file_path.exists():
                return file_path.stat().st_size
            return 0
        except Exception:
            return 0
