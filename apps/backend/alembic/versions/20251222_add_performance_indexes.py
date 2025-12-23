"""Add performance indexes for faster queries

Revision ID: performance_indexes_001
Revises: 
Create Date: 2025-12-22

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'performance_indexes_001'
down_revision = None  # Update with latest revision
branch_labels = None
depends_on = None


def upgrade():
    # Indexes for listings table
    op.create_index(
        'idx_listings_state_created', 
        'listings', 
        ['state', 'created_at'], 
        unique=False
    )
    op.create_index(
        'idx_listings_seller_state', 
        'listings', 
        ['seller_id', 'state'], 
        unique=False
    )
    
    # Indexes for transactions table
    op.create_index(
        'idx_transactions_state_created', 
        'transactions', 
        ['state', 'created_at'], 
        unique=False
    )
    op.create_index(
        'idx_transactions_buyer_state', 
        'transactions', 
        ['buyer_id', 'state'], 
        unique=False
    )
    op.create_index(
        'idx_transactions_listing', 
        'transactions', 
        ['listing_id'], 
        unique=False
    )
    
    # Indexes for refresh_tokens table
    op.create_index(
        'idx_refresh_tokens_user_revoked', 
        'refresh_tokens', 
        ['user_id', 'is_revoked'], 
        unique=False
    )
    op.create_index(
        'idx_refresh_tokens_token', 
        'refresh_tokens', 
        ['token'], 
        unique=False
    )
    
    # Indexes for listing_proofs table
    op.create_index(
        'idx_listing_proofs_listing', 
        'listing_proofs', 
        ['listing_id'], 
        unique=False
    )


def downgrade():
    op.drop_index('idx_listing_proofs_listing', table_name='listing_proofs')
    op.drop_index('idx_refresh_tokens_token', table_name='refresh_tokens')
    op.drop_index('idx_refresh_tokens_user_revoked', table_name='refresh_tokens')
    op.drop_index('idx_transactions_listing', table_name='transactions')
    op.drop_index('idx_transactions_buyer_state', table_name='transactions')
    op.drop_index('idx_transactions_state_created', table_name='transactions')
    op.drop_index('idx_listings_seller_state', table_name='listings')
    op.drop_index('idx_listings_state_created', table_name='listings')

