# Internal Runbooks

## Resolving Stuck Escrow

### Symptoms
- Transaction stuck in FUNDS_HELD or CONTRACT_SIGNED state
- Buyer cannot confirm access
- Credentials not revealed

### Steps

1. **Check Transaction State**
   ```sql
   SELECT id, state, buyer_id, seller_id, listing_id, created_at
   FROM transactions
   WHERE id = <transaction_id>;
   ```

2. **Check Credential Reveal Status**
   ```sql
   SELECT revealed_at, revealed_to_user_id
   FROM credential_vaults
   WHERE listing_id = <listing_id>;
   ```

3. **Check Paystack Status**
   - Verify payment authorization in Paystack dashboard
   - Check webhook events in `payment_events` table

4. **Resolution Options**
   - If credentials not revealed: Buyer can use `/transactions/{id}/reveal`
   - If buyer confirmed but payout failed: Check Paystack transfer logs
   - If stuck > 7 days: Super Admin can force release or refund

5. **Manual Intervention**
   ```python
   # Super Admin force release
   POST /api/v1/admin/transactions/{id}/release
   {
     "reason": "Stuck transaction resolved - buyer confirmed access"
   }
   ```

## Dispute Resolution Process

### When to Escalate
- Buyer claims credentials don't work
- Seller claims payment not received
- Account access issues after transfer
- Platform ban after transfer

### Steps

1. **Gather Information**
   - Transaction details
   - Audit logs for transaction
   - Communication between buyer/seller
   - Screenshots/proof from both parties

2. **Investigate**
   - Check credential reveal timestamp
   - Verify Paystack payment status
   - Review audit logs for anomalies
   - Check listing proof files

3. **Decision Matrix**
   - **Buyer at fault**: No refund (account works, buyer changed password)
   - **Seller at fault**: Full refund + listing removed
   - **Platform issue**: Full refund + compensation
   - **Unclear**: Escalate to Super Admin

4. **Action**
   ```python
   # Refund buyer
   POST /api/v1/admin/transactions/{id}/refund
   {
     "reason": "Seller provided invalid credentials - verified by admin"
   }
   
   # Or force release
   POST /api/v1/admin/transactions/{id}/release
   {
     "reason": "Buyer confirmed access - seller payout authorized"
   }
   ```

5. **Documentation**
   - Log decision in transaction notes
   - Update audit log
   - Notify both parties

## Disaster Recovery

### Database Backup

**Daily Backups**
```bash
# PostgreSQL backup
pg_dump -U escrow -d escrow_prod > backup_$(date +%Y%m%d).sql

# Restore
psql -U escrow -d escrow_prod < backup_20241216.sql
```

**Automated Backups**
- Configure cron job or use managed database service
- Store backups in S3/cloud storage
- Test restore procedure monthly

### Recovery Procedures

**Database Corruption**
1. Stop application
2. Restore from latest backup
3. Replay transaction logs (if using WAL)
4. Verify data integrity
5. Restart application

**Credential Vault Recovery**
- Credentials are encrypted - cannot be recovered without user password
- If encryption key lost: Credentials are permanently lost
- **Prevention**: Backup encryption pepper securely

**Transaction Recovery**
- Transactions are immutable (audit log)
- Can rebuild transaction state from audit logs
- Use audit logs to verify transaction history

## Incident Response

### Severity Levels

**P0 - Critical**
- Payment system down
- Credential decryption failing
- Database unavailable
- Response: Immediate, all hands

**P1 - High**
- API errors affecting users
- OTP delivery failing
- Webhook processing issues
- Response: Within 1 hour

**P2 - Medium**
- Performance degradation
- Non-critical feature broken
- Response: Within 4 hours

**P3 - Low**
- Minor bugs
- Documentation issues
- Response: Next business day

### Response Steps

1. **Acknowledge** - Confirm incident in monitoring
2. **Assess** - Determine severity and impact
3. **Communicate** - Notify team and users (if needed)
4. **Mitigate** - Take immediate action to reduce impact
5. **Resolve** - Fix root cause
6. **Post-Mortem** - Document and learn

## Monitoring Alerts

### Critical Alerts

- **Failed Payouts**: Alert immediately
- **Database Errors**: Alert if > 5 errors/minute
- **High Error Rate**: Alert if error rate > 5%
- **Admin Actions**: Log all, alert on refunds/releases

### Warning Alerts

- **High Latency**: p95 > 500ms
- **Low OTP Success Rate**: < 95%
- **Unusual Login Patterns**: Multiple failed logins

### Monitoring Queries

```sql
-- Failed transactions in last hour
SELECT COUNT(*) FROM transactions
WHERE state = 'refunded'
AND refunded_at > NOW() - INTERVAL '1 hour';

-- High-value stuck transactions
SELECT id, amount_usd, state, created_at
FROM transactions
WHERE state IN ('funds_held', 'contract_signed')
AND created_at < NOW() - INTERVAL '7 days';
```

