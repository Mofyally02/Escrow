"""Phase 4: Add payout fields to transactions

Revision ID: phase4_payout_001
Revises: phase3_transaction_001
Create Date: 2025-12-16 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'phase4_payout_001'
down_revision: Union[str, None] = 'phase3_transaction_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add Phase 4 fields to transactions table
    op.execute("""
        DO $$ 
        BEGIN
            -- Add access_confirmed_at if not exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='transactions' AND column_name='access_confirmed_at') THEN
                ALTER TABLE transactions ADD COLUMN access_confirmed_at VARCHAR(50);
            END IF;
            
            -- Add payout_reference if not exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='transactions' AND column_name='payout_reference') THEN
                ALTER TABLE transactions ADD COLUMN payout_reference VARCHAR(255);
            END IF;
            
            -- Add commission_usd if not exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='transactions' AND column_name='commission_usd') THEN
                ALTER TABLE transactions ADD COLUMN commission_usd INTEGER;
            END IF;
            
            -- Add payout_amount_usd if not exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='transactions' AND column_name='payout_amount_usd') THEN
                ALTER TABLE transactions ADD COLUMN payout_amount_usd INTEGER;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Remove Phase 4 fields (optional - usually we don't remove columns in production)
    op.execute("""
        DO $$ 
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='transactions' AND column_name='access_confirmed_at') THEN
                ALTER TABLE transactions DROP COLUMN access_confirmed_at;
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='transactions' AND column_name='payout_reference') THEN
                ALTER TABLE transactions DROP COLUMN payout_reference;
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='transactions' AND column_name='commission_usd') THEN
                ALTER TABLE transactions DROP COLUMN commission_usd;
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='transactions' AND column_name='payout_amount_usd') THEN
                ALTER TABLE transactions DROP COLUMN payout_amount_usd;
            END IF;
        END $$;
    """)

