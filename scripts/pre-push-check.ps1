# Pre-Push Security Check for S.A.G.I.P
Write-Host ""
Write-Host "Security Check - Scanning for exposed secrets..." -ForegroundColor Cyan
Write-Host ""

$errors = 0

# Check 1
Write-Host "Checking if .env is staged..." -ForegroundColor Yellow
$stagedEnv = git diff --cached --name-only | Select-String "^\.env$"
if ($stagedEnv) {
    Write-Host "  ERROR: .env file is staged for commit!" -ForegroundColor Red
    $errors++
} else {
    Write-Host "  OK: .env is not staged" -ForegroundColor Green
}

# Check 2
Write-Host ""
Write-Host "Checking .gitignore..." -ForegroundColor Yellow
$gitignoreContent = Get-Content .gitignore -Raw
if ($gitignoreContent -match "\.env") {
    Write-Host "  OK: .env is in .gitignore" -ForegroundColor Green
} else {
    Write-Host "  ERROR: .env is NOT in .gitignore!" -ForegroundColor Red
    $errors++
}

# Check 3
Write-Host ""
Write-Host "Scanning for API keys..." -ForegroundColor Yellow
$stagedFiles = git diff --cached --name-only
$foundKeys = $false
foreach ($file in $stagedFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        if ($content -match "AIzaSy[a-zA-Z0-9_-]{33}") {
            Write-Host "  ERROR: API key found in $file" -ForegroundColor Red
            $foundKeys = $true
            $errors++
        }
    }
}
if (-not $foundKeys) {
    Write-Host "  OK: No API keys found" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "All security checks passed! Safe to push." -ForegroundColor Green
} else {
    Write-Host "Found $errors issue(s)! DO NOT PUSH!" -ForegroundColor Red
}
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
exit $errors
