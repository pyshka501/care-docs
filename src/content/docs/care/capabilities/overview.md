---
title: Capabilities
description: Tools, skills, MCP servers, STARM solvers and the sandbox — what a Maestro chain can use and how it is configured.
sidebar:
  order: 1
---

Chains reach beyond the model through **tools**, **MCP servers** and
**skills**. In the desktop app, the [workshop](/care/workflows/workshop/)
creates tools and skills with checks. In the TUI and CLI, the **catalog**
lists what is installed (`Ctrl+K` in the TUI,
[`maestro catalog`](/care/cli/discovery/)).

## Tools

Tools are Python functions that a chain's tool steps call.

- **Bundled builtins** (on by default, `CARE_TOOLS__ENABLE_BUILTINS`):
  `web_search`, `fetch_url`, `http_request`, `calculator`, `current_datetime`,
  and `run_python` when code execution is on. `web_search` uses the configured
  provider and falls back to keyless DuckDuckGo.
- **Your tools**: put `@carl_tool` functions under `~/.config/care/tools`
  (`CARE_TOOLS__PATH`).
- **Workshop tools**: created in the app, checked in the Docker sandbox,
  saved to memory.
- **Tool synthesis**: when a chain calls a tool that is not registered,
  Maestro can write one, test it once in the sandbox and register it
  (`CARE_TOOLS__AUTO_SYNTHESIZE_TOOLS`, needs code execution).
- **Live-data routing**: before an all-model chain runs, steps that need live
  data (date, weather, prices) can be rewritten into tool calls
  (`CARE_TOOLS__ROUTE_LIVE_DATA_TO_TOOLS`).

See [CARL tool steps](/carl/steps/tool/) for how chains call tools.

## STARM solvers

Algorithmic sub-problems (sudoku, mazes, arithmetic puzzles, Game of Life,
ARC-AGI grids) can go to small trained solver models instead of the LLM. Each
task is a builtin tool that exists only when its solver server is configured.
See [STARM solvers](/care/solvers/starm/).

## MCP servers

A chain step can call an MCP server. The `weather` example shows the setup
(`mcp_servers.toml` plus an `mcp` step). See [CARL MCP](/carl/mcp/overview/).

## Skills

[AgentSkills](https://agentskills.io) are portable folders with a `SKILL.md`
and optional scripts. The catalog discovers installed skills, and chains run
them through skill steps. The model (URIs, execution modes, resolvers) is in
[CARL → AgentSkills](/carl/skills/overview/).

## Sandbox

Skill scripts and generated code run in a sandbox. `CARE_SANDBOX__KIND`
selects the backend:

| Backend | Notes |
| --- | --- |
| `docker` | **Default.** Needs the `docker` extra and a running Docker daemon. |
| `e2b` | Cloud microVM. Needs the `e2b` extra and an E2B key. |
| `firejail` | Linux only. |
| `local` | Plain subprocess, for internal testing only. Unsafe. |

Shared rules:

- **Network**: `none`, `skill_declared` (default: only domains the skill
  declares) or `open`.
- **Trust**: skills are pinned by SHA-256. A changed skill is refused before
  any process starts. In the TUI, audit and revoke trust on the **Sandbox
  Trust** screen ([`/sandbox`](/care/slash-commands/overview/)).
- **Limits**: CPU (`2.0`), memory (`1g`), process count (`256`).
- **Output checks**: files a skill produces are scanned (executable bits,
  binaries, shebangs, network tokens, symlink escapes, large or empty output).

The workshop and `run_python` always use the Docker sandbox.

## Context injection

Generation can include standing context (`CARE_CONTEXT__*`):

- **`CARE.md`**: a global file (`~/.config/care/CARE.md`) and a per-project
  `./CARE.md`, like a standing brief.
- **Long-term memory**: CARL's long-term memory store, recalled into prompts
  and updated after a turn.

## Telemetry

Opt in to an event sink (Langfuse) with `CARE_TELEMETRY__*` to trace
generation and execution. Off by default.

## See also

- [Section reference](/care/configuration/sections/): `tools`, `sandbox`, `context`, `telemetry`.
- [`maestro catalog`](/care/cli/discovery/).
