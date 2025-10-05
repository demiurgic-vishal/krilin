# PLATFORM REWRITE IMPLEMENTATION TRACKER

**Start Date**: 2025-10-05
**Target**: Transform workflow-based system → Cloud OS App Platform
**Status**: 🚧 IN PROGRESS

---

## OVERVIEW

This document tracks the complete rewrite from a workflow automation system to a Cloud OS App Platform as specified in `platform-specification.md`.

### Architecture Transformation

**FROM**: Workflow Automation System
- AI generates YAML workflows + Python code
- Data Adapter translates queries
- Workflow executor runs automation

**TO**: Cloud OS App Platform
- Hand-crafted apps with embedded Claude agents
- Apps compose via dependencies & outputs
- Platform provides runtime context (`ctx`)
- Shared backend with user isolation

---

## IMPLEMENTATION PHASES

### ✅ COMPLETED
- [x] Deep codebase exploration
- [x] Architecture comparison & gap analysis
- [x] Implementation plan creation

### 🚧 IN PROGRESS
- [ ] Phase 1: Platform Kernel Core (Weeks 1-3)
- [ ] Phase 2: App Runtime & Agents (Weeks 4-6)
- [ ] Phase 3: The 10 Core Apps (Weeks 7-10)
- [ ] Phase 4: UI Layer (Weeks 11-12)
- [ ] Phase 5: Testing & Documentation (Weeks 13-14)

---

## DETAILED CHANGES LOG

### Phase 1: Platform Kernel Core

#### 1.1 Platform Models & Database Schema
**Status**: 🔴 Not Started

**Files to Create**:
- [ ] `backend/app/models/app_platform.py` - New app models
- [ ] `backend/alembic/versions/xxx_create_app_platform_tables.py` - Migration

**Files to Modify**:
- [ ] `backend/app/models/marketplace.py` - Adapt for apps (not workflows)
- [ ] `backend/app/database.py` - Import new models

**Changes**:
- [ ] Create `App` model (metadata, version, manifest, code)
- [ ] Create `AppInstallation` model (user_id, app_id, config, state)
- [ ] Create `AppDependency` model (app_id, depends_on_app_id, version)
- [ ] Create `AppPermission` model (app_id, permission_type, scope)
- [ ] Create `AppTable` model (app_id, table_name, schema)
- [ ] Create `AppOutput` model (app_id, output_id, schema)
- [ ] Update existing marketplace models to reference apps

**Verification**:
```bash
# Run migrations
cd backend && alembic upgrade head

# Verify tables created
psql -d krilin_ai -c "\dt app_*"
```

---

#### 1.2 Platform Context System
**Status**: 🔴 Not Started

**Files to Create**:
- [ ] `backend/app/core/platform_context.py` - PlatformContext class
- [ ] `backend/app/core/context_factory.py` - Context creation
- [ ] `backend/app/core/storage_api.py` - ctx.storage implementation
- [ ] `backend/app/core/apps_api.py` - ctx.apps implementation
- [ ] `backend/app/core/integrations_api.py` - ctx.integrations implementation
- [ ] `backend/app/core/streams_api.py` - ctx.streams implementation

**Changes**:
- [ ] `PlatformContext` class with user_id, app_id, db session
- [ ] `ctx.storage` - Storage API with auto-scoping
- [ ] `ctx.apps` - App communication API
- [ ] `ctx.integrations` - Integration access API
- [ ] `ctx.streams` - Real-time streaming API
- [ ] `ctx.notifications` - Notification API
- [ ] `ctx.files` - File storage API
- [ ] `ctx.schedule` - Scheduling API
- [ ] `ctx.ai` - AI completion API
- [ ] `ctx.user` - Current user info
- [ ] `ctx.app_id` - Current app ID
- [ ] `ctx.log()` - Structured logging

**Verification**:
```python
# Test context creation
from app.core.context_factory import create_app_context

ctx = await create_app_context(user_id=1, app_id="habit-tracker", db=db)
assert ctx.user.id == 1
assert ctx.app_id == "habit-tracker"
assert ctx.storage is not None
assert ctx.apps is not None
```

---

#### 1.3 App Manifest System
**Status**: 🔴 Not Started

**Files to Create**:
- [ ] `backend/app/core/app_manifest.py` - New app manifest parser

**Files to Modify**:
- [ ] Deprecate `backend/app/services/workflow_manifest.py` (mark for removal)

**Changes**:
- [ ] `AppManifest` class with new schema:
  - [ ] `metadata` - name, version, author, description, icon, category
  - [ ] `dependencies` - required_apps, optional_apps, required_integrations
  - [ ] `outputs` - data outputs apps can expose
  - [ ] `permissions` - data_scopes, api_access, notifications
  - [ ] `agent_config` - system_prompt, tools, capabilities
  - [ ] `database` - table schemas for app
  - [ ] `ui_components` - widgets, pages, settings
  - [ ] `actions` - app actions/endpoints
