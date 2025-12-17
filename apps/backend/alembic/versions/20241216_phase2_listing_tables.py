"""Phase 2: Create listing tables (listings, credential_vaults, listing_proofs)

Revision ID: phase2_listing_001
Revises: phase1_auth_001
Create Date: 2025-12-16 13:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'phase2_listing_001'
down_revision: Union[str, None] = 'phase1_auth_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create listingstate enum (if not exists)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE listingstate AS ENUM ('draft', 'under_review', 'approved', 'reserved', 'sold');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Create prooftype enum (if not exists)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE prooftype AS ENUM ('earnings_screenshot', 'account_dashboard', 'review_screenshot', 'verification_document', 'other');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Get enum types for table creation
    listingstate_enum = postgresql.ENUM(
        'draft', 'under_review', 'approved', 'reserved', 'sold',
        name='listingstate',
        create_type=False
    )
    
    prooftype_enum = postgresql.ENUM(
        'earnings_screenshot', 'account_dashboard', 'review_screenshot',
        'verification_document', 'other',
        name='prooftype',
        create_type=False
    )
    
    # Extend auditaction enum with listing actions
    op.execute("""
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'listing_created';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'listing_submitted';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'listing_approved';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'listing_rejected';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'listing_state_changed';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'listing_viewed';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'credentials_stored';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'credentials_revealed';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'credentials_viewed';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'admin_review_started';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'admin_review_completed';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'admin_request_info';
    """)
    
    # Create listings table
    op.create_table(
        'listings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('seller_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('platform', sa.String(length=100), nullable=False),
        sa.Column('price_usd', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('state', listingstate_enum, server_default='draft', nullable=False),
        sa.Column('monthly_earnings', sa.Integer(), nullable=True),
        sa.Column('account_age_months', sa.Integer(), nullable=True),
        sa.Column('rating', sa.String(length=10), nullable=True),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['seller_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_listings_seller_id'), 'listings', ['seller_id'], unique=False)
    op.create_index(op.f('ix_listings_state'), 'listings', ['state'], unique=False)
    
    # Create credential_vaults table
    op.create_table(
        'credential_vaults',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('listing_id', sa.Integer(), nullable=False),
        sa.Column('encrypted_username', sa.Text(), nullable=False),
        sa.Column('encrypted_password', sa.Text(), nullable=False),
        sa.Column('encrypted_recovery_email', sa.Text(), nullable=True),
        sa.Column('encrypted_2fa_secret', sa.Text(), nullable=True),
        sa.Column('iv', sa.String(length=255), nullable=False),
        sa.Column('salt', sa.String(length=255), nullable=False),
        sa.Column('tag', sa.String(length=255), nullable=False),
        sa.Column('encryption_key_id', sa.String(length=100), nullable=False),
        sa.Column('revealed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('revealed_to_user_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['listing_id'], ['listings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['revealed_to_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('listing_id')
    )
    op.create_index(op.f('ix_credential_vaults_listing_id'), 'credential_vaults', ['listing_id'], unique=True)
    
    # Create listing_proofs table
    op.create_table(
        'listing_proofs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('listing_id', sa.Integer(), nullable=False),
        sa.Column('proof_type', prooftype_enum, nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('mime_type', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['listing_id'], ['listings.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_listing_proofs_listing_id'), 'listing_proofs', ['listing_id'], unique=False)


def downgrade() -> None:
    # Drop tables
    op.drop_index(op.f('ix_listing_proofs_listing_id'), table_name='listing_proofs')
    op.drop_table('listing_proofs')
    op.drop_index(op.f('ix_credential_vaults_listing_id'), table_name='credential_vaults')
    op.drop_table('credential_vaults')
    op.drop_index(op.f('ix_listings_state'), table_name='listings')
    op.drop_index(op.f('ix_listings_seller_id'), table_name='listings')
    op.drop_table('listings')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS prooftype')
    op.execute('DROP TYPE IF EXISTS listingstate')
    
    # Note: We don't remove the auditaction enum values as they might be referenced in audit_logs

