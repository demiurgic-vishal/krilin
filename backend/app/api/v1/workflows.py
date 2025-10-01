"""
Workflow management API endpoints.
Handles AI-generated custom workflows and code execution.
Supports the workflow system from ideas.txt for automation.
"""
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies import CurrentUserDep, DatabaseDep
from app.models.workflow import (
    Workflow,
    WorkflowExecution,
    WorkflowStatus,
    WorkflowTemplate,
)
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowExecutionCreate,
    WorkflowExecutionDetail,
    WorkflowExecutionResponse,
    WorkflowFromTemplateCreate,
    WorkflowResponse,
    WorkflowTemplateResponse,
    WorkflowUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[WorkflowResponse])
async def list_workflows(
    current_user: CurrentUserDep,
    db: DatabaseDep,
    status: Optional[WorkflowStatus] = None,
    limit: int = 50,
    offset: int = 0
) -> Any:
    """
    List user's workflows.

    Args:
        current_user: Current authenticated user
        db: Database session
        status: Optional filter by workflow status
        limit: Number of workflows to return
        offset: Number of workflows to skip

    Returns:
        list[WorkflowResponse]: List of user's workflows
    """
    query = select(Workflow).where(
        Workflow.user_id == current_user.id
    ).order_by(Workflow.created_at.desc())

    if status:
        query = query.where(Workflow.status == status)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    workflows = result.scalars().all()

    return [WorkflowResponse.from_orm(wf) for wf in workflows]


@router.post("/", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow_data: WorkflowCreate,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Create a new workflow.

    Args:
        workflow_data: Workflow creation data
        current_user: Current authenticated user
        db: Database session

    Returns:
        WorkflowResponse: Created workflow
    """
    workflow = Workflow(
        user_id=current_user.id,
        name=workflow_data.name,
        description=workflow_data.description,
        definition=workflow_data.definition,
        parameters=workflow_data.parameters,
        environment=workflow_data.environment,
        trigger_type=workflow_data.trigger_type,
        trigger_config=workflow_data.trigger_config,
        schedule_cron=workflow_data.schedule_cron,
        allowed_operations=workflow_data.allowed_operations,
        max_execution_time=workflow_data.max_execution_time,
        max_memory_mb=workflow_data.max_memory_mb,
        created_by_agent=workflow_data.created_by_agent,
        status="draft"
    )

    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)

    return WorkflowResponse.from_orm(workflow)


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Get a specific workflow.

    Args:
        workflow_id: Workflow ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        WorkflowResponse: Workflow details

    Raises:
        HTTPException: If workflow not found or unauthorized
    """
    result = await db.execute(
        select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.user_id == current_user.id
        )
    )
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    return WorkflowResponse.from_orm(workflow)


@router.patch("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: int,
    workflow_update: WorkflowUpdate,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Update a workflow.

    Args:
        workflow_id: Workflow ID
        workflow_update: Fields to update
        current_user: Current authenticated user
        db: Database session

    Returns:
        WorkflowResponse: Updated workflow

    Raises:
        HTTPException: If workflow not found or unauthorized
    """
    result = await db.execute(
        select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.user_id == current_user.id
        )
    )
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    # Update fields
    update_data = workflow_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workflow, field, value)

    # Increment version if definition changed
    if workflow_update.definition is not None:
        workflow.version += 1

    await db.commit()
    await db.refresh(workflow)

    return WorkflowResponse.from_orm(workflow)


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> None:
    """
    Delete a workflow.

    Args:
        workflow_id: Workflow ID
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If workflow not found or unauthorized
    """
    result = await db.execute(
        select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.user_id == current_user.id
        )
    )
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    await db.delete(workflow)
    await db.commit()


@router.post("/{workflow_id}/execute", response_model=WorkflowExecutionResponse, status_code=status.HTTP_201_CREATED)
async def execute_workflow(
    workflow_id: int,
    execution_data: WorkflowExecutionCreate,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Execute a workflow.
    Creates an execution record and triggers background task.

    Args:
        workflow_id: Workflow ID
        execution_data: Execution trigger data
        current_user: Current authenticated user
        db: Database session

    Returns:
        WorkflowExecutionResponse: Execution details

    Raises:
        HTTPException: If workflow not found or unauthorized
    """
    # Get workflow
    result = await db.execute(
        select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.user_id == current_user.id
        )
    )
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    if workflow.status not in ["active", "draft"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot execute workflow with status: {workflow.status}"
        )

    # Create execution record
    execution = WorkflowExecution(
        workflow_id=workflow_id,
        trigger_source=execution_data.trigger_source,
        trigger_data=execution_data.trigger_data,
        status="pending",
        started_at=datetime.utcnow()
    )

    db.add(execution)

    # Update workflow stats
    workflow.execution_count += 1
    workflow.last_execution_at = datetime.utcnow()

    await db.commit()
    await db.refresh(execution)

    # TODO: Trigger Celery task for actual execution
    # from app.workers.tasks import execute_workflow_task
    # execute_workflow_task.delay(execution.id)

    return WorkflowExecutionResponse.from_orm(execution)


