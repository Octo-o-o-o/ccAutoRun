###############################################################################
# Auto-Continue Documentation Script
#
# This script provides a complete automation solution for documentation:
# 1. Checks current progress
# 2. Monitors for completion
# 3. Provides clear next steps
# 4. Can run in background
#
# Usage:
#   .\auto-continue.ps1           # Interactive mode
#   .\auto-continue.ps1 -Watch    # Background monitoring mode
#   .\auto-continue.ps1 -Status   # Quick status check
###############################################################################

param(
    [switch]$Watch,
    [switch]$Status,
    [switch]$Once
)

# Configuration
$ProgressFile = "peta-docs\DOCUMENTATION_PROGRESS.md"
$LockFile = ".claude\hooks\.auto-continue.lock"
$MaxAutoSessions = 3

###############################################################################
# Helper Functions
###############################################################################

function Write-Header {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "  📚 Documentation Auto-Continue System" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host ""
}

function Get-TaskCounts {
    if (-not (Test-Path $ProgressFile)) {
        return @{
            Completed = 0
            Incomplete = 0
            Total = 0
            Percentage = 0
        }
    }

    $content = Get-Content $ProgressFile -Raw
    $completed = ([regex]::Matches($content, "^- \[x\]", [System.Text.RegularExpressions.RegexOptions]::Multiline)).Count
    $incomplete = ([regex]::Matches($content, "^- \[ \]", [System.Text.RegularExpressions.RegexOptions]::Multiline)).Count
    $total = $completed + $incomplete
    $percentage = if ($total -gt 0) { [math]::Round(($completed / $total) * 100, 1) } else { 0 }

    return @{
        Completed = $completed
        Incomplete = $incomplete
        Total = $total
        Percentage = $percentage
    }
}

function Get-SessionCount {
    if (Test-Path $LockFile) {
        return [int](Get-Content $LockFile)
    }
    return 0
}

function Set-SessionCount {
    param([int]$Count)
    $Count | Out-File -FilePath $LockFile -NoNewline
}

function Show-Status {
    $counts = Get-TaskCounts

    Write-Host "📊 Current Progress" -ForegroundColor Cyan
    Write-Host "   Total: $($counts.Total) tasks" -ForegroundColor White
    Write-Host "   Completed: $($counts.Completed) ($($counts.Percentage)%)" -ForegroundColor Green
    Write-Host "   Remaining: $($counts.Incomplete)" -ForegroundColor Yellow
    Write-Host ""
}

function Show-NextSteps {
    param([hashtable]$Counts)

    Write-Host "📝 Next Steps" -ForegroundColor Cyan
    Write-Host ""

    if ($Counts.Incomplete -eq 0) {
        Write-Host "  🎉 All documentation tasks complete!" -ForegroundColor Green
        Write-Host "  Ready to move to Phase 3: Enhancement & Polish" -ForegroundColor Green
        Write-Host ""
        return $true
    }

    $sessionCount = Get-SessionCount

    if ($sessionCount -ge $MaxAutoSessions) {
        Write-Host "  ⚠ Auto-continue limit reached ($sessionCount/$MaxAutoSessions sessions)" -ForegroundColor Yellow
        Write-Host "  Please review the last batch before continuing." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  To continue:" -ForegroundColor Cyan
        Write-Host "    1. Review completed pages in peta-docs/content/docs/" -ForegroundColor White
        Write-Host "    2. Run: .\auto-continue.ps1 -Reset" -ForegroundColor White
        Write-Host "    3. Use: /continue-docs" -ForegroundColor White
        Write-Host ""
        return $false
    }

    Write-Host "  Option 1 - Automatic (Recommended):" -ForegroundColor Cyan
    Write-Host "    /continue-docs" -ForegroundColor White -BackgroundColor DarkGray
    Write-Host ""
    Write-Host "  Option 2 - Preview next tasks:" -ForegroundColor Cyan
    Write-Host "    cd peta-docs" -ForegroundColor White
    Write-Host "    npm run docs:next" -ForegroundColor White
    Write-Host ""
    Write-Host "  Option 3 - Background monitoring:" -ForegroundColor Cyan
    Write-Host "    .\auto-continue.ps1 -Watch" -ForegroundColor White
    Write-Host ""

    return $false
}

