# Complete Security Implementation Guide

## Overview

This guide covers all security implementations for the GCC Scheduler app to prevent hacker modifications, secure passwords, and protect the database.

---

## 1. AUTHENTICATION SECURITY ✅

### 1.1 Password Hashing (Bcryptjs)

**What it does:**

- Converts plain text passwords to irreversible hashes
- Prevents password leaks even if Firebase is compromised
- Rate limits to prevent brute force attacks

**Files involved:**

- `functions/src/roleLogin.ts` - Cloud Function with bcryptjs
- Password hashes stored in Firebase Cloud Function env vars

**How it works:**

1. User enters password → Cloud Function (HTTPS)
2. Cloud Function hashes password locally (never leaves function)
3. Hash compared with stored hash using bcryptjs
4. If match → Custom Token issued to frontend
5. Frontend signs in with token, password forgotten

**Setup:**

```powershell
# 1. Generate password hashes (LOCAL - on your computer)
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourPassword', 10).then(h => console.log(h))"

# 2. Store hashes in Firebase (NOT passwords)
firebase functions:config:set auth.manager_pass_hash="$2a$10$..."
firebase deploy --only functions
```

See `SECURITY_PASSWORD_GUIDE.md` for complete password management.

---

## 2. DATABASE SECURITY ✅

### 2.1 Firestore Security Rules

**What it does:**

- Restricts who can read/write each collection
- Validates data before writing (prevents corruption)
- Enforces type checking and size limits
- Prevents unauthorized modifications

**Files involved:**

- `firestore.rules` - Security rules for Firestore

**Rules implemented:**

```firestore
✅ Public Read: Anyone can read schedule (employees need to see it)
✅ Restricted Write: Only manager/admin can write
✅ Payload Validation:
   - All required fields present
   - Correct field types
   - Timestamps within valid range
   - Array sizes limited (prevent DOS)
   - Config values within sane ranges
✅ Immutable Audit Logs: Only Cloud Function can write, cannot delete
✅ Deny Everything Else: No unintended access
```

**Deploy rules:**

```powershell
firebase deploy --only firestore:rules
```

**Test rules in Firebase Console:**

- Firestore → Simulator tab
- Simulate reads/writes from different roles
- Verify denied and allowed operations

---

## 3. AUDIT LOGGING ✅

### 3.1 Track All Changes

**What it does:**

- Records every modification to schedule
- Stores: who, when, what changed, hash of changes
- Immutable (cannot be deleted/modified)
- Only readable by manager/admin

**Files involved:**

- `functions/src/auditLogger.ts` - Cloud Function triggered on writes
- `firestore.rules` - Restricts read/write to audit logs

**Audit log structure:**

```typescript
{
  id: "uuid",                           // Unique identifier
  timestamp: 1704902400000,             // When change happened
  uid: "role-manager",                  // Who made change
  role: "manager",                      // Their role
  action: "write",                      // Type of change
  path: "artifacts/.../global_state",   // What was changed
  changes: {                            // Field-by-field diff
    "team": {
      "before": [...],
      "after": [...]
    },
    "overrides": { ... }
  },
  changeHash: "sha256hash..."           // Hash of changes (detect tampering)
}
```

**View audit logs:**

1. Firebase Console → Firestore
2. Navigate to: `artifacts/{APP_ID}/private/audit_logs/logs`
3. Click any log entry to see full details

**Use audit logs to:**

- Find unauthorized changes
- Restore previous data
- Detect hacker attacks
- Compliance/reporting

---

## 4. FRONTEND SECURITY ✅

### 4.1 Input Validation

**What it does:**

- Validates all user inputs before sending to server
- Prevents injection attacks
- Rejects malformed data
- Provides user feedback on errors

**Implemented in:**

- `src/components/LoginModal.tsx` - Password validation
- Form validation on all employee data edits

**Validation rules:**

```typescript
✅ Password: 1-500 characters
✅ Role: Must be "manager" or "admin"
✅ Employee names: 1-100 characters
✅ Dates: Valid date format, not in future
✅ No special characters that could cause injection
```

