---
title: Revise a chain
description: AI-edit a saved chain into a new version with a natural-language instruction.
sidebar:
  order: 2.5
---

`care revise` is the AI counterpart to [`care generate`](/care/cli/generate-run/):
instead of building a chain from a task, it hands an *existing* saved chain to
MAGE and asks for a minimal, targeted edit described in plain language. It's the
terminal twin of the TUI's `/revise` command.

## `care revise <chain_id> <change>…`

MAGE plans the smallest edit that satisfies your instruction. By **default the
command only previews that plan** — nothing is written. Pass `--yes` to save the
result as a **new version** of the same chain.

```bash
care revise weather "use Celsius and add a 3-day forecast"
care revise weather "use Celsius and add a 3-day forecast" --yes
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `<change>…` | — | What to change, in natural language (`nargs=+`, so quote it). |
| `--channel NAME` | `latest` | Version channel to read and write. |
| `--mode fast\|deep` | — | MAGE mode override (defaults to MAGE's own default). |
| `--yes` | off | Save the edited chain as a new version (default: preview only). |
| `--json` | off | Emit the edited chain as JSON instead of the plan summary. |

When you confirm with `--yes`, the new version **reuses the existing chain's
name** and records `change_summary="revise: <instruction>"`, so the edit shows up
clearly in [`care lineage`](/care/cli/memory/) and the chain's history.

:::note[Preview first]
Without `--yes` you'll see the planned edit and the line
`Preview only — re-run with --yes to save this as a new version.` This mirrors
the TUI's confirm-before-save flow. If MAGE decides nothing needs changing, the
command reports `MAGE proposed no changes.` and exits cleanly.
:::

If the `<chain_id>` reference is ambiguous, `revise` lists the candidates and
asks you to re-run with an explicit id. On a `401`/`403` it prints a friendly
token-expiry hint instead of a raw error.

---

## See also

- [Generate, Run & Replay](/care/cli/generate-run/) — build and execute chains.
- [Memory & Library](/care/cli/memory/) — inspect versions, lineage, and history.
