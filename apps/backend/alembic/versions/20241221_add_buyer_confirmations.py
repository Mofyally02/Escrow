"""Add buyer confirmations table

Revision ID: 20241221_buyer_confirmations
Revises: 20241216_phase3_transaction_updates
Create Date: 2024-12-21

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20241221_buyer_confirmations'
down_revision = 'phase5_performance_001'
branch_labels = None
depends_on = None


def upgrade():
    # Create confirmationstage enum
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE confirmationstage AS ENUM (
                'payment_complete',
                'contract_signing',
                'credential_reveal',
                'access_confirmation',
                'transaction_complete'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Create buyer_confirmations table
    op.create_table(
        'buyer_confirmations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('buyer_id', sa.Integer(), nullable=False),
        sa.Column('stage', postgresql.ENUM('payment_complete', 'contract_signing', 'credential_reveal', 'access_confirmation', 'transaction_complete', name='confirmationstage'), nullable=False),
        sa.Column('confirmation_text', sa.Text(), nullable=False),
        sa.Column('checkbox_label', sa.String(length=500), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['buyer_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_buyer_confirmations_transaction_id'), 'buyer_confirmations', ['transaction_id'], unique=False)
    op.create_index(op.f('ix_buyer_confirmations_buyer_id'), 'buyer_confirmations', ['buyer_id'], unique=False)
    op.create_index(op.f('ix_buyer_confirmations_stage'), 'buyer_confirmations', ['stage'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_buyer_confirmations_stage'), table_name='buyer_confirmations')
    op.drop_index(op.f('ix_buyer_confirmations_buyer_id'), table_name='buyer_confirmations')
    op.drop_index(op.f('ix_buyer_confirmations_transaction_id'), table_name='buyer_confirmations')
    op.drop_table('buyer_confirmations')
    op.execute('DROP TYPE IF EXISTS confirmationstage')

