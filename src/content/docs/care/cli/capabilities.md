---
title: Capabilities & Evolution
description: Search the marketplace, evolve chains, and render help.
sidebar:
  order: 6
---

## `care marketplace "<query>"`

Search shared `agent_skill` listings on Memory.

```bash
care marketplace "pdf extraction"
```

## `care evolve <chain_id>`

Submit an evolution run for a chain, watch it, and optionally accept the winner —
the terminal twin of the Evolution screen.

```bash
care evolve my-chain --wait --accept
```

| Flag | Purpose |
| --- | --- |
| `--wait` | Block until the run completes. |
| `--accept` | Promote the best individual into the stable channel. |

## `care help`

Render the tutorial + key cheat-sheet.

```bash
care help --markdown    # markdown instead of styled terminal output
```

Run `care <command> --help` for the full flag set.
