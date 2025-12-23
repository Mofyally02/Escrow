"""Add legal documents and user legal acknowledgments tables

Revision ID: legal_documents_001
Revises: buyer_confirmations_001
Create Date: 2025-12-21 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'legal_documents_001'
down_revision: Union[str, None] = '20241221_buyer_confirmations'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create documenttype enum (if it doesn't exist)
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'documenttype') THEN
                CREATE TYPE documenttype AS ENUM (
                    'terms_of_service', 'privacy_policy', 'seller_agreement',
                    'buyer_agreement', 'disclaimer', 'faq', 'other'
                );
            END IF;
        END $$;
    """)
    
    # Create legal_documents table (only if it doesn't exist)
    op.execute("""
        CREATE TABLE IF NOT EXISTS legal_documents (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL UNIQUE,
            document_type documenttype NOT NULL,
            content_markdown TEXT NOT NULL,
            version VARCHAR(20) NOT NULL DEFAULT '1.0',
            is_current BOOLEAN NOT NULL DEFAULT true,
            published_at TIMESTAMP WITH TIME ZONE,
            published_by_id INTEGER REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE
        );
    """)
    
    # Create indexes (only if they don't exist)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_legal_documents_slug ON legal_documents(slug);
        CREATE INDEX IF NOT EXISTS ix_legal_documents_document_type ON legal_documents(document_type);
        CREATE INDEX IF NOT EXISTS ix_legal_documents_is_current ON legal_documents(is_current);
    """)
    
    # Create user_legal_acknowledgments table (only if it doesn't exist)
    op.execute("""
        CREATE TABLE IF NOT EXISTS user_legal_acknowledgments (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            document_id INTEGER NOT NULL REFERENCES legal_documents(id),
            acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL,
            ip_address VARCHAR(45),
            user_agent VARCHAR(500),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE,
            UNIQUE(user_id, document_id)
        );
    """)
    
    # Create indexes (only if they don't exist)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_user_legal_acknowledgments_user_id ON user_legal_acknowledgments(user_id);
        CREATE INDEX IF NOT EXISTS ix_user_legal_acknowledgments_document_id ON user_legal_acknowledgments(document_id);
    """)
    
    # Extend auditaction enum with legal document actions
    op.execute("""
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'legal_document_created';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'legal_document_updated';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'legal_document_published';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'legal_document_deleted';
        ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'legal_document_acknowledged';
    """)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_user_legal_acknowledgments_document_id', table_name='user_legal_acknowledgments')
    op.drop_index('ix_user_legal_acknowledgments_user_id', table_name='user_legal_acknowledgments')
    op.drop_index('ix_legal_documents_is_current', table_name='legal_documents')
    op.drop_index('ix_legal_documents_document_type', table_name='legal_documents')
    op.drop_index('ix_legal_documents_slug', table_name='legal_documents')
    
    # Drop tables
    op.drop_table('user_legal_acknowledgments')
    op.drop_table('legal_documents')
    
    # Note: We don't remove enum values from auditaction as they might be referenced in audit_logs
    # Note: We don't drop documenttype enum as it might be referenced elsewhere

