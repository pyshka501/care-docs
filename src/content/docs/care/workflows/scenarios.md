---
title: Scenarios
description: End-to-end worked workflows — from a quick answer to building, evolving, and shipping an agent.
sidebar:
  order: 3
---

Concrete walkthroughs of the main ways people use MAESTRO CARE. They assume you've run
[`care init`](/care/cli/setup/) and launched the TUI with `care`.

## 1. Quick one-off answer (Ad-Hoc)

The fastest path — no setup beyond MAGE creds.

1. Stay in **Ad-Hoc** (default).
2. Type the task, optionally attaching files with `@`:
   ```text
   Summarise the key risks in @report.pdf and rank them by severity.
   ```
3. The answer prints inline. Follow up in the same thread; `/new` starts fresh.

## 2. Build & evolve a Production agent

Turn a task into a saved, evolving agent.

1. Switch to Production: `/mode production` (needs Memory configured).
2. Type the task → MAESTRO CARE **generates → saves** the chain (you get a `chain_id`) →
   runs a **baseline** → (if Platform is wired) **kicks off evolution**.
3. Watch evolution: `/evolution watch <run_id>`.
4. Accept the winner: `/evolution accept <run_id> <individual_id>` (or
   `/promote <chain_id> <version>`).
5. The improved chain is now in your [Library](/care/tui/screens/).

Headless equivalent:

```bash
care generate "Triage support tickets by severity" --save triage
care evolve triage --iterations 8 --wait --accept
```

## 3. Dataset-driven improvement

Measure before you optimise.

1. In Production, after the chain is saved, add test cases:
   ```text
   /dataset add <chain_id> "Checkout is down for everyone" --expected "high"
   /dataset add <chain_id> "Typo on the pricing page" --expected "low"
   ```
2. Score the chain against them: `/dataset run <chain_id>`.
3. Evolve with the dataset as the fitness signal, then re-run to confirm the gain.
4. Export the set to share or version: `/dataset export <chain_id> dataset.jsonl`.

## 4. Re-run a saved agent from the Library

Reuse an agent on new input.

1. `/library` (or `Ctrl+P` → search) → open a saved chain.
2. Use the **Run context** form to set a new task + attach context files, then run
   it. Or headless:
   ```bash
   care run <chain_id> --execute --task "New quarter, same analysis" --input region=EU
   ```
3. In Production, the run is recorded; review history with
   [`care memory history <chain_id>`](/care/cli/memory/).

## 5. Revise an existing chain

Edit a chain in natural language instead of regenerating.

```text
/revise <chain_id> add a verification step before the final answer
```

MAESTRO CARE previews the edit plan, you confirm, and it saves a **new version**. (In
Production, a plain follow-up prompt does this automatically against the current
chain.) Promote the version you like with `/promote`.

## 6. The canonical multi-agent flow

The end-to-end loop MAESTRO CARE is built around:

> Generate agent **A** → save it → generate **B** and **C** → return to **A** from
> the Library → re-run it from the same task + context files → **evolve A** and
> **accept** the best individual back into the stable channel.

## 7. Headless / CI

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
