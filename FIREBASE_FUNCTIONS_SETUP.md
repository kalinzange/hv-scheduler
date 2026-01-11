# Firebase Functions Setup Guide

This guide covers deploying and configuring Firebase Functions for secure role-based authentication.

## Overview

The app uses Firebase Functions to handle password verification and custom token generation server-side. This prevents client-side password exposure and enables secure role-based access control.

## Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project initialized: `firebase init`
- Node.js 18+ installed

## 1. Generate Password Hashes

Manager and Admin passwords are stored as bcrypt hashes in environment variables.

### Option A: Using Node.js REPL

```bash
cd functions
npm install
node
```

Then in the Node REPL:

```javascript
const bcrypt = require("bcryptjs");

// Generate Manager password hash
bcrypt.hash("YOUR_MANAGER_PASSWORD", 10, (err, hash) => {
  console.log("MANAGER_PASS_HASH:", hash);
});

// Generate Admin password hash
bcrypt.hash("YOUR_ADMIN_PASSWORD", 10, (err, hash) => {
  console.log("ADMIN_PASS_HASH:", hash);
});
```

Press `Ctrl+C` twice to exit when done.

### Option B: Create a Script

Create `functions/generate-hashes.js`:

```javascript
const bcrypt = require("bcryptjs");

const managerPass = process.argv[2] || "default-manager-pass";
const adminPass = process.argv[3] || "default-admin-pass";

console.log("Generating hashes...\n");

bcrypt.hash(managerPass, 10, (err, hash) => {
  console.log("MANAGER_PASS_HASH=", hash);
});

bcrypt.hash(adminPass, 10, (err, hash) => {
  console.log("ADMIN_PASS_HASH=", hash);
});
```

Run it:

```bash
cd functions
node generate-hashes.js "YourManagerPassword123" "YourAdminPassword456"
```

## 2. Set Environment Variables

### For Local Development

Create `functions/.env` (this file is gitignored):

```env
MANAGER_PASS_HASH=$2a$10$... (your hash from step 1)
ADMIN_PASS_HASH=$2a$10$... (your hash from step 1)
```

### For Production (Firebase)

```bash
firebase functions:secrets:set MANAGER_PASS_HASH
# Paste the hash when prompted

firebase functions:secrets:set ADMIN_PASS_HASH
# Paste the hash when prompted
```

**Alternative using config:**

```bash
firebase functions:config:set auth.manager_hash="$2a$10$..."
firebase functions:config:set auth.admin_hash="$2a$10$..."
```

