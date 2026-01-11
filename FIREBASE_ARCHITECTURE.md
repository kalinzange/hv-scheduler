# Firebase Functions Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATION                              │
│                     (React + TypeScript + Vite)                        │
└───────────────────────────┬────────────────────────────────────────────┘
                           │
                           │ HTTPS POST
                           │ Content-Type: application/json
                           │ Body: {role: "manager", password: "******"}
                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       FIREBASE CLOUD FUNCTION                           │
│                          roleLogin (HTTP)                              │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                    Rate Limiter                                   │ │
│  │  - Track attempts per IP address                                 │ │
│  │  - 5 attempts max                                                 │ │
│  │  - 15 minute lockout                                             │ │
│  │  - In-memory cache (resets on cold start)                        │ │
│  └────────────────────────┬─────────────────────────────────────────┘ │
│                           │                                             │
│                           ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                 Password Verification                             │ │
│  │  - Get hash from env: process.env.MANAGER_PASS_HASH              │ │
│  │  - bcrypt.compare(password, hash)                                │ │
│  │  - 10 rounds, secure hashing                                     │ │
│  └────────────────────────┬─────────────────────────────────────────┘ │
│                           │                                             │
│                           ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │              Custom Token Generation                              │ │
│  │  - Get/create anonymous user UID                                 │ │
│  │  - Create custom claims: {role, loginTime}                       │ │
│  │  - admin.auth().createCustomToken(uid, claims)                   │ │
│  │  - Return: {token: "eyJhbGciOi..."}                              │ │
│  └────────────────────────┬─────────────────────────────────────────┘ │
└────────────────────────────┴────────────────────────────────────────────┘
                           │
                           │ Response: 200 OK
                           │ {token: "custom-token..."}
                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FIREBASE AUTHENTICATION                          │
│                  signInWithCustomToken(auth, token)                    │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  - Verify token signature                                         │ │
│  │  - Extract custom claims                                          │ │
│  │  - Create authenticated user session                              │ │
│  │  - Set currentUser with claims                                    │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬───────────────────────────────────────────┘
                           │
                           │ Auth State Changed
                           │ user = {uid, customClaims: {role, loginTime}}
                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION STATE                               │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  currentUser: {                                                   │ │
│  │    uid: "firebase-uid",                                          │ │
│  │    role: "manager",                                              │ │
│  │    name: "Diretor",                                              │ │
│  │    loginTime: 1234567890                                         │ │
│  │  }                                                                │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬───────────────────────────────────────────┘
                           │
                           │ User Actions (Publish Schedule)
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         FIRESTORE DATABASE                              │
│                    artifacts/{appId}/public/data/...                   │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                    Security Rules Check                           │ │
│  │                                                                    │ │
│  │  function hasWriteAccess() {                                     │ │
│  │    return request.auth != null &&                                │ │
│  │           request.auth.token.role in ['manager', 'admin'];       │ │
│  │  }                                                                │ │
│  │                                                                    │ │
│  │  allow write: if hasWriteAccess() && isValidGlobalState();       │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                          SECURITY LAYERS
═══════════════════════════════════════════════════════════════════════════

Layer 1: Rate Limiting
━━━━━━━━━━━━━━━━━━━━━━
  Purpose: Prevent brute force attacks
  Implementation: In-memory cache in Cloud Function
  Limits: 5 attempts per IP, 15 minute cooldown
  Reset: On function cold start

Layer 2: Password Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Purpose: Verify user identity
  Implementation: bcrypt.compare() with hashed passwords
  Storage: Firebase Functions secrets (MANAGER_PASS_HASH, ADMIN_PASS_HASH)
  Security: 10 rounds of bcrypt hashing

Layer 3: Custom Claims
━━━━━━━━━━━━━━━━━━━━━━━━
  Purpose: Authorize user actions
  Implementation: Firebase Auth custom tokens
  Claims: {role: "manager", loginTime: timestamp}
  Validation: Checked by Firestore security rules

Layer 4: Firestore Rules
━━━━━━━━━━━━━━━━━━━━━━━━━━
  Purpose: Database-level access control
  Implementation: Security rules check auth.token.role
  Read: Public (schedule data is non-sensitive)
  Write: Only users with role in ['manager', 'admin']


═══════════════════════════════════════════════════════════════════════════
                          DATA FLOW EXAMPLE
═══════════════════════════════════════════════════════════════════════════

Viewer Login (Anonymous)
━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. App loads → signInAnonymously()
  2. Firebase Auth creates anonymous user
  3. User can READ published schedules
  4. User CANNOT WRITE (no role claim)

Manager Login
━━━━━━━━━━━━━━━
  1. User enters password in LoginModal
  2. POST to roleLogin function
  3. Function verifies password with bcrypt
  4. Function creates custom token with {role: "manager"}
  5. Client calls signInWithCustomToken(token)
  6. Firebase Auth authenticates user
  7. User can READ and WRITE (role: "manager")

