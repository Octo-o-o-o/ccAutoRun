###############################################################################
# Documentation Progress Watcher (PowerShell)
#
# This script monitors the progress file for changes and notifies when
# a batch is completed, suggesting automatic continuation.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .claude\hooks\watch-and-notify.ps1
#
# Or add to Windows Task Scheduler for automatic monitoring
###############################################################################

# Configuration
$ProgressFile = "peta-docs\DOCUMENTATION_PROGRESS.md"
$LastCountFile = ".claude\hooks\.last-completed-count"
$CheckInterval = 10  # seconds

###############################################################################
# Helper Functions
###############################################################################

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] " -NoNewline -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor $Color
}

function Get-CompletedCount {
    if (Test-Path $ProgressFile) {
        $content = Get-Content $ProgressFile -Raw
        $matches = [regex]::Matches($content, "^- \[x\]", [System.Text.RegularExpressions.RegexOptions]::Multiline)
        return $matches.Count
    }
    return 0
}

function Get-IncompleteCount {
    if (Test-Path $ProgressFile) {
        $content = Get-Content $ProgressFile -Raw
        $matches = [regex]::Matches($content, "^- \[ \]", [System.Text.RegularExpressions.RegexOptions]::Multiline)
        return $matches.Count
    }
    return 0
}

function Get-LastCount {
    if (Test-Path $LastCountFile) {
        return [int](Get-Content $LastCountFile)
    }
    return 0
}

function Save-Count {
    param([int]$Count)
    $Count | Out-File -FilePath $LastCountFile -NoNewline
}

function Send-WindowsNotification {
    param(
        [string]$Title,
        [string]$Message
    )

    Add-Type -AssemblyName System.Windows.Forms

    $notification = New-Object System.Windows.Forms.NotifyIcon
    $notification.Icon = [System.Drawing.SystemIcons]::Information
    $notification.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
    $notification.BalloonTipTitle = $Title
    $notification.BalloonTipText = $Message
    $notification.Visible = $true
    $notification.ShowBalloonTip(5000)

    # Keep notification visible
    Start-Sleep -Seconds 6
    $notification.Dispose()
}

function Play-CompletionSound {
    [System.Media.SystemSounds]::Asterisk.Play()
}

###############################################################################
# Main Watch Loop
###############################################################################

function Start-ProgressWatch {
    Write-ColorOutput "Starting documentation progress watcher..." "Green"
    Write-ColorOutput "Monitoring: $ProgressFile" "Cyan"
    Write-ColorOutput "Check interval: ${CheckInterval}s" "Cyan"
    Write-ColorOutput "Press Ctrl+C to stop" "Yellow"
    Write-Host ""

    # Initialize last count
    $lastCompleted = Get-CompletedCount
    Save-Count -Count $lastCompleted

    while ($true) {
        Start-Sleep -Seconds $CheckInterval

        # Check if file exists
        if (-not (Test-Path $ProgressFile)) {
            continue
        }

        # Count current completed tasks
        $currentCompleted = Get-CompletedCount
        $savedCount = Get-LastCount

        # Check if count has increased
        if ($currentCompleted -gt $savedCount) {
            $newCompletions = $currentCompleted - $savedCount

            Write-Host ""
            Write-ColorOutput "✨ New progress detected!" "Green"
            Write-ColorOutput "   $newCompletions new task(s) completed" "Green"
            Write-ColorOutput "   Total completed: $currentCompleted" "Green"
            Write-Host ""

            # Send Windows notification
            Send-WindowsNotification `
                -Title "Documentation Progress" `
                -Message "Completed $newCompletions new task(s)! Total: $currentCompleted"

            # Play sound
            Play-CompletionSound

            # Check if we should continue
            $incomplete = Get-IncompleteCount

            if ($incomplete -eq 0) {
                Write-ColorOutput "🎉 ALL TASKS COMPLETE!" "Green"
                Send-WindowsNotification `
                    -Title "Documentation Complete!" `
                    -Message "All tasks finished! Ready for Phase 3."
                exit 0
            } else {
                Write-ColorOutput "Remaining tasks: $incomplete" "Cyan"
                Write-Host ""
                Write-Host "💡 To continue with next batch:" -ForegroundColor Cyan
                Write-Host "   /continue-docs" -ForegroundColor White
                Write-Host ""
            }

            # Save new count
            Save-Count -Count $currentCompleted
        }
    }
}

###############################################################################
# Main Entry Point
###############################################################################

# Check if we're in the right directory
if (-not (Test-Path "peta-docs")) {
    Write-Host "Error: Not in KompasAI root directory" -ForegroundColor Red
    exit 1
}

# Create directory if needed
$hookDir = Split-Path -Parent $LastCountFile
if (-not (Test-Path $hookDir)) {
    New-Item -ItemType Directory -Path $hookDir -Force | Out-Null
}

# Handle command line arguments
$command = $args[0]

switch ($command) {
    "--once" {
        # Run once and exit
        $current = Get-CompletedCount
        $last = Get-LastCount
        if ($current -gt $last) {
            $diff = $current - $last
            Write-Host "Progress detected: $diff new completions"
            Save-Count -Count $current

            Write-Host ""
            Write-Host "💡 Suggested next step:" -ForegroundColor Cyan
            Write-Host "   /continue-docs" -ForegroundColor White
            Write-Host ""
        } else {
            Write-Host "No new progress"
        }
        exit 0
    }
    "--reset" {
        if (Test-Path $LastCountFile) {
            Remove-Item $LastCountFile
        }
        Write-Host "Progress counter reset" -ForegroundColor Green
        exit 0
    }
    "--status" {
        $completed = Get-CompletedCount
        $incomplete = Get-IncompleteCount
        $total = $completed + $incomplete
        $percentage = [math]::Round(($completed / $total) * 100, 1)

        Write-Host "📊 Documentation Progress" -ForegroundColor Cyan
        Write-Host "   Completed: $completed/$total ($percentage%)" -ForegroundColor Green
        Write-Host "   Remaining: $incomplete" -ForegroundColor Yellow
        exit 0
    }
    default {
        Start-ProgressWatch
    }
}
