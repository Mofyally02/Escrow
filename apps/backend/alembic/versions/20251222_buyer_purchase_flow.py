"""Add buyer purchase flow models and update transaction states

Revision ID: buyer_purchase_flow_001
Revises: legal_documents_001
Create Date: 2025-12-22 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'buyer_purchase_flow_001'
down_revision: Union[str, None] = 'legal_documents_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Update TransactionState enum
    # Note: PostgreSQL doesn't support dropping enum values, so we only add new ones
    op.execute("""
        DO $$ BEGIN
            -- Add new enum values
            IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'purchase_initiated' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transactionstate')) THEN
                ALTER TYPE transactionstate ADD VALUE 'purchase_initiated';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'payment_pending' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transactionstate')) THEN
                ALTER TYPE transactionstate ADD VALUE 'payment_pending';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'temporary_access_granted' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transactionstate')) THEN
                ALTER TYPE transactionstate ADD VALUE 'temporary_access_granted';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'verification_window' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transactionstate')) THEN
                ALTER TYPE transactionstate ADD VALUE 'verification_window';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ownership_agreement_pending' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transactionstate')) THEN
                ALTER TYPE transactionstate ADD VALUE 'ownership_agreement_pending';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ownership_agreement_signed' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transactionstate')) THEN
                ALTER TYPE transactionstate ADD VALUE 'ownership_agreement_signed';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'funds_release_pending' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transactionstate')) THEN
                ALTER TYPE transactionstate ADD VALUE 'funds_release_pending';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'funds_released' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transactionstate')) THEN
                ALTER TYPE transactionstate ADD VALUE 'funds_released';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cancelled' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transactionstate')) THEN
                ALTER TYPE transactionstate ADD VALUE 'cancelled';
            END IF;
        END $$;
    """)
    
    # Add new timestamp columns to transactions table
    op.add_column('transactions', sa.Column('purchase_initiated_at', sa.String(length=50), nullable=True))
    op.add_column('transactions', sa.Column('payment_pending_at', sa.String(length=50), nullable=True))
    op.add_column('transactions', sa.Column('temporary_access_granted_at', sa.String(length=50), nullable=True))
    op.add_column('transactions', sa.Column('verification_window_started_at', sa.String(length=50), nullable=True))
    op.add_column('transactions', sa.Column('ownership_agreement_pending_at', sa.String(length=50), nullable=True))
    op.add_column('transactions', sa.Column('ownership_agreement_signed_at', sa.String(length=50), nullable=True))
    op.add_column('transactions', sa.Column('funds_release_pending_at', sa.String(length=50), nullable=True))
    op.add_column('transactions', sa.Column('funds_released_at', sa.String(length=50), nullable=True))
    op.add_column('transactions', sa.Column('cancelled_at', sa.String(length=50), nullable=True))
    
    # Create temporary_accesses table
    op.create_table(
        'temporary_accesses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('access_granted_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('access_expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('access_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('login_attempts_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_login_attempts', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('access_revoked', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('warnings_shown', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('warnings_acknowledged_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('access_logs', sa.Text(), nullable=True),
        sa.Column('buyer_acknowledged_terms', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('buyer_acknowledged_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('transaction_id')
    )
    op.create_index(op.f('ix_temporary_accesses_transaction_id'), 'temporary_accesses', ['transaction_id'], unique=False)
    
    # Create ownership_agreements table
    op.create_table(
        'ownership_agreements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('agreement_content', sa.Text(), nullable=False),
        sa.Column('signed_by_name', sa.String(length=255), nullable=True),
        sa.Column('signed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('signature_hash', sa.String(length=64), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('agreement_version', sa.String(length=20), nullable=False, server_default='1.0'),
        sa.Column('effective_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verified_account_acknowledged', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('accepts_ownership_acknowledged', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('accepts_risks_acknowledged', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('platform_liability_ends_acknowledged', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('transaction_id')
    )
    op.create_index(op.f('ix_ownership_agreements_transaction_id'), 'ownership_agreements', ['transaction_id'], unique=False)


def downgrade() -> None:
    # Drop tables
    op.drop_index(op.f('ix_ownership_agreements_transaction_id'), table_name='ownership_agreements')
    op.drop_table('ownership_agreements')
    op.drop_index(op.f('ix_temporary_accesses_transaction_id'), table_name='temporary_accesses')
    op.drop_table('temporary_accesses')
    
    # Remove columns from transactions
    op.drop_column('transactions', 'cancelled_at')
    op.drop_column('transactions', 'funds_released_at')
    op.drop_column('transactions', 'funds_release_pending_at')
    op.drop_column('transactions', 'ownership_agreement_signed_at')
    op.drop_column('transactions', 'ownership_agreement_pending_at')
    op.drop_column('transactions', 'verification_window_started_at')
    op.drop_column('transactions', 'temporary_access_granted_at')
    op.drop_column('transactions', 'payment_pending_at')
    op.drop_column('transactions', 'purchase_initiated_at')
    
    # Note: Enum values cannot be easily removed in PostgreSQL
    # The old enum values will remain but won't be used

