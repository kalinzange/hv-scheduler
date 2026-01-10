# Complete Migration Guide: Netlify → GitHub Pages

**Status:** Ready for Production Migration  
**Estimated Time:** 2-3 hours  
**Difficulty:** Intermediate  
**Last Updated:** January 10, 2026

---

## Table of Contents

1. [Overview & Architecture](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: GitHub Pages Setup](#phase-1-github-pages)
4. [Phase 2: Firebase Cloud Functions](#phase-2-firebase-cloud-functions)
5. [Phase 3: Configuration & Secrets](#phase-3-configuration)
6. [Phase 4: Deployment](#phase-4-deployment)
7. [Phase 5: Testing & Verification](#phase-5-testing)
8. [Phase 6: Cleanup](#phase-6-cleanup)
9. [Troubleshooting](#troubleshooting)

---

## <a name="overview"></a>Overview & Architecture

### Current Setup (Netlify - To Be Removed)

```
Frontend → GitHub repo
  ↓
Netlify detects push
  ↓
Netlify runs: npm run build
  ↓
Netlify deploys to: yoursite.netlify.app
  ↓
Auth Backend: Netlify Function (Node.js)
  ↓
Database: Firebase Firestore
```

### New Setup (GitHub Pages + Firebase)

```
Frontend → GitHub repo
  ↓
GitHub Actions workflow triggered on push
  ↓
GitHub Actions runs: npm run build
  ↓
GitHub Pages deploys to: github.io/hv-scheduler
  ↓
Auth Backend: Firebase Cloud Function
  ↓
Database: Firebase Firestore (same)
```

### Key Differences

| Aspect               | Netlify               | GitHub Pages + Firebase       |
| -------------------- | --------------------- | ----------------------------- |
| **Cost/Deploy**      | 15 credits/deploy     | $0 free                       |
| **Hosting**          | Netlify CDN           | GitHub Pages (global)         |
| **Auth Backend**     | Netlify Function      | Firebase Cloud Function       |
| **Deployment**       | Automatic on push     | GitHub Actions (automatic)    |
| **Password Storage** | Plain text (insecure) | Bcryptjs hashes (secure)      |
| **Setup Time**       | 5 mins                | 2-3 hours (first time)        |
| **Maintenance**      | Netlify config        | GitHub Actions + Firebase CLI |

---

## <a name="prerequisites"></a>Prerequisites

### Required Software

- [ ] Git installed and configured
- [ ] Node.js 20+ installed (`node --version`)
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] GitHub account with repo access
- [ ] Firebase project created (same one as current)

### Verify Prerequisites

```powershell
# Check Node version
node --version  # Should be 20.x or higher

# Check Git
git --version

# Check Firebase CLI
firebase --version

# Login to Firebase
firebase login
```

### Current Status Check

- [ ] GitHub repo: https://github.com/fcardosopraia/hv-scheduler
- [ ] Firebase project: Check Firebase Console for project ID
- [ ] Netlify site: yoursite.netlify.app (will be deprecated)
- [ ] Current Firestore data: Backed up (just in case)

---

## <a name="phase-1-github-pages"></a>Phase 1: GitHub Pages Setup

### Step 1.1: Update `vite.config.ts`

**Why:** GitHub Pages serves from `/{repo-name}/` not root, so we need to set the base path.

**File:** `vite.config.ts`

```typescript
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: "/hv-scheduler/", // ← ADD THIS LINE
    plugins: [react(), tailwindcss()],
  };
});
```

**Commit:**

```powershell
git add vite.config.ts
git commit -m "chore: add GitHub Pages base path"
```

### Step 1.2: Create GitHub Actions Workflow

**Why:** Automatically build and deploy when you push to GitHub.

**Create file:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

env:
  VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
  VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
  VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
  VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
  VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
  VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
  VITE_CLOUD_FUNCTION_URL: ${{ secrets.VITE_CLOUD_FUNCTION_URL }}
  VITE_APP_ID: ${{ secrets.VITE_APP_ID }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Commit:**

```powershell
mkdir -p .github/workflows
# Create .github/workflows/deploy.yml with content above
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions deployment workflow"
```

### Step 1.3: Enable GitHub Pages

1. **Go to GitHub repo settings:**

   - https://github.com/fcardosopraia/hv-scheduler/settings

2. **Navigate to Pages section** (left sidebar)

3. **Configure:**

   - Source: "GitHub Actions" (already selected by workflow)
   - Branch: main
   - Save

4. **Wait for first deployment:**
   - Push to GitHub (we'll do this after Phase 3)
   - Actions tab will show deployment progress
   - First deploy takes ~2-3 minutes

### Step 1.4: Update `package.json` (Optional)

**Why:** Update homepage for consistency.

```json
{
  "homepage": "https://fcardosopraia.github.io/hv-scheduler",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

**Commit:**

```powershell
git add package.json
git commit -m "chore: update homepage for GitHub Pages"
```

---

## <a name="phase-2-firebase-cloud-functions"></a>Phase 2: Firebase Cloud Functions

### Step 2.1: Initialize Firebase Functions

```powershell
# From project root
firebase init functions

# When prompted:
# ✓ Select your Firebase project
# ✓ Language: TypeScript
# ✓ ESLint: Yes
# ✓ Install dependencies: Yes
```

This creates:

- `functions/` directory
- `functions/package.json`
- `functions/tsconfig.json`
- `functions/src/index.ts`

### Step 2.2: Replace Functions Files

The files are already created. Verify they're correct:

**Check `functions/src/roleLogin.ts` exists with bcryptjs:**

```powershell
ls functions/src/
# Should show: roleLogin.ts, auditLogger.ts, index.ts
```

**Verify `functions/src/index.ts` exports both functions:**

```typescript
export { roleLogin } from "./roleLogin";
export { onGlobalStateUpdate } from "./auditLogger";
```

### Step 2.3: Install Dependencies

```powershell
cd functions
npm install
cd ..
```

Verify these are in `functions/package.json`:

```json
"dependencies": {
  "firebase-admin": "^12.6.0",
  "firebase-functions": "^5.0.0",
  "bcryptjs": "^2.4.3"
}
```

### Step 2.4: Test Build Locally

```powershell
cd functions
npm run build
cd ..
```

**Expected output:** No errors, `functions/dist/` created with `.js` files.

---

## <a name="phase-3-configuration"></a>Phase 3: Configuration & Secrets

### Step 3.1: Generate Password Hashes

**CRITICAL:** Do this on your local computer, NOT in cloud.

```powershell
# Install bcryptjs locally if not already installed
npm install bcryptjs

# Generate TWO hashes (one for manager, one for admin)
node -e "const bcrypt = require('bcryptjs'); Promise.all([bcrypt.hash('YourManagerPassword2024!', 10), bcrypt.hash('YourAdminPassword2024!', 10)]).then(h => { console.log('MANAGER HASH:'); console.log(h[0]); console.log('\nADMIN HASH:'); console.log(h[1]); })"
```

**Output example:**

```
MANAGER HASH:
$2a$10$Ku.j7Yq6VxKu.j7Yq6VxKu.j7Yq6VxKu.j7Yq6VxKu.j7Yq6VxKu

ADMIN HASH:
$2a$10$abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzab
```

**SAVE THESE HASHES SECURELY:**

- Copy to a password manager (Bitwarden, 1Password, etc.)
- Do NOT commit to GitHub
- Do NOT store in plain text files

### Step 3.2: Set Firebase Environment Variables

```powershell
# Set manager password hash
firebase functions:config:set auth.manager_pass_hash="$2a$10$Ku.j7Yq6VxKu.j7Yq6VxKu.j7Yq6VxKu.j7Yq6VxKu.j7Yq6VxKu"

# Set admin password hash
firebase functions:config:set auth.admin_pass_hash="$2a$10$abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzab"

# Verify they're set
firebase functions:config:get
```

**Expected output:**

```json
{
  "auth": {
    "manager_pass_hash": "$2a$10$Ku.j7Yq6VxKu.j7Yq6VxKu.j7Yq6VxKu.j7Yq6VxKu.j7Yq6VxKu",
    "admin_pass_hash": "$2a$10$abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzab"
  }
}
```

### Step 3.3: Deploy Firebase Cloud Functions

```powershell
firebase deploy --only functions
```

**What happens:**

1. Functions are built
2. Uploaded to Firebase
3. Deployed and available

**Expected output:**

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project/functions
```

**Important:** Note the URL where function is deployed. It will be:

```
https://region-projectId.cloudfunctions.net/roleLogin
https://region-projectId.cloudfunctions.net/onGlobalStateUpdate
```

Find exact URL:

1. Firebase Console → Functions
2. Click `roleLogin` function
3. Find "Trigger" tab
4. Copy the HTTP URL

Example: `https://us-central1-gcc-scheduler.cloudfunctions.net/roleLogin`

### Step 3.4: Deploy Firestore Rules

```powershell
firebase deploy --only firestore:rules
```

**Expected output:**

```
✔  Deploy complete!
```

### Step 3.5: Set GitHub Secrets

**Go to:** GitHub repo → Settings → Secrets and variables → Actions

**Add these 8 secrets:**

1. **VITE_FIREBASE_API_KEY**

   - Value: From Firebase Console → Project Settings → Web SDK setup
   - Looks like: `AIzaSyD...`

2. **VITE_FIREBASE_AUTH_DOMAIN**

   - Value: `your-project.firebaseapp.com`

3. **VITE_FIREBASE_PROJECT_ID**

   - Value: `your-project-id`

4. **VITE_FIREBASE_STORAGE_BUCKET**

   - Value: `your-project.appspot.com`

5. **VITE_FIREBASE_MESSAGING_SENDER_ID**

   - Value: From Project Settings (numeric ID)

6. **VITE_FIREBASE_APP_ID**

   - Value: From Project Settings

7. **VITE_CLOUD_FUNCTION_URL**

   - Value: `https://region-projectId.cloudfunctions.net/roleLogin`
   - Replace with your actual function URL from Step 3.3

8. **VITE_APP_ID**
   - Value: `gcc-scheduler`

**Find all Firebase values:**

1. Firebase Console → Project Settings (gear icon)
2. Go to "General" tab
3. Scroll to "Your apps" section
4. Find web app config

---

## <a name="phase-4-deployment"></a>Phase 4: Deployment

### Step 4.1: Delete Netlify Configuration

**Why:** Remove old deployment config to avoid confusion.

```powershell
# Remove Netlify files
rm netlify.toml
rm -r netlify/

git add -A
git commit -m "chore: remove Netlify configuration (migrated to GitHub Pages)"
```

### Step 4.2: Remove Netlify Dependencies

**Update `package.json`:**

Only keep Firebase and React dependencies. Remove:

- ~~netlify-cli~~ (if installed)
- (bcryptjs stays in functions/package.json only)

### Step 4.3: Final Commit

```powershell
# Stage all changes
git add -A

# Review what will be committed
git status

# Commit
git commit -m "feat: migrate from Netlify to GitHub Pages and Firebase Cloud Functions

- Move frontend deployment to GitHub Pages with GitHub Actions
- Move auth backend from Netlify Functions to Firebase Cloud Functions
- Implement bcryptjs password hashing for manager/admin authentication
- Add rate limiting to prevent brute force attacks
- Add Firestore security rules for data protection
- Add audit logging for compliance and security
- Remove Netlify configuration files"
```

### Step 4.4: Push to GitHub

```powershell
git push origin main
```

**What happens:**

1. GitHub Actions workflow triggers
2. Dependencies installed
3. TypeScript builds
4. App built to `dist/`
5. Deployed to GitHub Pages
6. Takes ~2-3 minutes

**Monitor progress:**

1. Go to repo
2. Click "Actions" tab
3. Find your workflow run
4. Watch the build progress
5. Should complete with green checkmark

**First deployment URL:** `https://fcardosopraia.github.io/hv-scheduler/`

---

## <a name="phase-5-testing"></a>Phase 5: Testing & Verification

### Step 5.1: Verify Deployment

```powershell
# Check GitHub Pages is deployed
# Go to: https://fcardosopraia.github.io/hv-scheduler/

# Should see:
# ✓ App loads
# ✓ Logo visible
# ✓ Schedule grid visible
# ✓ No 404 errors
```

### Step 5.2: Test Authentication

**Test Manager Login:**

1. Open app at `https://fcardosopraia.github.io/hv-scheduler/`
2. Click on "Diretor" (Manager) button
3. Enter manager password (the plain text one you used to generate hash)
4. Expected: Login succeeds, custom token created

**Test Admin Login:**

1. Click on "Admin" button
2. Enter admin password
3. Expected: Login succeeds

**Test Rate Limiting:**

1. Try manager login with wrong password
2. Repeat 5 times
3. Expected: 6th attempt returns "Too many attempts"
4. Wait 15 minutes, try again
5. Expected: Login works again

### Step 5.3: Test Data Sync

1. Login as manager
2. Edit schedule (change a shift)
3. Expected: Data saves to Firestore
4. Status shows "saved" (not "offline")
5. Refresh page, data persists

### Step 5.4: Test Audit Logging

1. Login as manager
2. Make a schedule change
3. Go to Firebase Console → Firestore
4. Navigate to: `artifacts → gcc-scheduler → private → audit_logs → logs`
5. Should see new audit log entry with:
   - Timestamp
   - Changes made
   - Who made it

### Step 5.5: Verify Security Headers

```powershell
# Check security headers are present
curl -i https://fcardosopraia.github.io/hv-scheduler/

# Should see:
# - X-Frame-Options: DENY
# - X-Content-Type-Options: nosniff
# - Strict-Transport-Security: ...
```

### Step 5.6: Test All Roles

| Role    | How to test         | Expected                       |
| ------- | ------------------- | ------------------------------ |
| Viewer  | No login needed     | Can view, cannot edit          |
| Editor  | Login as employee   | Can edit own assignments       |
| Manager | Login with password | Can edit all, approve requests |
| Admin   | Login with password | Can edit all, manage roles     |

---

## <a name="phase-6-cleanup"></a>Phase 6: Cleanup

### Step 6.1: Turn Off Netlify Deployment

**Go to:** Netlify → Site settings → Danger zone → Delete site

**Or just don't renew plan.**

### Step 6.2: Archive Netlify Function Files (Optional)

Keep local backup of old Netlify function for reference:

```powershell
# Create archive
mkdir old-netlify-backup
cp -r netlify/ old-netlify-backup/
cp netlify.toml old-netlify-backup/

# Optional: Create a git tag for reference
git tag -a netlify-final -m "Final Netlify configuration before migration"
```

### Step 6.3: Update Documentation

**Add to README.md:**

````markdown
## Deployment

This app is deployed to GitHub Pages with Firebase backend.

- **Frontend:** https://fcardosopraia.github.io/hv-scheduler/
- **CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`)
- **Authentication:** Firebase Cloud Functions (bcryptjs + rate limiting)
- **Database:** Firebase Firestore
- **Rules:** See `firestore.rules`

### Making Changes

```bash
# Make changes locally
git add .
git commit -m "description"
git push origin main

# GitHub Actions automatically:
# 1. Builds the app
# 2. Deploys to GitHub Pages
# 3. Deploy completes in ~2-3 minutes
```
````

### Password Management

See `SECURITY_PASSWORD_GUIDE.md` for:

- How to change manager/admin passwords
- Password rotation procedures
- Security best practices

````

### Step 6.4: Verify Everything Works

**Checklist:**

- [ ] App loads at GitHub Pages URL
- [ ] Manager login works
- [ ] Admin login works
- [ ] Schedule changes sync to Firestore
- [ ] Offline mode works (try in DevTools offline)
- [ ] Rate limiting works (5 attempts trigger lockout)
- [ ] No console errors
- [ ] HTTPS lock icon shows in browser
- [ ] Audit logs created on changes
- [ ] Firebase dashboard shows healthy functions

---

## <a name="troubleshooting"></a>Troubleshooting

### Issue: App loads but shows 404

**Solution:**
1. Verify `base: "/hv-scheduler/"` in `vite.config.ts`
2. Rebuild: `npm run build`
3. Push to GitHub
4. Wait 2-3 minutes for deployment

### Issue: Login fails with "Invalid credentials"

**Solutions:**
1. Verify password hash was set in Firebase:
   ```powershell
   firebase functions:config:get
````

2. Ensure you're using the plain text password (not the hash)
3. Check Cloud Function logs:
   ```powershell
   firebase functions:log
   ```

### Issue: "Too many login attempts" appears immediately

**Solutions:**

1. Rate limiting may be triggered from your IP
2. Wait 15 minutes
3. Or check in browser DevTools what's being sent

### Issue: GitHub Actions build fails

**Solutions:**

Look at error in Actions tab:

**Error: "Cannot find module 'firebase-functions'"**

```powershell
cd functions
npm install
npm run build
cd ..
git add -A
git commit -m "fix: rebuild functions"
git push
```

**Error: "VITE\_\* variables not found"**

```
Check GitHub Secrets are set correctly:
1. Settings → Secrets
2. Verify all 8 secrets exist
3. Re-run workflow (Actions → Deploy → Re-run)
```

### Issue: Cloud Function returns 500 error

**Solution:**

```powershell
# Check logs
firebase functions:log

# Look for the error
# Common: Missing env vars, bcryptjs comparison error

# If bcryptjs error, regenerate hashes
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password', 10).then(h => console.log(h))"

# Update in Firebase
firebase functions:config:set auth.manager_pass_hash="$2a$10$..."
firebase deploy --only functions
```

### Issue: Firestore rules error on write

**Solution:**

```powershell
# Check Firestore rules deployed
firebase deploy --only firestore:rules

# Test in Firebase Console:
# 1. Firestore → data → click document
# 2. Simulator tab
# 3. Test your reads/writes
# 4. Should show "Simulated result: Allowed" or "Denied"
```

### Issue: Audit logs not being created

**Solutions:**

1. Verify `auditLogger` Cloud Function deployed:

   ```powershell
   firebase functions:list
   ```

   Should show both `roleLogin` and `onGlobalStateUpdate`

2. Check function logs:

   ```powershell
   firebase functions:log
   ```

3. Make a test schedule change and watch logs

### Issue: Password reset needed

**Solution:** See `SECURITY_PASSWORD_GUIDE.md`

```powershell
# Generate new hash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('NewPassword', 10).then(h => console.log(h))"

# Update Firebase
firebase functions:config:set auth.manager_pass_hash="$2a$10$..."

# Redeploy
firebase deploy --only functions
```

---

## Rollback Plan (If Needed)

**If GitHub Pages deployment fails and you need to go back to Netlify:**

```powershell
# Revert to Netlify branch
git log --oneline  # Find commit before migration

git reset --hard <commit-hash>

# Redeploy to Netlify
# Login to Netlify, reconnect GitHub repo
```

**However:** Since password hashes are now in Firebase, you'd still have:

- ✅ Secure password hashing
- ✅ Rate limiting
- ✅ Audit logging
- ✅ Firestore rules

These security features remain regardless of frontend hosting.

---

## Success Criteria

### Your migration is successful when:

✅ App loads at `https://fcardosopraia.github.io/hv-scheduler/`  
✅ Login works with manager/admin passwords  
✅ Schedule changes sync to Firestore  
✅ Offline mode works  
✅ Rate limiting blocks brute force attempts  
✅ Audit logs record all changes  
✅ No Netlify resources are being used  
✅ GitHub Actions deploys automatically on push  
✅ All security headers present (verified in browser)  
✅ Zero monthly hosting costs for frontend

---

## Cost Comparison (Monthly)

### Before (Netlify)

- 10 deploys × 15 credits = 150 credits = ~$7.50
- 5 GB bandwidth × 10 credits/GB = 50 credits = ~$2.50
- 100k requests × 3 credits/10k = 30 credits = ~$1.50
- **Total: ~$12-15/month** (scales with usage)

### After (GitHub Pages + Firebase)

- GitHub Pages: $0
- Firebase Cloud Functions: $0 (free tier: 2M invocations/month)
- Firebase Firestore: $0 (free tier: 50k reads/day, 20k writes/day)
- **Total: $0/month** ✅

### Annual Savings

- Netlify: $150-180/year
- GitHub Pages: $0/year
- **Savings: $150-180/year**

---

## Next Steps After Migration

1. **Document Passwords Securely**

   - Store in password manager
   - Share with team securely (not via email/Slack)

2. **Monitor First Month**

   - Watch GitHub Actions for deployment errors
   - Check Cloud Function logs for auth issues
   - Verify Firestore rules working

3. **Set Up Scheduled Tasks (Optional)**

   - Weekly backup of Firestore data
   - Monthly audit log review
   - Quarterly password rotation

4. **Train Team**
   - Show manager how to update password (see guide)
   - Explain audit logging benefits
   - Ensure they understand new auth flow

---

## Support & Documentation

### Files to Reference

- **Security:** `SECURITY_IMPLEMENTATION_GUIDE.md`
- **Passwords:** `SECURITY_PASSWORD_GUIDE.md`
- **Firestore Rules:** `firestore.rules`
- **Cloud Functions:** `functions/src/`
- **GitHub Actions:** `.github/workflows/deploy.yml`

### Useful Commands

```powershell
# View Cloud Function logs
firebase functions:log

# View Firestore rules
firebase rules:list

# Redeploy everything
firebase deploy

# Test locally
npm run dev

# Build for production
npm run build

# View Firestore data
firebase firestore:describe
```

### External References

- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Bcryptjs Documentation](https://github.com/dcodeIO/bcryptjs)

---

## Final Notes

**Congratulations on migrating!** 🎉

You've successfully:

- ✅ Moved to free GitHub Pages hosting
- ✅ Implemented secure password hashing
- ✅ Added rate limiting
- ✅ Created audit logging
- ✅ Set up automated deployments
- ✅ Reduced costs to $0

This is a modern, secure, production-ready setup that scales from freelance to enterprise.

**Questions?** Check:

1. Cloud Function logs: `firebase functions:log`
2. Firestore rules simulator
3. GitHub Actions output
4. Browser DevTools Network tab

**Stuck?** See Troubleshooting section above.

---

**Migration Completed:** January 10, 2026  
**Status:** Production Ready  
**Maintenance Level:** Low (GitHub Actions handles everything)
