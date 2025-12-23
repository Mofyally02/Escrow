"""Add missing transaction columns (verification_deadline, account_verified_at)

Revision ID: add_missing_transaction_cols_001
Revises: bd409e48b546
Create Date: 2025-12-22 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_missing_transaction_cols_001'
down_revision: Union[str, None] = 'bd409e48b546'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add missing columns to transactions table
    op.execute("""
        DO $$ 
        BEGIN
            -- Add verification_deadline if not exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='transactions' AND column_name='verification_deadline') THEN
                ALTER TABLE transactions ADD COLUMN verification_deadline VARCHAR(50);
            END IF;
            
            -- Add account_verified_at if not exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='transactions' AND column_name='account_verified_at') THEN
                ALTER TABLE transactions ADD COLUMN account_verified_at VARCHAR(50);
            END IF;
            
            -- Add account_verified boolean if not exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='transactions' AND column_name='account_verified') THEN
                ALTER TABLE transactions ADD COLUMN account_verified BOOLEAN DEFAULT FALSE NOT NULL;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Remove columns (optional - usually we don't remove columns in production)
    op.execute("""
        DO $$ 
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='transactions' AND column_name='verification_deadline') THEN
                ALTER TABLE transactions DROP COLUMN verification_deadline;
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='transactions' AND column_name='account_verified_at') THEN
                ALTER TABLE transactions DROP COLUMN account_verified_at;
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='transactions' AND column_name='account_verified') THEN
                ALTER TABLE transactions DROP COLUMN account_verified;
            END IF;
        END $$;
    """)

