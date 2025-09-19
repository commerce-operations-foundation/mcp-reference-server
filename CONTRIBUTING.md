# Contributing

Thanks for your interest in improving Commerce Operations Foundation MCP!

## Getting Started

- Fork this repository and create a feature branch from `main`.
- Ensure you have Node.js 18+ installed.
- Work primarily inside the `server/` folder for server changes.

## Development Workflow

- Install deps: `cd server && npm ci`
- Run unit tests: `npm run test:unit`
- Run integration tests: `npm run test:integration` (requires a local build)
- Lint: `npm run lint`
- Type-check: `npm run typecheck`

Before opening a PR:
- Ensure `npm run typecheck` passes
- Ensure `npm run lint` passes
- Ensure `npm test` passes locally

## Commit Messages

Follow conventional commits where possible (e.g., `feat:`, `fix:`, `docs:`, `refactor:`).

## Pull Requests

- Keep PRs focused and small where possible.
- Include tests for new functionality or bug fixes.
- Update documentation when behavior or public APIs change.

## Code Style

- TypeScript strict mode is enabled.
- ESLint and Prettier are configured; run `npm run lint` and `npm run format`.

## Licensing

By contributing, you agree that your contributions will be licensed under the MIT License.

