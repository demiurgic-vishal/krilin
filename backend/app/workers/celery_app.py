"""
Celery configuration for background tasks.
Handles data sync, reminders, and AI analysis jobs.
"""
from celery import Celery
from celery.schedules import crontab

from app.config import settings

# Create Celery app
celery_app = Celery(
    "krilin_ai",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.tasks"]
)

# Configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=100,
)

# Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    "sync-all-data-sources": {
        "task": "app.workers.tasks.sync_all_data_sources",
        "schedule": 300.0,  # Every 5 minutes
    },
    "process-morning-reminders": {
        "task": "app.workers.tasks.process_morning_reminders",
        "schedule": crontab(hour=7, minute=0),  # 7:00 AM daily
    },
    "analyze-goal-progress": {
        "task": "app.workers.tasks.analyze_goal_progress",
        "schedule": crontab(hour=20, minute=0),  # 8:00 PM daily
    },
}