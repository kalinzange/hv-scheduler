# Firebase Functions Quick Reference

Quick commands for common Firebase Functions tasks.

## Generate Password Hashes

```bash
cd functions
node generate-hashes.js "ManagerPassword" "AdminPassword"
```

## Set Environment Variables

### Local (.env)

```bash
cd functions
cat > .env << 'EOF'
MANAGER_PASS_HASH=$2a$10$...
ADMIN_PASS_HASH=$2a$10$...
EOF
```

### Production (Firebase Secrets)

```bash
firebase functions:secrets:set MANAGER_PASS_HASH
firebase functions:secrets:set ADMIN_PASS_HASH
```

## Deploy

### All functions

```bash
firebase deploy --only functions
```

### Specific function

```bash
firebase deploy --only functions:roleLogin
```

### Rules only

```bash
firebase deploy --only firestore:rules
```

### Everything

```bash
firebase deploy
```

## Test Locally

### Start emulator

```bash
cd functions
npm run serve
```

### Test endpoint

```bash
curl -X POST http://localhost:5001/YOUR_PROJECT/us-central1/roleLogin \
  -H "Content-Type: application/json" \
  -d '{"role":"manager","password":"test123"}'
```

## Monitor

### View logs

```bash
firebase functions:log
```

### Filter by function

```bash
firebase functions:log --only roleLogin
```

### Show errors only

```bash
firebase functions:log | grep ERROR
```

### Real-time logs

```bash
firebase functions:log --only roleLogin --lines 100
```

## Manage Secrets

### List secrets

```bash
firebase functions:secrets:list
```

### View secret value

```bash
firebase functions:secrets:access MANAGER_PASS_HASH
```

### Update secret

```bash
firebase functions:secrets:set MANAGER_PASS_HASH
```

### Delete secret

```bash
firebase functions:secrets:destroy MANAGER_PASS_HASH
```

## Troubleshooting

### Function not found

```bash
firebase deploy --only functions:roleLogin
```

### Clear cache and redeploy

```bash
cd functions
rm -rf node_modules lib
npm install
npm run build
cd ..
firebase deploy --only functions
```

### Check function status

```bash
firebase functions:list
```

### Delete and recreate function

```bash
firebase functions:delete roleLogin
firebase deploy --only functions:roleLogin
```

## Production URLs

After deployment, your function URL will be:

```
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/roleLogin
```

Add this to:

- `.env.local` as `VITE_CLOUD_FUNCTION_URL`
- GitHub Secrets as `VITE_CLOUD_FUNCTION_URL`

## Common Issues

### CORS errors

- Function includes CORS headers by default
- Check browser console for actual error
- Verify function is deployed: `firebase functions:list`

### 401 Unauthorized

- Wrong password
- Check hash is correct: `firebase functions:secrets:access MANAGER_PASS_HASH`
- View logs: `firebase functions:log --only roleLogin`

### 429 Too Many Requests

- Wait 15 minutes
- Or restart function (production): Delete and redeploy

### Environment variable not found

- Local: Check `functions/.env` exists
- Production: Run `firebase functions:secrets:list`

## Update Passwords

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

## Check Deployment

```bash
# List all functions
firebase functions:list

# Check specific function
firebase functions:list | grep roleLogin

# View function details in console
# https://console.firebase.google.com/project/YOUR_PROJECT/functions
```

## Local Testing Workflow

```bash
# 1. Install dependencies
cd functions && npm install && cd ..

# 2. Set local env vars
echo 'MANAGER_PASS_HASH=$2a$10$...' > functions/.env
echo 'ADMIN_PASS_HASH=$2a$10$...' >> functions/.env

# 3. Start emulator (Terminal 1)
cd functions && npm run serve

# 4. Start dev server (Terminal 2)
npm run dev

# 5. Test in browser
open http://localhost:5173/hv-scheduler/
```

## Production Deployment Workflow

```bash
# 1. Set production secrets (one-time)
firebase functions:secrets:set MANAGER_PASS_HASH
firebase functions:secrets:set ADMIN_PASS_HASH

# 2. Deploy functions
firebase deploy --only functions

# 3. Copy function URL from output
# Example: https://us-central1-myproject.cloudfunctions.net/roleLogin

# 4. Add to GitHub Secrets
# Go to Settings → Secrets → Actions
# Add: VITE_CLOUD_FUNCTION_URL = <function-url>

# 5. Push to deploy via GitHub Actions
git push origin main
```

## Links

- **Firebase Console:** https://console.firebase.google.com
- **Functions:** https://console.firebase.google.com/project/YOUR_PROJECT/functions
- **Logs:** https://console.firebase.google.com/project/YOUR_PROJECT/functions/logs
- **Usage:** https://console.firebase.google.com/project/YOUR_PROJECT/usage

## See Also

- [FIREBASE_FUNCTIONS_SETUP.md](FIREBASE_FUNCTIONS_SETUP.md) - Complete setup guide
- [FIREBASE_DEPLOYMENT_CHECKLIST.md](FIREBASE_DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist
- [functions/src/roleLogin.ts](functions/src/roleLogin.ts) - Function implementation
