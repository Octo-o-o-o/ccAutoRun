#!/bin/bash

###############################################################################
# Auto-Continue Documentation Hook
#
# This script checks if there are incomplete tasks and provides guidance
# for continuing the documentation process.
#
# Usage: Called automatically by Claude Code hooks, or manually run:
#   bash .claude/hooks/check-and-continue.sh
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
PROGRESS_FILE="peta-docs/DOCUMENTATION_PROGRESS.md"
LOCK_FILE=".claude/hooks/.auto-continue.lock"
MAX_AUTO_SESSIONS=3  # Prevent infinite loops

###############################################################################
# Helper Functions
###############################################################################

log_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo -e "\n${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${CYAN}  📚 Documentation Auto-Continue Hook${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

###############################################################################
# Check Functions
###############################################################################

check_progress_file() {
    if [ ! -f "$PROGRESS_FILE" ]; then
        log_error "Progress file not found: $PROGRESS_FILE"
        return 1
    fi
    return 0
}

count_incomplete_tasks() {
    grep -c "^- \[ \]" "$PROGRESS_FILE" || echo "0"
}

count_completed_tasks() {
    grep -c "^- \[x\]" "$PROGRESS_FILE" || echo "0"
}

get_session_count() {
    if [ -f "$LOCK_FILE" ]; then
        cat "$LOCK_FILE"
    else
        echo "0"
    fi
}

increment_session_count() {
    local count=$(get_session_count)
    echo $((count + 1)) > "$LOCK_FILE"
}

reset_session_count() {
    echo "0" > "$LOCK_FILE"
}

###############################################################################
# Main Logic
###############################################################################

main() {
    print_header

    # Check if we're in the right directory
    if [ ! -d "peta-docs" ]; then
        log_error "Not in KompasAI root directory"
        log_info "Please run from: $(pwd)"
        exit 1
    fi

    # Check progress file exists
    if ! check_progress_file; then
        exit 1
    fi

    # Count tasks
    local incomplete=$(count_incomplete_tasks)
    local completed=$(count_completed_tasks)
    local total=$((incomplete + completed))
    local percentage=$(( (completed * 100) / total ))

    # Display current status
    log_info "Progress: ${BOLD}${completed}/${total}${NC} tasks completed (${percentage}%)"
    log_info "Remaining: ${BOLD}${incomplete}${NC} tasks"
    echo ""

    # Check if all tasks are complete
    if [ "$incomplete" -eq 0 ]; then
        log_success "${BOLD}🎉 ALL DOCUMENTATION TASKS COMPLETE!${NC}"
        log_success "Ready to move to Phase 3: Enhancement & Polish"
        reset_session_count
        echo ""

        # Suggest next steps
        echo -e "${CYAN}Next steps:${NC}"
        echo "  1. Review completed documentation"
        echo "  2. Run: cd peta-docs && npm run build"
        echo "  3. Start Phase 3 tasks (see DOCUMENTATION_PROGRESS.md)"
        echo ""
        exit 0
    fi

    # Check auto-session limit
    local session_count=$(get_session_count)
    if [ "$session_count" -ge "$MAX_AUTO_SESSIONS" ]; then
        log_warning "Auto-continue limit reached (${session_count}/${MAX_AUTO_SESSIONS} sessions)"
        log_info "Pausing for manual review..."
        echo ""
        echo -e "${CYAN}To continue:${NC}"
        echo "  1. Review the last batch of completed pages"
        echo "  2. Run: bash .claude/hooks/check-and-continue.sh --reset"
        echo "  3. Use: /continue-docs"
        echo ""
        exit 0
    fi

    # Show next batch preview
    log_info "Next batch preview:"
    echo ""
    cd peta-docs && npm run docs:next 5 2>/dev/null | tail -n +3 | head -n 15
    cd ..
    echo ""

    # Increment session counter
    increment_session_count
    local new_count=$(get_session_count)
    log_info "Auto-session: ${new_count}/${MAX_AUTO_SESSIONS}"
    echo ""

    # Provide continuation instructions
    echo -e "${BOLD}${GREEN}📝 Ready to continue!${NC}"
    echo ""
    echo -e "${CYAN}Option 1 - Automatic (Recommended):${NC}"
    echo -e "  ${BOLD}/continue-docs${NC}"
    echo ""
    echo -e "${CYAN}Option 2 - Manual review first:${NC}"
    echo "  cd peta-docs && npm run docs:status"
    echo "  Then use: /continue-docs"
    echo ""
    echo -e "${CYAN}Option 3 - Pause auto-continue:${NC}"
    echo "  bash .claude/hooks/check-and-continue.sh --pause"
    echo ""

    # If in auto mode, suggest immediate continuation
    if [ "$1" == "--auto" ]; then
        log_success "Auto-mode enabled - suggesting immediate continuation"
        echo ""
        echo -e "${BOLD}${YELLOW}⚡ Paste this into Claude Code to continue:${NC}"
        echo ""
        echo -e "${BOLD}/continue-docs${NC}"
        echo ""
    fi
}

###############################################################################
# Command Line Interface
###############################################################################

case "${1:-}" in
    --reset)
        reset_session_count
        log_success "Session counter reset"
        exit 0
        ;;
    --pause)
        echo "9999" > "$LOCK_FILE"
        log_success "Auto-continue paused (run with --reset to resume)"
        exit 0
        ;;
    --resume)
        reset_session_count
        log_success "Auto-continue resumed"
        main --auto
        ;;
    --status)
        if check_progress_file; then
            echo "Completed: $(count_completed_tasks)"
            echo "Incomplete: $(count_incomplete_tasks)"
            echo "Session count: $(get_session_count)/$MAX_AUTO_SESSIONS"
        fi
        exit 0
        ;;
    --auto)
        main --auto
        ;;
    --help|-h)
        echo "Usage: bash check-and-continue.sh [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  (no args)    Run check and show continuation options"
        echo "  --auto       Run in auto mode (suggest immediate continuation)"
        echo "  --reset      Reset session counter"
        echo "  --pause      Pause auto-continue"
        echo "  --resume     Resume auto-continue"
        echo "  --status     Show current status"
        echo "  --help       Show this help"
        echo ""
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
