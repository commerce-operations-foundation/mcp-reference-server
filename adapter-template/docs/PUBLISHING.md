# Publishing Guide

This guide explains how to publish and distribute your Fulfillment adapter.

## Table of Contents

- [For Fulfillment Vendors (NPM Package)](#for-fulfillment-vendors-npm-package)
- [For Retailers (Private Adapter)](#for-retailers-private-adapter)
- [Versioning Strategy](#versioning-strategy)
- [Testing Before Release](#testing-before-release)
- [Documentation Requirements](#documentation-requirements)
- [Support and Maintenance](#support-and-maintenance)

## For Fulfillment Vendors (NPM Package)

If you're an Fulfillment vendor providing a public adapter package, follow these steps to publish to NPM.

### Prerequisites

1. **NPM Account**
   ```bash
   # Create account at npmjs.com
   # Then login locally
   npm login
   ```

2. **Package Scope** (recommended)
   ```bash
   # Update package.json name
   "name": "@yourcompany/uois-adapter-yourfulfillment"
   ```

### Step 1: Prepare for Publishing

1. **Update package.json**
   ```json
   {
     "name": "@yourcompany/uois-adapter-yourfulfillment",
     "version": "1.0.0",
     "description": "Universal Fulfillment adapter for YourFulfillment",
     "keywords": ["uois", "fulfillment", "adapter", "mcp", "yourfulfillment"],
     "author": "Your Company <support@yourcompany.com>",
     "license": "MIT",
     "repository": {
       "type": "git",
       "url": "https://github.com/yourcompany/yourfulfillment-adapter"
     },
     "bugs": {
       "url": "https://github.com/yourcompany/yourfulfillment-adapter/issues"
     },
     "homepage": "https://docs.yourfulfillment.com/adapter"
   }
   ```

2. **Verify all tests pass**
   ```bash
   npm test
   npm run lint
   ```

3. **Build the package**
   ```bash
   npm run build
   ```

4. **Check package contents**
   ```bash
   npm pack --dry-run
   ```

### Step 2: Version Management

Use semantic versioning (semver):

```bash
# Patch release (1.0.0 -> 1.0.1)
# Bug fixes, minor updates
npm version patch

# Minor release (1.0.0 -> 1.1.0)
# New features, backward compatible
npm version minor

# Major release (1.0.0 -> 2.0.0)
# Breaking changes
npm version major

# Pre-release versions
npm version prerelease --preid=beta
# Results in: 1.0.1-beta.0
```

### Step 3: Publish to NPM

1. **First-time publishing (scoped package)**
   ```bash
   npm publish --access public
   ```

2. **Subsequent releases**
   ```bash
   npm publish
   ```

3. **Publish beta/pre-release**
   ```bash
   npm publish --tag beta
   ```

### Step 4: Post-Publishing

1. **Verify installation**
   ```bash
   # In a test directory
   npm install @yourcompany/uois-adapter-yourfulfillment

   # Check it works
   node -e "import('@yourcompany/uois-adapter-yourfulfillment').then(m=>console.log(m.VERSION))"
   ```

2. **Create GitHub release**
   ```bash
   git push origin main
   git push origin --tags
   # Create release on GitHub with changelog
   ```

3. **Update documentation**
   - Update README with new version
   - Add changelog entry
   - Update any version-specific docs

### NPM Scripts for Publishing

Add these to your package.json:

```json
{
  "scripts": {
    "prepublishOnly": "npm run clean && npm run build && npm test",
    "publish:patch": "npm version patch && npm publish",
    "publish:minor": "npm version minor && npm publish",
    "publish:major": "npm version major && npm publish",
    "publish:beta": "npm version prerelease --preid=beta && npm publish --tag beta",
    "postpublish": "git push origin main --tags"
  }
}
```

## For Retailers (Private Adapter)

If you're a retailer creating a custom adapter for internal use, follow these guidelines.

### Option 1: Private NPM Registry

1. **Setup private registry** (e.g., Verdaccio, npm Enterprise, Artifactory)

2. **Configure NPM**
   ```bash
   # Set registry for your scope
   npm config set @yourcompany:registry https://npm.yourcompany.com

   # Authenticate
   npm login --registry https://npm.yourcompany.com
   ```

3. **Publish to private registry**
   ```bash
   npm publish --registry https://npm.yourcompany.com
   ```

### Option 2: Git Repository

1. **Use Git tags for versions**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Install from Git**
   ```bash
   # In your MCP server
   npm install git+ssh://git@github.com:yourcompany/yourfulfillment-adapter.git#v1.0.0

   # Or using HTTPS
   npm install git+https://github.com/yourcompany/yourfulfillment-adapter.git#v1.0.0
   ```

### Option 3: Local File System

1. **Build the adapter**
   ```bash
   cd yourfulfillment-adapter
   npm run build
   ```

2. **Link locally (for development)**
   ```bash
   # In adapter directory
   npm link

   # In MCP server directory
   npm link @yourcompany/uois-adapter-yourfulfillment
   ```

3. **Or use file path**
   ```bash
   # In .env
   ADAPTER_TYPE=local
   ADAPTER_PATH=../yourfulfillment-adapter/dist
   ```

### CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Build and Deploy Adapter

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Package
        run: npm pack

      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: adapter-package
          path: '*.tgz'
```

## Versioning Strategy

### Semantic Versioning

Follow semver strictly:
- **MAJOR.MINOR.PATCH** (e.g., 2.1.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes

### Breaking Changes

Increment MAJOR version when:
- Removing or renaming public methods
- Changing method signatures
- Modifying response formats
- Updating minimum Node.js version
- Changing configuration structure

### Feature Additions

Increment MINOR version when:
- Adding new methods
- Adding optional parameters
- Adding new configuration options
- Performance improvements
- Adding new error types

### Bug Fixes

Increment PATCH version when:
- Fixing bugs
- Updating documentation
- Improving error messages
- Security patches
- Dependency updates (non-breaking)

### Pre-release Versions

Use for testing before stable release:
```bash
1.0.0-alpha.1  # Alpha release
1.0.0-beta.1   # Beta release
1.0.0-rc.1     # Release candidate
```

## Testing Before Release

### 1. Unit Tests

```bash
# Run all tests
npm test

# With coverage
npm test -- --coverage

# Watch mode during development
npm test -- --watch
```

### 2. Integration Tests

Test with actual MCP server:

```javascript
// test/integration.test.js
const { YourFulfillmentAdapter } = require('../dist');

describe('Integration Tests', () => {
  it('should work with MCP server', async () => {
    const adapter = new YourFulfillmentAdapter({
      apiUrl: process.env.TEST_API_URL,
      apiKey: process.env.TEST_API_KEY
    });

    await adapter.connect();
    const health = await adapter.healthCheck();
    expect(health.status).toBe('healthy');
    await adapter.disconnect();
  });
});
```

### 3. Manual Testing Checklist

- [ ] Adapter connects successfully
- [ ] All CRUD operations work
- [ ] Error handling works correctly
- [ ] Rate limiting is respected
- [ ] Timeout handling works
- [ ] Retry logic functions properly
- [ ] Memory leaks check
- [ ] Performance benchmarks

### 4. Compatibility Testing

Test with different versions:
- Node.js versions (14, 16, 18, 20)
- MCP server versions
- Your Fulfillment API versions

## Documentation Requirements

### Required Documentation

1. **README.md**
   - Installation instructions
   - Configuration options
   - Basic usage example
   - Link to full documentation

2. **CHANGELOG.md**
   ```markdown
   # Changelog

   ## [1.1.0] - 2024-01-15
   ### Added
   - New split order functionality
   - Support for webhook notifications

   ### Fixed
   - Memory leak in connection pooling
   - Rate limiting for bulk operations

   ### Changed
   - Improved error messages
   - Updated dependencies
   ```

3. **API Documentation**
   - All public methods
   - Parameters and return types
   - Error scenarios
   - Code examples

4. **Migration Guides**
   ```markdown
   # Migrating from v1.x to v2.0

   ## Breaking Changes
   - `captureOrder` now requires `currency` field
   - Removed deprecated `legacyAuth` option

   ## Migration Steps
   1. Update configuration...
   2. Change method calls...
   ```

### Documentation Tools

Consider using:
- **TypeDoc** for API documentation
- **Docusaurus** for documentation site
- **Swagger/OpenAPI** for REST API docs

## Support and Maintenance

### Version Support Policy

Define your support timeline:

```markdown
| Version | Status  | Security Updates | End of Life |
| ------- | ------- | ---------------- | ----------- |
| 2.x     | Current | ✓                | -           |
| 1.x     | LTS     | ✓                | 2025-01-01  |
| 0.x     | EOL     | ✗                | 2023-12-31  |
```

### Issue Management

1. **Bug Reports**
   - Use GitHub Issues
   - Provide issue templates
   - Label system (bug, feature, docs)

2. **Security Issues**
   - Private disclosure process
   - Security policy file
   - CVE handling

### Release Notes Template

```markdown
# Release Notes - v1.1.0

## Release Date: 2024-01-15

## What's New
- Split order functionality for multi-warehouse fulfillment
- Webhook support for real-time updates
- Performance improvements (30% faster order processing)

## Bug Fixes
- Fixed memory leak in connection pooling (#123)
- Resolved rate limiting issues for bulk operations (#124)
- Corrected timezone handling in order timestamps (#125)

## Breaking Changes
None in this release

## Deprecations
- `legacyAuth` option will be removed in v2.0.0

## Upgrade Instructions
```bash
npm update @yourcompany/uois-adapter-yourfulfillment
```

## Known Issues
- Bulk update operations limited to 100 items

## Contributors
Thanks to @user1, @user2 for their contributions!
```

### Monitoring Published Versions

1. **NPM Statistics**
   ```bash
   npm view @yourcompany/uois-adapter-yourfulfillment
   npm info @yourcompany/uois-adapter-yourfulfillment versions
   ```

2. **Download Statistics**
   - Check npmjs.com package page
   - Use npm-stat.com for graphs

3. **Deprecating Old Versions**
   ```bash
   npm deprecate @yourcompany/uois-adapter-yourfulfillment@"< 1.0.0" "Please upgrade to v1.0.0 or higher"
   ```

## Quick Publish Checklist

Before publishing, ensure:

- [ ] All tests pass
- [ ] Documentation is updated
- [ ] CHANGELOG is updated
- [ ] Version number is correct
- [ ] Package.json is complete
- [ ] Build completes successfully
- [ ] No sensitive data in code
- [ ] License file is present
- [ ] Git tag is created
- [ ] GitHub release is drafted

## Troubleshooting Publishing Issues

### Common Issues

1. **Authentication Failed**
   ```bash
   npm login
   npm whoami
   ```

2. **Package Name Taken**
   - Use scoped packages: `@yourcompany/package-name`

3. **Missing Files**
   - Check `files` field in package.json
   - Use `npm pack --dry-run` to verify

4. **Version Already Exists**
   - Can't republish same version
   - Increment version number

5. **Large Package Size**
   - Add `.npmignore` file
   - Exclude unnecessary files
   - Check with `npm pack --dry-run`

## Resources

- [NPM Documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
