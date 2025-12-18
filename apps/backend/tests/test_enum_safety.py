"""
Enum Safety Tests

This test suite ensures that all Python enums match their PostgreSQL enum definitions.
This prevents the "invalid input value for enum" errors that occur when there's a mismatch.

Run with: pytest tests/test_enum_safety.py
"""
import pytest
from sqlalchemy import create_engine, text
from app.core.config import settings
from app.models.user import Role
from app.models.otp_code import OTPType
from app.models.listing import ListingState
from app.models.transaction import TransactionState
from app.models.audit_log import AuditAction
from app.models.payment_event import PaymentEventType
from app.models.listing_proof import ProofType


@pytest.fixture
def db_engine():
    """Create database engine for testing"""
    return create_engine(settings.DATABASE_URL)


def get_postgres_enum_values(engine, enum_name: str) -> list[str]:
    """Get all values for a PostgreSQL enum type"""
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT unnest(enum_range(NULL::{enum_name}));"))
        return [row[0] for row in result]


class TestEnumSafety:
    """Test that all Python enums match PostgreSQL enum definitions"""
    
    def test_otp_type_enum_matches_postgres(self, db_engine):
        """Test OTPType enum values match PostgreSQL otptype enum"""
        pg_values = get_postgres_enum_values(db_engine, "otptype")
        python_values = [e.value for e in OTPType]
        
        assert set(pg_values) == set(python_values), \
            f"OTPType mismatch: PostgreSQL has {pg_values}, Python has {python_values}"
    
    def test_role_enum_matches_postgres(self, db_engine):
        """Test Role enum values match PostgreSQL role enum"""
        pg_values = get_postgres_enum_values(db_engine, "role")
        python_values = [e.value for e in Role]
        
        assert set(pg_values) == set(python_values), \
            f"Role mismatch: PostgreSQL has {pg_values}, Python has {python_values}"
    
    def test_listing_state_enum_matches_postgres(self, db_engine):
        """Test ListingState enum values match PostgreSQL listingstate enum"""
        pg_values = get_postgres_enum_values(db_engine, "listingstate")
        python_values = [e.value for e in ListingState]
        
        assert set(pg_values) == set(python_values), \
            f"ListingState mismatch: PostgreSQL has {pg_values}, Python has {python_values}"
    
    def test_transaction_state_enum_matches_postgres(self, db_engine):
        """Test TransactionState enum values match PostgreSQL transactionstate enum"""
        pg_values = get_postgres_enum_values(db_engine, "transactionstate")
        python_values = [e.value for e in TransactionState]
        
        assert set(pg_values) == set(python_values), \
            f"TransactionState mismatch: PostgreSQL has {pg_values}, Python has {python_values}"
    
    def test_audit_action_enum_matches_postgres(self, db_engine):
        """Test AuditAction enum values match PostgreSQL auditaction enum"""
        pg_values = get_postgres_enum_values(db_engine, "auditaction")
        python_values = [e.value for e in AuditAction]
        
        assert set(pg_values) == set(python_values), \
            f"AuditAction mismatch: PostgreSQL has {pg_values}, Python has {python_values}"
    
    def test_payment_event_type_enum_matches_postgres(self, db_engine):
        """Test PaymentEventType enum values match PostgreSQL paymenteventtype enum"""
        pg_values = get_postgres_enum_values(db_engine, "paymenteventtype")
        python_values = [e.value for e in PaymentEventType]
        
        assert set(pg_values) == set(python_values), \
            f"PaymentEventType mismatch: PostgreSQL has {pg_values}, Python has {python_values}"
    
    def test_proof_type_enum_matches_postgres(self, db_engine):
        """Test ProofType enum values match PostgreSQL prooftype enum"""
        pg_values = get_postgres_enum_values(db_engine, "prooftype")
        python_values = [e.value for e in ProofType]
        
        assert set(pg_values) == set(python_values), \
            f"ProofType mismatch: PostgreSQL has {pg_values}, Python has {python_values}"
    
    def test_all_enums_use_lowercase_values(self):
        """Test that all enum values are lowercase (PostgreSQL convention)"""
        all_enums = [
            OTPType,
            Role,
            ListingState,
            TransactionState,
            AuditAction,
            PaymentEventType,
            ProofType,
        ]
        
        for enum_class in all_enums:
            for enum_member in enum_class:
                assert enum_member.value.islower() or '.' in enum_member.value or '_' in enum_member.value, \
                    f"{enum_class.__name__}.{enum_member.name} has non-lowercase value: {enum_member.value}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

