#!/bin/bash

###############################################################################
# Documentation Progress Watcher
#
# This script monitors the progress file for changes and notifies when
# a batch is completed, suggesting automatic continuation.
#
# Usage:
#   bash .claude/hooks/watch-and-notify.sh
#
# Features:
#   - Monitors DOCUMENTATION_PROGRESS.md for changes
#   - Detects when tasks are marked complete
#   - Displays desktop notifications (if available)
#   - Suggests next steps
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
PROGRESS_FILE="peta-docs/DOCUMENTATION_PROGRESS.md"
CHECK_INTERVAL=10  # seconds
LAST_COUNT_FILE=".claude/hooks/.last-completed-count"

###############################################################################
# Helper Functions
###############################################################################

log_info() {
    echo -e "${CYAN}[$(date +'%H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

count_completed() {
    grep -c "^- \[x\]" "$PROGRESS_FILE" || echo "0"
}

get_last_count() {
    if [ -f "$LAST_COUNT_FILE" ]; then
        cat "$LAST_COUNT_FILE"
    else
        echo "0"
    fi
}

save_count() {
    echo "$1" > "$LAST_COUNT_FILE"
}

send_notification() {
    local title="$1"
    local message="$2"

    # Try different notification methods
    if command -v notify-send &> /dev/null; then
        # Linux (Ubuntu, etc.)
        notify-send "$title" "$message"
    elif command -v osascript &> /dev/null; then
        # macOS
        osascript -e "display notification \"$message\" with title \"$title\""
    elif command -v powershell.exe &> /dev/null; then
        # Windows (WSL)
        powershell.exe -Command "
            Add-Type -AssemblyName System.Windows.Forms
            \$notification = New-Object System.Windows.Forms.NotifyIcon
            \$notification.Icon = [System.Drawing.SystemIcons]::Information
            \$notification.BalloonTipTitle = '$title'
            \$notification.BalloonTipText = '$message'
            \$notification.Visible = \$true
            \$notification.ShowBalloonTip(5000)
        "
    fi
}

play_sound() {
    # Try to play completion sound
    if command -v afplay &> /dev/null; then
        # macOS
        afplay /System/Library/Sounds/Glass.aiff &
    elif command -v paplay &> /dev/null; then
        # Linux
        paplay /usr/share/sounds/freedesktop/stereo/complete.oga &
    fi
}

###############################################################################
# Main Watch Loop
###############################################################################

watch_progress() {
    log_info "Starting documentation progress watcher..."
    log_info "Monitoring: $PROGRESS_FILE"
    log_info "Check interval: ${CHECK_INTERVAL}s"
    log_info "Press Ctrl+C to stop"
    echo ""

    # Initialize last count
    local last_completed=$(count_completed)
    save_count "$last_completed"

    while true; do
        sleep "$CHECK_INTERVAL"

        # Check if file exists
        if [ ! -f "$PROGRESS_FILE" ]; then
            continue
        fi

        # Count current completed tasks
        local current_completed=$(count_completed)
        local saved_count=$(get_last_count)

        # Check if count has increased
        if [ "$current_completed" -gt "$saved_count" ]; then
            local new_completions=$((current_completed - saved_count))

            log_success "✨ ${BOLD}New progress detected!${NC}"
            log_success "   ${new_completions} new task(s) completed"
            log_success "   Total completed: ${current_completed}"
            echo ""

            # Send notification
            send_notification \
                "Documentation Progress" \
                "Completed ${new_completions} new task(s)! Total: ${current_completed}"

            # Play sound
            play_sound

            # Check if we should continue
            local incomplete=$(grep -c "^- \[ \]" "$PROGRESS_FILE" || echo "0")

            if [ "$incomplete" -eq 0 ]; then
                log_success "🎉 ${BOLD}ALL TASKS COMPLETE!${NC}"
                send_notification \
                    "Documentation Complete!" \
                    "All 145 tasks finished! Ready for Phase 3."
                exit 0
            else
                log_info "Remaining tasks: ${incomplete}"
                echo ""
                echo -e "${CYAN}💡 To continue with next batch:${NC}"
                echo -e "   ${BOLD}/continue-docs${NC}"
                echo ""
            fi

            # Save new count
            save_count "$current_completed"
        fi
    done
}

###############################################################################
# Main Entry Point
###############################################################################

# Check if we're in the right directory
if [ ! -d "peta-docs" ]; then
    echo "Error: Not in KompasAI root directory"
    exit 1
fi

# Create lock file directory if needed
mkdir -p .claude/hooks

# Handle command line arguments
case "${1:-}" in
    --once)
        # Run once and exit
        current=$(count_completed)
        last=$(get_last_count)
        if [ "$current" -gt "$last" ]; then
            echo "Progress detected: $((current - last)) new completions"
            save_count "$current"
            bash .claude/hooks/check-and-continue.sh --auto
        else
            echo "No new progress"
        fi
        exit 0
        ;;
    --reset)
        rm -f "$LAST_COUNT_FILE"
        echo "Progress counter reset"
        exit 0
        ;;
    *)
        watch_progress
        ;;
esac
