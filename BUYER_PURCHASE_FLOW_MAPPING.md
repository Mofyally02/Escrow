# Buyer Purchase Flow - Backend Mapping
**Date:** December 21, 2025

## Flow Mapping: UI Steps → Backend Implementation

### STEP 1: Initiate Secure Purchase
**UI Action:** Buyer clicks "Purchase Account Securely"

**Backend Implementation:**
- **Endpoint:** `POST /api/v1/transactions` (already exists)
- **Current State:** `TransactionState.PENDING`
- **Actions:**
  - ✅ Create transaction
  - ✅ Lock listing (change to `ListingState.RESERVED`)
  - ✅ Initialize Paystack payment
  - ✅ Log audit event
- **Enhancement Needed:** Explicitly mark listing as reserved/locked

**Database Changes:**
- Transaction created with `state = PENDING`
- Listing state changed to `RESERVED`

---

### STEP 2: Make Escrow Payment
**UI Action:** Buyer completes payment

**Backend Implementation:**
- **Endpoint:** Paystack webhook `POST /api/v1/webhooks/paystack`
- **Current State:** `TransactionState.FUNDS_HELD`
- **Actions:**
  - ✅ Receive payment webhook
  - ✅ Update transaction to `FUNDS_HELD`
  - ✅ Store authorization code
  - ✅ Log payment event
- **Status:** ✅ Already implemented

**Database Changes:**
- Transaction `state = FUNDS_HELD`
- `paystack_authorization_code` stored
- `funds_held_at` timestamp set

---

### STEP 3: Receive Limited Account Access
**UI Action:** Seller submits credentials, buyer receives temporary access

**Backend Implementation:**
- **Endpoint:** `POST /api/v1/credentials/transactions/{id}/reveal` (already exists)
- **Current State:** `TransactionState.CREDENTIALS_RELEASED`
- **Actions:**
  - ✅ Decrypt credentials
  - ✅ Mark as revealed
  - ✅ Update transaction state
- **Enhancement Needed:**
  - Add temporary access window tracking
  - Add access attempt logging
  - Block credential changes during verification period

**New Model Needed:**
```python
class TemporaryAccess(Timestamped):
    transaction_id: int
    access_granted_at: datetime
    access_expires_at: datetime
    verification_window_hours: int = 48
    access_attempts: int = 0
    max_attempts: int = 10
```

**Database Changes:**
- Transaction `state = CREDENTIALS_RELEASED`
- `credentials_released_at` timestamp
- Create `TemporaryAccess` record

---

### STEP 4: Account Validation & Verification
**UI Action:** Buyer verifies account, can open dispute

**Backend Implementation:**
- **New Endpoint:** `POST /api/v1/transactions/{id}/verify-account`
- **New Endpoint:** `POST /api/v1/transactions/{id}/open-dispute`
- **Current State:** `TransactionState.CREDENTIALS_RELEASED` (stays same)
- **New State:** `TransactionState.ACCOUNT_VERIFIED` (optional, or use confirmation)
- **Actions:**
  - ✅ Buyer confirms account is valid
  - ✅ Or buyer opens dispute
  - ✅ Track verification timestamp
  - ✅ Enforce time limit (24-48 hours)

**Enhancement Needed:**
- Add verification confirmation endpoint
- Add dispute endpoint (already exists but needs enhancement)
- Add time limit enforcement

**Database Changes:**
- Add `account_verified_at` timestamp to Transaction
- Add `verification_deadline` timestamp
- BuyerConfirmation with `stage = ACCOUNT_VERIFICATION`

---

### STEP 5: Ownership Acceptance Agreement
**UI Action:** Buyer signs Ownership Transfer Agreement

**Backend Implementation:**
- **Endpoint:** `POST /api/v1/contracts/{transaction_id}/sign` (exists but needs enhancement)
- **Current State:** `TransactionState.CONTRACT_SIGNED`
- **Actions:**
  - ✅ Generate Ownership Transfer Agreement PDF
  - ✅ Require full legal name signature
  - ✅ Validate name matches buyer profile
  - ✅ Store signature hash
  - ✅ Log acceptance
- **Enhancement Needed:**
  - Update contract template to include ownership transfer language
  - Add name validation against user profile
  - Add signature hash for integrity

**Database Changes:**
- Contract `signed_by_name` set
- Contract `signed_at` timestamp
- Transaction `state = CONTRACT_SIGNED`
- BuyerConfirmation with `stage = OWNERSHIP_ACCEPTANCE`

---

### STEP 6: Final Confirmation & Fund Release
**UI Action:** Buyer clicks "Confirm Ownership & Release Funds"

**Backend Implementation:**
- **Endpoint:** `POST /api/v1/transactions/{id}/confirm-access` (exists)
- **Current State:** `TransactionState.COMPLETED`
- **Actions:**
  - ✅ Verify ownership agreement is signed
  - ✅ Capture funds from Paystack
  - ✅ Calculate commission
  - ✅ Transfer funds to seller
  - ✅ Mark transaction complete
  - ✅ Archive agreement
