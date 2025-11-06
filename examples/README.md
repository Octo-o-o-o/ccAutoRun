# Examples

This directory contains example files showing how to integrate ccAutoRun into your project.

## 📦 package.json

The `package.json` file shows how to add npm scripts for convenient access to ccAutoRun functionality.

### Usage

Copy the `scripts` section to your project's `package.json`:

```json
{
  "scripts": {
    "docs:continue": "powershell -ExecutionPolicy Bypass -File ./.claude/hooks/auto-continue.ps1",
    "docs:watch": "powershell -ExecutionPolicy Bypass -File ./.claude/hooks/auto-continue.ps1 -Watch",
    "docs:reset": "powershell -ExecutionPolicy Bypass -File ./.claude/hooks/auto-continue.ps1 -Reset",
    "docs:status": "powershell -ExecutionPolicy Bypass -File ./.claude/hooks/auto-continue.ps1 -Status",
    "docs:test": "powershell -ExecutionPolicy Bypass -File ./.claude/hooks/test-system.ps1"
  }
}
```

Then use:

```bash
npm run docs:continue   # Check progress and show next steps
npm run docs:watch      # Start background monitoring
npm run docs:reset      # Reset session counter
npm run docs:status     # Quick status check
npm run docs:test       # Run system tests
```

### For Unix/Linux/macOS

Replace PowerShell commands with Bash:

```json
{
  "scripts": {
    "docs:continue": "bash ./.claude/hooks/check-and-continue.sh",
    "docs:watch": "bash ./.claude/hooks/watch-and-notify.sh",
    "docs:reset": "bash ./.claude/hooks/check-and-continue.sh --reset",
    "docs:status": "bash ./.claude/hooks/check-and-continue.sh --status"
  }
}
```

## 🎯 Custom Integration

You can customize script names to match your workflow:

```json
{
  "scripts": {
    "auto:start": "powershell -ExecutionPolicy Bypass -File ./.claude/hooks/auto-continue.ps1 -Watch",
    "auto:continue": "...",
    "auto:stop": "powershell -ExecutionPolicy Bypass -File ./.claude/hooks/auto-continue.ps1 -Pause"
  }
}
```

## 💡 Tips

1. **Use watch mode** for best experience
2. **Add to README** so team members know how to use it
3. **Customize command names** to match your project conventions
4. **Combine with other scripts** (e.g., build, test, deploy)

## 📚 More Examples

Looking for specific integration examples? Please open an issue or submit a PR!

We welcome examples for:
- Different project types (frontend, backend, mobile)
- Different use cases (refactoring, testing, documentation)
- Integration with CI/CD pipelines
- Custom workflows
