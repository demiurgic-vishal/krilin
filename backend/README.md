# Krilin AI Backend

FastAPI backend for the Krilin AI personal assistant system. Features specialized AI agents, data integration, and workflow automation.

## Features

- **AI Agents**: Specialized agents for coding, finance, health, research, and shopping
- **Goal-Driven Planning**: Users say "I want to be more social" and get comprehensive plans
- **Data Integration**: Connect Google Calendar, Gmail, health trackers, and more
- **Workflow Engine**: Safe execution of AI-generated automation workflows
- **Community Features**: Share accomplishments and participate in challenges
- **Real-time Chat**: Context-aware conversations with memory

## Quick Start

### Development Setup

1. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   # Using Poetry (recommended)
   poetry install
   
   # Or using pip
   pip install -r requirements.txt
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start services with Docker Compose:**
   ```bash
   docker-compose up -d postgres redis
   ```

5. **Run database migrations:**
   ```bash
   poetry run alembic upgrade head
   ```

6. **Start the development server:**
   ```bash
   poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Using Docker (Full Stack)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user info

### AI Chat
- `POST /api/v1/chat/conversations` - Create new conversation
- `GET /api/v1/chat/conversations` - List conversations
- `POST /api/v1/chat/conversations/{id}/messages` - Send message to AI agent
- `POST /api/v1/chat/goal-chat` - Goal-driven chat (creates plans & resources)

### Goals & Progress
- `GET /api/v1/goals/` - List user goals
- `POST /api/v1/goals/` - Create new goal
- `GET /api/v1/goals/{id}/progress` - Get goal progress

### Data Integration
- `GET /api/v1/data/sources` - List connected data sources
- `POST /api/v1/data/sources/{type}/connect` - Connect data source
- `POST /api/v1/data/sources/{id}/sync` - Trigger sync

## AI Agents

### Coding Agent
- Creates custom workflows and automation
- Handles "I want to be more organized" requests
- Connects email/calendar for deadline tracking
- Builds productivity systems

### Research Agent
- Finds books and learning resources (including libgen)
- Creates learning plans for new skills
- Handles "I want to be more social" or "learn new tech" requests
- Generates structured learning paths

### Health Agent
- Creates personalized workout plans
- Integrates with fitness trackers (Whoop, Apple Health)
- Provides nutrition and wellness guidance
- Tracks health goals and metrics

### Finance Agent
- Analyzes spending patterns from email
- Provides investment advice and budgeting
- Tracks financial goals
- Offers debt management strategies

### Shopping Agent
- Researches products and finds best deals
- Compares prices across platforms
- Considers budget and quality factors

## Architecture

```
app/
├── main.py              # FastAPI application
├── config.py            # Configuration management
├── database.py          # Database connection
├── dependencies.py      # FastAPI dependencies
├── api/v1/             # API endpoints
├── models/             # SQLAlchemy models
├── schemas/            # Pydantic schemas
├── services/           # Business logic
│   ├── ai_agent.py     # Pydantic AI integration
│   └── data_integrations/
├── utils/              # Utilities
└── workers/            # Celery background tasks
```

## Environment Variables

Key environment variables (see `.env.example`):

- `SECRET_KEY` - JWT secret key
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for Pydantic AI
- `GOOGLE_CLIENT_ID/SECRET` - For Google OAuth integration

## Development

### Database Migrations

```bash
# Create migration
poetry run alembic revision --autogenerate -m "description"

# Apply migrations
poetry run alembic upgrade head

# Rollback migration
poetry run alembic downgrade -1
```

### Testing

```bash
# Run tests
poetry run pytest

# With coverage
poetry run pytest --cov=app
```

### Code Quality

```bash
# Format code
poetry run black app/

# Sort imports
poetry run isort app/

# Type checking
poetry run mypy app/
```

## Production Deployment

1. Set environment variables for production
2. Use PostgreSQL and Redis managed services
3. Deploy with Docker or cloud platforms
4. Set up SSL/TLS termination
5. Configure monitoring and logging

## Contributing

1. Follow the existing code patterns
2. Add type hints to all functions
3. Write tests for new features
4. Update documentation

## License

[Your License Here]