@router.get("/{workflow_id}/executions", response_model=list[WorkflowExecutionResponse])
async def get_execution_history(
    workflow_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep,
    limit: int = 50,
    offset: int = 0
) -> Any:
    """
    Get workflow execution history.

    Args:
        workflow_id: Workflow ID
        current_user: Current authenticated user
        db: Database session
        limit: Number of executions to return
        offset: Number of executions to skip

    Returns:
        list[WorkflowExecutionResponse]: Execution history

    Raises:
        HTTPException: If workflow not found or unauthorized
    """
    # Verify workflow ownership
    result = await db.execute(
        select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.user_id == current_user.id
        )
    )
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    # Get executions
    result = await db.execute(
        select(WorkflowExecution).where(
            WorkflowExecution.workflow_id == workflow_id
        ).order_by(WorkflowExecution.started_at.desc())
        .limit(limit).offset(offset)
    )
    executions = result.scalars().all()

    return [WorkflowExecutionResponse.from_orm(ex) for ex in executions]


@router.get("/executions/{execution_id}", response_model=WorkflowExecutionDetail)
async def get_execution_detail(
    execution_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Get detailed execution information with steps.

    Args:
        execution_id: Execution ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        WorkflowExecutionDetail: Detailed execution info

    Raises:
        HTTPException: If execution not found or unauthorized
    """
    result = await db.execute(
        select(WorkflowExecution).where(
            WorkflowExecution.id == execution_id
        ).options(
            selectinload(WorkflowExecution.workflow),
            selectinload(WorkflowExecution.steps)
        )
    )
    execution = result.scalar_one_or_none()

    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )

    # Verify ownership through workflow
    if execution.workflow.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )

    return WorkflowExecutionDetail.from_orm(execution)


@router.get("/templates/", response_model=list[WorkflowTemplateResponse])
async def list_templates(
    db: DatabaseDep,
    category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> Any:
    """
    List available workflow templates.

    Args:
        db: Database session
        category: Optional filter by category
        limit: Number of templates to return
        offset: Number of templates to skip

    Returns:
        list[WorkflowTemplateResponse]: Available templates
    """
    query = select(WorkflowTemplate).where(
        WorkflowTemplate.is_public == True
    ).order_by(WorkflowTemplate.usage_count.desc())

    if category:
        query = query.where(WorkflowTemplate.category == category)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    templates = result.scalars().all()

    return [WorkflowTemplateResponse.from_orm(t) for t in templates]


@router.post("/from-template", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow_from_template(
    template_data: WorkflowFromTemplateCreate,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """
    Create a workflow from a template.

    Args:
        template_data: Template instantiation data
        current_user: Current authenticated user
        db: Database session

    Returns:
        WorkflowResponse: Created workflow

    Raises:
        HTTPException: If template not found
    """
    # Get template
    result = await db.execute(
        select(WorkflowTemplate).where(
            WorkflowTemplate.id == template_data.template_id,
            WorkflowTemplate.is_public == True
        )
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Create workflow from template
    workflow_def = _instantiate_template(template.template, template_data.parameters)

    workflow = Workflow(
        user_id=current_user.id,
        name=template_data.name,
        description=template.description,
        definition=workflow_def,
        parameters=template_data.parameters,
        environment={},
        trigger_type="manual",
        trigger_config={},
        allowed_operations=[],
        created_by_agent=template.created_by_agent,
        status="active"
    )

    db.add(workflow)

    # Update template usage count
    template.usage_count += 1

    await db.commit()
    await db.refresh(workflow)

    return WorkflowResponse.from_orm(workflow)


def _instantiate_template(template: dict, parameters: dict) -> dict:
    """
    Instantiate a workflow template with user parameters.

    Args:
        template: Template definition
        parameters: User-provided parameters

    Returns:
        dict: Instantiated workflow definition
    """
    # Simple implementation - in real system would do template variable replacement
    workflow_def = template.copy()
    workflow_def["parameters"] = parameters
    return workflow_def
