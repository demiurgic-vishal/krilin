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
from app.models.user import User, UserSession
from app.models.goal import Goal, ProgressEntry, Reminder
from app.models.conversation import Conversation, Message, AgentMemory
from app.models.data_source import DataSource, SyncHistory, DataRecord
from app.models.community import Accomplishment, AccomplishmentComment, AccomplishmentReaction, UserConnection, CommunityChallenge, ChallengeParticipation
from app.models.marketplace import MarketplaceApp, MarketplaceAppInstallation, MarketplaceAppReview, MarketplaceAppCategory, MarketplaceAppCollection
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


class MessageAdmin(ModelView, model=Message):
    """Message admin view."""

    name = "Message"
    name_plural = "Messages"
    icon = "fa-solid fa-message"

    column_sortable_list = [Message.id, Message.created_at]
    column_default_sort = [(Message.created_at, True)]
    column_filters = [Message.role]

    can_create = False
    can_edit = False
    can_delete = True
    can_view_details = True


class ProgressEntryAdmin(ModelView, model=ProgressEntry):
    """Progress Entry admin view."""

    name = "Progress Entry"
    name_plural = "Progress Entries"
    icon = "fa-solid fa-chart-line"

    column_sortable_list = [ProgressEntry.id, ProgressEntry.date]
    column_default_sort = [(ProgressEntry.date, True)]

    can_create = False
    can_edit = True
    can_delete = True
    can_view_details = True


class ReminderAdmin(ModelView, model=Reminder):
    """Reminder admin view."""

    name = "Reminder"
    name_plural = "Reminders"
    icon = "fa-solid fa-bell"

    column_sortable_list = [Reminder.id, Reminder.scheduled_for]
    column_default_sort = [(Reminder.scheduled_for, False)]
    column_filters = [Reminder.is_sent, Reminder.is_acknowledged]

    can_create = False
    can_edit = True
    can_delete = True
    can_view_details = True


class SyncHistoryAdmin(ModelView, model=SyncHistory):
    """Sync History admin view."""

    name = "Sync History"
    name_plural = "Sync Histories"
    icon = "fa-solid fa-rotate"

    column_sortable_list = [SyncHistory.id, SyncHistory.started_at]
    column_default_sort = [(SyncHistory.started_at, True)]
    column_filters = [SyncHistory.status]

    can_create = False
    can_edit = False
    can_delete = True
    can_view_details = True


class DataRecordAdmin(ModelView, model=DataRecord):
    """Data Record admin view."""

    name = "Data Record"
    name_plural = "Data Records"
    icon = "fa-solid fa-table"

    column_sortable_list = [DataRecord.id, DataRecord.record_date]
    column_default_sort = [(DataRecord.record_date, True)]
    column_filters = [DataRecord.record_type]

    can_create = False
    can_edit = True
    can_delete = True
    can_view_details = True




class AgentMemoryAdmin(ModelView, model=AgentMemory):
    """Agent Memory admin view."""

    name = "Agent Memory"
    name_plural = "Agent Memories"
    icon = "fa-solid fa-brain"

    column_sortable_list = [AgentMemory.id, AgentMemory.created_at]
    column_default_sort = [(AgentMemory.created_at, True)]

    can_create = False
    can_edit = True
    can_delete = True
    can_view_details = True


class UserConnectionAdmin(ModelView, model=UserConnection):
    """User Connection admin view."""

    name = "User Connection"
    name_plural = "User Connections"
    icon = "fa-solid fa-users"

    column_sortable_list = [UserConnection.id, UserConnection.created_at]
    column_default_sort = [(UserConnection.created_at, True)]
    column_filters = [UserConnection.is_mutual, UserConnection.is_blocked]

    can_create = False
    can_edit = True
    can_delete = True
    can_view_details = True


class AccomplishmentCommentAdmin(ModelView, model=AccomplishmentComment):
    """Accomplishment Comment admin view."""

    name = "Accomplishment Comment"
    name_plural = "Accomplishment Comments"
    icon = "fa-solid fa-comment"

    column_sortable_list = [AccomplishmentComment.id, AccomplishmentComment.created_at]
    column_default_sort = [(AccomplishmentComment.created_at, True)]

    can_create = False
    can_edit = True
    can_delete = True
    can_view_details = True


class AccomplishmentReactionAdmin(ModelView, model=AccomplishmentReaction):
    """Accomplishment Reaction admin view."""

    name = "Accomplishment Reaction"
    name_plural = "Accomplishment Reactions"
    icon = "fa-solid fa-heart"

    column_sortable_list = [AccomplishmentReaction.id, AccomplishmentReaction.created_at]
    column_default_sort = [(AccomplishmentReaction.created_at, True)]
    column_filters = [AccomplishmentReaction.reaction_type]

    can_create = False
    can_edit = False
    can_delete = True
    can_view_details = True


