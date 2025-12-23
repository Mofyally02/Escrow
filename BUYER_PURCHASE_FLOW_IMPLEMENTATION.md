# Buyer Purchase Flow Implementation

## Overview

This document describes the implementation of the **step-locked buyer purchase flow** that ensures buyers can only proceed one step at a time, with clear legal protections and dispute prevention.

## Architecture

### State Machine

The transaction flow follows a strict 7-step process:

1. **PURCHASE_INITIATED** - Buyer clicks "Purchase Account Securely", listing is locked
2. **PAYMENT_PENDING** → **FUNDS_HELD** - Payment completed, funds secured in escrow
3. **TEMPORARY_ACCESS_GRANTED** - Buyer receives limited access for verification
4. **VERIFICATION_WINDOW** - Buyer can verify account (24-48 hour window)
5. **OWNERSHIP_AGREEMENT_PENDING** → **OWNERSHIP_AGREEMENT_SIGNED** - Buyer signs ownership transfer agreement
6. **FUNDS_RELEASE_PENDING** → **FUNDS_RELEASED** - Final confirmation and fund release
7. **COMPLETED** - Transaction fully closed, read-only

### Models

#### 1. Transaction (Updated)
- Added new state enum values for step-locked flow
- Added timestamp fields for each step
- Added `get_current_step()` method to return step number (1-7)
- Added `can_proceed_to_next_step()` method for step validation

#### 2. TemporaryAccess
- Tracks limited account access window (STEP 3)
- Time-limited access (default 48 hours)
- Security controls: login attempt tracking, max attempts, revocation capability
- Buyer acknowledgment of terms ("Do not change account details")

#### 3. OwnershipAgreement
- Binding ownership transfer agreement (STEP 5)
- Digital signature with full legal name (validated against user profile)
- SHA-256 signature hash for integrity verification
- Four required acknowledgments:
  - Verified account
  - Accepts ownership
  - Accepts risks
  - Platform liability ends

### API Endpoints

All endpoints are under `/api/v1/purchase/`:

#### STEP 1: Initiate Purchase
```
POST /purchase/initiate
```
- Locks listing to buyer
- Creates transaction in `PURCHASE_INITIATED` state
- Initializes Paystack payment
- Returns payment authorization URL

#### STEP 2: Confirm Payment
```
POST /purchase/{transaction_id}/payment/confirm
```
- Confirms payment completion
- Updates state to `FUNDS_HELD`
- Funds are secured in escrow

#### STEP 3: Grant Temporary Access
```
POST /purchase/{transaction_id}/temporary-access
```
- Creates temporary access record
- Sets 48-hour access window
- Updates state to `TEMPORARY_ACCESS_GRANTED`
- Buyer can now access credentials for verification

#### STEP 4: Start Verification Window
```
POST /purchase/{transaction_id}/verification/start
```
- Starts verification window (48 hours)
- Updates state to `VERIFICATION_WINDOW`
- Sets verification deadline

#### STEP 4: Verify Account
```
POST /purchase/{transaction_id}/verification/verify
```
- Buyer confirms account is valid
- Updates state to `OWNERSHIP_AGREEMENT_PENDING` if verified
- Or buyer can open dispute if invalid

#### STEP 5: Sign Ownership Agreement
```
POST /purchase/{transaction_id}/ownership-agreement/sign
```
- Buyer signs binding ownership transfer agreement
- Validates buyer name matches profile
- Requires all four acknowledgments
- Generates signature hash
- Updates state to `OWNERSHIP_AGREEMENT_SIGNED`

#### STEP 6: Request Funds Release
```
POST /purchase/{transaction_id}/funds/release
```
- Buyer confirms ownership and requests fund release
- Calculates commission and payout
- Processes payout to seller
- Updates state to `FUNDS_RELEASED` → `COMPLETED`

#### Get Purchase Status
```
GET /purchase/{transaction_id}/status
```
- Returns current step, state, and next available actions
- Shows verification deadline and time remaining

### CRUD Operations

All step operations are in `app/crud/buyer_purchase_flow.py`:

- `initiate_purchase()` - STEP 1
- `confirm_payment()` - STEP 2
- `grant_temporary_access()` - STEP 3
- `start_verification_window()` - STEP 4
- `verify_account()` - STEP 4
- `create_ownership_agreement()` - STEP 5
- `sign_ownership_agreement()` - STEP 5
- `request_funds_release()` - STEP 6
- `release_funds()` - STEP 6
- `open_dispute()` - Dispute handling

### Step Validation

Each step enforces:
1. **State validation** - Can only proceed from valid previous state
2. **User authorization** - Buyer must own the transaction
3. **Requirement checking** - All step requirements must be met
4. **Audit logging** - All actions are logged with IP and user agent

### Legal Protections

1. **Explicit Consent** - Buyer must explicitly acknowledge each step
2. **Digital Signature** - Full legal name signature with hash verification
3. **Time Stamps** - All actions are timestamped
4. **IP Tracking** - IP address recorded for legal evidence
5. **Immutable Records** - All agreements are stored and cannot be modified

### Security Controls

1. **Temporary Access Limits**:
   - Time-limited (48 hours default)
   - Login attempt tracking
   - Maximum attempts (10 default)
   - Admin revocation capability

2. **Signature Validation**:
   - Name must match user profile exactly
   - SHA-256 hash for integrity
   - IP and user agent recorded

3. **State Machine Enforcement**:
   - Cannot skip steps
   - Cannot proceed without completing previous step
   - Terminal states prevent further changes

### Migration

Migration file: `alembic/versions/20251222_buyer_purchase_flow.py`

Creates:
- `temporary_accesses` table
- `ownership_agreements` table
- Updates `transactions` table with new timestamp columns
- Updates `TransactionState` enum with new values

### Next Steps

1. **Frontend Integration**:
   - Create step-by-step UI components
   - Show progress indicator
   - Display verification countdown
   - Ownership agreement form with all acknowledgments

2. **Email Notifications**:
   - Notify seller when purchase initiated
   - Notify buyer when temporary access granted
   - Notify buyer of verification deadline
   - Notify seller when funds released

3. **Dispute Handling**:
   - Admin dispute resolution interface
   - Dispute evidence collection
   - Refund processing

4. **Testing**:
   - Unit tests for each step
   - Integration tests for full flow
   - Edge case handling (expired access, disputes, etc.)

## Benefits

1. **Legal Clarity** - Clear ownership transfer moment
2. **Dispute Prevention** - Explicit buyer consent at each step
3. **Buyer Protection** - Verification window before commitment
4. **Seller Protection** - Funds held until buyer confirms
5. **Platform Protection** - Clear liability boundaries
6. **Audit Trail** - Complete record of all actions

