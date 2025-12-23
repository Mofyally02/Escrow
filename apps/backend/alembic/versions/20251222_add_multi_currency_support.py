"""add multi-currency support

Revision ID: multi_currency_001
Revises: add_missing_transaction_cols_001, performance_indexes_001
Create Date: 2025-12-22 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'multi_currency_001'
down_revision = ('add_missing_transaction_cols_001', 'performance_indexes_001')  # Multiple heads
branch_labels = None
depends_on = None


def upgrade():
    # Create currency enum type (only if it doesn't exist)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE currency AS ENUM ('KSH', 'USD', 'EUR', 'GBP', 'CAD');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Add currency columns to listings table
    op.add_column('listings', sa.Column('currency', postgresql.ENUM('KSH', 'USD', 'EUR', 'GBP', 'CAD', name='currency', create_type=False), server_default='USD', nullable=False))
    op.add_column('listings', sa.Column('price', sa.Integer(), nullable=True))
    
    # Update price column: set price = price_usd for existing records
    op.execute("""
        UPDATE listings SET price = price_usd WHERE price IS NULL;
    """)
    
    # Add currency columns to transactions table
    op.add_column('transactions', sa.Column('currency', postgresql.ENUM('KSH', 'USD', 'EUR', 'GBP', 'CAD', name='currency', create_type=False), server_default='USD', nullable=False))
    op.add_column('transactions', sa.Column('amount', sa.Integer(), nullable=True))
    op.add_column('transactions', sa.Column('payment_currency', postgresql.ENUM('KSH', 'USD', 'EUR', 'GBP', 'CAD', name='currency', create_type=False), nullable=True))
    op.add_column('transactions', sa.Column('payment_amount', sa.Integer(), nullable=True))
    
    # Update amount column: set amount = amount_usd for existing records
    op.execute("""
        UPDATE transactions SET amount = amount_usd WHERE amount IS NULL;
    """)


def downgrade():
    # Remove currency columns from transactions
    op.drop_column('transactions', 'payment_amount')
    op.drop_column('transactions', 'payment_currency')
    op.drop_column('transactions', 'amount')
    op.drop_column('transactions', 'currency')
    
    # Remove currency columns from listings
    op.drop_column('listings', 'price')
    op.drop_column('listings', 'currency')
    
    # Drop currency enum type
    op.execute("DROP TYPE IF EXISTS currency;")