Publish Schedule
━━━━━━━━━━━━━━━━
  1. Manager clicks "Publish" button
  2. App calls Firestore updateDoc()
  3. Firestore rules check: request.auth.token.role in ['manager', 'admin']
  4. If passed: Write succeeds, lastPublished timestamp updated
  5. If failed: Write rejected with permission denied

Viewer Tries to Publish
━━━━━━━━━━━━━━━━━━━━━━━━
  1. Viewer clicks "Publish" button (hypothetically)
  2. App calls Firestore updateDoc()
  3. Firestore rules check: request.auth.token.role
  4. Check fails: No role claim in token
  5. Write rejected: "Missing or insufficient permissions"


═══════════════════════════════════════════════════════════════════════════
                        ENVIRONMENT VARIABLES
═══════════════════════════════════════════════════════════════════════════

Client (.env.local)
━━━━━━━━━━━━━━━━━━━
  VITE_CLOUD_FUNCTION_URL    - roleLogin endpoint URL
  VITE_FIREBASE_API_KEY      - Firebase project API key
  VITE_FIREBASE_AUTH_DOMAIN  - Auth domain
  VITE_FIREBASE_PROJECT_ID   - Project ID
  VITE_FIREBASE_STORAGE_BUCKET - Storage bucket
  VITE_FIREBASE_MESSAGING_SENDER_ID - Messaging sender ID
  VITE_FIREBASE_APP_ID       - App ID

Functions (Firebase Secrets)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MANAGER_PASS_HASH          - bcrypt hash of manager password
  ADMIN_PASS_HASH            - bcrypt hash of admin password

GitHub Actions (Repository Secrets)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  All VITE_* variables above
  Used during build step to inject into production bundle


═══════════════════════════════════════════════════════════════════════════
                          DEPLOYMENT FLOW
═══════════════════════════════════════════════════════════════════════════

Local Development
━━━━━━━━━━━━━━━━━━━
  1. npm install
  2. Create .env.local with Firebase config
  3. npm run dev
  4. Test at localhost:5173/hv-scheduler/

Functions Deployment
━━━━━━━━━━━━━━━━━━━━
  1. cd functions && npm install
  2. node generate-hashes.js "pass1" "pass2"
  3. firebase functions:secrets:set MANAGER_PASS_HASH
  4. firebase functions:secrets:set ADMIN_PASS_HASH
  5. firebase deploy --only functions
  6. Copy function URL

Production Deployment
━━━━━━━━━━━━━━━━━━━━━
  1. Add VITE_CLOUD_FUNCTION_URL to GitHub Secrets
  2. git push origin main
  3. GitHub Actions builds with secrets injected
  4. Deploys to GitHub Pages
  5. Live at https://username.github.io/hv-scheduler/


═══════════════════════════════════════════════════════════════════════════
                         MONITORING & LOGS
═══════════════════════════════════════════════════════════════════════════

View Function Logs
━━━━━━━━━━━━━━━━━━━
  firebase functions:log --only roleLogin

Filter by Severity
━━━━━━━━━━━━━━━━━━
  firebase functions:log | grep ERROR
  firebase functions:log | grep WARN

Check Metrics
━━━━━━━━━━━━━
  Firebase Console → Functions → roleLogin → Metrics
  - Invocations per day
  - Error rate
  - Execution time
  - Memory usage

Client-Side Logs
━━━━━━━━━━━━━━━━
  Browser DevTools → Console
  - Authentication state changes
  - API errors
  - Permission denials

Firestore Audit Trail
━━━━━━━━━━━━━━━━━━━━━
  artifacts/{appId}/private/audit_logs/
  - Tracks all write operations
  - Includes user, timestamp, changes
  - Immutable (delete prohibited by rules)
```

## Quick Reference

### Test Login Flow

```bash
# Using curl
curl -X POST https://us-central1-PROJECT.cloudfunctions.net/roleLogin \
  -H "Content-Type: application/json" \
  -d '{"role":"manager","password":"test123"}'

# Expected response
{"token":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

### Decode Custom Token

```javascript
// In browser console after login
firebase
  .auth()
  .currentUser.getIdTokenResult()
  .then((result) => console.log(result.claims));
// Output: {role: "manager", loginTime: 1234567890, ...}
```

### Check Firestore Rules

```bash
firebase firestore:rules:get
```

### View Active Sessions

```bash
# Firebase Console → Authentication → Users
# Shows all authenticated users with UID and metadata
```

## See Also

- [FIREBASE_FUNCTIONS_SUMMARY.md](FIREBASE_FUNCTIONS_SUMMARY.md) - Overview
- [FIREBASE_DEPLOYMENT_CHECKLIST.md](FIREBASE_DEPLOYMENT_CHECKLIST.md) - Deployment steps
- [FIREBASE_FUNCTIONS_SETUP.md](FIREBASE_FUNCTIONS_SETUP.md) - Detailed setup
- [FIREBASE_QUICK_REFERENCE.md](FIREBASE_QUICK_REFERENCE.md) - Command reference
