"""Phase 5: Add performance indexes for frequently queried fields

Revision ID: phase5_performance_001
Revises: phase4_payout_001
Create Date: 2025-12-16 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'phase5_performance_001'
down_revision: Union[str, None] = 'phase4_payout_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add indexes for frequently queried fields
    
    # Listings indexes
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_listings_category ON listings(category);
        CREATE INDEX IF NOT EXISTS ix_listings_platform ON listings(platform);
        CREATE INDEX IF NOT EXISTS ix_listings_price_usd ON listings(price_usd);
        CREATE INDEX IF NOT EXISTS ix_listings_created_at ON listings(created_at DESC);
    """)
    
    # Transactions indexes
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_transactions_seller_id ON transactions(seller_id);
        CREATE INDEX IF NOT EXISTS ix_transactions_created_at ON transactions(created_at DESC);
        CREATE INDEX IF NOT EXISTS ix_transactions_completed_at ON transactions(completed_at DESC) WHERE completed_at IS NOT NULL;
    """)
    
    # Users indexes
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS ix_users_is_active ON users(is_active) WHERE is_active = true;
    """)
    
    # Audit logs indexes
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at ON audit_logs(created_at DESC);
        CREATE INDEX IF NOT EXISTS ix_audit_logs_user_id_action ON audit_logs(user_id, action);
    """)


def downgrade() -> None:
    # Remove indexes
    op.execute("""
        DROP INDEX IF EXISTS ix_listings_category;
        DROP INDEX IF EXISTS ix_listings_platform;
        DROP INDEX IF EXISTS ix_listings_price_usd;
        DROP INDEX IF EXISTS ix_listings_created_at;
        DROP INDEX IF EXISTS ix_transactions_seller_id;
        DROP INDEX IF EXISTS ix_transactions_created_at;
        DROP INDEX IF EXISTS ix_transactions_completed_at;
        DROP INDEX IF EXISTS ix_users_role;
        DROP INDEX IF EXISTS ix_users_is_active;
        DROP INDEX IF EXISTS ix_audit_logs_created_at;
        DROP INDEX IF EXISTS ix_audit_logs_user_id_action;
    """)

