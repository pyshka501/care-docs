---
title: Chat surfaces & stage policy
description: The three chat surfaces — Interactive, Production, Ad-Hoc — what each does on every prompt, and how per-stage policy and env overrides shape them.
sidebar:
  order: 1
---

The toggle above the prompt (or `/mode`) picks how MAESTRO treats every message.
There are three surfaces, but only two are real modes — **Interactive** (the
default) and **Production**. **Ad-Hoc** is the legacy name and normalises to
Interactive on read.

| | **Interactive** (default) | **Production** |
| --- | --- | --- |
| On each prompt | Generate a chain, run it **on the spot**, answer inline. | Generate a **reproducible** chain, then auto save → baseline → (optionally) evolve. |
| Save / baseline / evolve | **Your call** — driven by the chain-action buttons (Save to library, Evolve). | **Automatic** — the pipeline runs them for you. |
| Follow-up prompt | **Reuses the chain** for context; a new prompt can generate afresh. | Treated as [`/revise`](/care/slash-commands/overview/) — a new version of the same chain. |
| Saved? | Only when you press **Save**. | Saved to Memory under a stable `chain_id` + a baseline dataset entry. |
| Needs Memory? | No. | **Yes** (`CARE_MEMORY__BASE_URL`). |

## Interactive

The default surface. Type a task → MAGE generates → CARL runs → the answer
prints. Nothing is persisted unless you choose to: the **Save to library** and
**Evolve** chain-action buttons put you in control of what survives the session.
Follow-up prompts reuse the same chain so the conversation has context; start a
fresh chain whenever you want.

Use it for: quick answers, exploration, iterating on a chain before you commit it.

## Production

The durable path — for agents you'll keep, measure, and improve. Every prompt
produces one **reproducible** chain that is then **automatically** saved,
baselined, and (if Platform is wired) evolved. Once a chain exists, your next
plain messages are treated as `/revise` edits — a new version under the same
`chain_id`, not a new chain. Details and the full lifecycle are on the
[Production mode](/care/workflows/production/) page.

Use it for: agents you want to save, build a dataset for, evolve, and promote.

:::note
Production requires `CARE_MEMORY__BASE_URL` (and `CARE_MEMORY__API_KEY` if the
deployment enforces auth). Set the startup surface with `CARE_CHAT__DEFAULT_MODE`.
:::

## Ad-Hoc (legacy)

`ad_hoc` (and the spellings `ad-hoc` / `adhoc`) is the old name for the
fast, run-on-the-spot path. It is kept only for back-compat: on read it is
**normalised to `interactive`**, so anything that still passes `ad_hoc` lands on
the Interactive surface with no change in behaviour.

---

## Stage policy

Both surfaces are built from the same pipeline. Two stages — **generate** and
**preview** — are always automatic. The other four are configurable, each with
one of three policies:

| Policy | Behaviour |
| --- | --- |
| `auto` | Do it silently. |
| `ask` | Show a confirm gate first. |
| `skip` | Never do it (and skip stages that depend on it). |

The four configurable stages and their per-surface presets:

| Stage | Interactive | Production |
| --- | --- | --- |
| `run` | `ask` | `ask` |
| `save` | `skip` (button-driven) | `auto` |
| `baseline` | `skip` (button-driven) | `auto` |
| `evolve` | `skip` (button-driven) | `auto` |

In Interactive, `save` / `baseline` / `evolve` are `skip` at the pipeline level
because they're driven by the chain-action **buttons**, not by modal gates.

## Env overrides

Set the boot-time surface, then override any stage policy without editing
`config.toml`. Env vars nest with the `__` delimiter through every level.

```bash
# Boot-time surface: interactive | production (legacy aliases accepted)
export CARE_CHAT__DEFAULT_MODE=production

# Per-stage policy: CARE_CHAT__MODE__<MODE>__<STAGE> = ask | auto | skip
export CARE_CHAT__MODE__INTERACTIVE__RUN=auto      # run Interactive chains without a gate
export CARE_CHAT__MODE__PRODUCTION__SAVE=ask       # confirm before saving in Production
```

`<MODE>` is `INTERACTIVE` or `PRODUCTION`; `<STAGE>` is `RUN`, `SAVE`,
`BASELINE`, or `EVOLVE`. An unset stage defers to the preset above.

:::note[Soft parsing]
A malformed or legacy `default_mode` never crashes the config load. Known
aliases (`ad_hoc`, `ad-hoc`, `adhoc` → `interactive`; `prod` → `production`) are
normalised; anything unrecognised is dropped, the field falls back to its default
(`interactive`), and a warning is logged.
:::

## See also

- [Configuration sections](/care/configuration/sections/) — the full `chat` config surface.
- [The MAESTRO CARE TUI](/care/tui/overview/) — the buttons and `/mode` toggle in context.
- [Production mode](/care/workflows/production/) · [Scenarios](/care/workflows/scenarios/)
- [`/mode`](/care/slash-commands/overview/) — switch from the keyboard.
