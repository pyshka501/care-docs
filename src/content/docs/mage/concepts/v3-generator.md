---
title: v3 Generator (experimental)
description: The plan, author, compile and dry-run generator on MAGE's research branches. How it works, how to run it in the evaluation harness, and what has and has not been measured.
sidebar:
  order: 4
---

:::caution[Experimental, not in the package]
v3 lives in `evaluation/plan_author_v3.py` on the development branches
`feat/v3-phase0` and `feat/v3-ideal-loop`. It runs only as an arm of the
MAGEBench runner. `MAGEGenerator` does not call it, the `mmar-mage` wheel does
not include `evaluation/`, and Maestro does not use it.
:::

v3 replaces deep mode's four fixed stages with a short, general process: plan
the data flow, let one author call write CARL, then check the result with
deterministic code and a dry run in the real CARL runtime.

```mermaid
flowchart TB
    C([public task contract]) --> F["1 contract facts<br/>task families · tools · environment"]
    F --> P["2 data-flow plan<br/>one model call"]
    P --> A["3 author<br/>one model call → CARL"]
    A --> K["4 compiler<br/>deterministic"]
    K --> Ad{"5 admission<br/>typed CARL load · lint · semantic checks"}
    Ad -->|diagnostics with fix advice| A
    Ad -->|admitted| D{"6 dry run<br/>synthesized inputs · simulated tools · real CARL"}
    D -->|failed, with trace| A
    D -->|passed| Out([chain])
```

## Stages

1. **Contract facts.** From the public contract only: task families (editing,
   evidence, closed-world, files, tools, privacy), declared tools and MCP
   servers, and the environment (for example whether a human can answer
   `human_input`). Each family adds a short guide to the prompt.
2. **Data-flow plan.** One call names the few nodes the answer needs, what
   each consumes and produces, and which declared tool it calls. A node that
   nothing consumes is not allowed, so the plan is minimal by construction.
3. **Author.** One call maps the nodes to CARL steps, guided by step cards
   and the step types the installed CARL can load.
4. **Compiler.** Deterministic: strips model overrides, normalises references
   (`$steps.N.result.x` → `$steps.N.result_data.x`), removes dead steps, fits
   the final step to the output contract or to the answer format the request
   names.
5. **Admission and repair.** Typed CARL load, lint and general semantic
   checks. Every finding carries concrete fix advice and goes back to the
   author. The measured configuration allows up to three repairs.
6. **Dry run.** Inputs are synthesized from the public contract, declared
   tools are simulated by a model from their schemas, the chain runs in real
   CARL, and the run is checked deterministically. A failed dry run becomes
   one more repair round with the execution trace. An optional reviewer in a
   fresh context can judge the answer; it is off in the measured version.

The measured version is **v3.4**: one dry-run round on two fixtures, up to two
dry-run repairs, reviewer off.

## Add-ons on `feat/v3-ideal-loop`

Each is switched on per benchmark arm and is **experimental**:

| Add-on | Arm field | Page |
| --- | --- | --- |
| Generation memory (examples, ideas) | `memory_mode` | [Memory and reuse](/mage/concepts/memory/) |
| Reuse ladder and generation as an IdeaL run | `memory_loop` | [IdeaL loop](/mage/concepts/ideal-loop/) |
| Code steps written by the author | `code_profile` | [Tool forges](/mage/concepts/tool-forge/) |
| API tool forge | `forge_enabled` | [Tool forges](/mage/concepts/tool-forge/) |
| Gap-driven code-tool forge | `code_forge` | [Tool forges](/mage/concepts/tool-forge/) |

Code steps need a CARL build with the `code` step and a sandbox (Docker for
measurements). The CARL that MAGE's development line pins does not have it.

## Running it

Only through the MAGEBench runner, from a checkout of the branch. `preflight`
is free: it validates the suite and the run config and prints the call and
cost ceilings without calling any provider.

```bash
python -m evaluation.magebench_runner preflight \
  --suite evaluation/suites/magebench_families_v1_dev.json \
  --config evaluation/families/configs/fam-pilot-glm-o1.json --no-persist

# paid: real provider calls, refused without --allow-external
python -m evaluation.magebench_runner run \
  --suite ... --config ... --allow-external
```

An arm is `{"kind": "plan_author_v3", ...}` in the run config, with fields
such as `author_max_repairs`, `author_dry_run_rounds`,
`author_dry_run_fixtures`, `author_dry_run_judge`. The input is a benchmark
task contract (`runtime_input_schema`, `capability_fixture`, an output
contract), not a free-text task.

The `preflight` command above was run on `feat/v3-ideal-loop` (acf7091).
The unit tests of v3, the memory loop and both forges pass offline on that
commit.

## What was measured

Internal measurements on the MAGEBench suites, October 2026, two models:

- v3.4 was the best version on the development suite.
- On 42 held-out tasks that no version had been tuned on, v3.4 was not worse
  than the previous version (v2.2), and the difference was within noise.
- Skeleton examples from memory, author-written code steps and the API tool
  forge gave no gain in their first measurement.

The memory loop, the IdeaL loop and the code-tool forge have not been
measured. They have only been smoke-tested end to end on a few development
tasks.

## Why it is not in the package yet

v3 takes a benchmark contract rather than a `GenerationRequest`, depends on
the evaluation harness for its dry run and tool simulation, and its add-ons
need an unreleased CARL. Bringing it behind `MAGEGenerator` is open work.

## See also

- [Generation pipeline](/mage/concepts/pipeline/): the path you can use today.
- [Changelog](/mage/reference/changelog/)
