"""add_listing_drafts_table

Revision ID: bd409e48b546
Revises: add_signature_fields_001
Create Date: 2025-12-21 18:53:32.610291

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'bd409e48b546'
down_revision: Union[str, None] = 'add_signature_fields_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create draftstatus enum (if it doesn't exist)
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'draftstatus') THEN
                CREATE TYPE draftstatus AS ENUM ('draft', 'submitted');
            END IF;
        END $$;
    """)
    
    # Check if table already exists
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()
    
    if 'listing_drafts' not in existing_tables:
        # Create listing_drafts table
        # Use existing enum type instead of creating new one
        op.execute("""
            CREATE TABLE listing_drafts (
                id SERIAL PRIMARY KEY,
                seller_id INTEGER NOT NULL UNIQUE,
                data JSONB NOT NULL,
                step INTEGER NOT NULL DEFAULT 0,
                status draftstatus NOT NULL DEFAULT 'draft',
                last_saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE,
                CONSTRAINT fk_listing_drafts_seller FOREIGN KEY (seller_id) REFERENCES users(id)
            );
        """)
        op.create_index('ix_listing_drafts_seller_id', 'listing_drafts', ['seller_id'], unique=True)
        op.create_index('ix_listing_drafts_status', 'listing_drafts', ['status'])


def downgrade() -> None:
    op.drop_index('ix_listing_drafts_status', table_name='listing_drafts')
    op.drop_index('ix_listing_drafts_seller_id', table_name='listing_drafts')
    op.drop_table('listing_drafts')
    op.execute("DROP TYPE IF EXISTS draftstatus")
