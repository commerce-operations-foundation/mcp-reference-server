# Contributing

Welcome! Thank you for your interest in contributing to the Commerce Operations Foundation MCP Server.

This project is open-source because we believe collaboration drives better software. We welcome contributions of all types — code, documentation, testing, and feedback.

## Code of Conduct

Please review our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing. We're committed to a respectful, inclusive community.

## Getting Started

### 1. Fork and Clone

First, fork the repository on GitHub by clicking the "Fork" button at the top of the [repository page](https://github.com/commerce-operations-foundation/mcp-reference-server).

Then clone your fork:

```bash
# Clone your fork (replace YOUR-USERNAME with your GitHub username)
git clone https://github.com/YOUR-USERNAME/mcp-reference-server.git
cd mcp-reference-server

# Add the upstream remote to sync with the main repository
git remote add upstream https://github.com/commerce-operations-foundation/mcp-reference-server.git
```

### 2. Set Up the Environment

Ensure you have Node.js 18+ installed.

Install dependencies:

```bash
cd server
npm install
```

Run tests to verify setup:

```bash
npm test
```

### 3. Pick an Issue

Check [open issues](https://github.com/commerce-operations-foundation/mcp-reference-server/issues) and look for labels like:
- `good first issue`
- `help wanted`

Or open a new issue if you've found a bug or have a feature idea.

## Contributing Code

### 1. Create a Branch

```bash
git checkout -b feat/short-description
```

Use branch prefixes:
- `feat/` for new features
- `fix/` for bug fixes
- `docs/` for documentation
- `refactor/` for code improvements

### 2. Follow Code Standards

- TypeScript strict mode is enabled
- ESLint and Prettier are configured; run `npm run lint` and `npm run format`
- Write tests for new functionality
- Keep commits atomic and messages descriptive:

```
feat: add order sync API
fix: correct webhook payload parsing
docs: clarify configuration options
```

### 3. Run Tests

```bash
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests (requires build)
npm run typecheck        # Type checking
npm run lint             # Linting
```

Before opening a PR, ensure:
- `npm run typecheck` passes
- `npm run lint` passes
- `npm test` passes locally

### 4. Submit a Pull Request

- Push your branch to your fork:
  ```bash
  git push origin feat/short-description
  ```
- Open a PR from your fork against the `develop` branch of the main repository
- Link related issues in the PR description (Fixes #123)
- Include a brief summary of what, why, and how you changed it
- Keep PRs focused and small where possible

## Code Review Process

- All PRs require at least one reviewer approval
- Automated checks (CI, tests, lint) must pass before merge
- Be responsive to feedback — it's a collaboration, not a gatekeeping step

## Documentation

- Update relevant markdown files or API references
- If you add a major feature, include an example or tutorial section
- Documentation lives in the `/docs` directory

## Testing Guidelines

- Follow the project's testing framework (Jest)
- Include both unit and integration tests where appropriate
- Keep test coverage high for core modules
- Work primarily inside the `server/` folder for server changes

## Project Structure

```
/server            # Core MCP server implementation
/adapter-template  # Template for creating custom adapters
/docs              # Documentation
/schemas           # JSON Schema definitions
```

## Commit Messages

Follow conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `refactor:` for code improvements
- `test:` for test changes
- `chore:` for maintenance tasks

## Release Workflow

- Merges to `develop` trigger automated builds
- Releases are tagged and versioned following semantic versioning
- Changelogs are generated from commit messages

## Communication

- For bug reports and feature requests, use [GitHub Issues](https://github.com/commerce-operations-foundation/mcp-reference-server/issues)
- For design proposals and discussions, use [GitHub Discussions](https://github.com/commerce-operations-foundation/mcp-reference-server/discussions)

## Licensing

By contributing, you agree that your contributions will be licensed under the MIT License.

## Acknowledgments

Thanks to all contributors — your work makes this project better for everyone.

