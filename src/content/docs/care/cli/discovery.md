---
title: Discovery & Validation
description: List installed capabilities, validate chains, and import chain files.
sidebar:
  order: 4
---

## `care catalog`

List installed AgentSkills, MCP servers, tools, and capability memory cards.

```bash
care catalog --json --kind skill
```

| Flag | Purpose |
| --- | --- |
| `--json` | Machine-readable output. |
| `--kind ...` | Filter by capability kind. |

## `care validate <chain.json>`

Parse and preflight a CARL chain file — catch problems before running.

```bash
care validate chain.json
```

## `care import <pattern>...`

Batch-validate (dry-run by default) or import chain JSON files into Memory.

```bash
care import "chains/*.json"            # dry-run validate
care import "chains/*.json" --apply    # actually import
```

| Flag | Purpose |
| --- | --- |
| `--apply` | Import (default is a dry-run validation). |

Run `care <command> --help` for the full flag set.
