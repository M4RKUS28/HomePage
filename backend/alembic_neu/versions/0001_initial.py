"""Initial schema – all tables.

Revision ID: 0001_initial
Revises:
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # ENUM types
    # ------------------------------------------------------------------
    project_status = postgresql.ENUM(
        "up", "down", "unknown", "checking",
        name="project_status",
        create_type=False,
    )
    project_status.create(op.get_bind(), checkfirst=True)

    # ------------------------------------------------------------------
    # users
    # ------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("avatar_object_name", sa.String(512), nullable=True),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"])
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # ------------------------------------------------------------------
    # projects
    # ------------------------------------------------------------------
    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("link", sa.String(512), nullable=False),
        sa.Column("image_object_name", sa.String(512), nullable=True),
        sa.Column(
            "status",
            sa.Enum("up", "down", "unknown", "checking", name="project_status", create_type=False),
            nullable=False,
            server_default="unknown",
        ),
        sa.Column(
            "last_checked",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.Column("position", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("health_check_urls", postgresql.JSONB(), nullable=True),
    )
    op.create_index(op.f("ix_projects_id"), "projects", ["id"])
    op.create_index(op.f("ix_projects_title"), "projects", ["title"])

    # ------------------------------------------------------------------
    # messages
    # ------------------------------------------------------------------
    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("sender_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.create_index(op.f("ix_messages_id"), "messages", ["id"])

    # ------------------------------------------------------------------
    # cv_data
    # ------------------------------------------------------------------
    op.create_table(
        "cv_data",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("data", postgresql.JSONB(), nullable=False),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
    )
    op.create_index(op.f("ix_cv_data_id"), "cv_data", ["id"])


def downgrade() -> None:
    op.drop_table("cv_data")
    op.drop_table("messages")
    op.drop_table("projects")
    op.drop_table("users")

    # Drop enum type
    sa.Enum(name="project_status").drop(op.get_bind(), checkfirst=True)
