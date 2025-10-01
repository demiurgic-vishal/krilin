"""
Community features API endpoints.
Handles accomplishment sharing and social features from ideas.txt.
"make people feel they accomplished something share it with their community"
"""
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from app.dependencies import CurrentUserDep, DatabaseDep
from app.models.community import (
    Accomplishment,
    AccomplishmentComment,
    AccomplishmentReaction,
    AccomplishmentType,
    ChallengeParticipation,
    CommunityChallenge,
    UserConnection,
)
from app.schemas.community import (
    AccomplishmentCreate,
    AccomplishmentResponse,
    AccomplishmentUpdate,
    ChallengeCreate,
    ChallengeParticipationCreate,
    ChallengeParticipationResponse,
    ChallengeParticipationUpdate,
    ChallengeResponse,
    CommentCreate,
    CommentResponse,
    ConnectionCreate,
    ConnectionResponse,
    ReactionCreate,
    ReactionResponse,
)

router = APIRouter()


# ========== Accomplishments ==========

@router.get("/accomplishments", response_model=list[AccomplishmentResponse])
async def list_accomplishments(
    current_user: CurrentUserDep,
    db: DatabaseDep,
    accomplishment_type: Optional[AccomplishmentType] = None,
    user_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0
) -> Any:
    """
    List community accomplishments feed.
    """
    # Get user's connections to filter feed
    conn_result = await db.execute(
        select(UserConnection.following_id).where(
            UserConnection.follower_id == current_user.id,
            UserConnection.is_blocked == False
        )
    )
    following_ids = [row[0] for row in conn_result.all()]
    following_ids.append(current_user.id)

    query = select(Accomplishment).where(
        or_(
            Accomplishment.user_id.in_(following_ids),
            Accomplishment.visibility == "public"
        )
    ).order_by(Accomplishment.accomplished_at.desc())

    if accomplishment_type:
        query = query.where(Accomplishment.accomplishment_type == accomplishment_type)

    if user_id:
        query = query.where(Accomplishment.user_id == user_id)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    accomplishments = result.scalars().all()

    return [AccomplishmentResponse.from_orm(a) for a in accomplishments]


@router.post("/accomplishments", response_model=AccomplishmentResponse, status_code=status.HTTP_201_CREATED)
async def share_accomplishment(
    accomplishment_data: AccomplishmentCreate,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """Share a new accomplishment with the community."""
    accomplishment = Accomplishment(
        user_id=current_user.id,
        goal_id=accomplishment_data.goal_id,
        title=accomplishment_data.title,
        description=accomplishment_data.description,
        accomplishment_type=accomplishment_data.accomplishment_type,
        metrics=accomplishment_data.metrics,
        evidence=accomplishment_data.evidence,
        visibility=accomplishment_data.visibility,
        accomplished_at=accomplishment_data.accomplished_at
    )

    db.add(accomplishment)
    await db.commit()
    await db.refresh(accomplishment)

    return AccomplishmentResponse.from_orm(accomplishment)


@router.get("/accomplishments/{accomplishment_id}", response_model=AccomplishmentResponse)
async def get_accomplishment(
    accomplishment_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """Get a specific accomplishment."""
    result = await db.execute(
        select(Accomplishment).where(Accomplishment.id == accomplishment_id)
    )
    accomplishment = result.scalar_one_or_none()

    if not accomplishment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Accomplishment not found"
        )

    if accomplishment.visibility == "private" and accomplishment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Accomplishment not found"
        )

    accomplishment.view_count += 1
    await db.commit()

    return AccomplishmentResponse.from_orm(accomplishment)


@router.patch("/accomplishments/{accomplishment_id}", response_model=AccomplishmentResponse)
async def update_accomplishment(
    accomplishment_id: int,
    accomplishment_update: AccomplishmentUpdate,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """Update an accomplishment."""
    result = await db.execute(
        select(Accomplishment).where(
            Accomplishment.id == accomplishment_id,
            Accomplishment.user_id == current_user.id
        )
    )
    accomplishment = result.scalar_one_or_none()

    if not accomplishment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Accomplishment not found"
        )

    update_data = accomplishment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(accomplishment, field, value)

    await db.commit()
    await db.refresh(accomplishment)

    return AccomplishmentResponse.from_orm(accomplishment)


@router.delete("/accomplishments/{accomplishment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_accomplishment(
    accomplishment_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> None:
    """Delete an accomplishment."""
    result = await db.execute(
        select(Accomplishment).where(
            Accomplishment.id == accomplishment_id,
            Accomplishment.user_id == current_user.id
        )
    )
    accomplishment = result.scalar_one_or_none()

    if not accomplishment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Accomplishment not found"
        )

    await db.delete(accomplishment)
    await db.commit()


