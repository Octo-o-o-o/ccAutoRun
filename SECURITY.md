# Security Policy

## Supported Versions

We actively support the following versions of ccAutoRun with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by emailing the maintainers directly. You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information in your report:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

This information will help us triage your report more quickly.

## Security Best Practices

### For Users

**1. Keep ccAutoRun Updated**
- Always use the latest stable version
- Run `npm update ccautorun` regularly
- Subscribe to release notifications on GitHub

**2. Secure Your Configuration**
- **Never commit sensitive files** to version control:
  - `.env`, `.env.local`, `.env.production`
  - `credentials.json`, `secrets.yaml`
  - `*.pem`, `*.key`, `*.cert`
  - Private keys (`id_rsa`, `id_ed25519`)
- Add all sensitive patterns to `.gitignore`
- Use the `ccautorun audit` command to detect exposed sensitive files

**3. Sandbox Mode (Enabled by Default)**
- ccAutoRun runs in sandbox mode by default, which:
  - Restricts file access to the project directory
  - Blocks dangerous commands (`rm -rf /`, `format`, etc.)
  - Uses a whitelist for allowed commands
  - Prevents parent directory access (`../../`)
- Only disable sandbox mode with `--dangerously-skip-permissions` when absolutely necessary

**4. Review Generated Plans**
- Always review AI-generated plans before execution
- Check for suspicious file operations or commands
- Verify that sensitive directories are not accessed

**5. Hook Security**
- Review `.claude/hooks/` scripts before running
- Avoid running hooks from untrusted sources
- Use `ccautorun audit` to scan for command injection risks

### For Developers

**1. Dependency Security**
- Run `npm audit` before each release
- Keep all dependencies updated
- Use `npm audit fix` to auto-fix vulnerabilities
- Review security advisories for dependencies

**2. Input Validation**
- Validate all user inputs
- Sanitize file paths to prevent directory traversal
- Escape shell commands to prevent injection

**3. Secrets Management**
- Never hardcode secrets in source code
- Use environment variables for sensitive data
- Implement secret detection in CI/CD pipelines

**4. Code Review**
- All PRs must be reviewed before merging
- Focus on security implications of changes
- Run security tests in CI/CD

**5. Logging and Auditing**
- Log all security-relevant events to `audit.log`
- Never log sensitive information (passwords, API keys)
- Implement log rotation and retention policies

## Security Features

### Sandbox Mode

ccAutoRun implements a comprehensive sandbox to restrict potentially dangerous operations:

**File Access Control:**
- Only allows access to files within the project directory
- Blocks access to system directories:
  - `/etc`, `/System`, `C:\Windows`
  - User home directory (except `.ccautorun/`)
  - Parent directories (`../..`)

**Command Whitelist:**
- Safe commands: `git`, `npm`, `node`, `cat`, `ls`, `echo`
- Blocked commands: `rm -rf /`, `format`, `dd`, `mkfs`, `del /s`

**Runtime Protection:**
- Command injection detection
- Path traversal prevention
- Atomic file operations to prevent corruption

### Sensitive File Detection

The `ccautorun audit` command scans for:
- Environment files (`.env*`)
- Credential files (`credentials.json`, `secrets.yaml`)
- Private keys (`*.pem`, `*.key`, `id_rsa`)
- Other sensitive patterns

### Audit Logging

All security-relevant operations are logged to `.ccautorun/logs/audit.log`:
- File access attempts
- Command executions
- Sensitive file access warnings
- Hook executions

## Known Security Considerations

### Current Dependency Vulnerabilities (as of 2025-11-07)

**esbuild <=0.24.2 (Moderate Severity)**
- **Issue**: Development server request forgery
- **Impact**: Low (development dependency only)
- **Mitigation**: Not used in production, only during development and testing
- **Status**: Monitoring for updates

**vitest chain (6 moderate vulnerabilities)**
- **Impact**: Low (development/testing dependency only)
- **Mitigation**: Not included in production build
- **Status**: Will update when stable release available

**Why these are acceptable:**
- All vulnerabilities are in **development dependencies only**
- They do not affect production runtime
- Breaking changes in proposed fixes require careful evaluation
- We monitor these dependencies and will update when safe

### Limitations

**1. AI-Generated Code Risks**
- AI-generated plans may contain unintended behaviors
- **Mitigation**: User review before execution, sandbox mode

**2. Hook Execution**
- Custom hooks run with user's permissions
- **Mitigation**: Hook security scanning, user awareness

**3. Third-Party Tool Dependencies**
- ccAutoRun integrates with external tools (git, npm, Claude Code)
- **Mitigation**: Validate tool outputs, handle errors gracefully

## Security Roadmap

### v2.1 (Planned)
- [ ] Enhanced sandbox with three permission levels (safe/standard/dangerous)
- [ ] Automated secret detection in file diffs
- [ ] Integration with GitHub Secret Scanning
- [ ] Security policy templates for teams

### v2.2 (Future)
- [ ] End-to-end encryption for sensitive plan data
- [ ] Role-based access control (RBAC) for team usage
- [ ] Security compliance reports (SOC 2, ISO 27001)
- [ ] Integration with external security scanning tools

## Compliance

ccAutoRun is designed with the following security principles:

- **Principle of Least Privilege**: Runs with minimal required permissions
- **Defense in Depth**: Multiple layers of security controls
- **Fail Securely**: Errors default to secure state
- **Secure by Default**: Sandbox mode enabled out of the box
- **Audit Trail**: Comprehensive logging of security events

## Security Testing

We perform the following security tests:

- **Dependency Scanning**: `npm audit` in CI/CD
- **Sensitive File Detection**: Automated scans for exposed secrets
- **Command Injection Testing**: Test suite for shell command safety
- **Path Traversal Testing**: Verify sandbox restrictions
- **Integration Tests**: End-to-end security scenarios

Run security tests locally:

```bash
# Full security audit
npm run test:security

# Dependency scan
npm audit

# ccAutoRun security audit
ccautorun audit

# Coverage report
npm run test:coverage
```

## Acknowledgments

We are grateful to security researchers who responsibly disclose vulnerabilities. Contributors will be acknowledged here (with permission).

---

**Last Updated**: 2025-11-07
**Version**: 2.0.0
