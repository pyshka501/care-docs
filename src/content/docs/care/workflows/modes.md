---
title: Ad-Hoc vs Production
description: The two chat modes in depth — what each one does on every prompt, and when to use them.
sidebar:
  order: 1
---

The toggle above the prompt (or `/mode`) picks one of two modes. They differ in
**what happens on every prompt** and **whether anything is saved**.

| | **Ad-Hoc** (default) | **Production** |
| --- | --- | --- |
| On each prompt | Generate a chain, run it **on the spot**, answer inline. | Generate a **reproducible** chain, save it, run a baseline, (optionally) evolve. |
| Agent loop | May loop **ReAct-style** until it decides the task is done. | **No loop** — one task → one reproducible chain. |
| Answer synthesis | When ≥2 steps succeed, an extra LLM call merges them into one reply. | Skipped — chains must stay reproducible. |
| Saved? | **Nothing** is saved. | Saved to Memory under a stable `chain_id` + a baseline dataset entry. |
| Follow-up prompt | Generates a fresh chain (carries Ad-Hoc history for context). | **Iterates the same chain** via [`/revise`](/care/slash-commands/overview/) — a new version, not a new chain. |
| Needs Memory? | No. | **Yes** (`CARE_MEMORY__BASE_URL`). |

## Ad-Hoc

The fast path. Type a task → MAGE generates → MAESTRO CARE runs → the answer prints. The
agent may iterate (ReAct) until done; when several steps succeed MAESTRO CARE makes one
extra call to synthesise a single coherent reply. Ad-Hoc keeps a short rolling
history (`CARE_CHAT__AD_HOC_HISTORY_TURNS`, default 6) so follow-ups have context.
`/new` or `/clear` resets it. Works with no Memory configured.

Use it for: quick answers, exploration, one-offs.

## Production

The durable path — for agents you'll keep, measure, and improve. Every prompt
produces one **reproducible** chain (no ReAct, no synthesis), saved to Memory.
Details and the full lifecycle are on the [Production mode](/care/workflows/production/)
page.

Use it for: agents you want to save, build a dataset for, evolve, and promote.

:::note
Production requires `CARE_MEMORY__BASE_URL` (and `CARE_MEMORY__API_KEY` if the
deployment enforces auth). **Without Memory, selecting Production auto-falls back
to Ad-Hoc** with a warning — the toggle tooltip explains why. Set the startup mode
with `CARE_CHAT__DEFAULT_MODE`.
:::

## See also

- [Production mode](/care/workflows/production/) · [Scenarios](/care/workflows/scenarios/)
- [`/mode`](/care/slash-commands/overview/) — switch from the keyboard.
