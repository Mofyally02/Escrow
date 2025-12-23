"""Add signature fields to user legal acknowledgments

Revision ID: add_signature_fields_001
Revises: buyer_purchase_flow_001
Create Date: 2025-12-22 18:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_signature_fields_001'
down_revision: Union[str, None] = 'buyer_purchase_flow_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add signature fields to user_legal_acknowledgments table
    op.execute("""
        ALTER TABLE user_legal_acknowledgments
        ADD COLUMN IF NOT EXISTS signed_by_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS signature_hash VARCHAR(64);
    """)


def downgrade() -> None:
    # Remove signature fields
    op.execute("""
        ALTER TABLE user_legal_acknowledgments
        DROP COLUMN IF EXISTS signature_hash,
        DROP COLUMN IF EXISTS signed_by_name;
    """)

