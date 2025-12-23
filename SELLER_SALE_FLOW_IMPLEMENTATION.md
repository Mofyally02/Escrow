# Seller Sale Flow Implementation

## Overview

This document describes the implementation of the **step-locked seller sale flow** that mirrors the buyer purchase flow, ensuring sellers are protected from non-paying or abusive buyers while maintaining full auditability.

## Architecture

### Seller Flow Steps (Mirrors Buyer Flow)

1. **STEP 1 - List Account for Secure Sale**: Seller creates listing (existing)
2. **STEP 2 - Buyer Locks the Account**: Buyer initiates purchase (handled by buyer flow)
3. **STEP 3 - Escrow Payment Confirmed**: Buyer pays into escrow (handled by buyer flow)
4. **STEP 4 - Secure Credential Delivery**: Seller delivers credentials after payment confirmed
5. **STEP 5 - Buyer Verification Period**: Buyer verifies account (handled by buyer flow)
6. **STEP 6 - Buyer Acceptance & Ownership Transfer**: Buyer signs agreement and releases funds (handled by buyer flow)
7. **STEP 7 - Post-Transfer Lock & Closure**: Transaction completed (handled by buyer flow)

### Seller Protections

1. **No Credential Delivery Before Payment**: Credentials can only be delivered after `FUNDS_HELD` state
2. **Payment Guaranteed**: Funds are locked in escrow before credentials are exposed
3. **Time-Bound Delivery**: Seller has clear delivery window
4. **Evidence-Based Defense**: All actions are logged with timestamps and IP addresses
5. **Ownership Finality**: Once buyer signs agreement, no reversals
6. **Immutable Transaction Logs**: Complete audit trail

### API Endpoints

All endpoints are under `/api/v1/sale/`:

#### Seller Dashboard
```
GET /sale/dashboard
```
- Shows all active and completed transactions
- Displays total earnings and pending earnings
- Transaction status for each listing

#### Get Transaction Status
```
GET /sale/transaction/{transaction_id}/status
```
- Current step and state
- Payment confirmation status
- Credential delivery status
- Buyer verification status
- Fund release status
- Whether seller can deliver credentials

#### STEP 4: Deliver Credentials
```
POST /sale/transaction/{transaction_id}/credentials/deliver
```
- Seller submits credentials after payment confirmed
- Credentials are encrypted and stored
- One-time encrypted submission
- Access logging enabled
- Updates transaction state to `TEMPORARY_ACCESS_GRANTED`

#### Check Can Deliver Credentials
```
GET /sale/transaction/{transaction_id}/can-deliver
```
- Checks if seller can deliver credentials
- Returns reason if cannot deliver
- Validates payment confirmation

### CRUD Operations

All seller operations are in `app/crud/seller_sale_flow.py`:

- `get_seller_transaction_status()` - Get transaction with seller validation
- `can_deliver_credentials()` - Check if seller can deliver (STEP 4 requirements)
- `deliver_credentials()` - STEP 4: Encrypt and store credentials
- `get_seller_dashboard_data()` - Get dashboard stats and transactions

### Step Validation

Each seller action enforces:
1. **State validation** - Can only deliver after payment confirmed
2. **Seller authorization** - Seller must own the listing
3. **Payment confirmation** - Funds must be held in escrow
4. **Audit logging** - All actions are logged with IP and user agent

### Security Controls

1. **Credential Delivery Protection**:
   - Only allowed after `FUNDS_HELD` state
   - Credentials encrypted with AES-256-GCM
   - One-time submission (can update if not revealed)
   - Access logging enabled

2. **Payment Guarantee**:
   - Seller cannot deliver until payment confirmed
   - Funds locked in escrow before credential exposure
   - Clear "safe-to-deliver" indicator

3. **State Machine Enforcement**:
   - Cannot deliver before payment
   - Cannot deliver after credentials revealed
   - Transaction state updated automatically

### Seller Dashboard Features

1. **Active Transactions**:
   - Current step and state
   - Payment status
   - Credential delivery status
   - Buyer verification status
   - Fund release status

2. **Completed Transactions**:
   - Final transaction state
   - Payout amount
   - Completion date

3. **Earnings Summary**:
   - Total earnings (completed transactions)
   - Pending earnings (active transactions with funds held)
   - Transaction counts

### Integration with Buyer Flow

The seller flow is fully integrated with the buyer purchase flow:

- **STEP 2**: Buyer initiates purchase → Listing locked, transaction created
- **STEP 3**: Buyer confirms payment → Seller can see payment confirmation
- **STEP 4**: Seller delivers credentials → Buyer receives temporary access
- **STEP 5**: Buyer verifies account → Seller sees verification status
- **STEP 6**: Buyer signs agreement → Funds released to seller
- **STEP 7**: Transaction completed → Seller receives payment confirmation

### Legal Protections

1. **Payment Proof**: Escrow payment confirmation timestamped
2. **Delivery Proof**: Credential delivery timestamped and logged
3. **Buyer Signature**: Ownership agreement signature required before fund release
4. **Immutable Logs**: All actions logged with IP and timestamps
5. **No Reversals**: Once buyer accepts, transaction is final

### Seller Warnings

When delivering credentials (STEP 4), seller is warned:
> "Do not alter account details after submission."

This warning is:
- Shown in UI
- Logged in audit trail
- Part of seller agreement acknowledgment

### Next Steps

1. **Frontend Integration**:
   - Seller dashboard UI
   - Credential delivery form
   - Transaction status display
   - Earnings summary

2. **Email Notifications**:
   - Notify seller when buyer initiates purchase
   - Notify seller when payment confirmed
   - Notify seller when buyer verifies account
   - Notify seller when funds released

3. **Enhanced Protections**:
   - Seller reputation score
   - Auto-flag risky buyers
   - Partial payout holds for high-risk transactions
   - Dispute resolution interface

4. **Testing**:
   - Unit tests for each step
   - Integration tests for full flow
   - Edge case handling (payment failures, disputes, etc.)

## Benefits

1. **Seller Protection** - No credential exposure before payment
2. **Payment Guarantee** - Funds locked before delivery
3. **Clear Process** - Step-by-step flow with clear status
4. **Legal Clarity** - Explicit delivery moment and ownership transfer
5. **Audit Trail** - Complete record of all actions
6. **Dispute Prevention** - Evidence-based defense for sellers

## Buyer-Seller Symmetry

| Buyer Protection    | Seller Protection      |
| ------------------- | ---------------------- |
| Escrow payment      | Payment guaranteed     |
| Verification window | Time-bound delivery    |
| Dispute option      | Evidence-based defense |
| Digital signature   | Ownership finality     |
| Locked steps        | No reversals           |

Both flows are now fully implemented and integrated, providing equal protection for both parties while maintaining legal defensibility and auditability.

