# Krilin AI - Database, Redis & Celery Setup Guide

## 🎯 Overview

The Krilin AI backend uses a complete modern stack:
- **PostgreSQL 15** - Main database (async with SQLAlchemy 2.0)
- **Redis 7** - Caching and message broker
- **Celery** - Background task processing (worker + beat scheduler)
- **FastAPI** - Async Python web framework

All services run in **Docker containers** for easy setup and consistent environments.

---

## 🐳 Docker Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose Stack                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  PostgreSQL  │  │    Redis     │  │  FastAPI        │  │
│  │  Port: 5432  │  │  Port: 6379  │  │  Backend        │  │
│  │              │  │              │  │  Port: 8000     │  │
│  │ Database:    │  │ DB 0: Cache  │  │                 │  │
│  │ krilin_ai    │  │ DB 1: Broker │  │ uvicorn --reload│  │
│  │              │  │ DB 2: Results│  │                 │  │
│  └───────┬──────┘  └──────┬───────┘  └────────┬────────┘  │
│          │                 │                    │           │
│          └─────────────────┴────────────────────┘           │
│                          ▲                                   │
│                          │                                   │
│          ┌───────────────┴────────────────┐                │
│          │                                 │                │
│  ┌───────▼────────┐              ┌────────▼──────┐        │
│  │ Celery Worker  │              │  Celery Beat  │        │
│  │ (2 concurrent) │              │  (Scheduler)  │        │
│  │                │              │               │        │
│  │ - Data sync    │              │ Periodic:     │        │
│  │ - AI analysis  │              │ • Every 5 min │        │
│  │ - Workflows    │              │ • Daily 7 AM  │        │
│  └────────────────┘              │ • Daily 8 PM  │        │
│                                   └───────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Git (to clone the project)

### Option 1: Using the Start Script (Recommended)

```bash
cd backend
./start.sh
```

That's it! The script will:
1. Check if Docker is running
2. Create `.env` file if it doesn't exist
3. Build all containers
4. Start all services
5. Display status and useful commands

### Option 2: Manual Docker Compose

```bash
cd backend

# Create .env file
cp .env.example .env

# Edit .env and add your OPENAI_API_KEY
nano .env

# Build and start
docker-compose build
docker-compose up -d

# Check status
docker-compose ps
```

---

## 📦 Services Configuration

### 1. PostgreSQL Database

**Container:** `krilin_postgres`  
**Image:** `postgres:15-alpine`  
**Port:** `5432`  
**Credentials:**
- User: `postgres`
- Password: `password`
- Database: `krilin_ai`

**Connection String:**
```
postgresql+asyncpg://postgres:password@localhost:5432/krilin_ai
```

**Features:**
- ✅ UTF-8 encoding
- ✅ Persistent volume (`postgres_data`)
- ✅ Health checks every 10s
- ✅ Auto-restart on failure

**Database Schema:**
The database tables are automatically created on startup via `init_db()` in [backend/app/database.py](backend/app/database.py:60-68):

```python
async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        # Import all models
        from app.models import user, conversation, goal, data_source, workflow, community
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
```

**Tables Created:**
- `users` - User accounts and authentication
- `conversations` - Chat conversations
- `messages` - Chat messages
- `goals` - User goals and AI plans
- `goal_progress` - Goal progress tracking
- `workflows` - Automation workflows
- `workflow_executions` - Workflow run history
- `data_sources` - External service connections
- `sync_jobs` - Data sync tracking
- `accomplishments` - Community achievements
- `reactions` - User reactions
- `comments` - Community comments
- `user_connections` - Social connections
- `challenges` - Community challenges
- `challenge_participants` - Challenge participation

---

### 2. Redis

**Container:** `krilin_redis`  
**Image:** `redis:7-alpine`  
**Port:** `6379`

**Redis Databases:**
- **DB 0:** Application cache
- **DB 1:** Celery broker (task queue)
- **DB 2:** Celery result backend

**Features:**
- ✅ AOF persistence enabled
- ✅ Persistent volume (`redis_data`)
- ✅ Health checks every 10s
- ✅ Auto-restart on failure

**Connection Strings:**
```python
REDIS_URL=redis://redis:6379/0              # Cache
CELERY_BROKER_URL=redis://redis:6379/1      # Task queue
CELERY_RESULT_BACKEND=redis://redis:6379/2  # Results
```

