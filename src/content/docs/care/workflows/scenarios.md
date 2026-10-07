---
title: Scenarios
description: End-to-end walkthroughs in the Maestro desktop app — from a quick answer to a saved, evolved chain — plus TUI and CLI equivalents.
sidebar:
  order: 6
---

Concrete walkthroughs. The app scenarios assume you finished the
[Quick start](/care/getting-started/quick-start/): a chat model is set, and
for saving and evolution, Memory and the platform are configured.

Paid steps (generation, execution, repair, data generation, evolution start)
show one confirmation dialog, unless the session uses **Full access**. Free
steps (save, rename, pause, cancel) do not ask.

## 1. A quick answer with a fresh chain

1. New session. Describe the task:
   ```text
   Make a chain that summarises a support ticket in one sentence and rates
   its urgency from 1 to 5.
   ```
2. Approve the generation. Look at the structure graph on the card.
3. Ask to run it on an example. Approve the run.
4. Not satisfied? Say what to change; the agent generates again or adapts the
   input. Nothing is saved until you ask.

## 2. Keep what works

1. After a good run, say *"save this chain"*. It is written to memory as a new
   version.
2. Open the **Library**. The chain is under **Chains**; rename it there if the
   generated name is unclear (a rename is a new version too).

## 3. Reuse a saved chain

1. **Library → Chains**, open the chain, press **Run**.
2. A session opens with a drafted request. Send it; the agent shows the input
   contract and asks only for missing input.
3. Approve the run.

Or just ask in any session: *"run the ticket-summary chain on this text: …"*.

## 4. Repair a failed run

1. A run fails. Ask *"repair it"*.
2. Approve the repair proposal. You get a new chain; the original stays as it
   was.
3. Ask to run the proposal. That is a separate, separately approved run.
4. If it works, save it.

See [Runs, pause and repair](/care/app/runs/).

## 5. From a saved chain to an evolved one

1. **Data.** On the chain card press **Data for evolution**, or open
   **Library → Datasets**. Set the number of cases, difficulty, holdout share
   and token budget; start. Watch the cases being verified; add instructions
   if the cases miss something. See [Evolution data](/care/workflows/data-generation/).
2. **Evolve.** In the dataset version press **Use for evolution**, or on the
   chain card press **Evolve**, and send the request. The agent makes a plan
   with a token estimate and starts the run after your approval.
3. **Watch.** Follow the progress dock, the evolution card and
   [Activity](/care/app/activity/). With IdeaL on, open the radar.
4. **Take the result.** Ask for the result: the best chain is staged in the
   session. Run it on a real example, then save it.

See [Evolution](/care/workflows/evolution/).

## 6. Seed ideas and steer evolution (IdeaL)

1. Turn on IdeaL in **Settings → MAESTRO** (chain memory and namespace),
   restart the app.
2. **Library → Ideas → Add idea.** Describe a concrete change. Check for
   similar ideas, translate to English if needed, save. You can also ask the
   agent to research and propose ideas for a task; it shows the list for your
   review before saving.
3. Start an evolution. Its mutations get slates of ideas from your namespace.
4. In the radar, push a promising idea into the next mutations of the running
   evolution.
5. After the run, the ideas graph shows which ideas helped. Archive the ones
   that did not.

See [Ideas and the IdeaL radar](/care/app/ideas/).

## 7. Add a missing tool

1. **Library → Tools & skills → Create tool.** Describe it.
2. Prepare the draft; check that the sandbox run on samples succeeded.
3. Save. Rework it later the same way; a rework is a new version.

See [Tools and skills workshop](/care/workflows/workshop/).

## 8. Long work in the background

Ask *"run this evolution in the background"* (also works for generation,
execution and repair). The job appears in the jobs panel and in Activity. You
can keep chatting. Killing the job stops the work; for evolution it cancels
the run on the platform.

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
