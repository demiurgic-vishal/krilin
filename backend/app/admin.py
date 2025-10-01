"""
FastAPI Admin interface for Krilin AI.
Provides admin dashboard for managing users, goals, workflows, etc.
"""
from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.responses import RedirectResponse

from app.config import settings
from app.database import async_engine
from app.models.user import User
from app.models.goal import Goal, ProgressEntry
from app.models.workflow import Workflow, WorkflowExecution
from app.models.conversation import Conversation, Message
from app.models.data_source import DataSource, SyncHistory
from app.models.community import Accomplishment, UserConnection, CommunityChallenge
from app.utils.security import verify_password, get_user_by_email
from app.database import AsyncSessionLocal


class AdminAuth(AuthenticationBackend):
    """Admin authentication backend."""

    async def login(self, request: Request) -> bool:
        """Authenticate admin user."""
        form = await request.form()
        email = form.get("username")
        password = form.get("password")

        async with AsyncSessionLocal() as db:
            user = await get_user_by_email(db, email)

            if not user:
                return False

            if not verify_password(password, user.hashed_password):
                return False

            # Check if user is admin (you can add is_admin field to User model)
            # For now, allow any authenticated user
            request.session.update({"user_id": user.id, "email": user.email})
            return True

    async def logout(self, request: Request) -> bool:
        """Logout admin user."""
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        """Check if user is authenticated."""
        return "user_id" in request.session


# Admin views for each model
class UserAdmin(ModelView, model=User):
    """User admin view."""

    name = "User"
    name_plural = "Users"
    icon = "fa-solid fa-user"

    column_searchable_list = [User.email, User.full_name]
    column_sortable_list = [User.id, User.email, User.created_at]
    column_default_sort = [(User.created_at, True)]

    # Don't show password field
    column_exclude_list = [User.hashed_password]
    form_excluded_columns = [User.hashed_password, User.created_at, User.updated_at]

    can_create = True
    can_edit = True
    can_delete = False  # Soft delete only
    can_view_details = True


class GoalAdmin(ModelView, model=Goal):
    """Goal admin view."""

    name = "Goal"
    name_plural = "Goals"
    icon = "fa-solid fa-bullseye"

    column_searchable_list = [Goal.title, Goal.description]
    column_sortable_list = [Goal.id, Goal.created_at, Goal.priority]
    column_default_sort = [(Goal.created_at, True)]
    column_filters = [Goal.status, Goal.category, Goal.priority]

    can_create = False  # Users create goals through app
    can_edit = True
    can_delete = True
    can_view_details = True


class WorkflowAdmin(ModelView, model=Workflow):
    """Workflow admin view."""

    name = "Workflow"
    name_plural = "Workflows"
    icon = "fa-solid fa-diagram-project"

    column_searchable_list = [Workflow.name, Workflow.description]
    column_sortable_list = [Workflow.id, Workflow.created_at]
    column_default_sort = [(Workflow.created_at, True)]

    can_create = False
    can_edit = True
    can_delete = True
    can_view_details = True


class ConversationAdmin(ModelView, model=Conversation):
    """Conversation admin view."""

    name = "Conversation"
    name_plural = "Conversations"
    icon = "fa-solid fa-comments"

    column_searchable_list = [Conversation.title]
    column_sortable_list = [Conversation.id, Conversation.created_at]
    column_default_sort = [(Conversation.created_at, True)]
    column_filters = [Conversation.agent_type, Conversation.is_active]

    can_create = False
    can_edit = True
    can_delete = True
    can_view_details = True


class DataSourceAdmin(ModelView, model=DataSource):
    """Data Source admin view."""

    name = "Data Source"
    name_plural = "Data Sources"
    icon = "fa-solid fa-database"

    column_sortable_list = [DataSource.id, DataSource.created_at]
    column_default_sort = [(DataSource.created_at, True)]
    column_filters = [DataSource.source_type, DataSource.is_active]

    can_create = False
    can_edit = True
    can_delete = True
    can_view_details = True


class AccomplishmentAdmin(ModelView, model=Accomplishment):
    """Accomplishment admin view."""

    name = "Accomplishment"
    name_plural = "Accomplishments"
    icon = "fa-solid fa-trophy"

    column_sortable_list = [Accomplishment.id, Accomplishment.created_at]
    column_default_sort = [(Accomplishment.created_at, True)]
    column_filters = [Accomplishment.accomplishment_type, Accomplishment.visibility]

    can_create = False
    can_edit = True
    can_delete = True
    can_view_details = True


class ChallengeAdmin(ModelView, model=CommunityChallenge):
    """Challenge admin view."""

    name = "Challenge"
    name_plural = "Challenges"
    icon = "fa-solid fa-flag-checkered"

    column_searchable_list = [CommunityChallenge.title, CommunityChallenge.description]
    column_sortable_list = [CommunityChallenge.id, CommunityChallenge.created_at]
    column_default_sort = [(CommunityChallenge.created_at, True)]
    column_filters = [CommunityChallenge.category, CommunityChallenge.is_active]

    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True


def setup_admin(app) -> Admin:
    """
    Setup and configure admin interface.

    Args:
        app: FastAPI application instance

    Returns:
        Admin: Configured admin instance
    """
    authentication_backend = AdminAuth(secret_key=settings.secret_key)

    admin = Admin(
        app=app,
        engine=async_engine,
        title="Krilin AI Admin",
        authentication_backend=authentication_backend,
        base_url="/admin"
    )

    # Register admin views
    admin.add_view(UserAdmin)
    admin.add_view(GoalAdmin)
    admin.add_view(WorkflowAdmin)
    admin.add_view(ConversationAdmin)
    admin.add_view(DataSourceAdmin)
    admin.add_view(AccomplishmentAdmin)
    admin.add_view(ChallengeAdmin)

    return admin