---

### 3. FastAPI Backend

**Container:** `krilin_backend`  
**Port:** `8000`  
**Auto-reload:** Enabled

**API Endpoints:**
- **Root:** http://localhost:8000/
- **Docs:** http://localhost:8000/docs (Swagger UI)
- **ReDoc:** http://localhost:8000/redoc
- **Health:** http://localhost:8000/health

**Environment Variables:**
All configured in [backend/.env](backend/.env):
```bash
DATABASE_URL=postgresql+asyncpg://postgres:password@postgres:5432/krilin_ai
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2
SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-key
```

---

### 4. Celery Worker

**Container:** `krilin_celery_worker`  
**Concurrency:** 2 workers  
**Tasks:** Defined in [backend/app/workers/tasks.py](backend/app/workers/tasks.py)

**Background Tasks:**
1. `sync_user_data_source(source_id)` - Sync individual data source
2. `sync_all_data_sources()` - Sync all active sources
3. `process_morning_reminders()` - Send daily reminders
4. `analyze_goal_progress()` - Daily goal analysis
5. `execute_user_workflow(workflow_id)` - Run workflows
6. `parse_email_for_expenses(email_data)` - AI email parsing
7. `find_libgen_books(query)` - Book search

**Monitoring:**
```bash
# View worker logs
docker-compose logs -f celery-worker

# Worker stats
docker exec -it krilin_celery_worker celery -A app.workers.celery_app inspect stats
```

---

### 5. Celery Beat (Scheduler)

**Container:** `krilin_celery_beat`  
**Config:** [backend/app/workers/celery_app.py](backend/app/workers/celery_app.py:32-45)

**Scheduled Tasks:**

| Task | Schedule | Purpose |
|------|----------|---------|
| `sync_all_data_sources` | Every 5 minutes | Sync Google Calendar, Gmail, Whoop, etc. |
| `process_morning_reminders` | Daily at 7:00 AM | Send morning goal reminders |
| `analyze_goal_progress` | Daily at 8:00 PM | AI analysis of daily progress |

**Configuration:**
```python
celery_app.conf.beat_schedule = {
    "sync-all-data-sources": {
        "task": "app.workers.tasks.sync_all_data_sources",
        "schedule": 300.0,  # 5 minutes
    },
    "process-morning-reminders": {
        "task": "app.workers.tasks.process_morning_reminders",
        "schedule": "cron(hour=7, minute=0)",  # 7 AM
    },
    "analyze-goal-progress": {
        "task": "app.workers.tasks.analyze_goal_progress",
        "schedule": "cron(hour=20, minute=0)",  # 8 PM
    },
}
```

---

## 🔧 Management Commands

### Service Control

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart backend

# View logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f celery-worker

# Check status
docker-compose ps

# Exec into containers
docker exec -it krilin_backend bash
docker exec -it krilin_postgres psql -U postgres -d krilin_ai
```

### Database Management

```bash
# Connect to PostgreSQL
docker exec -it krilin_postgres psql -U postgres -d krilin_ai

# Backup database
docker exec -it krilin_postgres pg_dump -U postgres krilin_ai > backup.sql

# Restore database
cat backup.sql | docker exec -i krilin_postgres psql -U postgres -d krilin_ai

# Reset database (⚠️ DELETES ALL DATA)
docker-compose down -v
docker-compose up -d
```

### Redis Management

```bash
# Connect to Redis
docker exec -it krilin_redis redis-cli

# Common Redis commands
> PING              # Test connection
> INFO              # Server info
> DBSIZE            # Number of keys
> KEYS *            # List all keys (dev only!)
> FLUSHDB          # Clear current database
> SELECT 1         # Switch to DB 1 (Celery broker)
```

### Celery Management

```bash
# View active tasks
docker exec -it krilin_celery_worker celery -A app.workers.celery_app inspect active

# View registered tasks
docker exec -it krilin_celery_worker celery -A app.workers.celery_app inspect registered

# Purge all tasks
docker exec -it krilin_celery_worker celery -A app.workers.celery_app purge

