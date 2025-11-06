###############################################################################
# Hooks System Test Script
#
# This script validates that all automation components are working correctly.
###############################################################################

$ErrorActionPreference = "Continue"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "  🧪 Testing Hooks Automation System" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

$testsPassed = 0
$testsFailed = 0

###############################################################################
# Test Functions
###############################################################################

function Test-FileExists {
    param([string]$Path, [string]$Description)

    if (Test-Path $Path) {
        Write-Host "✅ $Description" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $Description" -ForegroundColor Red
        Write-Host "   Missing: $Path" -ForegroundColor Yellow
        return $false
    }
}

function Test-ScriptExecutes {
    param([string]$Script, [string]$Description)

    try {
        $result = & $Script -ErrorAction Stop 2>&1
        Write-Host "✅ $Description" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ $Description" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Yellow
        return $false
    }
}

###############################################################################
# Tests
###############################################################################

Write-Host "📁 Testing File Structure..." -ForegroundColor Cyan
Write-Host ""

# Test core files
if (Test-FileExists ".claude\hooks\auto-continue.ps1" "auto-continue.ps1 exists") { $testsPassed++ } else { $testsFailed++ }
if (Test-FileExists ".claude\hooks\watch-and-notify.ps1" "watch-and-notify.ps1 exists") { $testsPassed++ } else { $testsFailed++ }
if (Test-FileExists ".claude\hooks\check-and-continue.sh" "check-and-continue.sh exists") { $testsPassed++ } else { $testsFailed++ }
if (Test-FileExists ".claude\hooks\watch-and-notify.sh" "watch-and-notify.sh exists") { $testsPassed++ } else { $testsFailed++ }
if (Test-FileExists ".claude\hooks\README.md" "README.md exists") { $testsPassed++ } else { $testsFailed++ }

Write-Host ""
Write-Host "📝 Testing Documentation Files..." -ForegroundColor Cyan
Write-Host ""

if (Test-FileExists "peta-docs\DOCUMENTATION_PROGRESS.md" "Progress file exists") { $testsPassed++ } else { $testsFailed++ }
if (Test-FileExists ".claude\commands\continue-docs.md" "Slash command exists") { $testsPassed++ } else { $testsFailed++ }
if (Test-FileExists "peta-docs\AUTOMATION_GUIDE.md" "Automation guide exists") { $testsPassed++ } else { $testsFailed++ }
if (Test-FileExists "peta-docs\QUICKSTART_HOOKS.md" "Quickstart guide exists") { $testsPassed++ } else { $testsFailed++ }

Write-Host ""
Write-Host "🔧 Testing Script Functionality..." -ForegroundColor Cyan
Write-Host ""

# Test auto-continue.ps1 status
if (Test-ScriptExecutes { powershell -ExecutionPolicy Bypass -File ".claude\hooks\auto-continue.ps1" -Status } "auto-continue.ps1 -Status works") {
    $testsPassed++
} else {
    $testsFailed++
}

# Test watch-and-notify.ps1 once
if (Test-ScriptExecutes { powershell -ExecutionPolicy Bypass -File ".claude\hooks\watch-and-notify.ps1" --once } "watch-and-notify.ps1 --once works") {
    $testsPassed++
} else {
    $testsFailed++
}

Write-Host ""
Write-Host "📦 Testing npm Scripts..." -ForegroundColor Cyan
Write-Host ""

# Test if npm scripts are defined
$packageJson = Get-Content "peta-docs\package.json" -Raw | ConvertFrom-Json

$scriptsToTest = @("docs:continue", "docs:watch", "docs:reset", "docs:status", "docs:next", "docs:prompt")

foreach ($script in $scriptsToTest) {
    if ($packageJson.scripts.$script) {
        Write-Host "✅ npm script '$script' defined" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ npm script '$script' missing" -ForegroundColor Red
        $testsFailed++
    }
}

Write-Host ""
Write-Host "🔍 Testing Progress File..." -ForegroundColor Cyan
Write-Host ""

if (Test-Path "peta-docs\DOCUMENTATION_PROGRESS.md") {
    $progressContent = Get-Content "peta-docs\DOCUMENTATION_PROGRESS.md" -Raw

    # Check for completed tasks
    $completedMatches = [regex]::Matches($progressContent, "^- \[x\]", [System.Text.RegularExpressions.RegexOptions]::Multiline)
    $incompleteMatches = [regex]::Matches($progressContent, "^- \[ \]", [System.Text.RegularExpressions.RegexOptions]::Multiline)

    $completed = $completedMatches.Count
    $incomplete = $incompleteMatches.Count
    $total = $completed + $incomplete

    if ($total -gt 0) {
        Write-Host "✅ Progress file has valid tasks" -ForegroundColor Green
        Write-Host "   Completed: $completed" -ForegroundColor White
        Write-Host "   Incomplete: $incomplete" -ForegroundColor White
        Write-Host "   Total: $total" -ForegroundColor White
        $testsPassed++
    } else {
        Write-Host "❌ Progress file has no tasks" -ForegroundColor Red
        $testsFailed++
    }
} else {
    Write-Host "❌ Progress file not found" -ForegroundColor Red
    $testsFailed++
}

Write-Host ""
Write-Host "🔔 Testing Notification System..." -ForegroundColor Cyan
Write-Host ""

try {
    Add-Type -AssemblyName System.Windows.Forms
    Write-Host "✅ Windows Forms assembly loaded (notifications available)" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "⚠️  Windows Forms assembly not available (notifications may not work)" -ForegroundColor Yellow
}

try {
    [System.Media.SystemSounds]::Asterisk
    Write-Host "✅ System sounds available" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "⚠️  System sounds not available" -ForegroundColor Yellow
}

###############################################################################
# Results
###############################################################################

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "  📊 Test Results" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

$totalTests = $testsPassed + $testsFailed
$successRate = if ($totalTests -gt 0) { [math]::Round(($testsPassed / $totalTests) * 100, 1) } else { 0 }

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 70) { "Yellow" } else { "Red" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "🎉 All tests passed! System is ready to use." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: .\.claude\hooks\auto-continue.ps1" -ForegroundColor White
    Write-Host "  2. Copy '/continue-docs' to Claude Code" -ForegroundColor White
    Write-Host "  3. Start automating!" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Write-Host "⚠️  Some tests failed. Please check the errors above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Cyan
    Write-Host "  1. Ensure you're in the KompasAI root directory" -ForegroundColor White
    Write-Host "  2. Check that all files were created correctly" -ForegroundColor White
    Write-Host "  3. Run with administrator privileges if needed" -ForegroundColor White
    Write-Host ""
    exit 1
}