- [ ] Manifest validation
- [ ] JSON/YAML parsing
- [ ] Semantic versioning support

**Example Manifest**:
```json
{
  "metadata": {
    "id": "habit-tracker",
    "name": "Habit Tracker",
    "version": "1.0.0",
    "author": "Krilin Team"
  },
  "dependencies": {
    "required_apps": [],
    "optional_apps": ["calendar"],
    "required_integrations": []
  },
  "outputs": [
    {
      "id": "daily_streaks",
      "type": "data",
      "schema": {"habit_id": "string", "streak": "number"}
    }
  ],
  "permissions": {
    "data_scopes": ["read:own_data", "write:own_data"],
    "notifications": true
  },
  "agent_config": {
    "system_prompt": "You are a habit tracking assistant...",
    "tools": ["get_habits", "log_habit", "calculate_streak"]
  },
  "database": {
    "tables": [
      {
        "name": "habits",
        "schema": {
          "id": "string",
          "name": "string",
          "frequency": "string"
        }
      }
    ]
  }
}
```

**Verification**:
```python
# Test manifest parsing
from app.core.app_manifest import AppManifest

manifest = AppManifest.from_json_file("apps/habit-tracker/manifest.json")
assert manifest.metadata.id == "habit-tracker"
assert len(manifest.database.tables) > 0
assert manifest.agent_config is not None
```

---

### Phase 1 Completion Checklist
- [ ] All database tables created and migrated
- [ ] Platform context system working with all APIs
- [ ] App manifest parser functional
- [ ] Unit tests for Phase 1 components passing
- [ ] Can create context and access ctx.storage, ctx.apps, etc.

---

## FILES CHANGED SUMMARY

### Created Files
Count: 0

### Modified Files
Count: 0

### Deprecated Files
Count: 0

### Deleted Files
Count: 0

---

## TESTING STATUS

### Unit Tests
- [ ] Platform Context tests
- [ ] Storage API tests
- [ ] Apps API tests
- [ ] Integration API tests
- [ ] Manifest parser tests

### Integration Tests
- [ ] App installation flow
- [ ] Dependency resolution
- [ ] App-to-app communication
- [ ] Agent execution

### E2E Tests
- [ ] User installs app
- [ ] App uses platform APIs
- [ ] Agent chat works
- [ ] Real-time updates

---

## MIGRATION NOTES

### Reusable Components
✅ Keep and reuse:
- Integration layer (all files in `backend/app/services/` for integrations)
- Claude agent infrastructure (`claude_agent_service.py`)
- Auth system (`backend/app/api/v1/auth.py`)
- User models (`backend/app/models/user.py`)
- Database setup (`backend/app/database.py`)
- Query engine (adapt for ctx.storage)

### Components to Deprecate
❌ Mark for removal after migration:
- `backend/app/services/workflow_manager.py`
- `backend/app/services/workflow_manifest.py`
- `backend/app/services/data_adapter.py`
- `backend/app/services/workflow_executor.py`
- `backend/app/api/v1/workflows.py` (if exists)
- Old workflow models in `backend/app/models/workflow.py`

---

## PERFORMANCE METRICS

### Target Metrics (MVP)
- [ ] API Response Time: <100ms (non-AI)
- [ ] Agent Response Time: 1-3s (with streaming)
- [ ] Dashboard Load Time: <2s
- [ ] Token Cost: <$20/user/month
- [ ] Database Queries: <50ms p95

### Current Metrics
- Not yet measured

---

## NEXT STEPS

1. ✅ Create this tracking document
2. ⏭️ Start Phase 1.1: Create app platform models
3. ⏭️ Build platform context system
4. ⏭️ Implement storage API
5. ⏭️ Continue through phases sequentially

---

## NOTES & DECISIONS

### Key Architectural Decisions
1. **Shared Backend Model**: All users share same FastAPI instances for zero cold starts
2. **User Isolation**: Via context objects with user_id scoping, not separate containers
3. **App Storage**: Tables prefixed with `app_{app_id}_` for isolation
4. **Token Optimization**: Limit conversation history, cache queries, route simple operations
5. **MVP Scope**: 10 hand-crafted apps, NO marketplace, NO AI generation (Year 2)

### Open Questions
- [ ] File storage strategy (S3 vs local with user prefixes)
- [ ] WebSocket connection pooling approach
- [ ] Caching strategy for app outputs
- [ ] Agent token budget per user per day

---

**Last Updated**: 2025-10-05
**Updated By**: Claude (Autonomous Implementation)
