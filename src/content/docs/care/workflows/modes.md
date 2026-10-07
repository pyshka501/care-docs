---
title: Interactive and Production modes
description: The two TUI modes — Interactive (formerly Ad-Hoc) and Production — their stage policies, env overrides, and how the desktop app covers the same ground.
sidebar:
  order: 1
---

The Textual TUI (`maestro tui`) has two modes. **Interactive** is the default.
It replaces the former **Ad-Hoc** mode: the old name `ad_hoc` is still
accepted and is read as `interactive`.

The desktop app has no modes. There the chat agent does what you ask
(generate, run, save, evolve) and paid steps ask for one confirmation. See
[The desktop app](/care/app/overview/).

| | **Interactive** (default) | **Production** |
| --- | --- | --- |
| On each prompt | Generate a chain, **ask before running it**, show the answer. | Generate a reproducible chain, ask once, then save it, run a baseline and start evolution. |
| Follow-up prompt | A new generation. The agent may loop on its own answer (up to `CARE_CHAT__LOOP_MAX_ITER`, default 5). | Revises the saved chain into a new version. `/new` starts a new chain. |
| Save / evolve | **Save** and **Evolve** buttons; nothing is saved automatically. | Automatic. |
| Needs Memory | No. | **Yes.** Without Memory the TUI falls back to Interactive with a warning. |
| Needs Platform | Only for Evolve. | Optional. Without it, save and baseline still happen; evolution is skipped. |

Switch with the toggle above the prompt or `/mode`. The startup mode comes
from `CARE_CHAT__DEFAULT_MODE`.

## Interactive

Type a task: the generator builds a chain, the TUI asks before running it,
then shows the answer. Nothing is persisted until you press **Save** (save to
the library) or **Evolve** (opens the evolution launch picker). Use it to try
tasks and iterate on a chain before keeping it.

## Production

Each prompt produces one reproducible chain that is then saved to Memory under
a stable `chain_id`, run once as a **baseline** (recorded as the first dataset
entry), and handed to evolution when a platform is configured. Your next plain
prompt revises that chain. Details: [Production mode](/care/workflows/production/).

## Stage policy

Both modes run one pipeline: generate → run → save → baseline → evolve.
Generation is always automatic. The other four stages each have a policy:

| Policy | Behaviour |
| --- | --- |
| `auto` | Do it without asking. |
| `ask` | Show a confirmation first. |
| `skip` | Never do it (stages that depend on it are skipped too). |

Defaults:

| Stage | Interactive | Production |
| --- | --- | --- |
| `run` | `ask` | `ask` |
| `save` | `skip` (Save button) | `auto` |
| `baseline` | `skip` | `auto` |
| `evolve` | `skip` (Evolve button) | `auto` |

## Environment overrides

```bash
# Startup mode: interactive | production
export CARE_CHAT__DEFAULT_MODE=production

# Per-stage policy: CARE_CHAT__MODE__<MODE>__<STAGE> = ask | auto | skip
export CARE_CHAT__MODE__INTERACTIVE__RUN=auto    # run without asking in Interactive
export CARE_CHAT__MODE__PRODUCTION__SAVE=ask     # confirm before saving in Production
```

`<MODE>` is `INTERACTIVE` or `PRODUCTION`; `<STAGE>` is `RUN`, `SAVE`,
`BASELINE` or `EVOLVE`. An unset stage uses the default above.

:::note[Lenient parsing]
`default_mode` never crashes the config load. `ad_hoc`, `ad-hoc` and `adhoc`
are read as `interactive`, `prod` as `production`. Anything else is dropped
with a logged warning and the default (`interactive`) applies.
:::

The settings `CARE_CHAT__AD_HOC_HISTORY_TURNS` (default 6) and
`CARE_CHAT__AD_HOC_HISTORY_CHARS` (default 1200) keep their old spelling. They
set how much of the earlier conversation an Interactive follow-up sees.

## See also

- [Production mode](/care/workflows/production/) · [Scenarios](/care/workflows/scenarios/)
- [The TUI](/care/tui/overview/) · [`/mode`](/care/slash-commands/overview/)
- [Configuration sections](/care/configuration/sections/)
