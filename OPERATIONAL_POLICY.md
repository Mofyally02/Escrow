# ESCROW Platform - Operational Policy
## Admin Non-Interference & Security Policy

**Effective Date:** December 21, 2025  
**Version:** 1.0

---

## 1. Core Principle

**The platform never takes ownership of any freelance account.**

Escrow acts exclusively as a **neutral escrow agent and moderator**. We hold funds and facilitate secure handover, but the sale is strictly **between seller and buyer**.

---

## 2. Admin Access Prohibitions

### 2.1 Credential Access

**STRICTLY PROHIBITED:**
- Admins are **never** to request or receive account passwords
- Admins are **never** to view plaintext credentials
- Admins are **never** to log into any freelance account
- Admins are **never** to access accounts for any reason

**Technical Enforcement:**
- Credentials are encrypted with AES-256-GCM immediately upon submission
- Encryption key is derived from seller password + server pepper
- Admins see only "Encrypted – not visible" placeholder
- No endpoint exists for admin credential viewing
- Decryption is only possible via buyer reveal endpoint (in-memory, never logged)

### 2.2 Account Verification Process

**Allowed Admin Actions:**
- View listing metadata (title, description, price, etc.)
- View proof materials (screenshots, videos, documents)
- Request additional proof materials from seller
- Approve or reject listings based on visual verification
- Add admin notes for internal tracking

**Prohibited Admin Actions:**
- Requesting account credentials
- Logging into accounts to verify
- Accessing accounts for any purpose
- Viewing plaintext credentials

**Verification Requirements:**
- Seller must provide screenshots of profile, earnings, reviews
- Video screen recording (optional for high-value accounts)
- Partial proof (e.g., last 4 digits of linked payout method)
- Admin verifies visually — **never requires credentials**

---

## 3. Audit Trail Requirements

### 3.1 Mandatory Logging

**All admin actions must be logged:**
- Every moderation action (view proofs, approve, reject)
- Timestamp of action
- Admin user ID
- IP address
- User agent
- Action details

**No Exceptions:**
- No admin action can bypass audit logging
- Audit logs are immutable
- Super Admin can export full audit log for any listing/transaction

### 3.2 Audit Log Access

- **Regular Admins:** Can view their own audit logs
- **Super Admins:** Can view all audit logs and export for compliance
- **External Auditors:** Can request audit log exports (with proper authorization)

---

## 4. Admin Account Security

### 4.1 Authentication Requirements

**All admin accounts must:**
- Use hardware 2FA (YubiKey, Titan Security Key, etc.)
- Use strong passwords (minimum 16 characters, complexity required)
- Use unique passwords (not reused from other services)
- Enable account lockout after 5 failed login attempts

### 4.2 Access Monitoring

**All admin access is monitored:**
- Login attempts (successful and failed)
- IP address tracking
- Session duration
- Action frequency
- Unusual activity patterns

**Anomaly Detection:**
- Alerts on login from new IP addresses
- Alerts on login from new geographic locations
- Alerts on bulk actions (e.g., approving 10+ listings in 1 minute)
- Alerts on credential-related endpoint access attempts

---

## 5. Violation Consequences

### 5.1 Immediate Actions

**Violation of this policy results in:**
1. **Immediate account suspension**
2. **Immediate termination** (if confirmed violation)
3. **Full audit log review** of all actions by the violating admin
4. **Legal review** if violation involves credential access
5. **Notification to affected parties** (sellers/buyers) if applicable

### 5.2 Violation Types

**Severity Levels:**

**CRITICAL (Immediate Termination):**
- Requesting or receiving account passwords
- Viewing plaintext credentials
- Logging into any freelance account
- Attempting to access credentials via unauthorized means

**HIGH (Suspension + Review):**
- Bypassing audit logging
- Accessing admin endpoints without proper authorization
- Sharing admin credentials
- Violating data privacy policies

**MEDIUM (Warning + Training):**
- Failing to log actions properly
- Accessing accounts from unapproved locations
- Violating access monitoring requirements

