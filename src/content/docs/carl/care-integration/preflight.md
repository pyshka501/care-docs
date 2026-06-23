---
title: Preflight
description: Statically introspect what a chain needs, and check it against a context before running.
sidebar:
  order: 2
---

Before running a saved chain you often want to know what it will try to use —
which tools, MCP servers, and AgentSkills — so you can register or install the
missing pieces. CARL exposes static introspection on `ReasoningChain`.

## What does this chain reference?

```python
chain.required_tools()         # de-duplicated tool names from ToolStep configs
chain.required_mcp_servers()   # MCP server names referenced by MCP steps
chain.required_skills()        # AgentSkill identifiers (URI or source string)
```

These are pure static reads — no execution, no LLM.

## Preflight against a context

`chain.preflight(context)` compares the requirements against a context's registry
and returns a `PreflightReport`:

```python
report = chain.preflight(context)
print(report.format_text())
if not report.all_present:
    print("register first:", report.missing_tools)
```

### PreflightReport

| Field / member | Meaning |
| --- | --- |
| `required_tools` / `required_mcp_servers` / `required_skills` | Everything the chain references. |
| `missing_tools` | Tools referenced but **not** registered in the context (MAESTRO's "register before running" list). |
| `missing_mcp_servers` / `missing_skills` | Reserved (currently always empty — MCP carries its own config; skill resolution is async/network-bound). |
| `all_present` (property) | `True` when nothing is missing. |
| `format_text()` | One-line summary when OK, multi-line breakdown otherwise. |

The report is **structured, not narrated** — MAESTRO turns it into a modal; CLIs and
CI read the raw lists.

## See also

- [MAESTRO integration overview](/carl/care-integration/overview/)
- The CLI twin: [`care validate`](/care/cli/discovery/) preflights a chain file.
