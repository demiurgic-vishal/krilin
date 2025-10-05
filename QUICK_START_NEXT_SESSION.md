# QUICK START - NEXT SESSION

> **Fast track to continue building the platform**

**Current State**: Phase 3 Complete (Foundation + Runtime + First App)
**Next Phase**: Phase 4 (Build Core Apps) OR Test Current Implementation

---

## ⚡ IMMEDIATE ACTION REQUIRED

### 1. Run Database Migration (5 minutes)

```bash
cd /Users/vishaltomar/Documents/Projects/krilin/backend

# Create migration
docker-compose exec backend alembic revision --autogenerate -m "create_app_platform_tables"

# Apply migration
docker-compose exec backend alembic upgrade head

# Verify tables
docker-compose exec backend psql -U postgres -d krilin_ai -c "\dt app*"
```

**Expected Output**:
- apps
- app_installations
- app_dependencies
- app_permissions
- app_tables
- app_outputs
- app_agent_conversations

---

## 🧪 TESTING THE PLATFORM (30 minutes)

### Step 1: Register Habit Tracker App

Create file: `backend/scripts/register_habit_tracker.py`

```python
import asyncio
import json
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import AsyncSessionLocal
from app.core.app_installer import register_app_metadata

async def main():
    manifest_path = Path(__file__).parent.parent / "apps" / "habit_tracker" / "manifest.json"

    print(f"Loading manifest from: {manifest_path}")

    with open(manifest_path) as f:
        manifest = json.load(f)

    print(f"Registering app: {manifest['metadata']['name']}")

    async with AsyncSessionLocal() as db:
        await register_app_metadata("habit-tracker", manifest, db)

    print("✅ Habit Tracker registered successfully!")

if __name__ == "__main__":
    asyncio.run(main())
```

Run it:
```bash
cd backend
python scripts/register_habit_tracker.py
```

### Step 2: Start Backend

```bash
docker-compose up backend
# Or if already running:
docker-compose restart backend
```

### Step 3: Get Auth Token

```bash
# Login or use existing token
export TOKEN="your_jwt_token_here"
```

### Step 4: Test Installation

```bash
# Install Habit Tracker
curl -X POST http://localhost:8000/api/v1/apps/habit-tracker/install \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected response:
# {
#   "success": true,
#   "app_id": "habit-tracker",
#   "message": "Successfully installed habit-tracker",
#   "installation_id": 1
# }
```

### Step 5: Test Actions

```bash
# Get habits (should return 3 sample habits)
curl http://localhost:8000/api/v1/apps/habit-tracker/actions/get_habits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"parameters": {}}'

# Create a habit
curl -X POST http://localhost:8000/api/v1/apps/habit-tracker/actions/create_habit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parameters": {
      "name": "Meditate",
      "description": "10 minutes of meditation",
      "frequency": "daily",
      "category": "wellness"
    }
  }'

# Log a habit completion
curl -X POST http://localhost:8000/api/v1/apps/habit-tracker/actions/log_habit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parameters": {
      "habit_id": "HABIT_ID_FROM_GET_HABITS",
      "notes": "Felt great today!"
    }
  }'

# Get statistics
curl -X POST http://localhost:8000/api/v1/apps/habit-tracker/actions/get_stats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"parameters": {"period": "week"}}'
```

### Step 6: Test Agent Chat

```bash
# Chat with Habit Coach AI
curl -X POST http://localhost:8000/api/v1/apps/habit-tracker/agent/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my habits and their current streaks"
  }'

# You'll get Server-Sent Events (SSE) stream with agent responses
```

### Step 7: Test Outputs

```bash
# Get daily streaks output
curl http://localhost:8000/api/v1/apps/habit-tracker/outputs/daily_streaks \
  -H "Authorization: Bearer $TOKEN"

# Get completion stats output
curl http://localhost:8000/api/v1/apps/habit-tracker/outputs/completion_stats \
  -H "Authorization: Bearer $TOKEN"
```

### Step 8: Test Uninstall

```bash
# Uninstall (keeps data)
curl -X DELETE http://localhost:8000/api/v1/apps/habit-tracker/uninstall \
  -H "Authorization: Bearer $TOKEN"

# Uninstall and delete data
curl -X DELETE "http://localhost:8000/api/v1/apps/habit-tracker/uninstall?delete_data=true" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🐛 TROUBLESHOOTING

### Migration Fails
```bash
# Check if tables already exist
docker-compose exec backend psql -U postgres -d krilin_ai -c "\dt"

# Drop and recreate if needed
docker-compose exec backend alembic downgrade base
docker-compose exec backend alembic upgrade head
```

### Import Errors
```bash
# Check Python path
docker-compose exec backend python -c "import sys; print('\n'.join(sys.path))"

# Restart backend
docker-compose restart backend
```

### Module Not Found: apps.habit_tracker
```bash
# Verify directory structure
ls -la backend/apps/habit_tracker/