# Worker stats
docker exec -it krilin_celery_worker celery -A app.workers.celery_app inspect stats
```

---

## 🗄️ Database Schema Details

### SQLAlchemy Models

All models use **SQLAlchemy 2.0** with **async support**:

**Location:** `backend/app/models/`

**Key Models:**
```python
# User model
class User(Base):
    __tablename__ = "users"
    id: Mapped[int]
    email: Mapped[str]
    hashed_password: Mapped[str]
    full_name: Mapped[str | None]
    is_active: Mapped[bool]
    is_verified: Mapped[bool]
    # Relationships: goals, conversations, data_sources, workflows

# Goal model
class Goal(Base):
    __tablename__ = "goals"
    id: Mapped[int]
    user_id: Mapped[int]  # FK to users
    title: Mapped[str]
    description: Mapped[str | None]
    category: Mapped[str]
    status: Mapped[str]  # pending, active, completed, archived
    current_progress: Mapped[int]
    ai_plan: Mapped[dict | None]  # JSON
    resources: Mapped[list | None]  # JSON
    # Relationships: user, progress_entries

# Workflow model
class Workflow(Base):
    __tablename__ = "workflows"
    id: Mapped[int]
    user_id: Mapped[int]
    name: Mapped[str]
    steps: Mapped[list]  # JSON
    trigger: Mapped[dict | None]  # JSON
    is_active: Mapped[bool]
    # Relationships: user, executions
```

**Async Usage:**
```python
from app.database import AsyncSessionLocal

async with AsyncSessionLocal() as db:
    result = await db.execute(select(User).where(User.email == "user@example.com"))
    user = result.scalar_one_or_none()
```

---

## 🔐 Security Notes

### Development Settings (Current)
- ⚠️ Database password: `password` (CHANGE IN PRODUCTION)
- ⚠️ Secret key: Simple string (CHANGE IN PRODUCTION)
- ⚠️ Debug mode: Enabled

### Production Recommendations
1. Use strong passwords (32+ characters)
2. Generate secure secret key:
   ```python
   import secrets
   secrets.token_urlsafe(32)
   ```
3. Set `DEBUG=False`
4. Use SSL/TLS for database connections
5. Enable PostgreSQL authentication
6. Use Redis password protection
7. Set up firewall rules
8. Use environment-specific .env files

---

## 🐛 Troubleshooting

### Issue: "Docker is not running"
**Solution:** Start Docker Desktop application

### Issue: "Port 5432 already in use"
**Solution:** 
```bash
# Check what's using the port
lsof -i :5432

# Stop local PostgreSQL if running
brew services stop postgresql@15
```

### Issue: "Connection refused to database"
**Solution:**
```bash
# Check if postgres is healthy
docker-compose ps

# View postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres
```

### Issue: "Celery tasks not running"
**Solution:**
```bash
# Check worker status
docker-compose logs celery-worker

# Check if Redis is accessible
docker-compose logs redis

# Restart Celery
docker-compose restart celery-worker celery-beat
```

### Issue: "Database tables not created"
**Solution:**
The `init_db()` function runs automatically on backend startup. If tables aren't created:
```bash
# Check backend logs
docker-compose logs backend

# Restart backend to trigger init_db()
docker-compose restart backend
```

---

## 📊 Monitoring & Logs

### View All Logs
```bash
docker-compose logs -f
```

### Service-Specific Logs
```bash
docker-compose logs -f postgres        # Database logs
docker-compose logs -f redis           # Cache logs  
docker-compose logs -f backend         # API logs
docker-compose logs -f celery-worker   # Task execution logs
docker-compose logs -f celery-beat     # Scheduler logs
```

### Log Retention
```bash
# Clear old logs
docker-compose down
docker system prune -a
```

---

## 🎯 Next Steps

1. **Add your OpenAI API key** to `.env`:
   ```bash
   OPENAI_API_KEY=sk-...
   ```

2. **Test the API**:
   - Visit http://localhost:8000/docs
   - Try the `/health` endpoint
   - Register a new user
   - Create a goal with AI

3. **Monitor background tasks**:
   ```bash
   docker-compose logs -f celery-worker
   ```

4. **Connect frontend**:
   ```bash
   cd ../frontend
   npm run dev
   ```

---

**Questions?** Check the logs or open an issue!

**Documentation:** 
- FastAPI: https://fastapi.tiangolo.com/
- SQLAlchemy: https://docs.sqlalchemy.org/
- Celery: https://docs.celeryq.dev/
- Redis: https://redis.io/docs/
