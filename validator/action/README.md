# onX MCP Validator GitHub Action

Validate your MCP server against the Commerce Operations Foundation onX specification in your CI/CD pipeline.

## Usage

```yaml
name: Validate MCP Server

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build server
        run: npm run build

      - name: Validate MCP Server
        uses: commerce-operations-foundation/onx-validator-action@v1
        with:
          server-command: node
          server-args: ./dist/index.js
          env-vars: |
            ADAPTER_TYPE=built-in
            ADAPTER_NAME=mock
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `server-command` | Command to start the MCP server | Yes | - |
| `server-args` | Arguments to pass to the server | No | `''` |
| `env-vars` | Environment variables (KEY=VALUE, one per line) | No | `''` |
| `functional-tests` | Run functional tests | No | `true` |
| `fail-on-partial` | Fail workflow if only partially compliant | No | `false` |
| `working-directory` | Working directory for running the server | No | `.` |

## Outputs

| Output | Description |
|--------|-------------|
| `compliance` | Compliance status: `full`, `partial`, or `non-compliant` |
| `score` | Compliance score (0-100) |
| `report` | Full JSON compliance report |
| `implemented-tools` | Number of implemented tools |
| `missing-tools` | Comma-separated list of missing tools |

## Examples

### Basic Usage

```yaml
- name: Validate MCP Server
  uses: commerce-operations-foundation/onx-validator-action@v1
  with:
    server-command: node
    server-args: ./dist/index.js
```

### With Environment Variables

```yaml
- name: Validate MCP Server
  uses: commerce-operations-foundation/onx-validator-action@v1
  with:
    server-command: node
    server-args: ./dist/index.js
    env-vars: |
      ADAPTER_TYPE=built-in
      ADAPTER_NAME=mock
      LOG_LEVEL=error
```

### Strict Mode (Fail on Partial Compliance)

```yaml
- name: Validate MCP Server
  uses: commerce-operations-foundation/onx-validator-action@v1
  with:
    server-command: node
    server-args: ./dist/index.js
    fail-on-partial: true
```

### Schema Validation Only

```yaml
- name: Validate MCP Server (Schema Only)
  uses: commerce-operations-foundation/onx-validator-action@v1
  with:
    server-command: node
    server-args: ./dist/index.js
    functional-tests: false
```

### Using Outputs

```yaml
- name: Validate MCP Server
  id: validate
  uses: commerce-operations-foundation/onx-validator-action@v1
  with:
    server-command: node
    server-args: ./dist/index.js

- name: Check compliance
  run: |
    echo "Compliance: ${{ steps.validate.outputs.compliance }}"
    echo "Score: ${{ steps.validate.outputs.score }}%"
    if [ "${{ steps.validate.outputs.compliance }}" = "full" ]; then
      echo "Server is fully compliant!"
    fi

- name: Upload report
  uses: actions/upload-artifact@v4
  with:
    name: compliance-report
    path: compliance-report.json
  env:
    REPORT: ${{ steps.validate.outputs.report }}
```

### Monorepo Usage

```yaml
- name: Validate MCP Server
  uses: commerce-operations-foundation/onx-validator-action@v1
  with:
    server-command: node
    server-args: ./dist/index.js
    working-directory: ./packages/mcp-server
```

## Compliance Badge

Add a compliance badge to your README:

```markdown
![onX Compliant](https://img.shields.io/badge/onX-compliant-green)
```

Or dynamically based on your CI status:

```markdown
![onX Validation](https://github.com/your-org/your-repo/actions/workflows/validate.yml/badge.svg)
```

## License

MIT
