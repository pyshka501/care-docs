---
title: The app and the Maestro harness
description: How the Maestro desktop app works — the start screen, the sidebar, sessions and access presets, the model that does chain work, cards and the progress dock.
sidebar:
  order: 1
---

The Maestro desktop app is an **agent builder**: you describe a task in chat,
Maestro asks for what is missing, builds an agent (a chain), checks it on your
examples, improves it with evolution and can publish it as an HTTP service.
You can also just talk to it: it answers, reads your files and runs saved
agents.

The window is a native shell around the **Maestro harness**: a resident chat
agent with sessions, tools, approvals and background jobs. Maestro adds its
own plugins: chain tools, [My agents](/care/app/library/) (the library),
the [IdeaL panel](/care/app/ideas/), [Activity](/care/app/activity/), result
cards, the **MAESTRO** settings page and the Russian interface.

:::note[Current development line]
This section describes builds from the current development line of Maestro.
Features added after the 0.5.0 documentation (marked *development line* on
these pages) are not yet in a tagged Maestro release.
:::

## Start and stop

```bash
maestro          # or: maestro app
```

`Maestro.app` does the same. The harness listens only on a random
`127.0.0.1` port inside the window; no browser tab is opened. A one-time token
is exchanged for a session cookie at start, telemetry is off, and closing the
window stops the harness and Maestro's tool process.

Plugins and the harness profile are loaded once at start. Changes to settings
or plugins take effect after a **full restart** (quit and reopen).

Optional window flags: `--width`, `--height` (default 1280 × 820) and
`--debug` (WebView developer diagnostics).

## The start screen

*Development line.* The header shows the AIRI logo and the MAESTRO name with
the badge **Agent builder** (*Конструктор агентов*). A blank session
explains the four steps: describe the task, MAESTRO clarifies, builds and
checks, improves and publishes. Below the input field are starter cards:

| Card | What it puts into the input field |
| --- | --- |
| **Reviewer agent** (*Агент-ревьюер*) | The beginning of a request for an agent that checks code or documents by your rules. |
| **Document agent** (*Агент для документов*) | A request for an agent that extracts data from contracts, letters, receipts. |
| **Agent from examples** (*Агент по примерам*) | A request to import examples from a file and build an agent for them. |
| **Improve an agent** (*Улучшить агента*) | A request to evolve a saved agent on its dataset. |
| **What else can MAESTRO do?** (*Что ещё умеет MAESTRO?*) | The question *"What can you do?"*. |

A card only fills the input field. Nothing is sent or paid for until you edit
and send it. Asked what it can do, the agent checks which parts are switched
off in this session (for example no Memory or no evolution platform) and says
so instead of promising them.

## The sidebar

- **New agent** (*Новый агент*): a new conversation. Sessions are grouped by
  project folder.
- **My agents** (*Мои агенты*): everything saved in Maestro's memory. See
  [My agents](/care/app/library/).
- **IdeaL**: the idea lake and evolution runs, shown inside the app. See
  [The IdeaL panel](/care/app/ideas/).
- **Activity** (*Активность*): Maestro work from all sessions. See
  [Activity](/care/app/activity/).

One sidebar panel is open at a time; a press elsewhere in the sidebar closes
it.

## Sessions

A session is one conversation in a project folder. Everything a session
produces stays tied to it: chains, runs, repair proposals, evolution starts.
Files you attach are saved into that project folder.

Each session has:

- the **chat**, where you talk to the agent. See [Chat](/care/app/chat/);
- the **model selector** under the input field: the chat model for this
  session;
- the **access preset**: **Read only** (*Только чтение*), **Workspace write**
  (*Запись в папке проекта*) or **Full access** (*Полный доступ*). It decides what the agent may do without asking and whether
  paid work asks for confirmation. See [Confirmations](/care/app/confirmations/);
- the **Session tab** (*Сессия*): Maestro results from this conversation's
  loaded history, links to My agents and Activity, and shortcuts to start a
  new chain.

## Which model does the chain work

