"""
Configuration management using Pydantic Settings.
LLM-friendly with type hints and clear structure.
"""
from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Application
    app_name: str = "Krilin AI Backend"
    app_version: str = "0.1.0"
    debug: bool = False
    environment: Literal["development", "staging", "production"] = "development"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    
    # Security
    secret_key: str = Field(..., description="Secret key for JWT tokens")
    access_token_expire_minutes: int = 30
    algorithm: str = "HS256"
    
    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:password@localhost/krilin_ai",
        description="Async PostgreSQL connection string"
    )
    
    # Redis
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection string for caching and Celery"
    )
    
    # Celery
    celery_broker_url: str = Field(
        default="redis://localhost:6379/1",
        description="Celery broker URL (Redis)"
    )
    celery_result_backend: str = Field(
        default="redis://localhost:6379/2", 
        description="Celery result backend URL"
    )
    
    # AI Models
    openai_api_key: str = Field(..., description="OpenAI API key for Pydantic AI")
    default_model: str = "gpt-4o"
    
    # External APIs
    google_client_id: str = Field(default="", description="Google OAuth client ID")
    google_client_secret: str = Field(default="", description="Google OAuth secret")
    whoop_client_id: str = Field(default="", description="Whoop OAuth client ID")
    whoop_client_secret: str = Field(default="", description="Whoop OAuth secret")
    strava_client_id: str = Field(default="", description="Strava OAuth client ID")
    strava_client_secret: str = Field(default="", description="Strava OAuth secret")
    
    # CORS
    allowed_origins: list[str] = [
        "http://localhost:3000",  # Next.js frontend
        "http://localhost:3001",  # Alternative frontend port
    ]
    
    # Logging
    log_level: str = "INFO"
    
    # File Storage
    max_upload_size: int = 10 * 1024 * 1024  # 10MB
    upload_dir: str = "uploads"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.environment == "development"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.environment == "production"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Global settings instance
settings = get_settings()