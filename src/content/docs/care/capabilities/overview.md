---
title: Capabilities
description: Tools, AgentSkills, the sandbox, and context injection — what an agent can use, and how to configure it.
sidebar:
  order: 1
---

Generated chains can reach beyond the LLM via **tools** and **AgentSkills**. MAESTRO
surfaces everything installed through the **Catalog** (`Ctrl+K`, or
[`care catalog`](/care/cli/discovery/)).

## Tools

Tools are Python functions a chain's tool steps can call.

- **Registry** — register functions with `@carl_tool`; the `tools` config controls
  the registry (`CARE_TOOLS__*`).
- **Bundled builtins** — MAESTRO ships ready-made tools (e.g. `web_search`).
- **On-the-fly synthesis** — when a chain needs a tool that isn't registered, MAESTRO
  can synthesise one from a description, plan its inputs, and wire it in.

See [CARL tool steps](/carl/steps/tool/) for how chains invoke tools.

## AgentSkills

[AgentSkills](https://agentskills.io) are portable skill folders (`SKILL.md` +
scripts/assets). MAESTRO's catalog discovers installed skills (from `~/.agents/skills/`,
`./.claude/skills/`, and the `agent-skills` library) and chains run them via
AgentSkill steps. The full model — URIs, execution modes, resolvers — is documented
in [CARL → AgentSkills](/carl/skills/overview/).

## Sandbox

Skill scripts run inside a **sandbox** so untrusted code stays contained. Backends:
`local`, `docker`, `e2b`, `firejail` (configure via `CARE_SANDBOX__*`). Trusted
skills are tracked in a SHA-pinned trust store you can audit and revoke from the
**Sandbox Trust** screen ([`/sandbox`](/care/slash-commands/overview/)).

## Context injection

MAESTRO can inject extra context into generation (`CARE_CONTEXT__*`):

- **`CARE.md`** — a project context file, picked up like a system brief.
- **Long-term-memory digest** — a summary of saved memory folded into the prompt.

## Telemetry

Opt into an event-stream sink (e.g. Langfuse) via `CARE_TELEMETRY__*` to trace
generation + execution in a dashboard.

## See also

- [Configuration → sections](/care/configuration/sections/) — the `tools` / `sandbox` / `context` / `telemetry` keys.
- [`care catalog`](/care/cli/discovery/) — list everything installed.
