# Migration Guide: Netlify to GitHub Pages

## Overview

This guide walks through migrating the HV Scheduler from Netlify hosting to GitHub Pages.

## Current Setup (Netlify)

### Current Configuration

- **Host**: Netlify (https://hv-scheduler.netlify.app)
- **Build Command**: `tsc && vite build`
- **Output Directory**: `dist/`
- **Environment**: Firebase config via environment variables
- **Deployment**: Automatic on Git push to main branch

### Current Files

- `netlify.toml` - Netlify configuration file
- `.env` file - Local environment variables (not committed)

---

## GitHub Pages Setup

### Prerequisites

1. GitHub repository must be public (free GitHub Pages)
2. Node.js and npm installed locally
3. Latest code committed and pushed to main branch

### Step 1: Prepare Repository Structure

GitHub Pages serves from one of these locations:

- **Option A (Recommended)**: `/docs` folder on `main` branch
- **Option B**: `gh-pages` branch (auto-generated deployment branch)

For this project, we'll use **Option A** (`/docs` on main branch) as it's simpler.

### Step 2: Configure Vite for GitHub Pages

Update `vite.config.ts` to set the correct base path:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/hv-scheduler/", // Add this line for GitHub Pages
  build: {
    outDir: "docs", // Build to /docs instead of /dist
  },
});
```

### Step 3: Update Build Output Directory

Modify build configuration in `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

The `outDir: "docs"` in `vite.config.ts` handles the output directory change.

### Step 4: Environment Variables on GitHub Pages

GitHub Pages is a **static hosting** service - it cannot run backend Node.js code or access environment variables at build time the same way Netlify does.

#### Option A: Use GitHub Secrets (Recommended)

1. Go to repository Settings > Secrets and variables > Actions
2. Add the following secrets:

   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_APP_ID`

3. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_APP_ID: ${{ secrets.VITE_APP_ID }}

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

#### Option B: Commit `.env` File (Less Secure)

If you prefer to commit environment variables (not recommended for sensitive data):

1. Create `.env` file in repository root
2. Add all `VITE_*` variables
3. Commit and push

### Step 5: Enable GitHub Pages in Repository Settings

1. Go to repository Settings > Pages
2. Under "Build and deployment":
   - **Source**: GitHub Actions (or Branch if using Option B)
   - **Branch**: main
   - **Folder**: /docs
3. Click Save

### Step 6: Remove Netlify Configuration

1. Delete or archive `netlify.toml` (no longer needed)
2. Update `.gitignore` if needed

### Step 7: Local Testing Before Deployment

```bash
# Build locally
npm run build

# Preview the build
npm run preview

# Check that /docs folder is created with all files
ls -la docs/
```

### Step 8: Commit and Push

```bash
git add .
git commit -m "chore: migrate from Netlify to GitHub Pages"
git push origin main
```

GitHub Actions will automatically:

1. Detect the push
2. Run the build workflow
3. Deploy to GitHub Pages
4. The app will be available at: `https://yourusername.github.io/hv-scheduler/`

---

## Post-Migration Checklist

- [ ] Vite config updated with `base: "/hv-scheduler/"` and `outDir: "docs"`
- [ ] GitHub Actions workflow created in `.github/workflows/deploy.yml`
- [ ] GitHub Secrets added for all Firebase environment variables
- [ ] GitHub Pages enabled in repository settings
- [ ] `.env` file handling configured (secrets or committed)
- [ ] `netlify.toml` removed from repository
- [ ] Local build test successful (`npm run build`)
- [ ] Changes committed and pushed to main
- [ ] GitHub Actions workflow triggered and completed
- [ ] App accessible at `https://<username>.github.io/hv-scheduler/`
- [ ] Firebase functionality verified in production
- [ ] DNS/custom domain updated if applicable

---

## Troubleshooting

### Issue: "404 Not Found" on GitHub Pages

**Solution**: Verify `base` is set to `"/hv-scheduler/"` in `vite.config.ts`

### Issue: Assets not loading (CSS/JS 404)

**Solution**:

- Check that `base` path is correct
- Ensure build output is in `/docs` folder
- Verify `index.html` exists in `/docs`

### Issue: Firebase not connecting

**Solution**:

- Verify GitHub Secrets are added correctly
- Check Actions workflow log for build errors
- Ensure environment variables are properly passed to build step

### Issue: Blank page on load

**Solution**:

- Check browser console for errors
- Verify `public/service-worker.js` paths are correct (may need base path adjustment)
- Check that all imports use correct paths

### Issue: Environment variables undefined at runtime

**Solution**:

- Only `VITE_*` prefixed variables are available in the browser
- Make sure all Firebase config variables start with `VITE_`
- Rebuild after adding new secrets

---

## Rollback Plan

If issues occur after migration:

1. **Revert to Netlify**:

   ```bash
   git revert <commit-hash>
   git push
   ```

   This will restore `netlify.toml` and original configuration

2. **Keep GitHub Pages as backup**:
   - Keep the workflow file and secrets configured
   - Can redeploy quickly if needed

---

## Additional Notes

### GitHub Pages Limitations

- No server-side processing (only static files)
- No backend API (must use Firebase/external services)
- Free tier has 1GB storage limit
- Deployments take 1-2 minutes

### GitHub Actions Advantages

- Included free tier (2000 minutes/month)
- Automatic on every push
- Easy to view build logs
- Integrates with GitHub

### Firebase Integration

- No changes needed to Firebase code
- Firestore rules remain the same
- Authentication works the same way
- Data persistence unchanged

### Performance

- GitHub Pages CDN provides good global performance
- Similar or better than Netlify in most regions
- Free tier has no performance limits

---

## Migration Complete! 🎉

Once GitHub Pages is serving your app successfully:

1. Verify all features work (login, scheduling, data saving)
2. Test on multiple devices and browsers
3. Update any documentation referencing Netlify
4. Optionally remove Netlify project
5. Monitor GitHub Actions for any issues
