# Git pre-push hook for Windows - Auto-build before pushing
# This runs automatically when you push from GitHub Desktop or command line

Write-Host "🔨 Auto-building project before push..." -ForegroundColor Cyan

# Run the build
npm run build --silent

# Check if build succeeded
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix errors before pushing." -ForegroundColor Red
    exit 1
}

# Stage the built files
git add docs/ public/version.json

# Check if there are staged changes from the build
$stagedChanges = git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "📦 Adding build artifacts to commit..." -ForegroundColor Yellow
    # Create a new commit with the build artifacts
    git commit -m "chore: update build artifacts [auto-generated]" --no-verify
}

Write-Host "✅ Build complete! Continuing with push..." -ForegroundColor Green
exit 0
