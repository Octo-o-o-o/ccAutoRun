# 🤖 ccAutoRun - Claude Code Automation System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue.svg)](https://github.com/Octo-o-o-o/ccAutoRun)

**Achieve 92% automation for batch processing tasks in Claude Code!**

A powerful automation system that enables Claude Code to automatically continue processing tasks in batches, with intelligent safety limits and real-time monitoring.

## 🎯 What is ccAutoRun?

ccAutoRun solves a critical problem: **how to automate long-running tasks in Claude Code without constant manual supervision**.

Instead of manually checking every 30-60 minutes to continue the next batch, ccAutoRun:
- ✅ Automatically continues to the next batch using `/clear` command
- ✅ Runs 3 consecutive batches (safety limit)
- ✅ Notifies you when it's time to review
- ✅ Provides desktop notifications and sound alerts
- ✅ Reduces manual intervention to < 1 hour for multi-day projects

**Automation Level: 92%** 🎉

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/Octo-o-o-o/ccAutoRun.git

# Copy files to your project
cp -r ccAutoRun/.claude /your/project/
cp -r ccAutoRun/scripts /your/project/

# For Windows users
# Just copy the .claude folder to your project root
```

### Usage (3 Steps)

**Step 1:** Configure your task in `.claude/commands/continue-docs.md` (or rename/customize it)

**Step 2:** Reset the session counter
```powershell
# Windows
.\.claude\hooks\auto-continue.ps1 -Reset

# Unix/Linux/macOS
bash .claude/hooks/check-and-continue.sh --reset
```

**Step 3:** Start auto-run in Claude Code
```
/continue-docs
```

That's it! The system will:
1. Complete batch 1 → Auto `/clear` → Auto continue
2. Complete batch 2 → Auto `/clear` → Auto continue
3. Complete batch 3 → Pause for your review

## 🎬 How It Works

### Auto-Loop Mechanism

```
You type once: /continue-docs
    ↓
[Batch 1] Auto-complete → Auto output /clear + /continue-docs
    ↓
[Batch 2] Auto-complete → Auto output /clear + /continue-docs
    ↓
[Batch 3] Auto-complete → Reach safety limit → Pause
    ↓
⚠️ Prompt: Please review, then run /clear + /continue-docs
    ↓
You: Review 10 min + Reset counter
    ↓
Repeat until all done! 🎊
```

### Core Innovation: `/clear` Command Loop

The system leverages Claude Code's `/clear` command to:
- Reset context between batches
- Maintain consistent quality
- Enable true automatic looping
- Prevent context pollution

## 📊 Efficiency Gains

| Method | Total Time | Manual Time | Automation |
|--------|------------|-------------|------------|
| Pure Manual | 12-15h | 12-15h | 0% |
| Script-Assisted | 10-12h | 2-3h | 75% |
| Hooks + Monitoring | 10-12h | 1-2h | 85% |
| **ccAutoRun** | **10-12h** | **< 1h** | **92%** |

For a 140-task project:
- **Before:** 12-15 hours of manual work
- **After:** < 1 hour of manual work (just reviews)
- **Savings:** 92% time reduction!

## ✨ Key Features

### 1. Intelligent Auto-Continuation
- Automatically loops through batches using `/clear`
- No manual intervention between batches
- Seamless context reset

### 2. Safety Mechanism
- 3-batch safety limit (configurable)
- Prevents infinite loops
- Forces quality review every 21 tasks
- Stored in `.claude/hooks/.auto-continue.lock`

### 3. Real-Time Monitoring (Optional)
- Desktop notifications when batch completes
- Sound alerts
- Background monitoring mode
- Progress tracking

### 4. Cross-Platform Support
- **Windows:** PowerShell scripts
- **Unix/Linux/macOS:** Bash scripts
- Consistent functionality across platforms

### 5. Comprehensive Documentation
- 20,000+ words of detailed guides
- Quick start tutorials
- Troubleshooting guides
- Best practices

## 📋 Project Structure

```
ccAutoRun/
├── .claude/
│   ├── commands/
│   │   └── continue-docs.md        # Slash command with auto-loop logic
│   └── hooks/
│       ├── auto-continue.ps1       # Main script (Windows)
│       ├── watch-and-notify.ps1    # Monitoring script (Windows)
│       ├── check-and-continue.sh   # Main script (Unix)
│       ├── watch-and-notify.sh     # Monitoring script (Unix)
│       ├── test-system.ps1         # System test script
│       └── README.md               # Hooks technical documentation
├── scripts/
│   └── docs-automation.mjs         # Node.js progress management
├── docs/
│   ├── FULL_AUTO_MODE.md          # Complete auto mode guide
│   ├── QUICKSTART_HOOKS.md        # Quick start guide
│   ├── AUTOMATION_GUIDE.md        # Comprehensive automation guide
│   ├── AUTOMATION_INDEX.md        # Documentation index
│   └── README_AUTOMATION.md       # Quick reference
├── examples/
│   └── package.json               # Example npm integration
├── README.md                       # This file
├── LICENSE                         # MIT License
└── .gitignore
```

## 🎯 Use Cases

### 1. Documentation Generation
Generate hundreds of pages of technical documentation with minimal manual intervention.

### 2. Code Refactoring
Systematically refactor large codebases across multiple files.

### 3. Test Writing
Automatically generate comprehensive test suites.

### 4. Data Processing
Process large datasets in batches with Claude Code.

### 5. Content Creation
Generate multiple articles, tutorials, or guides.

## 🛠️ Command Reference

### Windows (PowerShell)

```powershell
# Main automation script
.\.claude\hooks\auto-continue.ps1           # Interactive mode
.\.claude\hooks\auto-continue.ps1 -Watch    # Background monitoring
.\.claude\hooks\auto-continue.ps1 -Status   # Quick status check
.\.claude\hooks\auto-continue.ps1 -Reset    # Reset session counter
.\.claude\hooks\auto-continue.ps1 -Pause    # Pause auto-continue

