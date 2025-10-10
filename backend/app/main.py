"""
Main FastAPI application for Krilin AI Backend.
LLM-friendly structure with clear routing and middleware.
"""
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.admin import setup_admin
from app.api.v1 import auth, chat, data_sources, goals, community, apps, errors
from app.config import settings
from app.database import close_db, init_db

# Configure logging to stdout
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    await init_db()

    # Start session manager cleanup task
    from app.services.session_manager import get_session_manager
    session_manager = get_session_manager()
    await session_manager.start_cleanup_task()

    yield

    # Shutdown
    # Clean up all active Claude SDK sessions
    from app.services.session_manager import cleanup_session_manager
    await cleanup_session_manager()

    await close_db()


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered personal assistant backend",
    debug=settings.debug,
    lifespan=lifespan,
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Session middleware for admin authentication
app.add_middleware(SessionMiddleware, secret_key=settings.secret_key)

# Setup admin interface
admin = setup_admin(app)

# Include API routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["ai-chat"])
app.include_router(data_sources.router, prefix="/api/v1/data-sources", tags=["data-integration"])
app.include_router(apps.router, prefix="/api/v1/apps", tags=["apps"])
app.include_router(goals.router, prefix="/api/v1/goals", tags=["goals"])
app.include_router(community.router, prefix="/api/v1/community", tags=["community"])
app.include_router(errors.router, prefix="/api/v1", tags=["errors"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Krilin AI Backend",
        "version": settings.app_version,
        "environment": settings.environment,
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": settings.app_version,
        "environment": settings.environment,
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level.lower(),
    )