function Start-BackgroundWatch {
    Write-Host "🔍 Starting background monitoring..." -ForegroundColor Green
    Write-Host "   This will watch for progress updates and notify you." -ForegroundColor Cyan
    Write-Host "   Press Ctrl+C to stop monitoring." -ForegroundColor Yellow
    Write-Host ""

    & powershell -ExecutionPolicy Bypass -File ".claude\hooks\watch-and-notify.ps1"
}

###############################################################################
# Main Functions
###############################################################################

function Invoke-InteractiveMode {
    Write-Header

    # Check directory
    if (-not (Test-Path "peta-docs")) {
        Write-Host "❌ Error: Not in KompasAI root directory" -ForegroundColor Red
        Write-Host "   Current: $(Get-Location)" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }

    # Show current status
    Show-Status

    # Get counts
    $counts = Get-TaskCounts

    # Check if complete
    $complete = Show-NextSteps -Counts $counts

    if ($complete) {
        exit 0
    }

    # Increment session counter
    $sessionCount = Get-SessionCount
    Set-SessionCount -Count ($sessionCount + 1)

    # Provide copy-paste command
    Write-Host "💡 Quick Start" -ForegroundColor Cyan
    Write-Host "   Copy and paste this into Claude Code:" -ForegroundColor White
    Write-Host ""
    Write-Host "   /continue-docs" -ForegroundColor Green -BackgroundColor Black
    Write-Host ""
}

function Invoke-StatusMode {
    $counts = Get-TaskCounts

    if ($counts.Total -eq 0) {
        Write-Host "No progress file found or empty." -ForegroundColor Yellow
        exit 1
    }

    Write-Host ""
    Write-Host "Documentation Progress:" -ForegroundColor Cyan
    Write-Host "  • Completed: $($counts.Completed)/$($counts.Total) ($($counts.Percentage)%)" -ForegroundColor Green
    Write-Host "  • Remaining: $($counts.Incomplete) tasks" -ForegroundColor Yellow

    $sessionCount = Get-SessionCount
    Write-Host "  • Sessions: $sessionCount/$MaxAutoSessions" -ForegroundColor Blue
    Write-Host ""

    if ($counts.Incomplete -eq 0) {
        Write-Host "🎉 All tasks complete!" -ForegroundColor Green
    } else {
        Write-Host "💡 Run: .\auto-continue.ps1 to continue" -ForegroundColor Cyan
    }
    Write-Host ""
}

function Invoke-OnceMode {
    $counts = Get-TaskCounts

    if ($counts.Incomplete -eq 0) {
        Write-Host "✅ All tasks complete!" -ForegroundColor Green
        exit 0
    }

    Write-Host "📝 $($counts.Incomplete) tasks remaining" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Continue with: /continue-docs" -ForegroundColor Cyan
}

###############################################################################
# Command Line Handling
###############################################################################

# Create directories if needed
$hookDir = ".claude\hooks"
if (-not (Test-Path $hookDir)) {
    New-Item -ItemType Directory -Path $hookDir -Force | Out-Null
}

# Handle different modes
if ($Watch) {
    Start-BackgroundWatch
}
elseif ($Status) {
    Invoke-StatusMode
}
elseif ($Once) {
    Invoke-OnceMode
}
else {
    # Check for special commands
    $command = $args[0]
    switch ($command) {
        "-Reset" {
            Set-SessionCount -Count 0
            Write-Host "✅ Session counter reset" -ForegroundColor Green
            exit 0
        }
        "-Pause" {
            Set-SessionCount -Count 9999
            Write-Host "⏸ Auto-continue paused" -ForegroundColor Yellow
            Write-Host "   Run with -Reset to resume" -ForegroundColor Cyan
            exit 0
        }
        default {
            Invoke-InteractiveMode
        }
    }
}
