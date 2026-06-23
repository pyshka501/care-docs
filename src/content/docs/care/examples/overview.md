---
title: Examples
description: Bundled example chains and the end-to-end MAESTRO workflow.
sidebar:
  order: 1
---

MAESTRO ships a couple of ready-made chains you can validate, import, and run.

## Bundled chains

| Example | What it shows |
| --- | --- |
| **weather** | A weather agent wired to an **MCP** server (`mcp_servers.toml` + `chain.json`). |
| **financier** | A financial-analysis chain (`chain.json`) — a multi-step reasoning agent over financial input. |

Each lives under `examples/` in the [care repo](https://github.com/Glazkoff/care)
with a `README.md`.

## Run a chain file

Any `chain.json` follows the same flow — validate, import, run:

```bash
care validate examples/financier/chain.json      # preflight
care import examples/financier/chain.json --apply # into Memory
care run <chain_id> --execute --task "Analyse Q3 results"
```

Or skip Memory and just preflight + export:

```bash
care run <chain_id> --export chain.py             # export to a runnable module
```

## The end-to-end workflow

The canonical MAESTRO loop, start to finish:

1. **Generate** — type a task in the [chat surface](/care/tui/overview/) (or `care generate "<task>"`).
2. **Run** — Ad-Hoc runs inline; Production saves to the [Library](/care/tui/screens/).
3. **Re-run** — reopen a saved chain from the Library and run it on new input.
4. **Evolve** — `care evolve <chain_id> --wait --accept` (or the Evolution screen) to
   improve it, then promote the winner.

## Recording a demo

`examples/asciicast/recording_script.md` has a keystroke script for recording an
asciicast of a MAESTRO session.

## See also

- [CLI: generate / run](/care/cli/generate-run/) · [TUI](/care/tui/overview/)
- [CARL cookbook](/carl/cookbook/overview/) — library-level chain examples.
