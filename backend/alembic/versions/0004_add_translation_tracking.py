"""Add translation tracking fields (has_changes, translation_group_id).

Revision ID: 0004_translation_tracking
Revises: 0003_access_logs
Create Date: 2026-02-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0004_translation_tracking"
down_revision: Union[str, None] = "0003_access_logs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # CV: track whether content has been manually edited
    op.add_column(
        "cv_data",
        sa.Column("has_changes", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    # Projects: track whether content has been manually edited
    op.add_column(
        "projects",
        sa.Column("has_changes", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    # Projects: link translations of the same project across languages
    op.add_column(
        "projects",
        sa.Column("translation_group_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        op.f("ix_projects_translation_group_id"),
        "projects",
        ["translation_group_id"],
    )

    # Populate translation_group_id for existing projects (self-reference)
    op.execute("UPDATE projects SET translation_group_id = id WHERE translation_group_id IS NULL")


def downgrade() -> None:
    op.drop_index(op.f("ix_projects_translation_group_id"), table_name="projects")
    op.drop_column("projects", "translation_group_id")
    op.drop_column("projects", "has_changes")
    op.drop_column("cv_data", "has_changes")
