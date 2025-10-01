"""
Database connection and session management using SQLAlchemy 2.0.
Async setup optimized for FastAPI and LLM code generation.
"""
import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.config import settings


# Create async engine
# Use NullPool for Celery workers to avoid event loop conflicts
if os.getenv("CELERY_WORKER"):
    engine = create_async_engine(
        settings.database_url,
        echo=settings.is_development,
        future=True,
        poolclass=NullPool,  # No connection pooling for Celery
    )
else:
    engine = create_async_engine(
        settings.database_url,
        echo=settings.is_development,  # Log SQL queries in development
        future=True,
        pool_pre_ping=True,  # Verify connections before use
        pool_size=10,  # Default connection pool size
        max_overflow=20,  # Allow up to 20 overflow connections
        pool_recycle=3600,  # Recycle connections after 1 hour
    )

# Alias for admin compatibility
async_engine = engine

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency to get database session.
    
    Usage:
        @app.post("/users/")
        async def create_user(db: AsyncSession = Depends(get_db)):
            # Use db session here
            pass
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables."""
    async with engine.begin() as conn:
        # Import all models here to register them
        from app.models import user, conversation, goal, data_source, workflow, community
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connections."""
    await engine.dispose()