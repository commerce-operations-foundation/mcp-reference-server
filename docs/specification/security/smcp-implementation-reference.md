# 📖 Secure Model Context Protocol (S-MCP)

**Version:** 0.1.0

**Status:** Draft

**Scope:** Identity Propagation, CRUD Security, and Cryptographic Human-in-the-Loop (HITL) Execution.

---

## 1. Executive Summary

The **Secure Model Context Protocol (S-MCP)** is a security-first extension of the Model Context Protocol. It moves beyond simple tool-calling to a **Host-Client-Server** trust model designed for agentic AI.

S-MCP ensures that while an AI Agent (the Host) can autonomously navigate data, it cannot execute high-risk operations without verifiable human intent.

---

## 2. Security Architecture: The Three Tiers

All S-MCP compliant implementations MUST categorize tools into one of three tiers:

| Tier | Operation Type | Security Requirement | User Experience |
| --- | --- | --- | --- |
| **Level 1** | **Read** | Bearer Token (`mcp:read`) | Transparent Execution |
| **Level 2** | **Write** | Bearer Token (`mcp:write`) | UI Confirmation "OK" |
| **Level 3** | **Critical** | JWS Signature (`mcp:admin`) | "Pause-and-Sign" Handshake |

---

## 3. The HITL "Pause-and-Sign" Protocol

For **Level 3 (Critical)** operations (marked `destructive: true`), the server and host MUST implement the **Deferred Execution & Confirmation (DEC)** pattern.

### 3.1 The Handshake Sequence

1. **Challenge:** When a critical tool is called without a signature, the Server returns a `202 Accepted` response containing a `ConfirmationToken`.
2. **Verification:** The Host interrupts the LLM, displays the action details to the human, and requests a signature.
3. **Signing:** The Host signs the `ConfirmationToken` using a private key stored in a Secure Enclave (TPM/Keychain).
4. **Resubmission:** The Host retries the tool call with the `X-MCP-Signature` header.

---

## 4. Normative Security Schema (`s-mcp-core.yaml`)

```yaml
openapi: 3.1.0
info:
  title: "S-MCP Core Specification"
  version: "1.1.0"
components:
  securitySchemes:
    OAuth2:
      type: oauth2
      flows:
        authorizationCode:
          x-use-pkce: true
          scopes:
            "mcp:read": "Read resources"
            "mcp:write": "Modify resources"
            "mcp:admin": "Destructive actions (Requires HITL)"
    HITLSignature:
      type: apiKey
      in: header
      name: X-MCP-Signature

x-mcp-tools:
  purge_resource:
    safety:
      readOnly: false
      destructive: true
      human_approval_required: true
    security:
      - OAuth2: ["mcp:admin"]
      - HITLSignature: []

```

---

## 5. Automated Compliance Rules (`.spectral.yaml`)

```yaml
extends: ["spectral:oas"]
rules:
  mcp-tool-safety-required:
    description: "All S-MCP tools MUST define 'readOnly' and 'destructive' hints."
    given: "$.x-mcp-tools[*].safety"
    then:
      - field: "readOnly"
        expect: true
      - field: "destructive"
        expect: true
  mcp-require-pkce:
    description: "S-MCP requires PKCE for OAuth2."
    given: "$.components.securitySchemes.OAuth2.flows.authorizationCode"
    then:
      field: "x-use-pkce"
      expected: true

```

---

## 6. Server Reference Implementation (Python)

```python
from fastmcp import FastMCP
import jwt

mcp = FastMCP("SecureSystem")

@mcp.tool()
async def delete_data(record_id: str, signature: str = None):
    """LEVEL 3: CRITICAL - Requires JWS Signature."""
    if not signature:
        # Step 1: Issue Challenge
        token = "chall_auth_" + record_id
        return f"ACTION_PAUSED: ConfirmationToken: {token}\nDetails: PURGE {record_id}"
    
    # Step 2: Verify Cryptographic Signature
    try:
        jwt.decode(signature, "USER_PUBLIC_KEY", algorithms=["RS256"])
        # Perform destructive action here
        return f"Permanently deleted {record_id}"
    except Exception:
        return "Security Error: Invalid Signature"

```

---

## 7. Security Audit Log Specification

Every Level 3 action MUST be logged in the following format for forensic audit:

```json
{
  "event_id": "uuid-v4",
  "timestamp": "ISO-8601",
  "actor": { "subject_id": "user_123", "ip_address": "127.0.0.1" },
  "action": { "tool_name": "purge_database", "status": "executed" },
  "verification": {
    "confirmation_token": "abc-123",
    "jws_signature": "eyJhbGciOiJSUzI1NiIs...",
    "signature_verified": true
  }
}

```

---

## 8. Compliance Checklist

* [ ] TLS 1.3 enforced for all remote traffic.
* [ ] OAuth2 PKCE enabled for all Authorization Code exchanges.
* [ ] `destructive: true` tools return a `202` pause.
* [ ] Host-side private keys stored in a Secure Enclave.
* [ ] `aud` (audience) claim validated by the server.

---