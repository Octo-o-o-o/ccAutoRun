# Stage 1: Analysis and Preparation 🔍

**[← Back to Main Plan](../README.md)** | **[Next Stage →](02-oauth-provider-setup.md)**

---

## 📋 Stage Information

- **Stage Number**: Stage 1
- **Estimated Time**: 2-3 hours
- **Dependencies**: None
- **Status**: ⏳ Pending

### 🎯 Goal
Thoroughly analyze the current authentication system, understand its architecture and limitations, research OAuth2.0 providers, and create a comprehensive technical specification for the refactor.

### 📝 Task Checklist

#### 1.1 Current System Analysis
- [ ] Task 1.1.1: Map out current authentication flow
  - **What**: Document the complete authentication flow from login to session management
  - **Why**: Understanding the current system is critical before refactoring
  - **How**:
    - Trace code from login routes → Passport Local strategy → session creation
    - Document middleware dependencies
    - Create a flow diagram (ASCII or Mermaid)
  - **Files**: `src/auth/`, `src/routes/auth.js`, `src/middleware/auth.js`
  - **Validation**: Flow diagram accurately represents the current system

- [ ] Task 1.1.2: Identify all auth-related files and dependencies
  - **What**: Create a complete inventory of all authentication-related code
  - **Why**: Need to know what will be affected by the refactor
  - **How**:
    - Search for Passport.js usage: `grep -r "passport" src/`
    - Search for session usage: `grep -r "req.session" src/`
    - List all files in `src/auth/` directory
    - Document external dependencies (npm packages)
  - **Files**: All files in `src/auth/`, auth middleware, session config
  - **Validation**: Complete file inventory documented

- [ ] Task 1.1.3: Document current pain points and limitations
  - **What**: List all known issues and limitations of current auth system
  - **Why**: These are the problems we're trying to solve
  - **How**:
    - Review GitHub issues tagged "auth" or "authentication"
    - Interview team members about auth pain points
    - Document scalability concerns
    - List missing features (OAuth, JWT, 2FA, etc.)
  - **Files**: Create `docs/auth-pain-points.md`
  - **Validation**: At least 5 concrete pain points documented

