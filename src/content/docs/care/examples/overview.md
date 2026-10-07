---
title: Examples
description: Example chains shipped with Maestro and how to use them from the desktop app and the CLI.
sidebar:
  order: 1
---

The Maestro repository has example chains under `examples/`, each with a
`README.md`.

| Example | What it shows | `maestro validate` |
| --- | --- | --- |
| `weather` | One `mcp` step (a weather MCP server from `mcp_servers.toml`) and one `llm` step that summarises it. | ok (1 MCP server) |
| `financier` | Reads a quarterly statement from a PDF with a skill, extracts figures with a `structured_output` step and a JSON Schema. Includes a sample skill under `skills/`. | reports a missing tool `pdf_extractor` until you provide it |
| `summarizer` | A one-step `llm` chain that reads `$outer_context`, with an 8-case `eval.jsonl`, used as an evolution seed. The README is in Russian. | ok |
| `asciicast` | A keystroke script and a seed directory for recording a CLI demo. | — |

The `validate` column is what `maestro validate examples/<name>/chain.json`
printed at the release base.

## Validate, import, run (CLI)

```bash
maestro validate examples/weather/chain.json          # parse + preflight
maestro import examples/weather/chain.json --apply    # save to Memory
maestro run <chain_id> --execute --task "Weather in Paris"
```

`maestro run <chain_id> --export chain.py` also writes the fetched chain as a
Python module (`.json` for JSON).

## Use an example in the desktop app

Import the chain with the CLI as above, then open it from
**Library → Chains** and press **Run**. Or attach the `chain.json` to a chat
and ask the agent to validate and run it; the agent stages the exact file and
asks for confirmation before running.

For evolution, the `summarizer` example has a ready dataset (`eval.jsonl`).
You can also generate a dataset in the app; see
[Evolution data](/care/workflows/data-generation/).

## Recording a demo

```bash
scripts/record_demo.sh
```

The per-act keystroke list is `examples/asciicast/recording_script.md`. The
recording is written to `docs/asciicasts/care-tour.cast`.

## See also

- [Scenarios](/care/workflows/scenarios/) for end-to-end walkthroughs.
- [CLI: generate and run](/care/cli/generate-run/).
- [CARL cookbook](/carl/cookbook/overview/) for library-level chain examples.
