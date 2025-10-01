"""
Main FastAPI application for Krilin AI Backend.
LLM-friendly structure with clear routing and middleware.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.admin import setup_admin
from app.api.v1 import auth, chat, data_sources, workflows, goals, community
from app.config import settings
from app.database import close_db, init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    await init_db()
    
    yield
    
    # Shutdown
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
app.include_router(workflows.router, prefix="/api/v1/workflows", tags=["workflows"])
app.include_router(goals.router, prefix="/api/v1/goals", tags=["goals"])
app.include_router(community.router, prefix="/api/v1/community", tags=["community"])


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