"""
Streams API - ctx.streams implementation.

Provides real-time pub/sub communication:
- ctx.streams.publish(stream_id, data) - Publish event to stream
- ctx.streams.subscribe(stream_id, callback) - Subscribe to stream
- ctx.streams.create_stream(stream_id, schema) - Create new stream
- ctx.streams.list_streams() - List available streams

Uses Redis pub/sub for real-time event distribution.
"""
import json
import logging
import asyncio
from typing import Any, Dict, Optional, Callable, AsyncIterator

logger = logging.getLogger(__name__)


class StreamsAPI:
    """
    Streams API for real-time pub/sub communication.

    Available via ctx.streams in any app.

    Uses Redis pub/sub for event distribution:
    - Stream keys: `stream:{user_id}:{stream_id}`
    - User-scoped streams for privacy
    - Cross-app communication
    """

    def __init__(self, user_id: int, app_id: str):
        self.user_id = user_id
        self.app_id = app_id
        self._redis = None  # Will be lazily initialized

    def _get_redis(self):
        """Get Redis client (lazy initialization)."""
        if self._redis is None:
            import redis.asyncio as redis
            from app.config import settings

            # Get Redis URL from settings
            redis_url = getattr(settings, "redis_url", "redis://localhost:6379")
            self._redis = redis.from_url(redis_url, decode_responses=True)

        return self._redis

    def _get_stream_key(self, stream_id: str) -> str:
        """
        Get Redis key for a stream.

        Streams are scoped to user for privacy:
        - Format: stream:{user_id}:{stream_id}

        Example: stream:1:habit_completed
        """
        return f"stream:{self.user_id}:{stream_id}"

    async def publish(self, stream_id: str, data: Dict[str, Any]) -> bool:
        """
        Publish an event to a stream.

        Args:
            stream_id: Stream identifier
            data: Event data (must be JSON-serializable)

        Returns:
            True if published successfully

        Example:
            # In Habit Tracker app
            await ctx.streams.publish("habit_completed", {
                "habit_id": "habit_123",
                "completed_at": ctx.now().isoformat(),
                "streak": 7
            })

            # Other apps subscribed to this stream will receive the event
        """
        try:
            redis = self._get_redis()

            # Add metadata
            event = {
                "stream_id": stream_id,
                "app_id": self.app_id,
                "user_id": self.user_id,
                "data": data,
                "timestamp": asyncio.get_event_loop().time()
            }

            # Publish to Redis channel
            stream_key = self._get_stream_key(stream_id)
            await redis.publish(stream_key, json.dumps(event))

            logger.debug(
                f"[STREAMS] Published to {stream_id} by app {self.app_id}"
            )

            return True

        except Exception as e:
            logger.error(f"[STREAMS] Failed to publish to {stream_id}: {e}")
            return False

    async def subscribe(
        self,
        stream_id: str,
        callback: Optional[Callable[[Dict[str, Any]], None]] = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Subscribe to a stream.

        Can be used in two ways:
        1. With async iteration (for streaming)
        2. With callback function

        Args:
            stream_id: Stream identifier
            callback: Optional callback function

        Yields:
            Event data

        Example 1 - Async iteration:
            async for event in ctx.streams.subscribe("habit_completed"):
                print(f"Habit completed: {event['data']['habit_id']}")
                # Process event...

        Example 2 - Callback:
            def handle_habit_completed(event):
                print(f"Habit: {event['data']['habit_id']}")

            await ctx.streams.subscribe("habit_completed", handle_habit_completed)
        """
        try:
            redis = self._get_redis()

            # Subscribe to Redis channel
            stream_key = self._get_stream_key(stream_id)
            pubsub = redis.pubsub()

            await pubsub.subscribe(stream_key)

            logger.info(
                f"[STREAMS] App {self.app_id} subscribed to {stream_id}"
            )

            # Listen for messages
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        event = json.loads(message["data"])

                        # Call callback if provided
                        if callback:
                            if asyncio.iscoroutinefunction(callback):
                                await callback(event)
                            else:
                                callback(event)

                        # Yield event for async iteration
                        yield event

                    except json.JSONDecodeError:
                        logger.error(f"[STREAMS] Invalid JSON in stream {stream_id}")

        except Exception as e:
            logger.error(f"[STREAMS] Error subscribing to {stream_id}: {e}")

        finally:
            # Cleanup
            if pubsub:
                await pubsub.unsubscribe(stream_key)
                await pubsub.close()

    async def create_stream(
        self,
        stream_id: str,
        schema: Optional[Dict[str, str]] = None,
        description: Optional[str] = None
    ) -> bool:
        """
        Create/register a new stream.

        Stores stream metadata in Redis for discovery.

        Args:
            stream_id: Stream identifier
            schema: Event schema (field -> type mapping)
            description: Stream description

        Returns:
            True if created successfully

        Example:
            await ctx.streams.create_stream(
                "habit_completed",
                schema={
                    "habit_id": "string",
                    "completed_at": "datetime",
                    "streak": "number"
                },
                description="Emitted when a habit is completed"
            )
        """
        try:
            redis = self._get_redis()

            # Store stream metadata
            metadata_key = f"stream_meta:{self.user_id}:{stream_id}"

            metadata = {
                "stream_id": stream_id,
                "app_id": self.app_id,  # App that created the stream
                "schema": schema or {},
                "description": description or "",
                "created_at": asyncio.get_event_loop().time()
            }

            await redis.set(metadata_key, json.dumps(metadata))

            logger.info(
                f"[STREAMS] Created stream {stream_id} by app {self.app_id}"
            )

            return True

        except Exception as e:
            logger.error(f"[STREAMS] Failed to create stream {stream_id}: {e}")
            return False

    async def list_streams(self) -> list[Dict[str, Any]]:
        """
        List all streams for current user.

        Returns:
            List of stream metadata

        Example:
            streams = await ctx.streams.list_streams()
            for stream in streams:
                print(f"{stream['stream_id']}: {stream['description']}")
        """
        try:
            redis = self._get_redis()

            # Get all stream metadata keys for user
            pattern = f"stream_meta:{self.user_id}:*"
            keys = await redis.keys(pattern)

            streams = []

            for key in keys:
                metadata_json = await redis.get(key)
                if metadata_json:
                    metadata = json.loads(metadata_json)
                    streams.append(metadata)

            return streams

        except Exception as e:
            logger.error(f"[STREAMS] Failed to list streams: {e}")
            return []

    async def delete_stream(self, stream_id: str) -> bool:
        """
        Delete a stream.

        Only the app that created the stream can delete it.

        Args:
            stream_id: Stream identifier

        Returns:
            True if deleted successfully
        """
        try:
            redis = self._get_redis()

            # Get stream metadata
            metadata_key = f"stream_meta:{self.user_id}:{stream_id}"
            metadata_json = await redis.get(metadata_key)

            if not metadata_json:
                return False

            metadata = json.loads(metadata_json)

            # Check if current app created the stream
            if metadata["app_id"] != self.app_id:
                logger.warning(
                    f"[STREAMS] App {self.app_id} cannot delete stream {stream_id} "
                    f"(created by {metadata['app_id']})"
                )
                return False

            # Delete metadata
            await redis.delete(metadata_key)

            logger.info(
                f"[STREAMS] Deleted stream {stream_id} by app {self.app_id}"
            )

            return True

        except Exception as e:
            logger.error(f"[STREAMS] Failed to delete stream {stream_id}: {e}")
            return False

    async def get_stream_info(self, stream_id: str) -> Optional[Dict[str, Any]]:
        """
        Get stream metadata.

        Args:
            stream_id: Stream identifier

        Returns:
            Stream metadata or None

        Example:
            info = await ctx.streams.get_stream_info("habit_completed")
            print(f"Schema: {info['schema']}")
        """
        try:
            redis = self._get_redis()

            metadata_key = f"stream_meta:{self.user_id}:{stream_id}"
            metadata_json = await redis.get(metadata_key)

            if metadata_json:
                return json.loads(metadata_json)

            return None

        except Exception as e:
            logger.error(f"[STREAMS] Failed to get stream info: {e}")
            return None
