"""Phase 3: Update transaction and contract models, add payment_events table

Revision ID: phase3_transaction_001
Revises: phase2_listing_001
Create Date: 2025-12-16 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'phase3_transaction_001'
down_revision: Union[str, None] = 'phase2_listing_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create transactionstate enum (if not exists)
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transactionstate') THEN
                CREATE TYPE transactionstate AS ENUM (
                    'pending', 'funds_held', 'contract_signed', 
                    'credentials_released', 'completed', 'refunded', 'disputed'
                );
            END IF;
        END $$;
    """)
    
    # Create paymenteventtype enum (if not exists)
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymenteventtype') THEN
                CREATE TYPE paymenteventtype AS ENUM (
                    'charge.success', 'charge.failed', 'transfer.success',
                    'transfer.failed', 'authorization', 'refund'
                );
            END IF;
        END $$;
    """)
    
    # Extend auditaction enum with transaction actions
    op.execute("""
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'transaction_initiated';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'funds_held';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'contract_generated';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'contract_signed';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'credentials_released';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'transaction_completed';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'transaction_refunded';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'transaction_disputed';
    """)
    
    # Define enum types for table creation (create_type=False since we created them above)
    transactionstate_enum = postgresql.ENUM(
        'pending', 'funds_held', 'contract_signed', 
        'credentials_released', 'completed', 'refunded', 'disputed',
        name='transactionstate',
        create_type=False
    )
    
    paymenteventtype_enum = postgresql.ENUM(
        'charge.success', 'charge.failed', 'transfer.success',
        'transfer.failed', 'authorization', 'refund',
        name='paymenteventtype',
        create_type=False
    )
    
    # Create transactions table
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('listing_id', sa.Integer(), nullable=False),
        sa.Column('buyer_id', sa.Integer(), nullable=False),
        sa.Column('seller_id', sa.Integer(), nullable=False),
        sa.Column('amount_usd', sa.Integer(), nullable=False),
        sa.Column('state', transactionstate_enum, server_default='pending', nullable=False),
        sa.Column('paystack_reference', sa.String(length=255), nullable=True),
        sa.Column('paystack_authorization_code', sa.String(length=255), nullable=True),
        sa.Column('paystack_customer_code', sa.String(length=255), nullable=True),
        sa.Column('funds_held_at', sa.String(length=50), nullable=True),
        sa.Column('contract_signed_at', sa.String(length=50), nullable=True),
        sa.Column('credentials_released_at', sa.String(length=50), nullable=True),
        sa.Column('completed_at', sa.String(length=50), nullable=True),
        sa.Column('refunded_at', sa.String(length=50), nullable=True),
        sa.Column('buyer_confirmed_access', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['listing_id'], ['listings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['buyer_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['seller_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('listing_id')
    )
    op.create_index(op.f('ix_transactions_listing_id'), 'transactions', ['listing_id'], unique=True)
    op.create_index(op.f('ix_transactions_buyer_id'), 'transactions', ['buyer_id'], unique=False)
    op.create_index(op.f('ix_transactions_state'), 'transactions', ['state'], unique=False)
    op.create_index('ix_transactions_paystack_reference', 'transactions', ['paystack_reference'], unique=True)
    
    # Create contracts table
    op.create_table(
        'contracts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('pdf_url', sa.String(length=500), nullable=True),
        sa.Column('pdf_hash', sa.String(length=64), nullable=False),
        sa.Column('signed_by_name', sa.String(length=255), nullable=True),
        sa.Column('signed_at', sa.String(length=50), nullable=True),
        sa.Column('contract_version', sa.String(length=20), server_default='1.0', nullable=False),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('transaction_id')
    )
    op.create_index(op.f('ix_contracts_transaction_id'), 'contracts', ['transaction_id'], unique=True)
    
    # Create payment_events table
    op.create_table(
        'payment_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('event_type', paymenteventtype_enum, nullable=False),
        sa.Column('paystack_event_id', sa.String(length=255), nullable=True),
        sa.Column('paystack_reference', sa.String(length=255), nullable=True),
        sa.Column('payload', sa.Text(), nullable=False),
        sa.Column('processed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('processed_at', sa.String(length=50), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('signature_verified', sa.Boolean(), server_default='false', nullable=False),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payment_events_transaction_id'), 'payment_events', ['transaction_id'], unique=False)
    op.create_index(op.f('ix_payment_events_event_type'), 'payment_events', ['event_type'], unique=False)
    op.create_index('ix_payment_events_paystack_event_id', 'payment_events', ['paystack_event_id'], unique=True)


def downgrade() -> None:
    # Drop tables
    op.drop_index('ix_payment_events_paystack_event_id', table_name='payment_events')
    op.drop_index(op.f('ix_payment_events_event_type'), table_name='payment_events')
    op.drop_index(op.f('ix_payment_events_transaction_id'), table_name='payment_events')
    op.drop_table('payment_events')
    op.drop_index(op.f('ix_contracts_transaction_id'), table_name='contracts')
    op.drop_table('contracts')
    op.drop_index('ix_transactions_paystack_reference', table_name='transactions')
    op.drop_index(op.f('ix_transactions_state'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_buyer_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_listing_id'), table_name='transactions')
    op.drop_table('transactions')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS paymenteventtype')
    op.execute('DROP TYPE IF EXISTS transactionstate')
    
    # Note: We don't remove auditaction enum values as they might be referenced in audit_logs
