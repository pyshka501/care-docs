---
title: Capability Status
description: One table with every MAGE capability, whether it is released, on the development line only or experimental, where it lives in the code, and whether it has been measured.
sidebar:
  order: 2
---

**Released**: in `mmar-mage` 0.1.3 on PyPI. **Development line**: package
version 0.2.0, on branches, not on PyPI; Maestro pins older revisions, and
the 0.2.0 candidate (`prep/mage-0.2.0`, draft PR `Glazkoff/carl-mage#21`) is
prepared for publication. **Experimental**: research extensions of v3 in
`evaluation/` and modules used only from there, not called by
`MAGEGenerator`, not used by Maestro.

## Library (`MAGEGenerator`)

| Capability | Status | Code | Notes |
| --- | --- | --- | --- |
| Fast mode | Released | `generator.py` `_generate_fast` | One model call. |
| Deep mode, four stages | Released | `generator.py` `_generate_deep`, `agents/` | Default mode. |
| Optional deep stages (research, ToT, MCTS, critique, verification, self-refine, and others) | Released, off by default | `agents/` | No internal measurement has shown a gain. |
| Tool grounding, `$history` reindexing, splice lint | Released (0.1.3) | `chain_repair.py`, `carl_export.py` | |
| Natural-language edit | Released; transactional on the development line | `chain_edit.py`, `agents/chain_editor.py` | |
| `mage evolve` | Released | `evolve/` | Maestro uses the evolution platform instead. |
| Memory recall and save | Released; stricter save rules on the development line | `memory.py`, `agents/memory_research_agent.py` | Needs the `memory` extra and a Memory service. |
| Runtime admission (`validate_runtime_chain`) | Development line | `chain_repair.py` | Maestro runs it again on every chain. |
| `GenerationRequest` and policies | Development line | `schemas.py` | |
| Typed tool bindings, tool retry policy | Development line | `schemas.py`, `carl_export.py` | |
| Exact output contracts | Development line | `chain_repair.py` | |
| Closed-world capability injection | Development line | `agents/capability_lookup_agent.py` | |
| Contract compiler (one-tool chains, no model call) | Development line | `generator.py` `_compile_contract_chain` | |
| Host-selected IdeaL hints | Development line | `schemas.py` `DataEgressPolicy` | Used by Maestro. |
| Semantic strategy, `compile()` | Development line, opt-in | `semantic_ir.py`, `semantic_compiler.py`, `readiness.py`, `outcomes.py` | Maestro uses `legacy`. |
| Hard generation budgets | Development line | `llm.py`, `schemas.py` | |
| `compose_chains` | Development line | `compose.py` | |
| Web research providers, keyless DuckDuckGo | Development line | `agents/web_research_agent.py` | Off by default. |
| `$steps.N.result_data.<field>` export fix | Development line, branch `maestro/step-field-refs` only | `carl_export.py`, `chain_repair.py` | Pinned by Maestro's development branch. |
| v3 strategy, `generation_strategy="v3"` (plan, author, compile, admit, dry run) | Development line, in the 0.2.0 candidate; opt-in | `mmar_mage/authoring/` | Measured internally on MAGEBench, October 2026, as the benchmark arm. Live smoke of the shipped strategy on a Codex model only (3/3 host tasks; 3/7 lite tasks scored), not re-measured. Maestro does not use it. See [v3 generator](/mage/concepts/v3-generator/). |

## v3 research extensions (evaluation harness)

| Capability | Status | Code | Measured |
| --- | --- | --- | --- |
| Generation memory (examples, ideas) | Experimental | `mmar_mage/generation_memory.py` | Once; no gain on a set without repeats. |
| Reuse ladder | Experimental | `mmar_mage/ideal_loop.py` | No. Offline tests only. |
| Generation as an IdeaL run | Experimental | `mmar_mage/ideal_loop.py` | No. Offline tests against a fake server. |
| Author-written `code` steps | Experimental | `evaluation/codestep_support.py` | Once; no gain. Needs a sandbox profile and runtime that the package does not ship. |
| API tool forge | Experimental | `mmar_mage/forge/` | Once; did not work end to end. |
| Code-tool forge | Experimental | `mmar_mage/code_forge.py` | No. Smoke runs only. |

They plug into the v3 pipeline only through `V3Hooks`, from the MAGEBench
arms in `evaluation/`. Branches: v3 generator on `feat/v3-phase0`; memory,
forges and code steps on `feat/v3-memory`, `feat/v3-forge`,
`feat/v3-codestep`; all of them plus the loop and the code-tool forge on
`feat/v3-ideal-loop` (acf7091), which is merged into `prep/mage-0.2.0`.

## Not features

These names appear in the code or older documents but are not working
capabilities you can rely on:

- Discovery of tools from the Internet inside `MAGEGenerator`: the
  capability discovery pipeline exists, but only runtime-bound capabilities
  reach the planner, and the end-to-end "find an API, make it a tool" path
  lives only in the experimental forge.
- `enable_tool_synthesis`: off by default, not measured.

## See also

- [Changelog](/mage/reference/changelog/)
- [Maestro as host](/mage/integration/maestro-host/)
