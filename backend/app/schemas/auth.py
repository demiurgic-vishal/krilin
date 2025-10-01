"""
Authentication Pydantic schemas.
LLM-friendly with clear validation and type hints.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    full_name: Optional[str] = None
    timezone: str = "UTC"
    preferences: dict = Field(default_factory=dict)


class UserCreate(UserBase):
    """Schema for user creation."""
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")


class UserUpdate(BaseModel):
    """Schema for user updates."""
    full_name: Optional[str] = None
    timezone: Optional[str] = None
    preferences: Optional[dict] = None


class UserResponse(UserBase):
    """Schema for user responses (excludes password)."""
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True  # For SQLAlchemy compatibility


class Token(BaseModel):
    """JWT token response schema."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # Seconds


class TokenData(BaseModel):
    """Token payload data."""
    user_id: Optional[int] = None


class LoginRequest(BaseModel):
    """Login request schema."""
    email: EmailStr
    password: str


class PasswordReset(BaseModel):
    """Password reset schema."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation schema."""
    token: str
    new_password: str = Field(..., min_length=8)