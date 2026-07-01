"""Add image_external_url to projects table.

Revision ID: 0006_project_image_external_url
Revises: 0005_app_settings
Create Date: 2026-06-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0006_project_image_external_url"
down_revision: Union[str, None] = "0005_app_settings"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "projects",
        sa.Column("image_external_url", sa.String(2048), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("projects", "image_external_url")