# Should see:
# - manifest.json
# - backend.py
# - agent_tools.py
# - __init__.py

# Add __init__.py to apps directory if missing
touch backend/apps/__init__.py
```

### Agent Tools Not Loading
```bash
# Check logs
docker-compose logs backend | grep "APP AGENT"

# Should see:
# [APP AGENT] Loaded tool: view_habits
# [APP AGENT] Loaded tool: create_new_habit
# etc.
```

---

## 📋 WHAT TO BUILD NEXT

### Option A: Build More Apps (Recommended)

**Easiest Next Apps** (similar to Habit Tracker):

1. **Journal App** (~4 hours)
   - Simple CRUD for journal entries
   - Mood tracking
   - Tags and search
   - Agent for reflection prompts

2. **Notes App** (~4 hours)
   - Create/read/update/delete notes
   - Rich text support
   - Folders and tags
   - Agent for organizing notes

3. **Task Manager** (~6 hours)
   - Create/complete tasks
   - Due dates and priorities
   - Projects and tags
   - Agent for task breakdown

**More Complex Apps**:

4. **Calendar** (~8 hours)
   - Google Calendar integration
   - Create/update events
   - Free slot detection
   - Agent for scheduling

5. **Finance Tracker** (~8 hours)
   - Income/expense tracking
   - Budgets and categories
   - Monthly reports
   - Agent for financial advice

### Option B: Start UI Layer

1. Create app routing (`frontend/app/apps/[id]/page.tsx`)
2. Build Habit Tracker UI components
3. Connect to API endpoints
4. Test end-to-end

### Option C: Improve Current App

1. Add more agent tools
2. Implement reminder scheduling
3. Add data visualizations
4. Create widget components

---

## 📂 FILE LOCATIONS

**Platform Core**:
- Models: `backend/app/models/app_platform.py`
- Context: `backend/app/core/platform_context.py`
- APIs: `backend/app/core/{storage_api,apps_api,integrations_api,streams_api}.py`
- Runtime: `backend/app/core/app_runtime.py`
- Agents: `backend/app/core/app_agent.py`
- Installer: `backend/app/core/app_installer.py`

**Habit Tracker App**:
- Manifest: `backend/apps/habit_tracker/manifest.json`
- Backend: `backend/apps/habit_tracker/backend.py`
- Agent Tools: `backend/apps/habit_tracker/agent_tools.py`

**API Endpoints**:
- Apps API: `backend/app/api/v1/apps.py`

**Documentation**:
- Checklist: `CHECKLIST.md`
- Phase 3 Summary: `PHASE_3_COMPLETE.md`
- Complete Status: `PLATFORM_REWRITE_COMPLETE_STATUS.md`

---

## 📊 PROGRESS TRACKER

**Completed**:
- [x] Phase 1: Foundation (5 files, 1,583 lines)
- [x] Phase 2: Core APIs (3 files, 898 lines)
- [x] Phase 3: Runtime (5+1 files, ~2,350 lines)

**In Progress**:
- [ ] Phase 4: Core Apps (1/10 apps done)

**Pending**:
- [ ] Phase 5: UI Layer
- [ ] Phase 6: Testing & Docs

**Overall**: ~50% Complete (3/6 phases)

---

## 🎯 SUCCESS METRICS

**For Testing Phase**:
- [ ] Migration successful
- [ ] App installs without errors
- [ ] All actions return correct data
- [ ] Agent chat streams responses
- [ ] Agent tools execute successfully
- [ ] Streaks calculate correctly
- [ ] Outputs return data
- [ ] Uninstall works

**For Next App**:
- [ ] Manifest complete
- [ ] All actions implemented
- [ ] Agent tools working
- [ ] Outputs defined
- [ ] Initialization logic
- [ ] API endpoints tested

---

## 💡 QUICK WINS

**If you have 30 minutes**:
- Run migration
- Test one endpoint
- Fix one bug

**If you have 2 hours**:
- Complete full testing
- Fix all issues
- Document learnings

**If you have 4 hours**:
- Test everything
- Start Journal app
- Get to 20% of Phase 4

**If you have 8 hours**:
- Test and fix
- Build 2 new apps (Journal + Notes)
- Get to 30% of Phase 4

---

## 🚀 RECOMMENDED PATH

1. ✅ **Run Migration** (5 min)
2. ✅ **Register Habit Tracker** (5 min)
3. ✅ **Test All Endpoints** (30 min)
4. ✅ **Fix Any Issues** (1 hour)
5. 🎯 **Build Journal App** (4 hours)
6. 🎯 **Build Notes App** (4 hours)
7. 🎯 **Build Task Manager** (6 hours)

**After 3 apps**: You'll have proven the architecture and can build remaining apps faster.

---

**Ready to continue? Start with the migration! ⚡**

---

**Last Updated**: 2025-10-05
**Next Steps**: Migration → Testing → Build More Apps