### 4.2 Dev-Only Logging

**What it does:**

- Removes all sensitive logs from production
- Prevents information leakage to browser console
- Keeps logs for development debugging

**Implemented in:**

- `src/App.tsx` - All console logs wrapped in `import.meta.env.DEV`
- Firebase debug messages disabled in production

**Production behavior:**

- No console output
- No Firebase debug info
- No stack traces visible to users

---

## 5. HTTP SECURITY HEADERS ✅

### 5.1 Security Headers

**What they do:**

- Prevent XSS attacks (X-XSS-Protection)
- Prevent clickjacking (X-Frame-Options)
- Enforce HTTPS (Strict-Transport-Security)
- Control resource loading (Content-Security-Policy)

**Implementation:**

Create `public/_headers` file:

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' *.firebase.com *.firebaseio.com https://*.cloudfunctions.net; frame-src https://www.gstatic.com/
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Deploy with GitHub Pages:**

- Copy `public/_headers` to your repo
- GitHub Pages automatically serves these headers

---

## 6. INFRASTRUCTURE SECURITY ✅

### 6.1 GitHub Pages + Cloudflare

**What it provides:**

- GitHub Pages: Free HTTPS, automatic deployments
- Cloudflare: Global CDN, DDoS protection, caching
- Zero-trust network connection to Firebase

**Setup:**

1. **GitHub Pages (automatic):**

   - GitHub Actions builds and deploys automatically
   - HTTPS enabled by default
   - Custom domain support

2. **Cloudflare (optional but recommended):**
   - Go to https://cloudflare.com
   - Add your domain
   - Point nameservers to Cloudflare
   - Enable "Full (strict)" SSL/TLS mode
   - Enable rate limiting:
     - Dashboard → Rate Limiting
     - 100 requests per 10 seconds per IP

### 6.2 Firebase Security

**Configured:**

- ✅ Anonymous auth disabled for writes (only reads)
- ✅ Custom claims required for writes (manager/admin)
- ✅ Firestore rules enforce validation
- ✅ Audit logging enabled
- ✅ Service accounts use Firebase Admin SDK
- ✅ No API keys exposed in production

---

## 7. ENVIRONMENT VARIABLES & SECRETS

### 7.1 GitHub Secrets (for GitHub Pages build)

**Store in:** GitHub Settings → Secrets and variables → Actions

```
VITE_FIREBASE_API_KEY=...           # Public, can be in code
VITE_FIREBASE_AUTH_DOMAIN=...       # Public, can be in code
VITE_FIREBASE_PROJECT_ID=...        # Public, can be in code
VITE_FIREBASE_STORAGE_BUCKET=...    # Public, can be in code
VITE_FIREBASE_MESSAGING_SENDER_ID=...  # Public, can be in code
VITE_FIREBASE_APP_ID=...            # Public, can be in code
VITE_CLOUD_FUNCTION_URL=...         # Public, endpoint only
VITE_APP_ID=...                     # Public, app identifier
```

**Important:** Firebase config is semi-public. Security depends on:

- Firestore rules (not Firebase config)
- Custom claims (manager/admin)
- Rate limiting
- Password hashing

### 7.2 Firebase Env Vars (for Cloud Functions)

**Store in:** Firebase Console → Functions → roleLogin → Runtime settings

```
MANAGER_PASS_HASH=$2a$10$...        # Hashed password (NEVER plain text)
ADMIN_PASS_HASH=$2a$10$...          # Hashed password (NEVER plain text)
```

**Important:** These are NOT in GitHub. They're only in Firebase.

---

## 8. DEPLOYMENT CHECKLIST

Before deploying to production:

### Cloud Functions Setup