If using `functions:config`, update [functions/src/roleLogin.ts](functions/src/roleLogin.ts#L57-L58) to:

```typescript
const managerHash = functions.config().auth.manager_hash;
const adminHash = functions.config().auth.admin_hash;
```

## 3. Deploy Functions

### Deploy All Functions

```bash
firebase deploy --only functions
```

### Deploy Specific Function

```bash
firebase deploy --only functions:roleLogin
```

### Check Deployment Status

```bash
firebase functions:log
```

## 4. Get Function URL

After deployment, Firebase outputs the function URL:

```
Function URL (roleLogin): https://us-central1-YOUR_PROJECT.cloudfunctions.net/roleLogin
```

## 5. Update Client Environment Variables

Add the function URL to your environment variables:

### For Local Development

Create/update `.env.local`:

```env
VITE_CLOUD_FUNCTION_URL=https://us-central1-YOUR_PROJECT.cloudfunctions.net/roleLogin
```

### For GitHub Pages (Production)

Add as a GitHub Secret:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add secret:
   - Name: `VITE_CLOUD_FUNCTION_URL`
   - Value: `https://us-central1-YOUR_PROJECT.cloudfunctions.net/roleLogin`

Your workflow already injects this in the build step:

```yaml
env:
  VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
  VITE_CLOUD_FUNCTION_URL: ${{ secrets.VITE_CLOUD_FUNCTION_URL }}
  # ... other vars
```

## 6. Testing

### Local Testing

```bash
# Terminal 1: Start the emulator
cd functions
npm run serve

# Terminal 2: Test the endpoint
curl -X POST http://localhost:5001/YOUR_PROJECT/us-central1/roleLogin \
  -H "Content-Type: application/json" \
  -d '{"role":"manager","password":"YOUR_MANAGER_PASSWORD"}'
```

Expected response:

```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Production Testing

Update `.env.local` with the production URL and test login in your app.

## 7. Security Notes

### Rate Limiting

The function has built-in rate limiting:

- 5 failed attempts per IP
- 15-minute lockout after exceeding limit
- Tracks attempts in-memory (resets on function cold start)

For persistent rate limiting, consider using Firebase Firestore or Redis.

### CORS Configuration

The function accepts requests from any origin with credentials. To restrict:

Update [functions/src/roleLogin.ts](functions/src/roleLogin.ts#L22):

```typescript
cors({
  origin: ['https://your-domain.github.io'],
  credentials: true
})(req, res, async () => {
```

### Password Requirements

Current validation:

- Length: 1-500 characters
- No complexity requirements

To add complexity requirements, update [functions/src/roleLogin.ts](functions/src/roleLogin.ts#L70-L73).

## 8. Monitoring

### View Logs

```bash
firebase functions:log
```

### Real-time Logs

```bash
firebase functions:log --only roleLogin
```

### Check Errors

```bash
firebase functions:log --only roleLogin --lines 100 | grep ERROR
```

## 9. Troubleshooting

### Function Not Found

```
Error: Failed to get function roleLogin
```

**Solution:** Deploy the function:

```bash
firebase deploy --only functions:roleLogin
```

### Environment Variables Not Set

```
Error: Password hash not configured
```

**Solution:** Set the secrets:

```bash
firebase functions:secrets:set MANAGER_PASS_HASH
firebase functions:secrets:set ADMIN_PASS_HASH
```

### CORS Errors

```
Access-Control-Allow-Origin header is missing
```

**Solution:** The function already includes CORS headers. Check browser console for actual error.

### Too Many Attempts

```
429 - Too many login attempts
```

**Solution:** Wait 15 minutes or restart the function (production only):

```bash
firebase functions:delete roleLogin
firebase deploy --only functions:roleLogin
```

### Invalid Token

```
auth/invalid-custom-token
```

**Solution:** Ensure Firebase project ID matches between client and functions.

## 10. Updating Passwords

### Change Manager Password

1. Generate new hash:

   ```bash
   cd functions
   node -e "require('bcryptjs').hash('NEW_PASSWORD', 10, (e,h) => console.log(h))"
   ```

2. Update secret:

   ```bash
   firebase functions:secrets:set MANAGER_PASS_HASH
   ```

3. Redeploy:
   ```bash
   firebase deploy --only functions:roleLogin
   ```

### Change Admin Password

Same steps as above, but use `ADMIN_PASS_HASH`.

## 11. Cost Considerations

Firebase Functions pricing (Blaze plan required for production):

- **Free tier:** 2M invocations/month
- **Paid:** $0.40 per million invocations
- **Network:** $0.12 per GB

Typical usage:

- ~10 logins/day = 300/month (well within free tier)

## 12. Backup & Rollback

### Backup Current Deployment

```bash
# View current config
firebase functions:config:get > functions-config-backup.json
```

### Rollback to Previous Version

Firebase keeps previous versions. To rollback:

1. Go to Firebase Console → Functions
2. Select `roleLogin`
3. Click "Rollback" next to previous version

Or redeploy from git:

```bash
git checkout <previous-commit>
firebase deploy --only functions:roleLogin
git checkout main
```

## Next Steps

1. ✅ Generate password hashes
2. ✅ Set environment variables (local & Firebase)
3. ✅ Deploy functions
4. ✅ Add function URL to GitHub Secrets
5. ✅ Test locally with curl
6. ✅ Test production login in app
7. ✅ Monitor logs for errors

## Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Auth Custom Tokens](https://firebase.google.com/docs/auth/admin/create-custom-tokens)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