#### 1.2 OAuth2.0 Research
- [ ] Task 1.2.1: Research Google OAuth2.0 integration
  - **What**: Understand Google's OAuth2.0 flow and requirements
  - **Why**: Google will be our first OAuth provider
  - **How**:
    - Read [Google OAuth2.0 documentation](https://developers.google.com/identity/protocols/oauth2)
    - Understand consent screen, scopes, and callback URLs
    - Note required credentials (client ID, client secret)
    - Document redirect URI requirements
  - **Files**: Create `docs/oauth-google-research.md`
  - **Validation**: Document includes flow diagram, required scopes, and setup steps

- [ ] Task 1.2.2: Research GitHub OAuth integration
  - **What**: Understand GitHub's OAuth flow and requirements
  - **Why**: GitHub will be our second OAuth provider
  - **How**:
    - Read [GitHub OAuth documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
    - Understand GitHub Apps vs OAuth Apps
    - Note required credentials and permissions
    - Document callback URL requirements
  - **Files**: Create `docs/oauth-github-research.md`
  - **Validation**: Document includes flow diagram, required scopes, and setup steps

- [ ] Task 1.2.3: Compare OAuth providers and design abstraction
  - **What**: Identify common patterns across OAuth providers
  - **Why**: Need a clean abstraction to support multiple providers
  - **How**:
    - Compare Google and GitHub OAuth flows
    - Identify common steps (redirect, callback, token exchange, user info)
    - Design a provider interface/abstraction
    - Plan for adding more providers in the future (Facebook, Twitter, etc.)
  - **Files**: Create `docs/oauth-provider-abstraction.md`
  - **Validation**: Abstraction design supports at least 4 different OAuth providers

#### 1.3 JWT Token Research
- [ ] Task 1.3.1: Research JWT best practices
  - **What**: Understand JWT token structure, signing, and security best practices
  - **Why**: JWT will be core to our new auth system
  - **How**:
    - Read [JWT RFC 8725](https://tools.ietf.org/html/rfc8725)
    - Research access token vs refresh token patterns
    - Understand token expiration and renewal
    - Learn about token blacklisting strategies
  - **Files**: Create `docs/jwt-best-practices.md`
  - **Validation**: Document covers token structure, expiration, refresh, and security

- [ ] Task 1.3.2: Design token storage strategy
  - **What**: Decide where and how to store tokens (client-side and server-side)
  - **Why**: Token storage affects security and UX
  - **How**:
    - Compare options: localStorage vs httpOnly cookies vs memory
    - Design refresh token rotation strategy
    - Plan token blacklist/revocation approach (Redis or database)
    - Consider mobile app requirements
  - **Files**: Create `docs/token-storage-strategy.md`
  - **Validation**: Clear decision on token storage with security justification

#### 1.4 Technical Specification
- [ ] Task 1.4.1: Create database schema changes
  - **What**: Design database changes to support OAuth and JWT
  - **Why**: Need to store OAuth provider info and refresh tokens
  - **How**:
    - Design `user_providers` table (user_id, provider, provider_user_id, profile)
    - Design `refresh_tokens` table (token_id, user_id, token, expires_at)
    - Plan migration strategy (don't break existing users table)
    - Create SQL migration files
  - **Files**: Create `docs/database-schema.md` and `migrations/001-add-oauth-tables.sql`
  - **Validation**: Database schema supports OAuth linking and JWT refresh tokens

- [ ] Task 1.4.2: Design API contract changes
  - **What**: Define new API endpoints and request/response formats
  - **Why**: Need clear API contract before implementation
  - **How**:
    - Design OAuth callback routes: `/auth/google/callback`, `/auth/github/callback`
    - Design token endpoints: `/auth/token/refresh`
    - Design account linking endpoints: `/auth/link/:provider`
    - Document request/response schemas
  - **Files**: Create `docs/api-contract.md`
  - **Validation**: All new endpoints documented with examples

- [ ] Task 1.4.3: Create refactor implementation plan
  - **What**: Break down the refactor into specific code changes
  - **Why**: Clear plan ensures smooth implementation
  - **How**:
    - List files to create: `src/auth/oauth-provider.js`, `src/auth/jwt-service.js`, etc.
    - List files to modify: `src/auth/passport-config.js`, `src/routes/auth.js`, etc.
    - Plan backward compatibility strategy
    - Identify risks and mitigation strategies
  - **Files**: Create `docs/refactor-plan.md`
  - **Validation**: Implementation plan covers all code changes with risk assessment

### ✅ Completion Criteria
- [ ] Current authentication flow is fully documented with diagram
- [ ] All auth-related files are inventoried
- [ ] Pain points and limitations are documented (at least 5)
- [ ] Google OAuth2.0 is researched and documented
- [ ] GitHub OAuth is researched and documented
- [ ] OAuth provider abstraction is designed
- [ ] JWT best practices are researched and documented
- [ ] Token storage strategy is decided and documented
- [ ] Database schema changes are designed and migration files created
- [ ] API contract changes are documented
- [ ] Refactor implementation plan is created
- [ ] All documents reviewed and approved by team

### 📤 Expected Output
- [ ] **Documentation Files**:
  - `docs/auth-pain-points.md` - Current system pain points
  - `docs/oauth-google-research.md` - Google OAuth research
  - `docs/oauth-github-research.md` - GitHub OAuth research
  - `docs/oauth-provider-abstraction.md` - Provider abstraction design
  - `docs/jwt-best-practices.md` - JWT research and best practices
  - `docs/token-storage-strategy.md` - Token storage decisions
  - `docs/database-schema.md` - Database schema changes
  - `docs/api-contract.md` - New API endpoints and contracts
  - `docs/refactor-plan.md` - Detailed implementation plan

- [ ] **Migration Files**:
  - `migrations/001-add-oauth-tables.sql` - Database migration

- [ ] **Diagrams** (in docs):
  - Current authentication flow diagram
  - OAuth2.0 flow diagram (Google & GitHub)
  - JWT token flow diagram
  - New system architecture diagram

- [ ] **Git Commit**:
  - Commit message: `docs: add OAuth2.0 and JWT refactor technical specification`

### ⚠️ Important Notes
- **Don't rush the analysis**: Spend quality time understanding the current system. Missing details here will cause issues later.
- **Think about migration**: We can't afford downtime. Plan how to migrate existing users smoothly.
- **Security first**: OAuth and JWT have security implications. Research thoroughly before designing.
- **Team alignment**: Get team feedback on the technical spec before moving to implementation.
- **Document assumptions**: Write down all assumptions (Node.js version, database support, etc.)

### 🔗 Dependencies
- **No code dependencies for this stage** (analysis only)
- **Required tools**:
  - Diagram tool (Mermaid, draw.io, or ASCII art)
  - Access to GitHub issues and team chat
  - Access to existing codebase and documentation

### 🧪 Validation Commands
```bash
# Verify all documentation files are created
ls docs/auth-pain-points.md docs/oauth-google-research.md docs/oauth-github-research.md docs/oauth-provider-abstraction.md docs/jwt-best-practices.md docs/token-storage-strategy.md docs/database-schema.md docs/api-contract.md docs/refactor-plan.md

# Verify migration file is created
ls migrations/001-add-oauth-tables.sql

# Check for completeness (should list at least 5 pain points)
grep -c "^-" docs/auth-pain-points.md  # Should be >= 5

# Verify git commit
git log -1 --oneline | grep "docs: add OAuth2.0 and JWT refactor"
```

### 📚 Reference Materials
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [Google OAuth2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Docs](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [JWT RFC 8725 - Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

### 🐛 Troubleshooting

**Issue**: Can't find all auth-related files
**Solution**: Use multiple search strategies:
- `grep -r "passport" src/`
- `grep -r "authenticate" src/`
- `grep -r "req.session" src/`
- `git log --all --full-history -- "*auth*"`

**Issue**: Overwhelmed by OAuth documentation
**Solution**: Focus on the official "Quick Start" guides first. Once you understand the basic flow, dive into details.

**Issue**: Team disagrees on technical approach
**Solution**: Create a decision matrix comparing alternatives. Document pros/cons of each approach and let the team vote.

---

## 📊 Implementation Details

### Current System Architecture (to be analyzed)
```
User Request
    ↓
Express Route (/login)
    ↓
Passport Local Strategy
    ↓
Database (check username/password)
    ↓
Session Creation (express-session)
    ↓
Session Cookie (sent to client)
    ↓
Subsequent Requests (cookie-based auth)
    ↓
Auth Middleware (check session)
    ↓
Protected Routes
```

### Target System Architecture (to be designed)
```
User Request
    ↓
┌─────────────────────────────────────┐
│ OAuth Flow       │ Local Flow       │
│ (Google/GitHub)  │ (username/pass)  │
└─────────────────────────────────────┘
    ↓                    ↓
    ↓              Passport Local
    ↓                    ↓
OAuth Provider      Database
    ↓                    ↓
Callback & Token Exchange
    ↓
┌─────────────────────────────────────┐
│      Authentication Service          │
│  (abstraction over providers)        │
└─────────────────────────────────────┘
    ↓
JWT Token Generation (access + refresh)
    ↓
Token sent to client (httpOnly cookie or header)
    ↓
Subsequent Requests
    ↓
JWT Validation Middleware
    ↓
Protected Routes
```

---

## 🎯 Next Steps

After completing this stage:
1. ✅ Review all documentation with team
2. ✅ Get approval on technical specification
3. ✅ Create git commit
4. ✅ Update progress tracking in README.md
5. ✅ Move to Stage 2: OAuth2.0 Provider Setup

**Command to continue**:
```bash
claude "@examples/refactor-auth/stages/02-oauth-provider-setup.md" 继续执行 Stage 2
```

---

**Estimated Lines**: 850 lines
**Token Estimate**: ~1300 tokens
**Complexity**: Medium
