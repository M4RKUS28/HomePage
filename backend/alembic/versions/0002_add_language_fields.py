"""Add language field to users, projects, and cv_data tables.

Revision ID: 0002_add_language
Revises: 0001_initial
Create Date: 2025-01-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0002_add_language"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add language column to users table
    op.add_column(
        "users",
        sa.Column("language", sa.String(10), nullable=False, server_default="en"),
    )

    # Add language column to projects table
    op.add_column(
        "projects",
        sa.Column("language", sa.String(10), nullable=False, server_default="en"),
    )

    # Add language column to cv_data table
    op.add_column(
        "cv_data",
        sa.Column("language", sa.String(10), nullable=False, server_default="en"),
    )


def downgrade() -> None:
    op.drop_column("cv_data", "language")
    op.drop_column("projects", "language")
    op.drop_column("users", "language")
