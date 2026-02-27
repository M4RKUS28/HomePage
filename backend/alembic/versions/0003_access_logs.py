"""Create access_logs table.

Revision ID: 0003_access_logs
Revises: 0002_add_language
Create Date: 2026-02-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0003_access_logs"
down_revision: Union[str, None] = "0002_add_language"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "access_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("ip_address", sa.String(45), nullable=False, index=True),
        sa.Column("city", sa.String(255), nullable=True),
        sa.Column("region", sa.String(255), nullable=True),
        sa.Column("country", sa.String(10), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("org", sa.String(512), nullable=True),
        sa.Column("timezone", sa.String(100), nullable=True),
        sa.Column("range_minutes", sa.Integer(), nullable=False, server_default="10"),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
            index=True,
        ),
    )


def downgrade() -> None:
    op.drop_table("access_logs")
