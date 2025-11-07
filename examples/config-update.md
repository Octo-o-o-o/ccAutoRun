# Configuration File Update for Database Migration

<!-- AUTO-RUN-CONFIG
stages: 2
current: 1
auto_continue: true
safety_limit: 0
task_type: refactor
estimated_time: 2-3 hours
architecture: single
-->

## 📋 Task Overview

- **Task Name**: Update Configuration for PostgreSQL to MongoDB Migration
- **Task Type**: Configuration / Refactor
- **Technology Stack**: Node.js, MongoDB, PostgreSQL
- **Estimated Time**: 2-3 hours (2 stages)
- **Architecture**: Single (All stages in one file)
- **Created**: 2025-01-07
- **Project Path**: /Users/example/projects/my-app

## 🎯 Background and Goals

### Current State
Our application currently uses PostgreSQL for data storage. We're migrating to MongoDB for better scalability with our document-based data model. Configuration files still reference PostgreSQL, and we need to update them for MongoDB while maintaining backward compatibility during the migration period.

### Goals
1. ✅ Update all configuration files to support MongoDB
2. ✅ Maintain backward compatibility with PostgreSQL during migration
3. ✅ Add environment-based configuration (dev, staging, prod)
4. ✅ Update connection pooling settings
5. ✅ Add MongoDB-specific configuration (replica sets, indexes)

### Success Criteria
- [ ] Configuration files support both PostgreSQL and MongoDB
- [ ] Environment variables are properly documented
- [ ] Connection pooling is configured correctly
- [ ] All existing tests pass
- [ ] MongoDB connection works in all environments

## 📐 Execution Rules

1. **Sequential Execution**: Execute stages in order (Stage 1 → 2)
2. **Quality First**: All completion criteria must be met
3. **Incremental Commits**: Create a git commit after each stage
4. **Backward Compatibility**: Must not break existing PostgreSQL connections during migration
5. **Self-Contained**: All details in this single file for easy navigation

---

## 📑 Stage Index

