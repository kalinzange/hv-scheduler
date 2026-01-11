# Firebase Functions Deployment Checklist

Complete this checklist in order to deploy Firebase Functions with secure authentication.

## Pre-Deployment

- [ ] **Install Firebase CLI**

  ```bash
  npm install -g firebase-tools
  firebase --version
  ```

- [ ] **Login to Firebase**

  ```bash
  firebase login
  ```

- [ ] **Verify Project**
  ```bash
  firebase use
  # Should show your Firebase project ID
  ```

## Step 1: Generate Password Hashes

- [ ] **Run hash generator**

  ```bash
  cd functions
  npm install  # Install bcryptjs if not already installed
  node generate-hashes.js "YourManagerPassword" "YourAdminPassword"
  ```

- [ ] **Save hashes** (you'll need them in Step 2)
  ```
  MANAGER_PASS_HASH=$2a$10$...
  ADMIN_PASS_HASH=$2a$10$...
  ```

## Step 2: Configure Environment Variables

### Local Development (.env file)

- [ ] **Create `functions/.env`**

  ```bash
  cd functions
  cat > .env << 'EOF'
  MANAGER_PASS_HASH=$2a$10$...your-hash-here...
  ADMIN_PASS_HASH=$2a$10$...your-hash-here...
  EOF
  ```

- [ ] **Verify .env is gitignored** (it should be by default)
  ```bash
  grep -q ".env" .gitignore && echo "✓ .env is gitignored" || echo "✗ Add .env to .gitignore!"
  ```

### Firebase Production (Secrets)

- [ ] **Set Manager password hash**

  ```bash
  firebase functions:secrets:set MANAGER_PASS_HASH
  # Paste your manager hash when prompted
  ```

- [ ] **Set Admin password hash**

  ```bash
  firebase functions:secrets:set ADMIN_PASS_HASH
  # Paste your admin hash when prompted
  ```

- [ ] **Verify secrets are set**
  ```bash
  firebase functions:secrets:access MANAGER_PASS_HASH
  firebase functions:secrets:access ADMIN_PASS_HASH
  ```

## Step 3: Update Firestore Rules

- [ ] **Deploy updated rules**

  ```bash
  firebase deploy --only firestore:rules
  ```

- [ ] **Verify rules deployment**
  - Go to Firebase Console → Firestore → Rules
  - Check that `lastPublished` is in the validation
  - Check that `hasWriteAccess()` requires `role in ['manager', 'admin']`

## Step 4: Deploy Functions

- [ ] **Install function dependencies**

  ```bash
  cd functions
  npm install
  ```

- [ ] **Build TypeScript (if applicable)**

  ```bash
  npm run build
  ```

- [ ] **Deploy all functions**

  ```bash
  firebase deploy --only functions
  ```

  Or deploy specific function:

  ```bash
  firebase deploy --only functions:roleLogin
  ```

- [ ] **Copy function URL** from deployment output
  ```
  Function URL (roleLogin): https://us-central1-YOUR_PROJECT.cloudfunctions.net/roleLogin
  ```

## Step 5: Configure Client Environment

### Local Development

- [ ] **Create/update `.env.local`** in project root
  ```env
  VITE_CLOUD_FUNCTION_URL=https://us-central1-YOUR_PROJECT.cloudfunctions.net/roleLogin
  VITE_FIREBASE_API_KEY=your-api-key
  VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=your-project-id
  VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
  VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
  VITE_FIREBASE_APP_ID=1:123456789:web:abc123
  ```

### GitHub Actions (Production)

- [ ] **Add GitHub Secret: VITE_CLOUD_FUNCTION_URL**

  1. Go to GitHub repo → Settings → Secrets and variables → Actions
  2. Click "New repository secret"
  3. Name: `VITE_CLOUD_FUNCTION_URL`
  4. Value: `https://us-central1-YOUR_PROJECT.cloudfunctions.net/roleLogin`
  5. Click "Add secret"

- [ ] **Verify other Firebase secrets exist**
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`

## Step 6: Test Locally

- [ ] **Start local dev server**

  ```bash
  npm run dev
  ```

- [ ] **Test Manager login**

  1. Open http://localhost:5173/hv-scheduler/
  2. Click "Login as Manager"
  3. Enter manager password
  4. Should successfully log in

- [ ] **Test Admin login**

  1. Click "Login as Admin"
  2. Enter admin password
  3. Should successfully log in

- [ ] **Check browser console** for errors

  - No CORS errors
  - No 401/403 errors
  - Custom token successfully created

- [ ] **Test rate limiting** (optional)
  1. Enter wrong password 5 times
  2. Should see "Too many login attempts" error
  3. Wait 15 minutes or restart function

## Step 7: Deploy to Production

- [ ] **Build for production**

  ```bash
  npm run build
  ```

- [ ] **Test production build locally**

  ```bash
  npm run preview
  ```

- [ ] **Commit and push**

  ```bash
  git add .
  git commit -m "Configure Firebase Functions authentication"
  git push origin main
  ```

- [ ] **Wait for GitHub Actions**

  - Go to Actions tab in GitHub
  - Watch deployment workflow
  - Should complete successfully

- [ ] **Test production site**
  1. Open https://YOUR_USERNAME.github.io/hv-scheduler/
  2. Test Manager login
  3. Test Admin login
  4. Verify functionality works

## Step 8: Monitor & Verify

- [ ] **Check Firebase Functions logs**

  ```bash
  firebase functions:log --only roleLogin
  ```

- [ ] **Check for errors**

  ```bash
  firebase functions:log --only roleLogin | grep ERROR
  ```

- [ ] **Verify custom claims**

  - Login as Manager
  - Open browser DevTools → Application → IndexedDB
  - Find Firebase Auth token
  - Decode at jwt.io
  - Should see `"role": "manager"` in payload

- [ ] **Test Firestore security**
  1. Login as Viewer (no login required, anonymous)
  2. Try to publish schedule
  3. Should fail with permission denied
  4. Login as Manager
  5. Publish should succeed

## Step 9: Security Verification

- [ ] **Verify rate limiting works**

  - Try wrong password 5+ times
  - Should get locked out

- [ ] **Verify CORS headers**

  - Check Network tab in DevTools
  - Response should have `Access-Control-Allow-Origin` header

- [ ] **Verify password hashes are secret**

  - Check GitHub repository
  - Ensure `.env` is not committed
  - Ensure `functions/.env` is in `.gitignore`

- [ ] **Test token expiration** (optional)
  - Firebase custom tokens expire after 1 hour
  - App should handle re-authentication

## Troubleshooting

### Function not found

```bash
firebase deploy --only functions:roleLogin
```

### Secrets not accessible

```bash
firebase functions:secrets:access MANAGER_PASS_HASH
# If fails, set again:
firebase functions:secrets:set MANAGER_PASS_HASH
```

### CORS errors

- Check function logs: `firebase functions:log`
- Verify CORS is configured in [functions/src/roleLogin.ts](functions/src/roleLogin.ts#L22)

### 401 Unauthorized

- Verify password is correct
- Check Firebase logs for bcrypt comparison result
- Ensure hash was generated with same password

### Environment variable not found

- Check `.env.local` exists and has correct variable name
- Restart dev server after changing .env
- For production, verify GitHub Secret name matches exactly

## Rollback Plan

If something goes wrong:

- [ ] **Rollback functions**

  ```bash
  # View versions
  firebase functions:list

  # Rollback via console
  # Go to Firebase Console → Functions → Select version → Rollback
  ```

- [ ] **Rollback Firestore rules**

  ```bash
  # Rules are versioned, rollback in Firebase Console
  # Firestore → Rules → View version history → Restore
  ```

- [ ] **Revert client code**
  ```bash
  git revert HEAD
  git push origin main
  ```

## Post-Deployment

- [ ] **Document passwords securely**

  - Store in password manager
  - Share with team securely (1Password, LastPass, etc.)

- [ ] **Set up monitoring** (optional)

  - Firebase Console → Functions → Metrics
  - Set up alerts for errors

- [ ] **Update documentation**

  - Document function URL in team wiki
  - Share deployment guide with team

- [ ] **Test from different devices**
  - Desktop browser
  - Mobile browser
  - Different networks

## Success Criteria

✅ All checks completed:

- Manager can login with password
- Admin can login with password
- Viewers cannot publish schedules
- Managers can publish schedules
- Rate limiting works after 5 failed attempts
- Production site loads with no console errors
- Firebase logs show successful logins
- Firestore rules enforce role-based access

## Next Steps

- Consider adding email/password authentication for Editors
- Implement persistent rate limiting with Firestore
- Add audit logging for login attempts
- Set up monitoring alerts

---

**Need help?** Check [FIREBASE_FUNCTIONS_SETUP.md](FIREBASE_FUNCTIONS_SETUP.md) for detailed troubleshooting.
