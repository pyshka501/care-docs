---
title: Python API
description: MAGEGenerator and its generate, compile and edit methods, the v3 strategy (the 0.2.0 default) and build_v3_contract, progress callbacks, cancellation, MAGEResult, the exceptions, and the admission helpers a host imports directly.
sidebar:
  order: 1
---

Signatures are from the development line (0.2.0). Items marked **0.2** are
not in the released 0.1.3.

## Entry points

```python
from mmar_mage import MAGEConfig, MAGEGenerator

generator = MAGEGenerator(
    config,                              # MAGEConfig | None (None = MAGEConfig(): v3 on 0.2.0, gpt-4o)
    progress,                            # MAGEProgressCallback | None
    capability_discovery_sources=None,   # 0.2: approved discovery sources
    capability_runtime_probe=None,       # 0.2: side-effect-free probe
)

result = await generator.generate(
    query,                    # str, or GenerationRequest (0.2)
    context_files=None,       # legacy string form only
    user_context="",          # legacy string form only
    safe_task=None,           # legacy string form only
    cancel=None,              # asyncio.Event
    capabilities=None,        # CapabilityContext: a closed-world tool catalogue (with v3: the whole tool set)
    runtime_features=None,    # 0.2: RuntimeEnvironmentFeatures, used by the semantic and v3 strategies
    return_candidates=False,  # deep mode: one MAGEResult per sampled topology
)

outcome = await generator.compile(query, ...)   # 0.2: ReadyChain | NeedsUserInput | Unsupported
edited = await generator.edit(instruction, chain=None, entity_id=None, save=False)
```

MAGE builds its own OpenAI-compatible client from `MAGEConfig` (`base_url`,
`api_key`, `model`, `provider`). It does not accept a client object; a host
that wants to route calls through its own model points `base_url` at a proxy.

Convenience functions:

```python
from mmar_mage import edit_chain, generate_chain

result = await generate_chain("Classify reviews by sentiment", config)
edited = await edit_chain("Rename to 'Invoice QA'", chain=chain_dict, config=config)
```

`edit` and `edit_chain` take `entity_id` (load from Memory) or `chain` (a
dict). Without either, MAGE searches Memory for the chain the instruction
names and returns `needs_disambiguation` with candidates on a tie. The edit
is planned as a minimal set of operations, applied to a copy, admitted, and
saved as a new version only with `save=True`.

Per-stage wrappers for debugging: `analyze_domain`, `plan_steps`, `build_dag`,
`describe_steps`, `critique_steps`, `verify_chain`, `refine`. They do not save
and do not wrap the output in a `MAGEResult`.

## v3 strategy

**0.2.0 candidate, the default there.** With a plain `MAGEConfig()` (or
`generation_strategy="v3"`), `generate()` runs the
[v3 generator](/mage/concepts/v3-generator/) and still returns a
`MAGEResult`. For the fast/deep pipeline pass
`generation_strategy="legacy"`; `mode`, per-topology `return_candidates` and
the per-stage wrappers above belong to it. Pass the tools as `capabilities` (without them the
chain may use none) and declare `human_input_callback_available` in
`runtime_features` (undeclared means nobody can answer `human_input`).

```python
from mmar_mage import MAGEConfig, MAGEGenerator, build_v3_contract

generator = MAGEGenerator(MAGEConfig(api_key="sk-..."))   # v3, the 0.2.0 default
result = await generator.generate(request, capabilities=caps, runtime_features=features)

contract = build_v3_contract(request, caps, features)   # what the v3 model reads; no model call
```

| Symbol | Purpose |
| --- | --- |
| `build_v3_contract(request, capabilities=None, runtime_features=None, *, resolved=None)` | The JSON contract v3 reads, built from a `GenerationRequest` (or a plain string) under its egress policy: `generation_view`, `current_turn_constraints`, `retrieved_untrusted_context`, `input_manifest`, `runtime_input_schema`, `output_contract`, `capability_fixture`, `environment`. Private schema fields, local paths and secrets in tool entries are left out. `generate()` calls it; a host can call it to inspect what the model would see. |
| `V3Result` | The outcome of the process function `mmar_mage.authoring.generate_v3`: `chain`, `admitted`, `plan`, `attempts`, `dry_runs`, `dry_run_passed`, `trace()`. `generate()` packs it into a `MAGEResult`; the benchmark adapter in `evaluation/` uses it directly. |

The rest of `mmar_mage.authoring` (`generate_v3`, `V3Settings`, `V3Hooks`,
the dry-run helpers) is importable but documented in code only; `V3Hooks` is
how the research extensions in `evaluation/` plug in.

## Progress and cancellation

