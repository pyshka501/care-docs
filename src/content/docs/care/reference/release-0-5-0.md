---
title: Release 0.5.0
description: Maestro 0.5.0 release notes — the desktop app as the primary interface, Library, Activity, fewer confirmations, IdeaL ideas and radar, Russian interface, evolution data, the workshop, STARM solvers, CARL 0.5.0.
sidebar:
  order: 3
---

Release 0.5.0 is one documentation release for the stack: Maestro, CARL 0.5.0,
MAGE and IdeaL. In this release the primary interface is the **Maestro desktop
app**. The TUI and the CLI remain supported as secondary interfaces.

## Desktop app and the Maestro harness

- `maestro` (no subcommand) and `Maestro.app` open the desktop app: a native
  window around the Maestro harness, a resident chat agent with sessions,
  tools, approvals and background jobs. `maestro tui` opens the TUI.
- **One model.** Generation, execution, repair, evolution data generation,
  workshop drafts and idea translation use the chat model of the session.
  The provider key stays in the harness. There is no fallback to a separate
  key.
- **Strategies.** The agent plans each chain request: reuse a saved chain,
  generate a new one (default), let the agent write one, or use an artifact
  from the session.
- **Runs.** Pause, resume and stop between steps; repair proposals that never
  run by themselves; background jobs for long work.

See [The desktop app](/care/app/overview/).

## Library

A sidebar panel that opens without a session or a model call: chains, memory
cards, ideas, evolution datasets, tools and skills. A chain card shows the
structure graph, renames the chain as a new version, and lists the chain's own
evolution runs with a radar. Run, Evolve and Data actions put a ready request
into a session for you to review and send. The panel names the memory it
reads and what to fix when it does not answer.
See [Library](/care/app/library/).

## Activity

One list of generation, execution, repair, evolution and data generation from
all sessions, with progress and plain-language failure reasons. With IdeaL on,
evolution runs kept by IdeaL are listed too and survive a restart.
See [Activity](/care/app/activity/).

## Fewer confirmations

- Paid work asks **once**, in an app dialog. The agent does not ask in chat.
- Free actions (save, rename, cancel, pause, archive an idea, push an idea)
  run without a dialog.
- A session with the **Full access** preset never asks.
- Pressing the button in Maestro's own forms (data generation, workshop, idea
  form) is the consent.

See [Confirmations](/care/app/confirmations/).

## IdeaL ideas and the radar

With IdeaL as chain memory: generation recall from the IdeaL catalog, chains
in your namespace, and evolution runs that take idea slates from IdeaL and
report outcomes back under a stable task key. In the app: the ideas graph;
add, edit, archive and restore ideas, with a similarity check and English
translation; the per-run **radar** (ideas around the task, their effect,
ideas versus control); pushing an idea into a running evolution. The in-app
agent can also seed ideas for a task and show them for your review before
saving. See [Ideas and the IdeaL radar](/care/app/ideas/) and
[IdeaL](/ideal/getting-started/overview/).

## Russian interface

A Russian language pack for the harness shell (about a thousand strings);
Maestro's own panels are in Russian. The MAESTRO settings page stays in English.
See [Settings and language](/care/app/settings/).

## Evolution data generation

A generator of verified datasets for a chain, with a token budget, pause,
retries, instructions while running, dataset versions with a hidden holdout
part, and a one-click hand-off to evolution.
See [Evolution data](/care/workflows/data-generation/).

## Tools and skills workshop

Create or rework a tool or a skill: draft, checks (tools run on samples in the
Docker sandbox), save as a new version.
See [Tools and skills workshop](/care/workflows/workshop/).

## STARM solvers

Algorithmic sub-problems (sudoku, mazes, arithmetic puzzles, Game of Life,
ARC-AGI) can go to trained solver models as builtin tools, with local answer
checks where the task allows. See [STARM solvers](/care/solvers/starm/).

## CARL 0.5.0

Chains run on CARL 0.5.0. See the [CARL changelog](/carl/reference/changelog/).

## TUI and CLI

- The TUI's **Ad-Hoc** mode is now **Interactive**. It asks before running a
  chain; `ad_hoc` is still accepted. See [modes](/care/workflows/modes/).
- The CLI command is `maestro`; `care` remains an alias.

## Known limits

- `Maestro.app` is macOS arm64 only and ad-hoc signed; not notarised.
- Background jobs, the in-process Activity list, chain pause and run ownership
  do not survive an app restart.
- Evolution runs can be cancelled but not paused. The total token budget is a
  planning check; the platform enforces per-call caps.
- Datasets of *tasks with tools* cannot be used for evolution yet.
- The best chain of an evolution is not saved to memory automatically.
- The *Chain generation* block on the MAESTRO settings page does not affect
  generation in the desktop app (only its mode does), although its header
  says so.
- Calls from Maestro's own forms are recognised by an identifier; whether such
  an identifier can be forged through a custom model endpoint is still under
  review.
