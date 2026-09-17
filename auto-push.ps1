# auto-push.ps1
# Simple auto-commit and push

Set-Location $PSScriptRoot

# Commit message: use argument or timestamp
$msg = if ($args.Count -gt 0) { $args[0] } else { "AniPulse" }

# Check for changes
$changes = git status --porcelain
if (-not $changes) {
    Write-Host "No changes to commit."
    exit 0
}

# Stage everything
Write-Host "Staging changes..."
git add -A

# Verify staged
$staged = git diff --cached --name-only
if (-not $staged) {
    Write-Host "Nothing was staged. Exiting."
    exit 0
}

# Commit
Write-Host "Committing with message: $msg"
git commit -m "$msg"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit failed."
    exit 1
}

# Push
Write-Host "Pushing..."
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host "Push successful!"
} else {
    Write-Host "Push failed. You may need to pull first."
    exit 1
}