- **[Stage 1: Configuration Structure Refactor](#stage-1-configuration-structure-refactor)** - Refactor config structure to support multiple databases
- **[Stage 2: MongoDB Configuration and Testing](#stage-2-mongodb-configuration-and-testing)** - Add MongoDB config and test connections

---

## Stage 1: Configuration Structure Refactor 🔧

**Status**: ⏳ Pending
**Estimated Time**: 1-1.5 hours

### 🎯 Goal
Refactor the configuration file structure to support both PostgreSQL and MongoDB connections, and add environment-based configuration loading.

### 📝 Task Checklist

#### 1.1 Analyze Current Configuration
- [ ] Task 1.1.1: Review existing config structure
  - **What**: Understand how configuration is currently loaded and used
  - **Why**: Need to know what needs to change
  - **How**:
    - Read `config/database.js` or equivalent
    - Trace how config is used in codebase (`grep -r "config.database"`)
    - Document current config schema
  - **Files**: `config/database.js`, `config/index.js`

- [ ] Task 1.1.2: Identify all configuration consumers
  - **What**: Find all files that read database configuration
  - **Why**: Need to ensure refactor doesn't break existing code
  - **How**:
    - Search for config imports: `grep -r "require.*config" src/`
    - List all database connection points
    - Document dependencies
  - **Files**: All files that import config

#### 1.2 Design New Configuration Structure
- [ ] Task 1.2.1: Design multi-database config schema
  - **What**: Create a config structure that supports both databases
  - **Why**: Need flexibility during migration period
  - **How**:
    - Design config schema with `databases.postgresql` and `databases.mongodb` sections
    - Add `activeDatabase` field to switch between databases
    - Plan environment variable mapping
  - **Files**: Create `config/schema.json` (design doc)

- [ ] Task 1.2.2: Create environment variable documentation
  - **What**: Document all required environment variables
  - **Why**: Team needs to know what to configure
  - **How**:
    - List all required env vars for PostgreSQL
    - List all required env vars for MongoDB
    - Create `.env.example` file
  - **Files**: `.env.example`, `docs/configuration.md`

#### 1.3 Implement Configuration Refactor
- [ ] Task 1.3.1: Refactor main config file
  - **What**: Update config file to load both database configurations
  - **Why**: Core change to support multi-database setup
  - **How**:
    - Update `config/database.js` with new structure
    - Add environment-based config loading
    - Maintain backward compatibility
  - **Files**: `config/database.js`, `config/environments/`

- [ ] Task 1.3.2: Create configuration loader utility
  - **What**: Create a utility to load and validate configuration
  - **Why**: Centralize config loading logic
  - **How**:
    - Create `config/loader.js` with validation logic
    - Add checks for required environment variables
    - Add helpful error messages for misconfiguration
  - **Files**: `config/loader.js`

- [ ] Task 1.3.3: Update configuration tests
  - **What**: Update or create tests for configuration loading
  - **Why**: Ensure config loads correctly
  - **How**:
    - Test config loads for each environment (dev, staging, prod)
    - Test fallback to defaults
    - Test validation of required fields
  - **Files**: `tests/config.test.js`

### ✅ Completion Criteria
- [ ] Config structure supports both PostgreSQL and MongoDB
- [ ] Environment-based configuration works (dev, staging, prod)
- [ ] `.env.example` documents all required variables
- [ ] Configuration loader has validation and error handling
- [ ] All configuration tests pass
- [ ] Backward compatibility maintained (existing PostgreSQL config still works)
- [ ] Documentation updated

### 📤 Expected Output
- **Files Created/Modified**:
  - `config/database.js` - Refactored config file
  - `config/loader.js` - Configuration loader utility
  - `config/environments/development.js` - Dev environment config
  - `config/environments/production.js` - Prod environment config
  - `.env.example` - Environment variable template
  - `docs/configuration.md` - Configuration documentation

- **Tests**:
  - `tests/config.test.js` - Configuration tests

- **Git Commit**:
  - Commit message: `refactor: restructure config to support multiple databases`

### ⚠️ Important Notes
- **Don't break existing code**: Maintain backward compatibility with current PostgreSQL setup
- **Validate environment variables**: Add clear error messages when required vars are missing
- **Document everything**: Configuration is critical, document all options

### 🧪 Validation Commands
```bash
# Test configuration loads correctly
npm test tests/config.test.js

# Verify environment variables are documented
cat .env.example | grep -E "(POSTGRES|MONGO)"

# Verify configuration structure
node -e "const config = require('./config'); console.log(JSON.stringify(config, null, 2))"
```

---

## Stage 2: MongoDB Configuration and Testing 🍃

**Status**: ⏳ Pending
**Estimated Time**: 1-1.5 hours
**Dependencies**: Stage 1

### 🎯 Goal
Add complete MongoDB configuration including connection pooling, replica set settings, and test the MongoDB connection in all environments.

### 📝 Task Checklist

#### 2.1 MongoDB Configuration
- [ ] Task 2.1.1: Add MongoDB connection configuration
  - **What**: Add MongoDB-specific configuration options
  - **Why**: MongoDB has different config options than PostgreSQL
  - **How**:
    - Add MongoDB connection string format support
    - Configure connection pooling (poolSize, maxIdleTimeMS)
    - Configure replica set settings (if applicable)
    - Add indexes configuration
  - **Files**: `config/database.js`, `config/mongodb.js`

- [ ] Task 2.1.2: Add MongoDB environment variables
  - **What**: Add MongoDB-specific environment variables
  - **Why**: Need to configure MongoDB connection per environment
  - **How**:
    - Add `MONGODB_URI` or `MONGODB_HOST`, `MONGODB_PORT`, `MONGODB_DB`
    - Add `MONGODB_USER` and `MONGODB_PASSWORD`
    - Add `MONGODB_REPLICA_SET` (if using replica sets)
    - Add `MONGODB_POOL_SIZE`
  - **Files**: `.env.example`, `config/database.js`

#### 2.2 Connection Testing
- [ ] Task 2.2.1: Create MongoDB connection test script
  - **What**: Create a script to test MongoDB connection
  - **Why**: Verify configuration works before deployment
  - **How**:
    - Create `scripts/test-mongo-connection.js`
    - Test connection establishment
    - Test authentication
    - Test read/write operations
  - **Files**: `scripts/test-mongo-connection.js`

- [ ] Task 2.2.2: Test connections in all environments
  - **What**: Verify MongoDB connection works in dev, staging, and prod
  - **Why**: Ensure config is correct for all environments
  - **How**:
    - Run test script with dev environment variables
    - Run test script with staging environment variables
    - Run test script with prod environment variables (or verify in deployment)
    - Document any connection issues and fixes
  - **Files**: Test results documented in `docs/configuration.md`

#### 2.3 Migration Preparation
- [ ] Task 2.3.1: Add database switching logic
  - **What**: Add ability to switch between PostgreSQL and MongoDB
  - **Why**: Need to test both databases during migration
  - **How**:
    - Add `ACTIVE_DATABASE` environment variable
    - Update database initialization logic to use active database
    - Add runtime database switching (optional)
  - **Files**: `src/db/index.js`, `config/database.js`

- [ ] Task 2.3.2: Update README with configuration instructions
  - **What**: Document how to configure and switch databases
  - **Why**: Team needs clear instructions
  - **How**:
    - Add "Database Configuration" section to README
    - Document environment variables
    - Provide examples for both databases
    - Add troubleshooting section
  - **Files**: `README.md`

- [ ] Task 2.3.3: Run full test suite
  - **What**: Run all tests with new configuration
  - **Why**: Ensure nothing broke
  - **How**:
    - Run `npm test` with PostgreSQL config
    - Run `npm test` with MongoDB config (if applicable)
    - Fix any failing tests
  - **Files**: All test files

### ✅ Completion Criteria
- [ ] MongoDB configuration is complete and documented
- [ ] MongoDB connection works in all environments (dev, staging, prod)
- [ ] Database switching logic works correctly
- [ ] All tests pass with both PostgreSQL and MongoDB configurations
- [ ] README documents configuration instructions
- [ ] `.env.example` has all MongoDB variables
- [ ] Troubleshooting section helps debug connection issues

### 📤 Expected Output
- **Files Created/Modified**:
  - `config/mongodb.js` - MongoDB-specific configuration
  - `scripts/test-mongo-connection.js` - Connection test script
  - `src/db/index.js` - Database initialization with switching logic
  - `.env.example` - Updated with MongoDB variables
  - `README.md` - Updated with configuration docs
  - `docs/configuration.md` - Detailed configuration guide

- **Tests**:
  - `tests/mongodb-connection.test.js` - MongoDB connection tests

- **Git Commit**:
  - Commit message: `feat: add MongoDB configuration and connection testing`

### ⚠️ Important Notes
- **Security**: Never commit actual credentials. Use `.env` file (gitignored) for local dev
- **Connection pooling**: Configure appropriate pool sizes for each environment
- **Replica sets**: If using MongoDB Atlas or replica sets, configure correctly
- **Error handling**: Add clear error messages for connection failures

### 🧪 Validation Commands
```bash
# Test MongoDB connection
node scripts/test-mongo-connection.js

# Verify MongoDB config is loaded
node -e "const config = require('./config'); console.log(config.databases.mongodb)"

# Run full test suite
npm test

# Test database switching
ACTIVE_DATABASE=mongodb node -e "const db = require('./src/db'); console.log(db.activeDatabase)"
ACTIVE_DATABASE=postgresql node -e "const db = require('./src/db'); console.log(db.activeDatabase)"
```

---

## 📊 Progress Tracking

| Stage | Status | Estimated | Actual | Completed | Issues |
|-------|--------|-----------|--------|-----------|--------|
| Stage 1 | ⏳ Pending | 1-1.5h | - | - | - |
| Stage 2 | ⏳ Pending | 1-1.5h | - | - | - |

**Total**: 2-3 hours (2 stages)

## 📝 Notes and Assumptions

**Assumptions**:
- Node.js application with existing PostgreSQL database
- Migrating to MongoDB (not removing PostgreSQL yet)
- Using environment variables for configuration
- Need to support dev, staging, and prod environments

**Dependencies**:
- mongodb (^5.0.0) - MongoDB driver (to be installed)
- Existing PostgreSQL driver (pg or similar)

**Constraints**:
- Must not break existing PostgreSQL connections
- Configuration must be environment-specific
- Must support gradual migration

## 🔗 Related Resources

- [MongoDB Connection String Format](https://docs.mongodb.com/manual/reference/connection-string/)
- [MongoDB Connection Pooling](https://docs.mongodb.com/manual/reference/connection-string/#connection-pool-options)
- [Node.js MongoDB Driver](https://mongodb.github.io/node-mongodb-native/)
- [Environment Variables Best Practices](https://12factor.net/config)

## 🚀 Getting Started

To start executing this plan:
```bash
# Load this entire plan in Claude and start with Stage 1
claude "@examples/config-update.md" 开始执行 Stage 1

# Or use auto-continue (if configured)
ccautorun run config-update
```

---

**Architecture**: Single File
**Total Estimated Lines**: ~2100 lines
**Total Estimated Tokens**: ~3150 tokens
**AI-Generated**: Yes
**Auto-Run Compatible**: Yes