class ChallengeParticipationAdmin(ModelView, model=ChallengeParticipation):
    """Challenge Participation admin view."""

    name = "Challenge Participation"
    name_plural = "Challenge Participations"
    icon = "fa-solid fa-user-check"

    column_sortable_list = [ChallengeParticipation.id, ChallengeParticipation.joined_at]
    column_default_sort = [(ChallengeParticipation.joined_at, True)]
    column_filters = [ChallengeParticipation.is_completed]

    can_create = False
    can_edit = True
    can_delete = True
    can_view_details = True


class AppAdmin(ModelView, model=MarketplaceApp):
    """Marketplace App admin view."""

    name = "Marketplace App"
    name_plural = "Marketplace Apps"
    icon = "fa-solid fa-store"

    column_searchable_list = [MarketplaceApp.name, MarketplaceApp.description]
    column_sortable_list = [MarketplaceApp.id, MarketplaceApp.created_at]
    column_default_sort = [(MarketplaceApp.created_at, True)]
    column_filters = [MarketplaceApp.publish_status, MarketplaceApp.is_official, MarketplaceApp.is_featured]

    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True


class AppInstallationAdmin(ModelView, model=MarketplaceAppInstallation):
    """Marketplace App Installation admin view."""

    name = "Marketplace App Installation"
    name_plural = "Marketplace App Installations"
    icon = "fa-solid fa-download"

    column_sortable_list = [MarketplaceAppInstallation.id, MarketplaceAppInstallation.installed_at]
    column_default_sort = [(MarketplaceAppInstallation.installed_at, True)]
    column_filters = [MarketplaceAppInstallation.is_active]

    can_create = False
    can_edit = True
    can_delete = True
    can_view_details = True


class AppReviewAdmin(ModelView, model=MarketplaceAppReview):
    """App Review admin view."""

    name = "App Review"
    name_plural = "App Reviews"
    icon = "fa-solid fa-star"

    column_sortable_list = [MarketplaceAppReview.id, MarketplaceAppReview.created_at]
    column_default_sort = [(MarketplaceAppReview.created_at, True)]
    column_filters = [MarketplaceAppReview.rating]

    can_create = False
    can_edit = True
    can_delete = True
    can_view_details = True


class AppCategoryAdmin(ModelView, model=MarketplaceAppCategory):
    """App Category admin view."""

    name = "App Category"
    name_plural = "App Categories"
    icon = "fa-solid fa-tags"

    column_searchable_list = [MarketplaceAppCategory.name, MarketplaceAppCategory.description]
    column_sortable_list = [MarketplaceAppCategory.id]

    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True


class AppCollectionAdmin(ModelView, model=MarketplaceAppCollection):
    """App Collection admin view."""

    name = "App Collection"
    name_plural = "App Collections"
    icon = "fa-solid fa-folder"

    column_searchable_list = [MarketplaceAppCollection.name, MarketplaceAppCollection.description]
    column_sortable_list = [MarketplaceAppCollection.id, MarketplaceAppCollection.created_at]
    column_default_sort = [(MarketplaceAppCollection.created_at, True)]

    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True


class UserSessionAdmin(ModelView, model=UserSession):
    """User Session admin view."""

    name = "User Session"
    name_plural = "User Sessions"
    icon = "fa-solid fa-clock"

    column_sortable_list = [UserSession.id, UserSession.created_at]
    column_default_sort = [(UserSession.created_at, True)]

    can_create = False
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
    # Users & Sessions
    admin.add_view(UserAdmin)
    admin.add_view(UserSessionAdmin)

    # Goals & Progress
    admin.add_view(GoalAdmin)
    admin.add_view(ProgressEntryAdmin)
    admin.add_view(ReminderAdmin)

    # Conversations & Messages
    admin.add_view(ConversationAdmin)
    admin.add_view(MessageAdmin)
    admin.add_view(AgentMemoryAdmin)

    # Data Sources & Records
    admin.add_view(DataSourceAdmin)
    admin.add_view(DataRecordAdmin)
    admin.add_view(SyncHistoryAdmin)

    # Community
    admin.add_view(AccomplishmentAdmin)
    admin.add_view(AccomplishmentCommentAdmin)
    admin.add_view(AccomplishmentReactionAdmin)
    admin.add_view(UserConnectionAdmin)
    admin.add_view(ChallengeAdmin)
    admin.add_view(ChallengeParticipationAdmin)

    # Apps Marketplace
    admin.add_view(AppAdmin)
    admin.add_view(AppInstallationAdmin)
    admin.add_view(AppReviewAdmin)
    admin.add_view(AppCategoryAdmin)
    admin.add_view(AppCollectionAdmin)

    return admin
