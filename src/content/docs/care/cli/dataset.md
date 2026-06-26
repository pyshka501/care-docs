---
title: Datasets & scripted eval
description: Build a per-chain eval dataset and score it from the terminal — the substring gate that drops into CI.
sidebar:
  order: 6.5
---

`care dataset` manages a small eval dataset attached to one chain — the terminal
twin of the TUI's `/dataset`. Each entry pairs an input **task** with an
**expected** substring; `run` replays every entry through the chain and scores it.
The sub-action is **required**: `list`, `add`, `run`, or `export`.

## The eval loop

1. **`add`** cases with `--expected` — the substring the chain's answer should
   contain.
2. **`run`** the dataset — every case is replayed through the chain (the CARL
   executor) and scored by **case-insensitive substring** match. It prints a
   per-case ✓/✗ and a `score: N/M passed` line, and **exits 1 if any case fails**
   — so it gates a CI job out of the box.
3. **`export`** the dataset as JSONL when you want to score it in an external eval
   framework instead.

:::note[`run` needs an LLM]
`care dataset run` actually executes the chain through CARL, so it requires a
configured LLM key (same as `care run --execute`). `list`, `add`, and `export`
are pure memory-card operations and need no LLM.
:::

## `care dataset add <chain_id> <task>`

Add one test case to a chain's dataset.

```bash
care dataset add weather "weather in Paris tomorrow" --expected "Paris"
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--expected EXPECTED` | **required** | Substring the answer must contain (the `run` gate matches this case-insensitively). |
| `--rubric RUBRIC` | `""` | LLM-judge rubric used **only by the TUI run** — `care dataset run` ignores it and scores by substring. |

## `care dataset list <chain_id>`

List a chain's dataset entries — one row per case with its status and a truncated
task.

```bash
care dataset list weather
care dataset list weather --json
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--json` | off | Emit the entries as JSON instead of the row view. |

## `care dataset run <chain_id>`

Replay every entry through the chain and score it.

```bash
care dataset run weather
```

```text
  ✓ weather in Paris tomorrow
  ✗ five-day forecast for SF

score: 1/2 passed (substring)
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--json` | off | Emit structured results instead of the per-case lines. |

Exit code is `0` only when **every** scored case passes; otherwise it is `1`.

## `care dataset export <chain_id> <output>`

Export the dataset as JSONL — one entry per line — for an external eval framework.

```bash
care dataset export weather weather-eval.jsonl
```

---

## In CI

Because `run` exits non-zero the moment a case fails, a CI step is just the
command itself — no extra glue:

```bash
# seed the dataset once (or commit the cases via `add` in a setup step)
care dataset add weather "weather in Paris tomorrow" --expected "Paris"
care dataset add weather "is it raining in London"   --expected "London"

# gate: non-zero exit fails the pipeline
care dataset run weather
```

```yaml
# .github/workflows/eval.yml (excerpt)
- name: Eval the weather chain
  run: care dataset run weather
  env:
    OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

Run `care dataset --help` for the authoritative, up-to-date flag set.

## See also

- [Production Commands](/care/slash-commands/production/) — the `/dataset`, evolution, and publish flow in the TUI.
- [CLI Overview](/care/cli/overview/) — every headless subcommand at a glance.
