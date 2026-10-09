---
title: The app and the Maestro harness
description: How the Maestro desktop app works — sessions, the chat model that drives every chain operation, strategies, cards and the progress dock.
sidebar:
  order: 1
---

The Maestro desktop app is a native window around the **Maestro harness**: a
resident chat agent with sessions, tools, approvals and background jobs.
Maestro adds its own plugins to it: chain tools, the
[Library](/care/app/library/), [Activity](/care/app/activity/), the Session tab,
result cards, the **MAESTRO** settings page and the Russian interface.

Maestro's own panels (Library, Activity, the Session tab, cards) are in
Russian. The harness shell follows the interface language you choose; see
[Settings and language](/care/app/settings/).

## Start and stop

```bash
maestro          # or: maestro app
```

`Maestro.app` does the same. The harness listens only on a random
`127.0.0.1` port inside the window; no browser tab is opened. A one-time token
is exchanged for a session cookie at start, telemetry is off, and closing the
window stops the harness and Maestro's tool process.

Plugins and the harness profile are loaded once at start. Changes to settings
or plugins take effect after a full restart.

Optional window flags: `--width`, `--height` (default 1280 × 820) and
`--debug` (WebView developer diagnostics).

## Sessions

A session is one conversation in a workspace (a project folder). Everything a
session produces stays tied to it: generated chains, runs, repair proposals,
evolution starts. You can have several sessions; the sidebar lists them.

Each session has:

- the **chat**, where you talk to the agent;
- the **model selector**: the chat model for this session;
- the **access preset**, which decides whether paid work asks for confirmation
  (see [Confirmations](/care/app/confirmations/));
- the **Session tab** (*Сессия*): Maestro results from this conversation's loaded history
  and shortcuts to start a new chain.

## The chat model drives everything

In the desktop app, every model call Maestro makes goes to the **model selected
in the chat that started the operation**:

- chain generation;
- chain execution (all model steps of the chain);
- repair proposals;
- evolution data generation;
- tool and skill drafts in the workshop;
- idea translation into English.

Maestro reaches that model through a private local bridge. The provider key
stays inside the harness; it is not copied into Maestro's configuration, files
or tool results. If the bridge is not available for a call, the call fails. It
never falls back to a separately configured key.

The evolution platform is the exception: it runs its own mutation and
validation models, configured on the [MAESTRO settings page](/care/app/settings/).

## How the agent handles a chain request

For ordinary questions the agent just answers. For chain work it first makes a
plan with one of five strategies:

| Strategy | What happens |
| --- | --- |
| Direct | Answer without a chain. |
| Reuse a chain | Load a saved chain from memory, then run it, adapt the input or evolve it. |
| Generate a chain | Generate a new chain with the Maestro generator (paid), then run, save or evolve it if you ask. |
| Agent writes the chain | The chat model writes the chain itself from the authoring guide, validates it, repairs it up to three times and stages it. |
| Use an artifact | Run, save or evolve a chain already generated or staged in this session. |

New chains use the **Maestro generator** by default. The agent writes a chain
itself only when you choose it: the Session tab offers *Maestro generator ·
default* and *Agent · alternative mode*. There is no automatic fallback
between the two. A chain that passes validation is not proven correct for
your task; run it on real input.

When memory is connected, generation first gets a short read-only recall of
related saved chains. With IdeaL as chain memory, the recall comes from the
IdeaL catalog.

You can name things in words: "the receipt chain", "the latest dataset". The
agent resolves such phrases to short references like `chain:<id>` or
`dataset:<id>`.

You do not need to say "yes" in chat before paid work. The agent is told not to
ask; the app shows its own dialog when one is needed.

## Cards and the progress dock

- **Tool cards** appear inline in the chat for every Maestro tool call. A
  generation card shows the chain's structure graph (step titles, types and
  dependencies) and a readiness summary. A run card shows each step's status
  and a bounded preview of its output or error.
- The **progress dock** above the input shows the latest generation, repair,
  execution or evolution of the session. For a running evolution it refreshes
  every 5 seconds.
- Pause, resume and stop controls for a running chain are on its card. See
  [Runs, pause and repair](/care/app/runs/).

## What else is in this section

- [Library](/care/app/library/): saved chains, memory cards, ideas, datasets, tools and skills.
- [Ideas and the IdeaL radar](/care/app/ideas/).
- [Runs, pause and repair](/care/app/runs/), including background jobs.
- [Activity](/care/app/activity/): all Maestro work across sessions.
- [Confirmations](/care/app/confirmations/): when the app asks and when it does not.
- [Settings and language](/care/app/settings/).

## Known limits

- The macOS bundle is arm64 only and ad-hoc signed; Developer ID signing and
  notarisation are separate release steps.
- Background jobs, the in-process Activity list, chain pause and the
  generation de-duplication ledger live in the app process. They are lost
  when the app restarts.
