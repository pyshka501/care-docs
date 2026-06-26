---
title: Discovery & Validation
description: List installed capabilities, validate chains, and import chain files.
sidebar:
  order: 4
---

Most of these commands accept `--json` for machine-readable output.

## `care catalog`

List installed AgentSkills, MCP servers, tools, and capability memory cards. Point
it at the directories/files to enumerate.

```bash
care catalog --skills ./skills --mcp-config ./mcp_servers.toml --tools ./tools
care catalog --kind tool --json
```

| Flag | Purpose |
| --- | --- |
| `--skills DIR` | Directory of `<name>/SKILL.md` folders (repeatable). |
| `--mcp-config PATH` | Path to an `mcp_servers.toml`. |
| `--tools DIR` | Directory of `@carl_tool` Python files. |
| `--kind agent_skill\|mcp_server\|tool\|memory_card` | Filter to one entry kind. |
| `--json` | JSON instead of the grouped text listing. |

## `care validate <file>`

Parse and preflight a chain JSON file (bare-chain or wrapper form) — catch problems
before running.

```bash
care validate chain.json
care validate chain.json --json
```

| Flag | Purpose |
| --- | --- |
| `--json` | Emit the `PreflightResult` as JSON. |

## `care import <pattern>...`

Batch-validate chain JSON files and import them into Memory. Accepts paths or globs
(`**/*.json` for recursive walks). It is the inverse of [`care export`](/care/cli/export/).

```bash
care import "chains/**/*.json"               # dry-run validate (default)
care import "chains/**/*.json" --apply        # actually save to Memory
```

:::note[Dry-run by default]
`care import` only previews by default — it validates every match and reports what
*would* be imported without touching Memory. Add `--apply` to actually save the
valid chains. Exit code is `0` when every match validates, `1` otherwise.
:::

| Flag | Default | Purpose |
| --- | --- | --- |
| `--apply` | off (dry-run) | Actually save chains to Memory. |
| `--channel NAME` | `latest` | Default channel for entries that don't specify one. |
