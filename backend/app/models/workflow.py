"""
Workflow models for customizable AI-generated workflows.
Supports code execution and file operations from ideas.txt.
"""
from datetime import datetime
from typing import Literal, Optional

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


WorkflowStatus = Literal["active", "paused", "completed", "failed", "draft"]
WorkflowTrigger = Literal["manual", "schedule", "event", "goal_progress", "data_change"]
ExecutionStatus = Literal["pending", "running", "completed", "failed", "cancelled"]


class Workflow(Base):
    """User workflows created by AI agents."""
    
    __tablename__ = "workflows"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Workflow definition
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    
    # Workflow configuration
    definition: Mapped[dict] = mapped_column(JSON)  # Steps, conditions, actions
    parameters: Mapped[dict] = mapped_column(JSON, default=dict)
    environment: Mapped[dict] = mapped_column(JSON, default=dict)  # Environment variables
    
    # Execution settings
    trigger_type: Mapped[WorkflowTrigger] = mapped_column(String(50), default="manual")
    trigger_config: Mapped[dict] = mapped_column(JSON, default=dict)
    schedule_cron: Mapped[Optional[str]] = mapped_column(String(100))
    
    # Permissions and security
    allowed_operations: Mapped[list[str]] = mapped_column(JSON, default=list)  # file_read, shell_exec, etc.
    max_execution_time: Mapped[int] = mapped_column(default=300)  # seconds
    max_memory_mb: Mapped[int] = mapped_column(default=512)
    
    # Metadata
    status: Mapped[WorkflowStatus] = mapped_column(String(20), default="draft")
    created_by_agent: Mapped[str] = mapped_column(String(50))  # Which agent created it
    version: Mapped[int] = mapped_column(default=1)
    
    # Statistics
    execution_count: Mapped[int] = mapped_column(default=0)
    success_count: Mapped[int] = mapped_column(default=0)
    failure_count: Mapped[int] = mapped_column(default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now()
    )
    last_execution_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="workflows")
    executions: Mapped[list["WorkflowExecution"]] = relationship(
        back_populates="workflow",
        cascade="all, delete-orphan",
        order_by="WorkflowExecution.started_at.desc()"
    )
    
    def __repr__(self) -> str:
        return f"<Workflow(id={self.id}, name='{self.name}', status='{self.status}')>"


class WorkflowExecution(Base):
    """Individual workflow execution instances."""
    
    __tablename__ = "workflow_executions"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workflow_id: Mapped[int] = mapped_column(ForeignKey("workflows.id"), index=True)
    
    # Execution metadata
    trigger_source: Mapped[str] = mapped_column(String(100))  # manual, schedule, event
    trigger_data: Mapped[dict] = mapped_column(JSON, default=dict)
    
    # Execution status
    status: Mapped[ExecutionStatus] = mapped_column(String(20), default="pending")
    progress_percentage: Mapped[float] = mapped_column(default=0.0)
    
    # Execution results
    results: Mapped[dict] = mapped_column(JSON, default=dict)
    outputs: Mapped[dict] = mapped_column(JSON, default=dict)
    logs: Mapped[list] = mapped_column(JSON, default=list)
    
    # Error information
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    error_details: Mapped[Optional[dict]] = mapped_column(JSON)
    
    # Resource usage
    cpu_time_seconds: Mapped[Optional[float]] = mapped_column()
    memory_peak_mb: Mapped[Optional[float]] = mapped_column()
    
    # Timing
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    duration_seconds: Mapped[Optional[float]] = mapped_column()
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    
    # Relationships
    workflow: Mapped[Workflow] = relationship(back_populates="executions")
    steps: Mapped[list["ExecutionStep"]] = relationship(
        back_populates="execution",
        cascade="all, delete-orphan",
        order_by="ExecutionStep.step_order"
    )
    
    def __repr__(self) -> str:
        return f"<WorkflowExecution(id={self.id}, status='{self.status}')>"


class ExecutionStep(Base):
    """Individual steps within a workflow execution."""
    
    __tablename__ = "execution_steps"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    execution_id: Mapped[int] = mapped_column(ForeignKey("workflow_executions.id"), index=True)
    
    # Step identification
    step_name: Mapped[str] = mapped_column(String(255))
    step_type: Mapped[str] = mapped_column(String(100))  # code_exec, file_op, api_call, etc.
    step_order: Mapped[int] = mapped_column()
    
    # Step configuration
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    inputs: Mapped[dict] = mapped_column(JSON, default=dict)
    
    # Execution results
    status: Mapped[ExecutionStatus] = mapped_column(String(20), default="pending")
    outputs: Mapped[dict] = mapped_column(JSON, default=dict)
    logs: Mapped[list] = mapped_column(JSON, default=list)
    
    # Error information
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    retry_count: Mapped[int] = mapped_column(default=0)
    
    # Timing
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    duration_seconds: Mapped[Optional[float]] = mapped_column()
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    
    # Relationships
    execution: Mapped[WorkflowExecution] = relationship(back_populates="steps")
    
    def __repr__(self) -> str:
        return f"<ExecutionStep(id={self.id}, name='{self.step_name}', status='{self.status}')>"


class WorkflowTemplate(Base):
    """Reusable workflow templates created by AI agents."""
    
    __tablename__ = "workflow_templates"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Template information
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(100), index=True)
    
    # Template definition
    template: Mapped[dict] = mapped_column(JSON)  # Parameterized workflow definition
    parameters_schema: Mapped[dict] = mapped_column(JSON)  # JSON Schema for parameters
    
    # Metadata
    created_by_agent: Mapped[str] = mapped_column(String(50))
    usage_count: Mapped[int] = mapped_column(default=0)
    is_public: Mapped[bool] = mapped_column(default=False)
    
    # Tags for discovery
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now()
    )
    
    def __repr__(self) -> str:
        return f"<WorkflowTemplate(id={self.id}, name='{self.name}')>"