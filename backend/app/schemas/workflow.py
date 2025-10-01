"""
Workflow Pydantic schemas.
Supports AI-generated custom workflows and automation.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.workflow import ExecutionStatus, WorkflowStatus, WorkflowTrigger


class WorkflowBase(BaseModel):
    """Base workflow schema."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class WorkflowCreate(WorkflowBase):
    """Schema for creating workflows."""
    definition: dict = Field(..., description="Workflow steps and configuration")
    parameters: dict = Field(default_factory=dict)
    environment: dict = Field(default_factory=dict)
    trigger_type: WorkflowTrigger = "manual"
    trigger_config: dict = Field(default_factory=dict)
    schedule_cron: Optional[str] = None
    allowed_operations: list[str] = Field(default_factory=list)
    max_execution_time: int = Field(default=300, ge=1, le=3600)
    max_memory_mb: int = Field(default=512, ge=128, le=4096)
    created_by_agent: str = Field(..., description="Agent that created this workflow")


class WorkflowUpdate(BaseModel):
    """Schema for updating workflows."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    definition: Optional[dict] = None
    parameters: Optional[dict] = None
    environment: Optional[dict] = None
    trigger_type: Optional[WorkflowTrigger] = None
    trigger_config: Optional[dict] = None
    schedule_cron: Optional[str] = None
    status: Optional[WorkflowStatus] = None
    allowed_operations: Optional[list[str]] = None
    max_execution_time: Optional[int] = Field(None, ge=1, le=3600)
    max_memory_mb: Optional[int] = Field(None, ge=128, le=4096)


class WorkflowResponse(WorkflowBase):
    """Schema for workflow responses."""
    id: int
    user_id: int
    definition: dict
    parameters: dict
    environment: dict
    trigger_type: WorkflowTrigger
    trigger_config: dict
    schedule_cron: Optional[str] = None
    allowed_operations: list[str]
    max_execution_time: int
    max_memory_mb: int
    status: WorkflowStatus
    created_by_agent: str
    version: int
    execution_count: int
    success_count: int
    failure_count: int
    created_at: datetime
    updated_at: datetime
    last_execution_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WorkflowExecutionCreate(BaseModel):
    """Schema for triggering workflow execution."""
    trigger_source: str = Field(default="manual")
    trigger_data: dict = Field(default_factory=dict)


class WorkflowExecutionResponse(BaseModel):
    """Schema for workflow execution responses."""
    id: int
    workflow_id: int
    trigger_source: str
    trigger_data: dict
    status: ExecutionStatus
    progress_percentage: float
    results: dict
    outputs: dict
    logs: list
    error_message: Optional[str] = None
    error_details: Optional[dict] = None
    cpu_time_seconds: Optional[float] = None
    memory_peak_mb: Optional[float] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ExecutionStepResponse(BaseModel):
    """Schema for execution step responses."""
    id: int
    execution_id: int
    step_name: str
    step_type: str
    step_order: int
    config: dict
    inputs: dict
    status: ExecutionStatus
    outputs: dict
    logs: list
    error_message: Optional[str] = None
    retry_count: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WorkflowExecutionDetail(WorkflowExecutionResponse):
    """Schema for detailed execution with steps."""
    steps: list[ExecutionStepResponse] = Field(default_factory=list)


class WorkflowTemplateResponse(BaseModel):
    """Schema for workflow template responses."""
    id: int
    name: str
    description: str
    category: str
    template: dict
    parameters_schema: dict
    created_by_agent: str
    usage_count: int
    is_public: bool
    tags: list[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkflowFromTemplateCreate(BaseModel):
    """Schema for creating workflow from template."""
    template_id: int
    name: str = Field(..., min_length=1, max_length=255)
    parameters: dict = Field(..., description="Parameters for template instantiation")