By default every model call Maestro makes goes to the **model selected in the
chat that started the operation**: writing and testing a chain, MAGE
generation, chain execution (all model steps), repair proposals, tool and
skill drafts, idea translation. Maestro reaches that model through a private
local bridge. The provider key stays inside the harness and is not copied
into Maestro's configuration, files or tool results.

*Development line.* **Settings → MAESTRO → Chain model** (*Модель для
цепочек*) can switch generation, execution and repair to a separate model
with its own address and key (**Custom model**, *Своя модель*). See
[Settings](/care/app/settings/).

The evolution platform is the exception: it runs its own mutation and
validation models, set on the MAESTRO settings page.

The default chat provider is **OpenRouter**: on first launch the app asks for
an OpenRouter key. Other providers can be added in **Settings → Chat model**,
including a ChatGPT subscription (see [Settings](/care/app/settings/)).

## Who writes a new chain

*Development line.* By default the **chat agent writes a new chain itself**:
it looks at real responses of the APIs it needs, writes the chain, validates
it, test-runs it on a realistic input and fixes it (up to three repairs). The
alternative is the **MAGE generator**: faster and cheaper, but the chain is
not run before you see it. The choice is the setting **Who writes chains**
(*Кто пишет цепочки*); you can always ask for the other one in chat.

Before building, the agent studies your request, attached files and Memory,
then asks for what is still missing or decides itself, depending on
**Clarify before building** (*Уточнения перед сборкой*). See
[Building an agent](/care/app/agents/).

## How the agent handles a request

For ordinary questions the agent just answers. For chain work it first makes a
plan with one of five strategies:

| Strategy | What happens |
| --- | --- |
| Direct | Answer without a chain. |
| Reuse a chain | Load a saved chain from memory, then run it, adapt the input or evolve it. |
| Agent writes the chain | The chat agent writes, validates, test-runs and repairs the chain (default for new chains). |
| Generate a chain | Generate a new chain with MAGE. |
| Use an artifact | Run, save or evolve a chain already built or staged in this session. |

You can name things in words: "the receipt chain", "the latest dataset". The
agent resolves such phrases to exact references itself; you never need to
copy ids or hashes.

You do not need to say "yes" in chat before paid work. The agent is told not
to ask; the app shows its own dialog when one is needed.

## Cards and the progress dock

- **Operation cards** appear in the chat for generation, execution, repair,
  evolution and dataset import. A chain card shows the step graph and a
  readiness summary; a run card shows each step's status and a bounded
  preview of its output or error. These cards stay visible when the turn's
  other tool calls fold. Card buttons put a short request into the input
  field; you send it yourself.
- *Development line.* The **progress dock** above the input is a live
  indicator only: while an operation runs it shows one line with the title,
  elapsed time and a progress bar (measured for evolution generations), plus
  **Go to card** (*Перейти к карточке*) and, for background jobs and
  evolutions, **Stop** (*Остановить*). After a watched operation finishes it
  shows a short result line for a few seconds and disappears.
- Pause, resume and stop for a running chain are on its card. See
  [Runs, pause and repair](/care/app/runs/).

## What else is in this section

- [Chat](/care/app/chat/): starting points, clarifying questions, attachments, diagrams.
- [Building an agent](/care/app/agents/): who writes the chain, the brief, test runs.
- [My agents](/care/app/library/): saved chains, memory cards, datasets, tools and skills.
- [The IdeaL panel](/care/app/ideas/).
- [Runs, pause and repair](/care/app/runs/), including background jobs.
- [Activity](/care/app/activity/): all Maestro work across sessions.
- [Confirmations](/care/app/confirmations/): when the app asks and when it does not.
- [Settings and language](/care/app/settings/).

## Known limits

- The macOS bundle is arm64 only and ad-hoc signed; Developer ID signing and
  notarisation are separate release steps.
- Background jobs, most of the Activity list, chain pause and the generation
  de-duplication ledger live in the app process. They are lost when the app
  restarts. Dataset generation runs are kept on disk.
