# Git pre-push hook for Windows — validates that the project builds
# before pushing. Does NOT auto-commit the build output: docs/ is
# rebuilt in CI with deployment secrets, so committing a local build
# leaks local .env values.

Write-Host "🔨 Validating build before push..." -ForegroundColor Cyan

npm run build --silent

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Fix errors before pushing." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build OK. Continuing with push." -ForegroundColor Green
exit 0
