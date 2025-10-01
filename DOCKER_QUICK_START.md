# 🥋 Krilin AI - Docker Quick Start Guide

## ⚡ TL;DR - Just Get It Running

```bash
# 1. Start Docker Desktop (make sure it's running!)

# 2. Navigate to backend
cd backend

# 3. Run the start script
./start.sh

# 4. Access the API
open http://localhost:8000/docs

# 5. In another terminal, start frontend
cd ../frontend
npm install
npm run dev

# 6. Open your browser
open http://localhost:3001
```

That's it! 🎉

---

## 📋 What Gets Started

When you run `./start.sh`, these services start:

| Service | Port | Purpose | Container Name |
|---------|------|---------|----------------|
| **PostgreSQL** | 5432 | Main database | krilin_postgres |
| **Redis** | 6379 | Cache & queue | krilin_redis |
| **Backend API** | 8000 | FastAPI server | krilin_backend |
| **Celery Worker** | - | Background tasks | krilin_celery_worker |
| **Celery Beat** | - | Task scheduler | krilin_celery_beat |

---

## 🔑 Important: Add Your API Keys

After first run, edit `.env` file:

```bash
cd backend
nano .env
```

Add your OpenAI API key:
```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

Then restart:
```bash
docker-compose restart backend celery-worker
```

---

## 🎯 Common Commands

### Start/Stop Services
```bash
cd backend

# Start everything
./start.sh

# Stop everything
./stop.sh

# Or manually:
docker-compose up -d      # Start
docker-compose down       # Stop
docker-compose restart    # Restart all
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f celery-worker
docker-compose logs -f postgres
```

### Check Status
```bash
docker-compose ps
```

### Access Services
```bash
# Backend API (Swagger UI)
open http://localhost:8000/docs

# Health check
curl http://localhost:8000/health

# Connect to database
docker exec -it krilin_postgres psql -U postgres -d krilin_ai

# Connect to Redis
docker exec -it krilin_redis redis-cli
```

---

## 🔄 Full Stack Development Setup

### Terminal 1: Backend (Docker)
```bash
cd backend
./start.sh
docker-compose logs -f backend
```

### Terminal 2: Frontend (Node.js)
```bash
cd frontend
npm install
npm run dev
```

### Terminal 3: Monitor Tasks (Optional)
```bash
cd backend
docker-compose logs -f celery-worker
```

---

## 🗄️ Database Access

### Using Docker CLI
```bash
# Access PostgreSQL
docker exec -it krilin_postgres psql -U postgres -d krilin_ai

# SQL commands
\dt              # List tables
\d users         # Describe users table
SELECT * FROM users;
\q               # Quit
```

### Using Database Client
- **Host:** localhost
- **Port:** 5432
- **Database:** krilin_ai
- **Username:** postgres
- **Password:** password

**Recommended clients:**
- [pgAdmin](https://www.pgadmin.org/)
- [DBeaver](https://dbeaver.io/)
- [TablePlus](https://tableplus.com/)

---

## 🧹 Clean Up / Reset

### Soft Reset (keeps data)
```bash
docker-compose down
docker-compose up -d
```

### Hard Reset (deletes everything)
```bash
# ⚠️ WARNING: This deletes ALL data
docker-compose down -v
docker system prune -a
./start.sh
```

---

## 🐛 Troubleshooting Quick Fixes

### "Docker is not running"
→ Start Docker Desktop application

### "Port already in use"
```bash
# Check what's using the port
lsof -i :8000   # Backend
lsof -i :5432   # PostgreSQL
lsof -i :6379   # Redis

# Stop the conflicting service
# For PostgreSQL:
brew services stop postgresql@15
```

### "Connection refused"
```bash
# Check if services are running
docker-compose ps

# Check logs for errors
docker-compose logs backend
docker-compose logs postgres

# Restart everything
docker-compose restart
```

### "Database tables not created"
```bash
# Backend auto-creates tables on startup
# If missing, restart backend:
docker-compose restart backend

# Check logs:
docker-compose logs backend
```

### "Celery tasks not executing"
```bash
# Check worker status
docker-compose logs celery-worker

# Check Redis connection
docker-compose logs redis

# Restart workers
docker-compose restart celery-worker celery-beat
```

---

## 📦 What's Installed Automatically

### Python Backend Dependencies
- FastAPI (web framework)
- SQLAlchemy (database ORM)
- Celery (task queue)
- Pydantic AI (AI agents)
- Redis client
- PostgreSQL driver (asyncpg)
- Authentication (JWT, bcrypt)

All managed by Poetry (see `pyproject.toml`)

### Containers
- PostgreSQL 15 Alpine
- Redis 7 Alpine
- Python 3.11 Slim

---

## 🎓 Learn More

- **Full Documentation:** [DATABASE_SETUP.md](DATABASE_SETUP.md)
- **Frontend Guide:** [FRONTEND_IMPLEMENTATION_STATUS.md](FRONTEND_IMPLEMENTATION_STATUS.md)
- **Navigation Map:** [NAVIGATION_MAP.md](NAVIGATION_MAP.md)
- **API Docs:** http://localhost:8000/docs (after starting)

---

## 🆘 Still Having Issues?

1. **Check Docker Desktop is running** ✅
2. **Check logs** for error messages:
   ```bash
   docker-compose logs -f
   ```
3. **Try a hard reset**:
   ```bash
   docker-compose down -v
   ./start.sh
   ```
4. **Check ports aren't blocked** by other services

---

## ✅ Quick Health Check

Run this to verify everything is working:

```bash
# 1. Check Docker containers
docker-compose ps

# Expected output: All services "Up (healthy)"

# 2. Test backend API
curl http://localhost:8000/health

# Expected: {"status":"healthy","version":"0.1.0","environment":"development"}

# 3. Test database connection
docker exec -it krilin_postgres psql -U postgres -d krilin_ai -c "SELECT version();"

# Expected: PostgreSQL version info

# 4. Test Redis
docker exec -it krilin_redis redis-cli PING

# Expected: PONG
```

If all 4 checks pass → **You're good to go!** 🎉

---

**Last Updated:** October 1, 2025  
**Krilin AI Version:** 0.1.0
