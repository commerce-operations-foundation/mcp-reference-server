# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL RULES

### NEVER touch the upstream repository
**NEVER interact with `commerce-operations-foundation/mcp-reference-server` for any reason.**
- Do NOT push to upstream
- Do NOT create PRs targeting upstream
- Do NOT use `gh` commands that reference `commerce-operations-foundation`
- Only push to `origin` (`cghobson/mcp-reference-server`)
- Only create PRs within `cghobson/mcp-reference-server` (base and head both on origin)

### Git workflow
- Push branches to `origin` only
- When creating PRs, both base and head must be on `cghobson/mcp-reference-server`
- Never use `--repo commerce-operations-foundation/mcp-reference-server` with any gh command
- **ALWAYS run `git status` before staging**. Never use `git add -A` or `git add .` without first checking what will be staged

## Code Principles

Before writing any line of code, ask: **"Is this necessary, or just present?"**

- **No unnecessary re-exports**: If consumers can import directly from the source, don't re-export through intermediate modules
- **No wrapper functions that just call another function**: If `foo()` just returns `bar()`, delete `foo()` and have callers use `bar()` directly
- **No intermediate layers that add no value**: Barrel files, facade modules, and adapter layers must justify their existence
- **Don't duplicate what's already defined elsewhere**: If behavior is specified in schema files (JSON), derive it programmatically rather than hardcoding it in TypeScript
- **Delete unused code**: If nothing calls it, remove it

## Project Structure

This is a monorepo containing:
- `server/` - MCP server for fulfillment/commerce operations
- `validator/` - MCP validator tool

See `server/CLAUDE.md` for server-specific guidance.
