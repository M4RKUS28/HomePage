"""Add github_link to projects table.

Revision ID: 0007_project_github_link
Revises: 0006_project_image_external_url
Create Date: 2026-06-18 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0007_project_github_link"
down_revision: Union[str, None] = "0006_project_image_external_url"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "projects",
        sa.Column("github_link", sa.String(512), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("projects", "github_link")
