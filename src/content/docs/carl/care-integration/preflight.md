---
title: Preflight
description: Statically list what a chain needs, and check it against a context before running.
sidebar:
  order: 2
---

Before running a saved chain you want to know what it will use, so you can
register or install the missing pieces. `ReasoningChain` answers this without
executing anything and without an LLM call.

## What does this chain reference?

```python
chain.required_tools()             # tool names from tool / map / agent steps and chain tools' allowed_tools
chain.required_mcp_servers()       # MCP server names
chain.required_skills()            # AgentSkill identifiers (URI or source string)
chain.required_code_profiles()     # runtime_profile names of code steps
chain.required_claude_code_clis()  # cli_path of claude_code steps (default "claude")
chain.required_codex_runtimes()    # ["openai-codex"] if the chain has a codex step
```

Tools found only at run time by a [tool-discovery step](/carl/steps/tool-discovery/)
are not listed. Names of embedded chain tools are left out, because the chain
supplies them itself.

## Preflight against a context

`chain.preflight(context)` compares those lists with what the context has and
returns a `PreflightReport`:

```python
report = chain.preflight(context)
print(report.format_text())
if not report.all_present:
    print("register first:", report.missing_tools)
```

### PreflightReport

| Field / member | How "missing" is decided |
| --- | --- |
| `required_*` | Everything the chain references (six lists, as above). |
| `missing_tools` | Not in `context.list_tools()`. |
| `missing_code_profiles` | `context.code_execution_policy` is absent or does not resolve the profile. |
| `missing_claude_code_clis` | `shutil.which()` cannot find the CLI. |
| `missing_codex_runtimes` | `check_codex_runtime()` reports the runtime unavailable. |
| `missing_mcp_servers` / `missing_skills` | Always empty. MCP servers carry their own config and skills resolve over the network at run time, so preflight lists them but does not check them. |
| `all_present` (property) | `True` when every `missing_*` list is empty. |
| `format_text()` | One line when everything is present, a breakdown otherwise. |

The report is data, not prose: Maestro turns it into a refusal or a dialog,
and CLIs and CI read the lists directly.

## In Maestro

Maestro runs preflight twice: once on the parsed chain without a context (to
list requirements), and once against the populated run context right before
execution. A missing tool, MCP server or skill refuses the run. From the
command line, `maestro validate <chain.json>` parses and preflights a chain
file (see [CLI discovery](/care/cli/discovery/)).

## See also

- [Maestro integration overview](/carl/care-integration/overview/)
- [Chain tools](/carl/steps/chain-tools/) · [Code step](/carl/steps/code/)