- **Enhancement Needed:**
  - Verify contract is signed before allowing confirmation
  - Add agreement archiving

**Database Changes:**
- Transaction `state = COMPLETED`
- `completed_at` timestamp
- `buyer_confirmed_access = True`
- Listing `state = SOLD`
- BuyerConfirmation with `stage = TRANSACTION_COMPLETE`

---

### STEP 7: Transaction Closed
**UI Action:** Final state (read-only)

**Backend Implementation:**
- **State:** `TransactionState.COMPLETED` (terminal)
- **Actions:**
  - ✅ Transaction becomes read-only
  - ✅ Credentials removed from system
  - ✅ Disputes no longer allowed
- **Status:** ✅ Already implemented

---

## Required Backend Changes

### 1. Transaction State Machine Updates

**Add New States:**
```python
class TransactionState(str, enum.Enum):
    PENDING = "pending"
    FUNDS_HELD = "funds_held"
    CREDENTIALS_RELEASED = "credentials_released"
    ACCOUNT_VERIFIED = "account_verified"  # NEW
    OWNERSHIP_AGREEMENT_SIGNED = "ownership_agreement_signed"  # NEW (or use CONTRACT_SIGNED)
    COMPLETED = "completed"
    REFUNDED = "refunded"
    DISPUTED = "disputed"
```

**Or enhance existing states:**
- Keep `CONTRACT_SIGNED` but ensure it includes ownership transfer language
- Add `account_verified_at` timestamp to track verification separately

### 2. New Models

**TemporaryAccess Model:**
```python
class TemporaryAccess(Timestamped):
    transaction_id: int
    access_granted_at: datetime
    access_expires_at: datetime
    verification_window_hours: int = 48
    access_attempts: int = 0
    max_attempts: int = 10
    blocked: bool = False
```

**OwnershipTransferAgreement Model (or enhance Contract):**
```python
# Enhance existing Contract model:
- Add ownership_transfer_clause: Text
- Add buyer_acknowledgment_text: Text
- Add signature_hash: String (SHA-256 of signed_by_name + signed_at + transaction_id)
```

### 3. New Endpoints

**Account Verification:**
- `POST /api/v1/transactions/{id}/verify-account` - Buyer confirms account is valid
- `GET /api/v1/transactions/{id}/verification-status` - Check verification status and deadline

**Dispute (Enhancement):**
- `POST /api/v1/transactions/{id}/open-dispute` - Open dispute before final confirmation
- Ensure disputes can only be opened before `COMPLETED` state

**Ownership Agreement:**
- `POST /api/v1/contracts/{transaction_id}/sign-ownership` - Sign ownership transfer agreement
- Validate buyer name matches profile
- Generate signature hash

### 4. Enhanced Contract Template

Update `PDFContractGenerator` to include:
- Ownership transfer clause
- Risk assumption clause
- Platform liability disclaimer
- Buyer acknowledgment text

### 5. Confirmation Stages Update

**Add New Stages:**
```python
class ConfirmationStage(str, enum.Enum):
    PAYMENT_COMPLETE = "payment_complete"
    ACCOUNT_VERIFICATION = "account_verification"  # NEW
    OWNERSHIP_ACCEPTANCE = "ownership_acceptance"  # NEW
    TRANSACTION_COMPLETE = "transaction_complete"
```

---

## State Transition Flow

```
PENDING
  ↓ (Payment successful)
FUNDS_HELD
  ↓ (Credentials revealed)
CREDENTIALS_RELEASED
  ↓ (Buyer verifies account)
ACCOUNT_VERIFIED (optional intermediate state)
  ↓ (Buyer signs ownership agreement)
CONTRACT_SIGNED (or OWNERSHIP_AGREEMENT_SIGNED)
  ↓ (Buyer confirms ownership & releases funds)
COMPLETED
```

**Dispute Path:**
- Can open dispute from `CREDENTIALS_RELEASED` or `ACCOUNT_VERIFIED`
- Dispute can lead to `REFUNDED` or `COMPLETED` (admin decision)

---

## Implementation Priority

### Phase 1: Core Flow (High Priority)
1. ✅ Transaction creation and payment (already done)
2. ✅ Credential reveal (already done)
3. ⚠️ Account verification endpoint (needs implementation)
4. ⚠️ Ownership agreement signing (enhance existing contract signing)
5. ✅ Final confirmation (already done)

### Phase 2: Enhancements (Medium Priority)
1. Temporary access tracking
2. Verification time limits
3. Dispute enhancements
4. Agreement archiving

### Phase 3: Legal Strengthening (High Priority)
1. Ownership transfer agreement template
2. Signature validation
3. Agreement hashing

---

## Next Steps

1. Create database migration for new fields/models
2. Implement account verification endpoint
3. Enhance contract signing with ownership transfer language
4. Add verification time limit enforcement
5. Update state machine if needed
6. Add temporary access tracking