```python
class Progress:
    def on_stage_start(self, stage: str) -> None: ...
    def on_stage_complete(self, stage: str, result) -> None: ...
    def on_error(self, stage: str, error: Exception) -> None: ...
    # optional, probed with getattr:
    def on_llm_chunk(self, stage: str, delta: str) -> None: ...      # enable_streaming, step_describing only
    def on_retry(self, stage: str, attempt: int, error: Exception) -> None: ...
    def on_cost_estimate(self, estimate) -> None: ...                # enable_preflight_cost_estimate
    def on_chain_preview(self, preview: dict) -> None: ...           # after the DAG, before step descriptions
```

Stage names: `fast_generation` in fast mode; in deep mode `domain_analysis`,
`step_planning`, `dag_building`, `step_describing` plus the optional stages
listed in [Generation pipeline](/mage/concepts/pipeline/); `chain_edit` for
edits; `semantic_*` stages for the semantic strategy; `v3_plan`,
`v3_author`, `v3_dry_run` for the v3 strategy.

Set the `cancel` event to stop. It is checked between stages and before model
calls; the call in flight finishes and its result is discarded. MAGE raises
`MAGECancelledError` with `.stage`.

## Result

`MAGEResult`:

| Field | Content |
| --- | --- |
| `chain_json`, `chain_dict` | The admitted CARL chain. |
| `code` | `ChainBuilder` Python for the chain, when generated. |
| `memory_key`, `memory_keys` | Ids of what was saved, if anything. |
| `mode` | `fast` or `deep`. A v3 result copies `MAGEConfig.mode`, which v3 does not use; the strategy is in `metadata.generation_strategy`. |
| `metadata` | `MAGEMetadata`: domain, step count, time, model, stages completed, memory and web hits used, suggested name, description and tags, token usage per stage, provider attempts. |
| `intermediate_artifacts` | Dumps of the stages that ran: `domain_analysis`, `step_plan`, `dag`, `described_steps` and others. With v3, one `v3` entry: the process trace (plan, compiler actions, attempts, dry runs). |
| `quality_report` | Execution feedback or benchmark mode report, when enabled. |

`to_care_dict()` and `from_care_dict()` serialise a replay bundle;
`replay_from(stage)` regenerates from a deep stage onwards.

## Exceptions

All derive from `MAGEError`.

| Exception | When |
| --- | --- |
| `MAGEValidationError` | The chain failed structure, lint or runtime admission; with v3, no authoring attempt was admitted. `.raw_output` holds the model output. |
| `MAGELLMError` | A provider call failed after retries. |
| `MAGEProviderContractError` | 0.2. Provider output broke the expected wire format. |
| `MAGEBudgetError` | 0.2. A `max_*` budget cannot be honoured. Terminal. |
| `MAGECancelledError` | `cancel` was set. |
| `MAGERequirementsError` | 0.2. Semantic `generate()` got a non-ready outcome (`.outcome`). |
| `MAGEMemoryError` | Low-level Memory failure; `generate()` does not raise it. |

## Admission helpers used by hosts

**0.2.** Maestro imports these directly, so they are part of the host
contract.

| Symbol | Module | Purpose |
| --- | --- | --- |
| `lint_chain(chain, *, known_tools, resolved_capabilities, runtime_input_schema, output_contract)` | `mmar_mage.chain_repair` | Deterministic findings as a list of strings. |
| `validate_runtime_chain(chain, *, ...same keywords)` | `mmar_mage.chain_repair` | Full admission of a final chain; raises `MAGEValidationError`. Expects `$history` already reindexed. |
| `reindex_history_refs(chain)` | `mmar_mage.carl_export` | Rewrites `$history[N]` to runtime positions. |
| `validate_carl_json(chain, *, strict_carl=False)` | `mmar_mage` | Structural check, step numbers, dependency targets, cycles; `strict_carl=True` rejects MAGE-only step types. |
| `to_carl_compat(chain)` | `mmar_mage` | Lowers MAGE authoring fields to CARL `step_config`. |
| `carl_loadable_step_types()` | `mmar_mage.carl_export` | Step types the installed CARL can load. |
| `compose_chains(chains, mode="sequential" or "parallel")` | `mmar_mage` | Deterministic composition of admitted chains. |
| `VALID_STEP_TYPES`, `CARL_VALID_STEP_TYPES` | `mmar_mage.schemas` | Authoring and exported step types. |

```python
from mmar_mage.chain_repair import lint_chain, validate_runtime_chain

findings = lint_chain(chain_dict)          # [] when clean
validate_runtime_chain(chain_dict)         # raises MAGEValidationError on failure
```

These two calls were run offline on a generated chain on `feat/v3-ideal-loop`.

## See also

- [Typed requests and admission](/mage/concepts/typed-authoring/)
- [Configuration](/mage/integration/configuration/)
- [Maestro as host](/mage/integration/maestro-host/)
