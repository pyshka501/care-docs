---
title: What is MAGE?
description: MAGE turns a plain-language task into a CARL chain. What it does, where it sits next to Maestro and CARL, which versions exist and what is released.
sidebar:
  order: 1
---

**MAGE** (Mesh Architecture Generation Engine, package `mmar-mage`) generates a
[CARL](/carl/getting-started/overview/) chain from a plain-language task. You
give it a task, and optionally an input schema, an exact output contract, a tool
catalogue and attached files. It returns chain JSON that the installed CARL
runtime has already loaded and checked.

MAGE does not run chains. CARL runs them. The usual host is Maestro (package
`care`): it collects the task, calls MAGE, checks the chain again, shows it to
you and runs it with CARL.

```mermaid
flowchart LR
    Task([Task in plain language]) --> Host["Maestro (package care)<br/>or your code"]
    Host -->|task, contracts,<br/>tools, recalled context| MAGE["MAGE<br/>mmar-mage"]
    MAGE -->|admitted CARL chain JSON| Host
    Host -->|chain + input| CARL["CARL runtime<br/>mmar-carl"]
    CARL -->|result| Host
    Host <-.->|save, recall| Memory[("GigaEvo Memory<br/>IdeaL")]
```

## What it gives you

- **v3 strategy** (0.2.0 candidate, the default there). Plans the data
  flow, lets the model write CARL, repairs it against admission and dry-runs
  it in CARL with simulated tools. See
  [v3 generator](/mage/concepts/v3-generator/).
- **Legacy strategy with two modes** (the default in 0.1.3 and in the
  revisions Maestro pins; in 0.2.0 `generation_strategy="legacy"`). `fast`:
  one model call writes the chain. `deep` (the default mode): four model
  stages (domain analysis, step plan, DAG, step descriptions), plus optional
  research and quality stages.
- **Admission before return.** Every chain passes deterministic lint and a
  typed load by the installed CARL runtime. One repair attempt is allowed;
  a chain that still fails is rejected, not returned.
- **Typed requests** (development line). A `GenerationRequest` separates the
  safe task from private context, carries an input schema and an exact output
  contract, and states what may leave the machine and what may be saved.
- **Natural-language edits** of an existing chain, applied to a copy and
  admitted the same way.
- **Optional memory**: recall of related saved chains from GigaEvo Memory and
  saving the result.
- **CLI**: `mage generate`, `mage edit`, `mage validate`, `mage evolve`,
  `mage version`.

## Versions and status

Three lines exist. The pages in this section label every capability with one
of them.

| Label | What it means | Where |
| --- | --- | --- |
| **Released** | In `mmar-mage` 0.1.3 on PyPI (June 2026). | Public repository `AIRI-MAESTRO/mage`, tag `v0.1.3`. |
| **Development line** | Package version `0.2.0`, not on PyPI. The release candidate (branch `prep/mage-0.2.0`, draft PR `Glazkoff/carl-mage#21`) is prepared for publication; Maestro pins older git revisions of this line. | Branches of the development repository `Glazkoff/carl-mage`. |
| **Experimental** | Research extensions of the v3 generator: generation memory, the IdeaL loop, the tool forges, author-written `code` steps. They plug into v3 only from `evaluation/` and are not part of the package API. | Development branches, merged into `prep/mage-0.2.0` but not called by `MAGEGenerator`. |

What Maestro actually runs is described in
[Maestro as host](/mage/integration/maestro-host/). The full list is in
[Capability status](/mage/reference/status/) and the
[changelog](/mage/reference/changelog/).

:::caution[v3 is the default in 0.2.0, which is not released]
The plan, author, compile and dry-run generator called "v3" is the default
strategy of the 0.2.0 candidate: `MAGEConfig()` and `mage generate` run it,
and `generation_strategy="legacy"` brings back the fast/deep pipeline. 0.2.0
is not on PyPI yet. The shipped strategy has passed offline tests and a live
smoke run on one Codex model, not a measurement. Maestro pins an older MAGE
and does not use it. Its research extensions (IdeaL loop, code-tool forge and
others) remain experimental. See [v3 generator](/mage/concepts/v3-generator/).
:::

## What MAGE emits

With the `legacy` strategy, `MAGEGenerator` writes 16 CARL step types: `llm`, `structured_output`, `tool`,
`mcp`, `mcp_resource`, `memory`, `transform`, `conditional`, `agent_skill`,
`evaluation`, `human_input`, `tool_discovery`, `agent_handoff`,
`parallel_sampling`, `supervisor`, `debate`. It does not write `code`,
`agent`, `map`, `command` or `wait` steps. The internal labels `eval` and
`aggregator` are lowered to `llm` before export. See
[the CARL step list](/carl/steps/overview/).

## Where to go next

- [Quick start](/mage/getting-started/quick-start/): install and generate a
  first chain.
- [Generation pipeline](/mage/concepts/pipeline/): what happens inside the
  legacy `fast` and `deep` modes.
- [v3 generator](/mage/concepts/v3-generator/): the 0.2.0 default.
- [Typed requests and admission](/mage/concepts/typed-authoring/).
- [Python API](/mage/integration/python-api/) and
  [Configuration](/mage/integration/configuration/).