- [ ] Create `functions/` directory
- [ ] Create `functions/src/roleLogin.ts` with bcryptjs
- [ ] Create `functions/src/auditLogger.ts`
- [ ] Create `functions/package.json` with dependencies
- [ ] Generate password hashes locally (don't commit)
- [ ] Set Firebase env vars with hashes
- [ ] Deploy functions: `firebase deploy --only functions`
- [ ] Test login with new password

### Firestore Security

- [ ] Update `firestore.rules` with validation rules
- [ ] Deploy rules: `firebase deploy --only firestore:rules`
- [ ] Test unauthorized write is rejected
- [ ] Test manager/admin write is allowed

### Frontend Updates

- [ ] Update `LoginModal.tsx` to use Cloud Function
- [ ] Set `VITE_CLOUD_FUNCTION_URL` env var
- [ ] All console logs wrapped in `import.meta.env.DEV`
- [ ] Input validation added
- [ ] No sensitive data in production logs

### GitHub Pages & Secrets

- [ ] Create GitHub Actions workflow (`.github/workflows/deploy.yml`)
- [ ] Set GitHub Secrets (Firebase config, app ID, Cloud Function URL)
- [ ] Create `public/_headers` with security headers
- [ ] Update `vite.config.ts` with base path
- [ ] Push to GitHub, verify deployment

### Testing

- [ ] App deploys successfully
- [ ] Firebase config loads
- [ ] Anonymous auth works (public read)
- [ ] Manager login works (calls Cloud Function)
- [ ] Admin login works (calls Cloud Function)
- [ ] Rate limiting works (5 failed attempts, 15-min lockout)
- [ ] Custom token creation succeeds
- [ ] Firestore sync works
- [ ] Offline mode works
- [ ] Audit logs created on write
- [ ] Security headers present (browser DevTools)
- [ ] No console logs in production
- [ ] HTTPS works (lock icon in browser)

### Security Testing

- [ ] Try to write without manager role → denied
- [ ] Try SQL injection in password → rejected
- [ ] Try XSS in employee name → stored safely, rendered as text
- [ ] Try brute force login → rate limited, 429 error
- [ ] View source code → no passwords, no sensitive data
- [ ] Check browser DevTools → no logs leaking info
- [ ] Check network tab → all requests over HTTPS

---

## 9. INCIDENT RESPONSE

### If You Suspect Unauthorized Access:

1. **Immediate actions:**

   ```
   [ ] Change manager/admin passwords (new hashes)
   [ ] Redeploy Cloud Function
   [ ] Check audit logs for unauthorized changes
   [ ] Review Firestore backup and restore if needed
   ```

2. **Investigation:**

   ```
   [ ] View audit log collection for suspects
   [ ] Check timestamps and changed fields
   [ ] Compare with known schedule edits
   [ ] Look for pattern (same IP, similar times, etc.)
   ```

3. **Recovery:**

   ```
   [ ] Use Firestore backup to restore correct state
   [ ] Export audit logs for records
   [ ] Document incident
   [ ] Train team on security
   ```

4. **Prevention:**
   ```
   [ ] Enable Cloud Audit Logs (for infrastructure)
   [ ] Enable Firestore backup
   [ ] Increase audit logging detail
   [ ] Implement additional IP whitelisting if needed
   ```

---

## 10. ONGOING MAINTENANCE

### Weekly

- Check audit logs for unusual activity
- Verify Cloud Function is running without errors

### Monthly

- Review Firestore rules for any gaps
- Test rate limiting effectiveness
- Check GitHub Actions deployments succeeded

### Quarterly (Every 90 days)

- Rotate manager/admin passwords
- Review and update security policies
- Test incident response procedures

### Annually

- Security audit
- Update dependencies
- Review and update this guide

---

## Support & Documentation

- **Password Management:** See `SECURITY_PASSWORD_GUIDE.md`
- **Firebase Rules:** https://firebase.google.com/docs/firestore/security/get-started
- **Cloud Functions:** https://firebase.google.com/docs/functions
- **Bcryptjs:** https://github.com/dcodeIO/bcryptjs
- **OWASP Top 10:** https://owasp.org/Top10/

---

## Questions?

1. Check Firebase Cloud Function logs:

   ```
   firebase functions:log
   ```

2. Check Firestore audit logs for access patterns

3. Verify Firestore rules simulator accepts your test case

4. Review browser DevTools Network tab for any failed requests

---

**Last Updated:** January 10, 2026
**Version:** 1.0 - Complete Security Implementation
