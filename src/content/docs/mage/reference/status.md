---
title: Capability Status
description: One table with every MAGE capability, whether it is released, on the development line only or experimental, where it lives in the code, and whether it has been measured.
sidebar:
  order: 2
---

**Released**: in `mmar-mage` 0.1.3 on PyPI. **Development line**: package
version 0.2.0, on branches, pinned by Maestro, not on PyPI. **Experimental**:
research code on `feat/v3-*` branches, not callable through `MAGEGenerator`,
not used by Maestro.

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

## v3 (evaluation harness)

| Capability | Status | Code | Measured |
| --- | --- | --- | --- |
| v3 generator (plan, author, compile, admit, dry run) | Experimental | `evaluation/plan_author_v3.py` | Yes, internal MAGEBench, October 2026. |
| Generation memory (examples, ideas) | Experimental | `mmar_mage/generation_memory.py` | Once; no gain on a set without repeats. |
| Reuse ladder | Experimental | `mmar_mage/ideal_loop.py` | No. Offline tests only. |
| Generation as an IdeaL run | Experimental | `mmar_mage/ideal_loop.py` | No. Offline tests against a fake server. |
| Author-written `code` steps | Experimental | `evaluation/codestep_support.py` | Once; no gain. Needs a CARL build with the code step. |
| API tool forge | Experimental | `mmar_mage/forge/` | Once; did not work end to end. |
| Code-tool forge | Experimental | `mmar_mage/code_forge.py` | No. Smoke runs only. |

Branches: v3 generator on `feat/v3-phase0`; memory, forges and code steps on
`feat/v3-memory`, `feat/v3-forge`, `feat/v3-codestep`; all of them plus the
loop and the code-tool forge on `feat/v3-ideal-loop` (acf7091).

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
