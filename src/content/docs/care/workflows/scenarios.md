---
title: Scenarios
description: End-to-end worked workflows — from a quick answer to building, evolving, and shipping an agent.
sidebar:
  order: 3
---

Concrete walkthroughs of the main ways people use MAESTRO. They assume you've run
[`care init`](/care/cli/setup/) and launched the TUI with `care`.

## 1. Quick one-off answer (Interactive)

The fastest path — no setup beyond MAGE creds.

1. Stay in **Interactive** (the default surface).
2. Type the task, optionally attaching files with `@`:
   ```text
   Summarise the key risks in @report.pdf and rank them by severity.
   ```
3. The answer prints inline. Follow up in the same thread; `/new` starts fresh.

## 2. Iterate in Interactive, then keep what works

Interactive runs the chain **on the spot** and persists nothing — until you decide to.
It's the natural place to explore a chain before committing it.

1. In **Interactive**, type a task → MAGE generates → CARL runs → the answer prints.
2. Refine with follow-up prompts (they reuse the chain for context); inspect the chain
   with [`/visualize`](/care/slash-commands/overview/).
3. When a chain is worth keeping, press the **Save to library** chain-action button —
   or hand it straight to evolution with **Evolve**, which opens the same launch picker
   (budget preview included) described below.
4. Want to tweak the steps by hand instead of regenerating? Export the chain and edit
   the JSON directly:
   ```bash
   care memory show <chain_id> --content-only > chain.json
   # edit chain.json — reorder steps, tweak prompts, change tool args
   care validate chain.json                 # preflight before re-importing
   care import chain.json --apply
   ```
   Or pack it into a portable bundle with [`care export`](/care/cli/export/) to move it
   between machines.

## 3. Build & evolve a Production agent

Turn a task into a saved, evolving agent.

1. Switch to Production: `/mode production` (needs Memory configured).
2. Type the task → MAESTRO **generates → saves** the chain (you get a `chain_id`) →
   runs a **baseline** → (if Platform is wired) **kicks off evolution**.
3. Watch evolution on the [Evolution dashboard](/care/tui/evolution/) (or
   `/evolution watch <run_id>` in chat) — the live **Fitness** chart, **Pareto front**,
   and a **cost meter** that tracks token/USD spend against the launch budget.
4. Accept the winner: `/evolution accept <run_id> <individual_id>` (or
   `/promote <chain_id> <version>`).
5. The improved chain is now in your [Library](/care/tui/screens/).

Headless equivalent:

```bash
care generate "Triage support tickets by severity" --save triage
care evolve triage --iterations 8 --wait --accept
```

## 4. Dataset-driven improvement

Measure before you optimise.

1. In Production, after the chain is saved, add test cases:
   ```text
   /dataset add <chain_id> "Checkout is down for everyone" --expected "high"
   /dataset add <chain_id> "Typo on the pricing page" --expected "low"
   ```
2. Score the chain against them: `/dataset run <chain_id>`.
3. Evolve with the dataset as the fitness signal — the launch picker's **budget preview**
   estimates the run's cost up front, and the [Evolution dashboard](/care/tui/evolution/)'s
   **cost meter** tracks it live. Re-run the dataset afterwards to confirm the gain.
4. Export the set to share or version: `/dataset export <chain_id> dataset.jsonl`.

## 5. Re-run a saved agent from the Library

Reuse an agent on new input.

1. `/library` (or `Ctrl+P` → search) → open a saved chain.
2. Use the **Run context** form to set a new task + attach context files, then run
   it. Or headless:
   ```bash
   care run <chain_id> --execute --task "New quarter, same analysis" --input region=EU
   ```
3. In Production, the run is recorded; review history with
   [`care memory history <chain_id>`](/care/cli/memory/).

## 6. Revise an existing chain

Edit a chain in natural language instead of regenerating.

```text
/revise <chain_id> add a verification step before the final answer
```

MAESTRO previews the edit plan, you confirm, and it saves a **new version**. (In
Production, a plain follow-up prompt does this automatically against the current
chain.) Promote the version you like with `/promote`.

Prefer surgical control? Export the chain, edit the JSON by hand, then re-import it:

```bash
care memory show <chain_id> --content-only > chain.json
# edit chain.json, then:
care validate chain.json
care import chain.json --apply
```

See [Export & import bundles](/care/cli/export/) for moving chains between machines.

## 7. The canonical multi-agent flow

The end-to-end loop MAESTRO is built around:

> Generate agent **A** → save it → generate **B** and **C** → return to **A** from
> the Library → re-run it from the same task + context files → **evolve A** and
> **accept** the best individual back into the stable channel.

## 8. Headless / CI

Everything has a terminal twin — script it:

```bash
care doctor --no-probes                       # health check (offline)
care generate "<task>" --save my-agent --output agent.py
care validate agent.json                      # preflight a chain file
care run my-agent --execute --save-result run1
care search "triage" --search-type hybrid     # find saved agents
care evolve my-agent --wait --accept
```

## See also

- [Production mode](/care/workflows/production/) · [Ad-Hoc vs Production](/care/workflows/modes/)
- [CLI reference](/care/cli/overview/) · [Slash commands](/care/slash-commands/overview/)