# Test the system
.\.claude\hooks\test-system.ps1
```

### Unix/Linux/macOS (Bash)

```bash
# Main automation script
bash .claude/hooks/check-and-continue.sh           # Interactive mode
bash .claude/hooks/check-and-continue.sh --auto    # Auto mode
bash .claude/hooks/check-and-continue.sh --reset   # Reset counter
bash .claude/hooks/check-and-continue.sh --status  # Status check

# Background monitoring
bash .claude/hooks/watch-and-notify.sh
```

### Claude Code

```
# The most important command!
/continue-docs
```

## 📖 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Quick Start](docs/QUICKSTART_HOOKS.md)** - Get started in 10 minutes
- **[Full Auto Mode](docs/FULL_AUTO_MODE.md)** - Deep dive into automation
- **[Automation Guide](docs/AUTOMATION_GUIDE.md)** - Complete reference
- **[Documentation Index](docs/AUTOMATION_INDEX.md)** - Navigate all docs

## 🔧 Configuration

### Adjust Batch Limit

Edit `.claude/commands/continue-docs.md`:

```markdown
# Find this line:
**ELSE IF session count >= 3:**

# Change to:
**ELSE IF session count >= 5:**  # More aggressive (5 batches)
**ELSE IF session count >= 1:**  # More conservative (review every batch)
```

**Recommended:** Keep default of 3 batches

### Customize for Your Task

The provided `continue-docs.md` is an example for documentation generation. To customize:

1. Copy `.claude/commands/continue-docs.md` to your own command name
2. Edit the instructions to match your task
3. Keep the "Auto-Continuation Logic" section intact
4. Adjust batch size guidelines as needed

## 🛡️ Safety Features

### 1. Session Counter
Tracks how many consecutive batches have run without manual review.

### 2. Safety Limit
Automatically pauses after 3 batches (default) to force quality review.

### 3. Lock File
Stores state in `.claude/hooks/.auto-continue.lock` to prevent race conditions.

### 4. Clear Instructions
Provides explicit next steps when safety limit is reached.

## 💡 Best Practices

1. **Use monitoring mode** for the best experience
2. **Review regularly** - Every 3 batches (21 tasks)
3. **Keep default limit** - 3 batches is optimal
4. **Commit frequently** - After each review session
5. **Multi-window layout** - Claude Code + Terminal + Editor + Browser

## 🐛 Troubleshooting

### Issue: Auto-loop not working

**Solution:** Check that:
1. You're using the latest `continue-docs.md` with auto-loop logic
2. The lock file exists and has correct permissions
3. There are still incomplete tasks remaining

### Issue: Desktop notifications not showing

**Solution (Windows):**
1. Enable notifications in Windows Settings
2. Turn off Focus Assist
3. Run PowerShell as administrator (if needed)

### Issue: Infinite loop

**Solution:**
```powershell
# Emergency pause
.\.claude\hooks\auto-continue.ps1 -Pause
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

```bash
git clone https://github.com/Octo-o-o-o/ccAutoRun.git
cd ccAutoRun

# Test the system
powershell -ExecutionPolicy Bypass -File .claude/hooks/test-system.ps1
```

### Guidelines

- Follow existing code style
- Update documentation for new features
- Test on multiple platforms when possible
- Add examples for new use cases

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for [Claude Code](https://claude.ai/code) by Anthropic
- Inspired by the need for better automation in AI-assisted development
- Community feedback and testing

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/Octo-o-o-o/ccAutoRun/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Octo-o-o-o/ccAutoRun/discussions)
- **Documentation:** See `docs/` directory

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Made with ❤️ for the Claude Code community**

**Achieve 92% automation and save hours of manual work!** 🚀