---

## 6. Operational Procedures

### 6.1 Listing Review Process

**Standard Workflow:**
1. Admin receives notification of new listing submission
2. Admin views listing details and proof materials
3. Admin verifies visually (screenshots, videos, documents)
4. Admin requests additional info if needed (via platform messaging)
5. Admin approves or rejects based on proof materials
6. All actions logged automatically

**Never:**
- Request credentials from seller
- Log into account to verify
- Access account for any reason

### 6.2 Dispute Resolution

**Process:**
1. Review transaction audit logs
2. Review listing proof materials
3. Review buyer confirmation
4. Make decision based on available evidence
5. Never access account to resolve dispute

### 6.3 Credential Release

**Process:**
1. Buyer signs contract
2. Buyer pays into escrow
3. Buyer requests credential reveal (one-time only)
4. System decrypts credentials in-memory
5. Credentials shown to buyer once
6. Credentials never logged or stored in plaintext
7. Platform involvement ends after buyer confirmation

**Admin Role:**
- Admins have **no role** in credential release
- Credential release is **fully automated**
- Admins cannot view or access credentials at any stage

---

## 7. Training Requirements

### 7.1 Initial Training

**All new admins must:**
- Complete security training on credential handling
- Sign acknowledgment of this policy
- Pass quiz on admin non-interference principles
- Complete hands-on training on audit logging

### 7.2 Ongoing Training

**All admins must:**
- Complete quarterly security refresher training
- Review policy updates within 7 days
- Attend annual security awareness session
- Report any policy violations or concerns immediately

---

## 8. Compliance & Monitoring

### 8.1 Regular Audits

**Quarterly Reviews:**
- Review all admin actions for compliance
- Verify audit log completeness
- Check for unauthorized access attempts
- Review access patterns for anomalies

### 8.2 Reporting

**Incident Reporting:**
- All policy violations must be reported within 24 hours
- Super Admin must be notified immediately for critical violations
- External auditors may review compliance on request

### 8.3 Documentation

**Required Documentation:**
- All admin actions must be documented in audit logs
- Policy acknowledgments must be stored
- Training completion records must be maintained
- Violation reports must be archived

---

## 9. Policy Acknowledgment

**All admins must:**
- Read and understand this policy
- Sign electronic acknowledgment
- Agree to immediate termination for violations
- Commit to reporting any concerns or violations

**Acknowledgment Statement:**
> "I acknowledge that I have read, understood, and agree to comply with the ESCROW Platform Operational Policy. I understand that requesting or accessing account credentials, logging into accounts, or viewing plaintext credentials will result in immediate termination. I commit to following all procedures and reporting any violations immediately."

---

## 10. Contact & Reporting

**Policy Questions:**
- Email: security@escrow.com
- Internal: #security-policy Slack channel

**Violation Reporting:**
- Email: violations@escrow.com (confidential)
- Internal: Report to Super Admin immediately
- Anonymous: Use secure reporting form (link provided to admins)

---

## 11. Policy Updates

This policy may be updated at any time. All admins will be notified of changes and must acknowledge updated policy within 7 days.

**Last Updated:** December 21, 2025  
**Next Review:** March 21, 2026

---

## Appendix A: Technical Implementation

### A.1 Encryption
- **Algorithm:** AES-256-GCM
- **Key Derivation:** Argon2id (64MB memory, 3 iterations, 4 lanes)
- **Key Source:** Seller password + server pepper
- **Storage:** Encrypted credentials only, no plaintext

### A.2 Access Control
- **Admin Endpoints:** Role-based access control (RBAC)
- **Credential Endpoints:** Buyer-only, password-protected
- **Audit Logging:** Automatic, immutable, comprehensive

### A.3 Monitoring
- **Access Logs:** All admin actions logged
- **Anomaly Detection:** Automated alerts on suspicious patterns
- **Export Capability:** Super Admin can export audit logs

---

**This policy is legally binding and enforceable. Violations will result in immediate consequences as outlined above.**

