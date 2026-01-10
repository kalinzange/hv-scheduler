# Password Management & Security Guide

## Architecture Overview

### Security Model

Your app uses a **server-side password hashing** model:

```
Plain Text Password (user enters)
           ↓
Cloud Function (HTTPS encrypted)
           ↓
Bcryptjs: compare(password, HASH)
           ↓
Hash stored in Firebase env vars (NOT plain text)
           ↓
Custom Token issued to frontend
           ↓
Firebase Auth signs in with token
```

**Key Security Properties:**

- ✅ Passwords never stored anywhere
- ✅ Passwords hashed with bcryptjs (industry standard)
- ✅ Only hashes in environment variables
- ✅ GitHub has no access to actual passwords
- ✅ Rate limited: 5 attempts per IP, 15-minute lockout

---

## Changing Manager/Admin Passwords

### Step 1: Generate New Password Hash Locally

**On your computer (NOT in the cloud):**

```powershell
# Option A: Using Node.js (if you have Node installed)
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourNewPassword123', 10).then(h => console.log(h))"
```

**Output example:**

```
$2a$10$Ku.j7Yq6VxKu.j7Yq6VxKu.j7Yq6VxKu.j7Yq6VxKu.j7Yq6VxKu
```

**Option B: Online bcryptjs tool (NOT recommended for sensitive passwords)**

- Use only if you don't have Node.js
- Go to: https://bcryptjs.org/
- Enter password, copy the hash

### Step 2: Update Firebase Cloud Function Environment Variables

1. **Login to Firebase Console:**

   - Go to: https://console.firebase.google.com/
   - Select your project

2. **Navigate to Functions:**

   - Left menu → Functions
   - Click on `roleLogin`
   - Select "Runtime settings" tab

3. **Update Environment Variables:**

   - Find: `MANAGER_PASS_HASH` or `ADMIN_PASS_HASH`
   - Click the pencil icon to edit
   - Replace with your new hash (from Step 1)
   - Click "Save"

   Example:

   ```
   MANAGER_PASS_HASH = $2a$10$Ku.j7Yq6VxKu.j7Yq6VxKu.j7Yq6VxKu.j7Yq6VxKu.j7Yq6VxKu
   ```

4. **Redeploy the function:**
   ```powershell
   firebase deploy --only functions:roleLogin
   ```

### Step 3: Test the New Password

1. Open your app
2. Click on Manager or Admin role
3. Try logging in with the new password
4. Verify it works

---

## Security Best Practices for Passwords

### ✅ DO:

- Use strong passwords: 16+ characters, mix of upper/lowercase, numbers, symbols
- Example strong password: `Shift@2024$Mgr#7!kL`
- Change passwords every 90 days
- Use different passwords for Manager and Admin roles
- Store the original passwords in a secure password manager (Bitwarden, 1Password, etc.)
- Keep password hash generation local (your computer only)

### ❌ DON'T:

- Share passwords in Slack, email, Teams, or GitHub
- Use simple passwords like `manager123` or `password`
- Store plain text passwords anywhere
- Use same password for multiple roles
- Commit password hashes to GitHub
- Share Firebase console access unnecessarily

---

## What's Protected

### At REST (stored):

- ✅ Password hashes stored in Firebase (not plain text)
- ✅ Firestore rules enforce write access per role
- ✅ Audit logs track all changes

### In TRANSIT (network):

- ✅ HTTPS encryption (automatic)
- ✅ Firebase validates custom tokens
- ✅ Passwords sent to Cloud Function only once

### At RISK (Frontend):

- ⚠️ Browser memory (unavoidable) - mitigated by rate limiting and session timeout
- ⚠️ Keyloggers on user's computer - educate staff on security

---

## Emergency: Compromised Password

If you suspect a password was compromised:

1. **Immediately change the password:**

   - Generate new hash (Step 1 above)
   - Update Firebase env var (Step 2)
   - Redeploy function

2. **Review audit logs:**

   ```
   Firebase Console → Firestore → artifacts → [appId] → private → audit_logs
   ```

   Look for unauthorized changes to the schedule.

3. **Revert unauthorized changes:**

   - Use Firestore backups or manually restore
   - Export schedule data before changes

4. **Enforce new password to all users:**
   - Tell Manager/Admin about password change
   - Force logout by clearing browser cache/cookies

---

## Rotating ALL Passwords (Best Practice)

**Quarterly (every 90 days):**

```
Step 1: Generate new Manager hash
Step 2: Generate new Admin hash
Step 3: Update BOTH in Firebase
Step 4: Redeploy function
Step 5: Notify Manager & Admin of new passwords
Step 6: Log and document in your records
```

---

## Technical Details

### Why Bcryptjs?

- **Purpose**: One-way password hashing (cannot reverse)
- **Cost Factor**: 10 (default, good balance of security vs. speed)
- **Salting**: Automatic (salt included in hash)
- **Time to hash**: ~100-200ms per comparison (good for security)

### Why Not Plain Text Comparison?

```javascript
// ❌ INSECURE (current Netlify setup)
if (password === "managerPassword") { ... }

// ✅ SECURE (new setup)
const matches = await bcrypt.compare(password, "$2a$10$...");
```

**Problems with plain text:**

- If env var leaks, password is known
- Same hash every time (vulnerable to dictionary attacks)
- No salting

---

## Disaster Recovery

### If you forgot the password:

**Option 1: Set a new one (recommended)**

- Generate new hash locally
- Update Firebase env var
- Deploy new function
- Test login

**Option 2: Firebase Console Access (if you have it)**

- Create a new user via Firebase Auth
- Reassign role via custom token

---

## Questions & Troubleshooting

**Q: Where is my password stored?**
A: Only the hash is in Firebase Cloud Function env vars. The plain text password exists only in your password manager.

**Q: Can Firebase see my password?**
A: No. Firebase only stores the hash and compares hashes, never the plain text.

**Q: What if I lose the password?**
A: You can always generate a new one and update the hash. The old password becomes invalid.

**Q: How do I view current password hashes?**
A: Go to Firebase Console → Functions → roleLogin → Runtime settings. Hashes are masked for security.

**Q: Is HTTPS enough?**
A: No. HTTPS encrypts in transit, but passwords should also be hashed at rest. Both are needed.

---

## Deployment Checklist

Before going to production:

- [ ] Password hashes generated locally
- [ ] Hashes stored in Firebase Cloud Function env vars
- [ ] Cloud Function deployed and tested
- [ ] LoginModal uses Cloud Function URL (VITE_CLOUD_FUNCTION_URL)
- [ ] Firestore rules deployed with validation
- [ ] Audit logging enabled
- [ ] Rate limiting tested (5 attempts trigger lockout)
- [ ] HTTPS enabled (automatic on GitHub Pages)
- [ ] GitHub Secrets configured (Firebase config only, NOT passwords)
- [ ] Team trained on strong passwords

---

## Support

For issues:

1. Check Firebase Cloud Function logs:

   ```powershell
   firebase functions:log
   ```

2. Check Firestore audit logs for unauthorized access

3. Verify network is using HTTPS (lock icon in browser)

4. Ensure rate limiting isn't blocking legitimate logins (try after 15 minutes)
