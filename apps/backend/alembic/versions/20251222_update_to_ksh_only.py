"""update to KSH only currency

Revision ID: ksh_only_001
Revises: multi_currency_001
Create Date: 2025-12-22 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'ksh_only_001'
down_revision = 'multi_currency_001'
branch_labels = None
depends_on = None


def upgrade():
    # Update currency enum to only include KSH
    # First, update all existing records to KSH
    op.execute("""
        UPDATE listings SET currency = 'KSH' WHERE currency != 'KSH' OR currency IS NULL;
        UPDATE transactions SET currency = 'KSH' WHERE currency != 'KSH' OR currency IS NULL;
        UPDATE transactions SET payment_currency = 'KSH' WHERE payment_currency IS NULL;
    """)
    
    # Update default values
    op.execute("""
        ALTER TABLE listings ALTER COLUMN currency SET DEFAULT 'KSH';
        ALTER TABLE transactions ALTER COLUMN currency SET DEFAULT 'KSH';
        ALTER TABLE transactions ALTER COLUMN payment_currency SET DEFAULT 'KSH';
    """)
    
    # Note: We keep the enum with all values for backward compatibility
    # But the application will only use KSH going forward


def downgrade():
    # Revert defaults (but keep enum values)
    op.execute("""
        ALTER TABLE listings ALTER COLUMN currency SET DEFAULT 'USD';
        ALTER TABLE transactions ALTER COLUMN currency SET DEFAULT 'USD';
        ALTER TABLE transactions ALTER COLUMN payment_currency DROP DEFAULT;
    """)

