---
title: Scenarios
description: End-to-end walkthroughs in the Maestro desktop app — from a quick agent to a saved, evolved one, with documents and IdeaL — plus TUI and CLI equivalents.
sidebar:
  order: 6
---

Concrete walkthroughs. The app scenarios assume you finished the
[Quick start](/care/getting-started/quick-start/): a chat model is set, and
for saving and evolution, Memory and the platform are configured.

Paid steps (test runs, generation, execution, repair, data generation,
evolution start) show one confirmation dialog, unless the session uses
**Full access**. Free steps (save, rename, import a file, pause, cancel) do
not ask.

## 1. A quick agent from a description

1. **New agent**. Describe the task:
   ```text
   Make an agent that summarises a support ticket in one sentence and rates
   its urgency from 1 to 5.
   ```
2. Answer the question card (input, output format) or say *"do it
   yourself"*.
3. The agent writes the chain and test-runs it; approve the test run. Look
   at the step graph on the card: it should say *Checked by a run*.
4. Ask to run it on your ticket. Approve the run.
5. Not satisfied? Say what to change. Nothing is saved until you ask.

## 2. Work on a document

1. Attach a PDF or a Word file with the paperclip, or drop it into the chat.
2. Ask: *"make an agent that extracts the parties, the amount and the due
   date from contracts like this one"*. The agent reads the file first and
   uses it as the realistic test input.
3. Later, run the saved agent on another contract by attaching it.

See [Chat](/care/app/chat/#attaching-files).

## 3. Keep what works

1. After a good run, say *"save this agent"*. It is written to memory as a
   new version.
2. Open **My agents**. The chain is under **Chains**; rename it there if the
   name is unclear (a rename is a new version too).

## 4. Reuse a saved agent

1. **My agents → Chains**, open the chain, press **Run**.
2. A session opens with a drafted request. Send it; the agent shows the input
   contract and asks only for missing input.
3. Approve the run.

Or just ask in any session: *"run the ticket-summary agent on this text: …"*.

## 5. Repair a failed run

1. A run fails at a step. The card says what went wrong, and the agent
   proposes a repair right away.
2. Approve the repair proposal. You get a new chain; the original stays as it
   was.
3. Ask to run the proposal. That is a separate, separately approved run.
4. If it works, save it.

See [Runs, pause and repair](/care/app/runs/).

## 6. From a saved agent to an evolved one

1. **Data.** Put your examples into a spreadsheet in the project folder and
   ask the agent to import it, or generate a dataset: on the chain card press
   **Data for evolution**, or open **My agents → Datasets**. See
   [Datasets](/care/autobench/overview/).
2. **Evolve.** On the chain card press **Evolve**, or **Use for evolution**
   on a dataset version, and send the request. For free-text answers ask for
   an LLM judge with your rubric. The agent makes a plan with a token
   estimate and starts the run after your approval.
3. **Watch.** Follow the live evolution card, the progress dock and
   [Activity](/care/app/activity/). With IdeaL on, open **Radar in IdeaL**.
4. **Take the result.** Press **Save best version** or ask for the result:
   the best chain is staged in the session. Run it on a real example, then
   save it.

See [Evolution](/care/workflows/evolution/).

## 7. Seed ideas and steer evolution (IdeaL)

1. Turn on IdeaL in **Settings → MAESTRO** (chain memory and namespace or
   project), restart the app, open **IdeaL** in the sidebar and sign in with
   your key once.
2. Ask the agent to *"seed ideas for this task"*. It drafts ideas, checks
   them against the lake and shows the list. Approve what to save.
3. Start an evolution. Its mutations get slates of ideas from your namespace.
4. Ask the agent to push a promising idea into the next mutations of the
   running evolution.
5. After the run, the run's page in IdeaL shows which ideas helped.

See [The IdeaL panel](/care/app/ideas/).

## 8. Add a missing tool

1. **My agents → Tools & skills → Create tool.** Describe it.
2. Prepare the draft; check that the sandbox run on samples succeeded.
3. Save. Rework it later the same way; a rework is a new version.

See [Tools and skills workshop](/care/workflows/workshop/).

## 9. Long work in the background

Ask *"run this evolution in the background"* (also works for generation,
execution and repair). The job appears in the jobs panel and in Activity. You
can keep chatting. **Stop** in the progress dock or killing the job stops the
work; for evolution it cancels the run on the platform.

---

## TUI equivalents

- Quick answers: **Interactive** mode, type the task, confirm the run.
  `/new` starts fresh.
- Durable chains: `/mode production`; each prompt generates, saves, runs a
  baseline and starts evolution. Follow-ups revise the chain.
- Datasets and evolution: `/dataset …`, `/evolution …`; see
  [Production mode](/care/workflows/production/).
- `@file` attaches a file to the task.

## CLI and CI

```bash
maestro doctor --no-probes                         # offline health check
maestro generate "Triage support tickets" --save triage --output triage.json
maestro validate triage.json                       # parse + preflight
maestro run <chain_id> --execute --task "Checkout is down for everyone"
maestro search "triage" --search-type hybrid
maestro evolve <chain_id> --wait --accept
```

Edit a saved chain by hand and re-import it:

```bash
maestro memory show <chain_id> --content-only > chain.json
# edit chain.json
maestro validate chain.json
maestro import chain.json --apply
```

See the [CLI reference](/care/cli/overview/) and
[Export and import](/care/cli/export/).
