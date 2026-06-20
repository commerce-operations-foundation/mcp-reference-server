# onX MCP Validator GitHub Action

Validate MCP servers against the onX specification in CI/CD.

## Usage

```yaml
- name: Validate MCP Server
  uses: commerce-operations-foundation/onx-validator-action@v1
  with:
    server-command: node
    server-args: ./dist/index.js
    env-vars: |
      ADAPTER_TYPE=built-in
      ADAPTER_NAME=mock
```

## Inputs/Outputs

See [action.yml](./action.yml) for all inputs and outputs.

## Exit Behavior

- **Full compliance**: Passes
- **Partial compliance**: Warning (or fails with `fail-on-partial: true`)
- **Non-compliant**: Fails
