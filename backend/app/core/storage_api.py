"""
Storage API - ctx.storage implementation.

Provides database operations with automatic user scoping:
- ctx.storage.query(table, options) - Query app's tables
- ctx.storage.find_one(table, where) - Find single record
- ctx.storage.insert(table, data) - Create record
- ctx.storage.update(table, id, data) - Update record
- ctx.storage.delete(table, id) - Delete record
- ctx.storage.count(table, where) - Count records

All operations are automatically scoped to the current user.
Table names are automatically prefixed: app_{app_id}_{table_name}
"""
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

from sqlalchemy import select, insert, update, delete, func, text, Table, MetaData, Column, Integer, String, DateTime, JSON
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class StorageAPI:
    """
    Storage API for app database operations.

    All operations are scoped to the current user automatically.
    Apps cannot access other users' data.
    """

    def __init__(self, db: AsyncSession, user_id: int, app_id: str):
        self.db = db
        self.user_id = user_id
        self.app_id = app_id
        self.metadata = MetaData()

    def _get_full_table_name(self, table_name: str) -> str:
        """Get full table name with app prefix."""
        # Replace hyphens with underscores for SQL compatibility
        safe_app_id = self.app_id.replace("-", "_")
        return f"app_{safe_app_id}_{table_name}"

    def _get_table_reference(self, table_name: str) -> Table:
        """
        Get SQLAlchemy Table reference for dynamic table.

        For now, we use raw SQL. In the future, we can improve this
        to use proper SQLAlchemy Table objects with reflection.
        """
        full_table_name = self._get_full_table_name(table_name)
        # Create a simple table reference for now
        # In production, we'd reflect the actual schema
        table = Table(
            full_table_name,
            self.metadata,
            Column('id', String, primary_key=True),
            Column('user_id', Integer),
            Column('data', JSON),
            Column('created_at', DateTime(timezone=True)),
            Column('updated_at', DateTime(timezone=True)),
            extend_existing=True
        )
        return table

    async def query(
        self,
        table: str,
        where: Optional[Dict[str, Any]] = None,
        order_by: Optional[Dict[str, str]] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        select_fields: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Query records from app table.

        Args:
            table: Table name (without app prefix)
            where: Filter conditions (field: value pairs)
            order_by: Sort order (field: "asc" or "desc")
            limit: Maximum number of records
            offset: Number of records to skip
            select_fields: Specific fields to select (default: all)

        Returns:
            List of records as dictionaries

        Example:
            habits = await ctx.storage.query(
                "habits",
                where={"active": True},
                order_by={"created_at": "desc"},
                limit=10
            )
        """
        full_table_name = self._get_full_table_name(table)

        # Build SELECT clause
        select_clause = ", ".join(select_fields) if select_fields else "*"

        # Build WHERE clause (always include user_id for security)
        where_clauses = [f"user_id = {self.user_id}"]
        params = {}

        if where:
            # System fields that are actual columns (not in JSONB)
            system_fields = ["id", "user_id", "created_at", "updated_at"]

            for i, (field, value) in enumerate(where.items()):
                param_name = f"where_{i}"

                # Check if this is a system field (actual column) or app data (JSONB)
                if field in system_fields:
                    # Direct column query
                    where_clauses.append(f"{field} = :{param_name}")
                    params[param_name] = value
                else:
                    # JSON field query
                    # Handle nested fields with dot notation
                    if "." in field:
                        json_field = field.split(".", 1)[1]
                    else:
                        json_field = field

                    # For booleans, use jsonb -> operator (returns jsonb) instead of ->> (returns text)
                    if isinstance(value, bool):
                        where_clauses.append(f"(data->'{json_field}')::boolean = :{param_name}")
                        params[param_name] = value
                    elif isinstance(value, (int, float)):
                        # For numbers, cast the jsonb value to numeric
                        where_clauses.append(f"(data->>'{json_field}')::numeric = :{param_name}")
                        params[param_name] = value
                    else:
                        # For strings and everything else, use ->> (returns text)
                        where_clauses.append(f"data->>'{json_field}' = :{param_name}")
                        params[param_name] = str(value)

        where_sql = " AND ".join(where_clauses)

        # Build ORDER BY clause
        order_sql = ""
        if order_by:
            system_fields = ["id", "user_id", "created_at", "updated_at"]
            order_parts = []
            for field, direction in order_by.items():
                dir_sql = "ASC" if direction.lower() == "asc" else "DESC"

                # Check if system field or JSONB field
                if field in system_fields:
                    # Direct column
                    order_parts.append(f"{field} {dir_sql}")
                else:
                    # JSONB field
                    if "." in field:
                        json_field = field.split(".", 1)[1]
                    else:
                        json_field = field
                    order_parts.append(f"data->>'{json_field}' {dir_sql}")
            order_sql = "ORDER BY " + ", ".join(order_parts)

        # Build LIMIT/OFFSET
        limit_sql = f"LIMIT {limit}" if limit else ""
        offset_sql = f"OFFSET {offset}" if offset else ""

        # Execute query
        query_sql = f"""
            SELECT {select_clause}
            FROM {full_table_name}
            WHERE {where_sql}
            {order_sql}
            {limit_sql}
            {offset_sql}
        """

        result = await self.db.execute(text(query_sql), params)
        rows = result.mappings().all()

        logger.debug(f"[STORAGE] Query {table}: {len(rows)} records")

        # Flatten JSONB data into records
        records = []
        for row in rows:
            record = dict(row)
            # If data field exists and is a dict, merge it into the record
            if "data" in record and isinstance(record["data"], dict):
                record.update(record["data"])
                del record["data"]
            records.append(record)

        return records

    async def find_one(
        self,
        table: str,
        where: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Find a single record.

        Args:
            table: Table name
            where: Filter conditions

        Returns:
            Record dictionary or None

        Example:
            habit = await ctx.storage.find_one("habits", {"id": "habit_123"})
        """
        results = await self.query(table, where=where, limit=1)
        return results[0] if results else None

    async def insert(
        self,
        table: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Insert a new record.

        Automatically adds:
        - user_id (for scoping)
        - id (if not provided)
        - created_at, updated_at timestamps

        Args:
            table: Table name
            data: Record data

        Returns:
            Created record

        Example:
            habit = await ctx.storage.insert("habits", {
                "name": "Exercise",
                "frequency": "daily"
            })
        """
        import uuid

        full_table_name = self._get_full_table_name(table)

        # Ensure required fields
        if "id" not in data:
            data["id"] = str(uuid.uuid4())

        # Add user_id for scoping
        data["user_id"] = self.user_id

        # Add timestamps
        now = datetime.utcnow()
        data["created_at"] = now
        data["updated_at"] = now

        # Separate system fields from app data
        system_fields = ["id", "user_id", "created_at", "updated_at"]
        app_data = {k: v for k, v in data.items() if k not in system_fields}

        # Build INSERT
        insert_sql = f"""
            INSERT INTO {full_table_name} (id, user_id, data, created_at, updated_at)
            VALUES (:id, :user_id, :data, :created_at, :updated_at)
            RETURNING id, user_id, data, created_at, updated_at
        """

        import json as json_lib

        result = await self.db.execute(
            text(insert_sql),
            {
                "id": data["id"],
                "user_id": self.user_id,
                "data": json_lib.dumps(app_data),  # JSON-encode the data for JSONB column
                "created_at": data["created_at"],
                "updated_at": data["updated_at"]
            }
        )
        await self.db.commit()

        row = result.mappings().one()
        record = dict(row)

        # Flatten data into record
        if "data" in record and isinstance(record["data"], dict):
            record.update(record["data"])
            del record["data"]

        logger.info(f"[STORAGE] Inserted into {table}: {record['id']}")

        return record

    async def update(
        self,
        table: str,
        record_id: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update an existing record.

        Only updates records owned by current user.

        Args:
            table: Table name
            record_id: Record ID
            data: Fields to update

        Returns:
            Updated record

        Example:
            updated = await ctx.storage.update("habits", "habit_123", {
                "streak": 7
            })
        """
        full_table_name = self._get_full_table_name(table)

        # Get existing record to merge data
        existing = await self.find_one(table, {"id": record_id})
        if not existing:
            raise ValueError(f"Record {record_id} not found in {table}")

        # Merge new data
        system_fields = ["id", "user_id", "created_at", "updated_at"]
        existing_data = {k: v for k, v in existing.items() if k not in system_fields}
        existing_data.update(data)

        # Update timestamp
        now = datetime.utcnow()

        update_sql = f"""
            UPDATE {full_table_name}
            SET data = :data, updated_at = :updated_at
            WHERE id = :id AND user_id = :user_id
            RETURNING id, user_id, data, created_at, updated_at
        """

        import json as json_lib

        result = await self.db.execute(
            text(update_sql),
            {
                "id": record_id,
                "user_id": self.user_id,
                "data": json_lib.dumps(existing_data),  # JSON-encode the data for JSONB column
                "updated_at": now
            }
        )
        await self.db.commit()

        row = result.mappings().one()
        record = dict(row)

        # Flatten data
        if "data" in record and isinstance(record["data"], dict):
            record.update(record["data"])
            del record["data"]

        logger.info(f"[STORAGE] Updated {table}: {record_id}")

        return record

    async def delete(
        self,
        table: str,
        record_id: str
    ) -> bool:
        """
        Delete a record.

        Only deletes records owned by current user.

        Args:
            table: Table name
            record_id: Record ID

        Returns:
            True if deleted, False if not found

        Example:
            deleted = await ctx.storage.delete("habits", "habit_123")
        """
        full_table_name = self._get_full_table_name(table)

        delete_sql = f"""
            DELETE FROM {full_table_name}
            WHERE id = :id AND user_id = :user_id
        """

        result = await self.db.execute(
            text(delete_sql),
            {"id": record_id, "user_id": self.user_id}
        )
        await self.db.commit()

        deleted = result.rowcount > 0

        if deleted:
            logger.info(f"[STORAGE] Deleted from {table}: {record_id}")

        return deleted

    async def count(
        self,
        table: str,
        where: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Count records matching criteria.

        Args:
            table: Table name
            where: Filter conditions

        Returns:
            Record count

        Example:
            active_habits = await ctx.storage.count("habits", {"active": True})
        """
        full_table_name = self._get_full_table_name(table)

        # Build WHERE clause
        where_clauses = [f"user_id = {self.user_id}"]
        params = {}

        if where:
            for i, (field, value) in enumerate(where.items()):
                param_name = f"where_{i}"
                if "." in field:
                    json_field = field.split(".", 1)[1]
                    where_clauses.append(f"data->>'{json_field}' = :{param_name}")
                else:
                    where_clauses.append(f"{field} = :{param_name}")
                params[param_name] = value

        where_sql = " AND ".join(where_clauses)

        count_sql = f"""
            SELECT COUNT(*) as count
            FROM {full_table_name}
            WHERE {where_sql}
        """

        result = await self.db.execute(text(count_sql), params)
        row = result.mappings().one()

        return int(row["count"])
