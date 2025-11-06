# Contributing to ccAutoRun

Thank you for your interest in contributing to ccAutoRun! This document provides guidelines for contributing to the project.

## 🎯 Ways to Contribute

### 1. Report Bugs
- Use GitHub Issues
- Include system information (OS, PowerShell/Bash version)
- Provide steps to reproduce
- Include error messages and logs

### 2. Suggest Features
- Open a GitHub Discussion first
- Explain the use case
- Provide examples if possible

### 3. Improve Documentation
- Fix typos and unclear explanations
- Add examples and use cases
- Translate to other languages

### 4. Submit Code
- Fix bugs
- Implement new features
- Improve existing code
- Add tests

## 🚀 Getting Started

### Development Setup

```bash
# Fork the repository on GitHub

# Clone your fork
git clone https://github.com/YOUR_USERNAME/ccAutoRun.git
cd ccAutoRun

# Create a branch for your changes
git checkout -b feature/your-feature-name
```

### Testing Your Changes

```powershell
# Windows
.\.claude\hooks\test-system.ps1

# Unix/Linux/macOS
bash .claude/hooks/check-and-continue.sh --status
```

## 📝 Coding Guidelines

### PowerShell Scripts

```powershell
# Use clear variable names
$progressFile = "path/to/file"  # Good
$pf = "path/to/file"            # Bad

# Add comments for complex logic
# Calculate completion percentage
$percentage = [math]::Round(($completed / $total) * 100, 1)

# Use proper error handling
try {
    # Your code
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
```

### Bash Scripts

```bash
# Use consistent formatting
function my_function() {
    local var_name="value"
    echo "Message"
}

# Add error checking
if [ ! -f "$file" ]; then
    echo "Error: File not found"
    exit 1
fi
```

### Documentation

- Use clear, concise language
- Include examples
- Use proper markdown formatting
- Test all code examples

## 🔍 Pull Request Process

### Before Submitting

1. **Test your changes**
   - Run on your target platform
   - Test edge cases
   - Verify documentation accuracy

2. **Update documentation**
   - Update README.md if needed
   - Add/update examples
   - Document new features

3. **Follow commit conventions**
   ```
   feat: Add new monitoring feature
   fix: Correct lock file path issue
   docs: Update installation guide
   refactor: Improve auto-continue logic
   test: Add system test cases
   ```

### Submitting a PR

1. **Create a descriptive title**
   - `feat: Add background monitoring for Unix`
   - `fix: Desktop notifications not working on Windows 11`
   - `docs: Add troubleshooting for common errors`

2. **Provide detailed description**
   ```markdown
   ## What
   Brief description of changes

   ## Why
   Reason for the changes

   ## How
   Technical details

   ## Testing
   How you tested the changes
   ```

3. **Link related issues**
   - Fixes #123
   - Relates to #456

4. **Request review**
   - Tag maintainers if needed
   - Be responsive to feedback

## 🧪 Testing Guidelines

### Manual Testing

Test on different platforms:
- Windows 10/11
- macOS (latest)
- Ubuntu/Debian
- Other Linux distros

Test different scenarios:
- First-time setup
- Existing project integration
- Error conditions
- Edge cases

### Automated Testing

If adding automated tests:
- Use consistent naming
- Test both success and failure cases
- Include comments explaining test purpose

## 📋 Code Review

### What We Look For

✅ **Good**
- Clear, readable code
- Proper error handling
- Comprehensive documentation
- Cross-platform compatibility
- No breaking changes (or clearly documented)

❌ **Avoid**
- Unclear variable names
- Magic numbers without explanation
- Platform-specific code without alternatives
- Breaking existing functionality

### Review Process

1. Maintainer reviews code
2. Automated tests run (if available)
3. Discussion and feedback
4. Updates if needed
5. Approval and merge

## 🎨 Style Guide

### File Naming

- Use lowercase with hyphens: `auto-continue.ps1`
- Be descriptive: `watch-and-notify.sh`
- Use appropriate extensions: `.ps1`, `.sh`, `.md`

### Directory Structure

Keep the existing structure:
```
.claude/
├── commands/
└── hooks/
scripts/
docs/
examples/
```

### Documentation

- Use H2 for main sections: `## Section`
- Use H3 for subsections: `### Subsection`
- Use code blocks with language tags: ` ```powershell`
- Use tables for comparisons
- Add emojis for visual clarity (but not excessively)

## 🐛 Bug Reports

### Good Bug Report Template

```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: Windows 11
- PowerShell Version: 7.3
- ccAutoRun Version: 1.0.0

## Additional Context
Screenshots, error logs, etc.
```

## 💡 Feature Requests

### Good Feature Request Template

```markdown
## Problem
What problem does this solve?

## Proposed Solution
How would this feature work?

## Alternatives Considered
Other ways to solve this problem

## Use Case
Real-world example of how this would be used
```

## 🤝 Community

- Be respectful and constructive
- Help others when you can
- Share your use cases and experiences
- Provide feedback on PRs and issues

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You

Thank you for contributing to ccAutoRun! Your efforts help make this tool better for everyone.

---

**Questions?** Open a GitHub Discussion or Issue.