# ========== Reactions ==========

@router.post("/accomplishments/{accomplishment_id}/reactions", response_model=ReactionResponse, status_code=status.HTTP_201_CREATED)
async def add_reaction(
    accomplishment_id: int,
    reaction_data: ReactionCreate,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """Add a reaction to an accomplishment."""
    acc_result = await db.execute(
        select(Accomplishment).where(Accomplishment.id == accomplishment_id)
    )
    accomplishment = acc_result.scalar_one_or_none()

    if not accomplishment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Accomplishment not found"
        )

    existing_result = await db.execute(
        select(AccomplishmentReaction).where(
            AccomplishmentReaction.accomplishment_id == accomplishment_id,
            AccomplishmentReaction.user_id == current_user.id
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        existing.reaction_type = reaction_data.reaction_type
        await db.commit()
        await db.refresh(existing)
        return ReactionResponse.from_orm(existing)

    reaction = AccomplishmentReaction(
        accomplishment_id=accomplishment_id,
        user_id=current_user.id,
        reaction_type=reaction_data.reaction_type
    )

    db.add(reaction)
    accomplishment.reaction_count += 1
    await db.commit()
    await db.refresh(reaction)

    return ReactionResponse.from_orm(reaction)


@router.delete("/accomplishments/{accomplishment_id}/reactions", status_code=status.HTTP_204_NO_CONTENT)
async def remove_reaction(
    accomplishment_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> None:
    """Remove user's reaction from an accomplishment."""
    result = await db.execute(
        select(AccomplishmentReaction).where(
            AccomplishmentReaction.accomplishment_id == accomplishment_id,
            AccomplishmentReaction.user_id == current_user.id
        )
    )
    reaction = result.scalar_one_or_none()

    if reaction:
        acc_result = await db.execute(
            select(Accomplishment).where(Accomplishment.id == accomplishment_id)
        )
        accomplishment = acc_result.scalar_one_or_none()
        if accomplishment:
            accomplishment.reaction_count = max(0, accomplishment.reaction_count - 1)

        await db.delete(reaction)
        await db.commit()


# ========== Comments ==========

@router.get("/accomplishments/{accomplishment_id}/comments", response_model=list[CommentResponse])
async def get_comments(
    accomplishment_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep,
    limit: int = 100,
    offset: int = 0
) -> Any:
    """Get comments for an accomplishment."""
    query = select(AccomplishmentComment).where(
        AccomplishmentComment.accomplishment_id == accomplishment_id
    ).order_by(AccomplishmentComment.created_at.asc())

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    comments = result.scalars().all()

    return [CommentResponse.from_orm(c) for c in comments]


@router.post("/accomplishments/{accomplishment_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def add_comment(
    accomplishment_id: int,
    comment_data: CommentCreate,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """Add a comment to an accomplishment."""
    acc_result = await db.execute(
        select(Accomplishment).where(Accomplishment.id == accomplishment_id)
    )
    accomplishment = acc_result.scalar_one_or_none()

    if not accomplishment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Accomplishment not found"
        )

    comment = AccomplishmentComment(
        accomplishment_id=accomplishment_id,
        user_id=current_user.id,
        parent_comment_id=comment_data.parent_comment_id,
        content=comment_data.content
    )

    db.add(comment)
    accomplishment.comment_count += 1
    await db.commit()
    await db.refresh(comment)

    return CommentResponse.from_orm(comment)


# ========== Connections ==========

@router.get("/connections", response_model=list[ConnectionResponse])
async def list_connections(
    current_user: CurrentUserDep,
    db: DatabaseDep,
    connection_type: Optional[str] = None
) -> Any:
    """List user's connections."""
    query = select(UserConnection).where(
        UserConnection.follower_id == current_user.id
    )

    if connection_type:
        query = query.where(UserConnection.connection_type == connection_type)

    result = await db.execute(query)
    connections = result.scalars().all()

    return [ConnectionResponse.from_orm(c) for c in connections]


@router.post("/connections", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
async def create_connection(
    connection_data: ConnectionCreate,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """Follow or connect with another user."""
    if connection_data.following_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot connect to yourself"
        )

    result = await db.execute(
        select(UserConnection).where(
            UserConnection.follower_id == current_user.id,
            UserConnection.following_id == connection_data.following_id
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Connection already exists"
        )

    connection = UserConnection(
        follower_id=current_user.id,
        following_id=connection_data.following_id,
        connection_type=connection_data.connection_type
    )

    reverse_result = await db.execute(
        select(UserConnection).where(
            UserConnection.follower_id == connection_data.following_id,
            UserConnection.following_id == current_user.id
        )
    )
    reverse = reverse_result.scalar_one_or_none()

    if reverse:
        connection.is_mutual = True
        reverse.is_mutual = True

    db.add(connection)
    await db.commit()
    await db.refresh(connection)

    return ConnectionResponse.from_orm(connection)


@router.delete("/connections/{following_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_connection(
    following_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> None:
    """Unfollow or disconnect from a user."""
    result = await db.execute(
        select(UserConnection).where(
            UserConnection.follower_id == current_user.id,
            UserConnection.following_id == following_id
        )
    )
    connection = result.scalar_one_or_none()

    if connection:
        await db.delete(connection)

        reverse_result = await db.execute(
            select(UserConnection).where(
                UserConnection.follower_id == following_id,
                UserConnection.following_id == current_user.id
            )
        )
        reverse = reverse_result.scalar_one_or_none()
        if reverse:
            reverse.is_mutual = False

        await db.commit()


# ========== Challenges ==========

@router.get("/challenges", response_model=list[ChallengeResponse])
async def list_challenges(
    db: DatabaseDep,
    category: Optional[str] = None,
    is_active: bool = True,
    limit: int = 50,
    offset: int = 0
) -> Any:
    """List community challenges."""
    query = select(CommunityChallenge).where(
        CommunityChallenge.is_active == is_active
    ).order_by(CommunityChallenge.start_date.desc())

    if category:
        query = query.where(CommunityChallenge.category == category)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    challenges = result.scalars().all()

    return [ChallengeResponse.from_orm(c) for c in challenges]


@router.get("/challenges/{challenge_id}", response_model=ChallengeResponse)
async def get_challenge(
    challenge_id: int,
    db: DatabaseDep
) -> Any:
    """Get a specific challenge."""
    result = await db.execute(
        select(CommunityChallenge).where(CommunityChallenge.id == challenge_id)
    )
    challenge = result.scalar_one_or_none()

    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found"
        )

    return ChallengeResponse.from_orm(challenge)


@router.post("/challenges/{challenge_id}/join", response_model=ChallengeParticipationResponse, status_code=status.HTTP_201_CREATED)
async def join_challenge(
    challenge_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """Join a community challenge."""
    challenge_result = await db.execute(
        select(CommunityChallenge).where(CommunityChallenge.id == challenge_id)
    )
    challenge = challenge_result.scalar_one_or_none()

    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found"
        )

    if not challenge.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Challenge is not active"
        )

    existing_result = await db.execute(
        select(ChallengeParticipation).where(
            ChallengeParticipation.challenge_id == challenge_id,
            ChallengeParticipation.user_id == current_user.id
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already participating in this challenge"
        )

    participation = ChallengeParticipation(
        challenge_id=challenge_id,
        user_id=current_user.id
    )

    db.add(participation)
    challenge.participant_count += 1
    await db.commit()
    await db.refresh(participation)

    return ChallengeParticipationResponse.from_orm(participation)


@router.get("/challenges/{challenge_id}/participation", response_model=ChallengeParticipationResponse)
async def get_challenge_participation(
    challenge_id: int,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """Get user's participation in a challenge."""
    result = await db.execute(
        select(ChallengeParticipation).where(
            ChallengeParticipation.challenge_id == challenge_id,
            ChallengeParticipation.user_id == current_user.id
        )
    )
    participation = result.scalar_one_or_none()

    if not participation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not participating in this challenge"
        )

    return ChallengeParticipationResponse.from_orm(participation)


@router.patch("/challenges/{challenge_id}/participation", response_model=ChallengeParticipationResponse)
async def update_challenge_progress(
    challenge_id: int,
    progress_update: ChallengeParticipationUpdate,
    current_user: CurrentUserDep,
    db: DatabaseDep
) -> Any:
    """Update progress in a challenge."""
    result = await db.execute(
        select(ChallengeParticipation).where(
            ChallengeParticipation.challenge_id == challenge_id,
            ChallengeParticipation.user_id == current_user.id
        )
    )
    participation = result.scalar_one_or_none()

    if not participation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not participating in this challenge"
        )

    participation.progress.update(progress_update.progress)

    if progress_update.completion_proof:
        participation.completion_proof = progress_update.completion_proof
        participation.is_completed = True
        participation.completed_at = datetime.utcnow()

        challenge_result = await db.execute(
            select(CommunityChallenge).where(CommunityChallenge.id == challenge_id)
        )
        challenge = challenge_result.scalar_one_or_none()
        if challenge:
            challenge.completion_count += 1

    await db.commit()
    await db.refresh(participation)

    return ChallengeParticipationResponse.from_orm(participation)
