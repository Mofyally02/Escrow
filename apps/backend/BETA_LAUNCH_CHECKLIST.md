# Beta Launch Checklist

## Pre-Launch Security

- [ ] External penetration test completed
- [ ] All critical/high vulnerabilities fixed
- [ ] Security headers middleware enabled
- [ ] HSTS enabled in production
- [ ] CSP headers configured
- [ ] All secrets rotated
- [ ] Super Admin 2FA enabled
- [ ] WAF rules configured (Cloudflare)

## Observability

- [ ] Sentry DSN configured and tested
- [ ] Prometheus metrics endpoint accessible
- [ ] Grafana dashboards created:
  - [ ] API latency (p50, p95, p99)
  - [ ] Error rates by endpoint
  - [ ] Transaction state distribution
  - [ ] OTP delivery success rate
  - [ ] Paystack webhook latency
- [ ] Alerting configured:
  - [ ] Failed payouts
  - [ ] Multiple failed logins
  - [ ] Admin actions
  - [ ] Database errors
  - [ ] High error rates

## Performance

- [ ] Load testing completed (200 concurrent users)
- [ ] p95 API response < 300ms under load
- [ ] Database indexes applied
- [ ] Query optimization verified
- [ ] Redis caching configured (if applicable)

## Beta Onboarding

- [ ] 20-30 vetted listings seeded
- [ ] 50 trusted sellers invited
- [ ] 100 pre-qualified buyers invited
- [ ] Onboarding documentation sent
- [ ] Support channels established (Discord/Telegram)

## Legal & Compliance

- [ ] Terms of Service reviewed and published
- [ ] Privacy Policy reviewed and published
- [ ] Platform ban disclaimer added
- [ ] E-signature legality verified
- [ ] Legal sign-off obtained

## Documentation

- [ ] API documentation (Swagger/ReDoc) polished
- [ ] Internal runbooks created:
  - [ ] How to resolve stuck escrow
  - [ ] Dispute resolution process
  - [ ] Disaster recovery (DB backup/restore)
  - [ ] Incident response playbook

## Production Deployment

- [ ] Production environment configured
- [ ] Zero-downtime deployment strategy tested
- [ ] Database backups automated
- [ ] SSL certificates configured
- [ ] Domain DNS configured
- [ ] CDN configured (Cloudflare)

## Go-Live Criteria

- [ ] First 5+ completed real transactions
- [ ] No critical bugs in production
- [ ] Monitoring shows stable performance
- [ ] Support team trained
- [ ] Feedback collection mechanism active

