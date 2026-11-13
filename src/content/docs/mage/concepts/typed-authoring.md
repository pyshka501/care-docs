---
title: Typed Requests and Admission
description: GenerationRequest, its data, capability and persistence policies, typed tool bindings, exact output contracts, closed-world tool catalogues, and the admission a chain must pass.
sidebar:
  order: 2
---

**Development line.** Everything on this page is in the 0.2.0 line that
Maestro pins (it first appeared in the untagged 0.1.4 freeze). None of it is
in the released 0.1.3, where `generate()` takes only a string.

A plain string task mixes three different things: what the chain should do,
private data that helps planning, and what the result must look like. A
`GenerationRequest` keeps them apart, so the host can decide what the model
sees, what may leave the machine and what may be saved.

## The request

| Field | Meaning |
| --- | --- |
| `current_task` | The task. The only text allowed into web or Memory research and into a saved chain's `task_description`. Must not contain file bodies. |
| `current_turn_constraints` | Constraints with the same priority as the task ("Return JSON"). |
| `project_instructions`, `personal_preferences` | Lower-priority text, for planning only. |
| `retrieved_untrusted_context` | `RetrievedUntrustedContext(context_id, source, content, media_type, private=True)`: file bodies, recalled chains, IdeaL hints. Rendered as labelled data, never as instructions. |
| `input_manifest` | `GenerationInputManifestEntry` per attached input: `input_id`, `name`, `kind`, `media_type`, `size_bytes`, `sha256`, `profile`, `available`, `error`. |
| `runtime_input_schema` | JSON schema of the object the chain receives as `$outer_context` at run time. |
| `output_contract` | `GenerationOutputContract(schema_name, json_schema, ...)`: the exact final answer. |
| `execution_budget` | `ChainExecutionBudget`: limits on the chain being built (steps, parallelism, calls, time, cost). Not the generation budget. |
| `data_egress_policy`, `capability_access_policy`, `persistence_policy` | See below. |

A request cannot be mixed with the legacy `context_files`, `user_context` or
`safe_task` arguments of `generate()`; that raises `ValueError`.

## Policies

**`DataEgressPolicy`**

- `external_research`: `"safe_task_only"` (default) or `"deny"`. Web research
  sees only `current_task`; with `deny` it is skipped.
- `generation_model_context`: what the generation model may see.
  `"safe_contract_only"` (default), `"allow_private_planning_context"`, or
  `"allow_selected_retrieved_context"`: only the retrieved items listed in
  `generation_retrieved_context_ids` (1 to 8 ids) are shown, and attachments
  appear under opaque labels. Maestro uses the last mode to pass IdeaL hints.

:::caution[Known limitation]
The `legacy` strategy does not fully enforce
`generation_model_context`: in `safe_contract_only` its planning prompt still
includes project instructions, preferences and retrieved context bodies. Only
the selected mode filters it. The semantic strategy honours all three modes.
:::

**`CapabilityAccessPolicy`**: `discovery` (`approved_only`, `deny`,
`network_candidates`), `sandbox_probe`, `artifact_install` (deny by default),
`credential_access` (`names_only` by default: MAGE handles credential names,
never values), `side_effect_execution` (deny by default: MAGE never infers
write permission from the task text), `execution_grants`.

**`PersistencePolicy`**: `mode="deny"`, `"explicit_only"` (default: MAGE
saves nothing, the host saves) or `"safe_projection_only"`.

## Typed tool bindings

Tool arguments in authored chains are explicit bindings, not free strings:

```json
{"kind": "literal", "value": "customer-sales"}
{"kind": "input_field", "path": "request.city"}
{"kind": "context_ref", "path": "$outer_context"}
{"kind": "step_output", "step_number": 2}
```

- `literal`: a constant, never treated as a lookup key.
- `input_field`: a dotted path relative to `$outer_context`, compiled to
  `$outer_context.request.city`.
- `context_ref`: a whole runtime reference: `$outer_context`, or a
  `$memory`, `$ltm`, `$metadata`, `$steps` or `$event` path.
- `step_output`: the raw text result of a declared dependency (or
  `"previous"`).

Transient tool failures retry on the same step:
`ToolRetryPolicy(max_attempts=2, retry_on=("timeout",))`, compiled to CARL
`error_recovery`.

## Exact output contracts

With an `output_contract`, the chain must have exactly one terminal step, a
`structured_output` step whose schema name, field names and types equal the
contract. This is checked in lint and again at admission. The lint message
names the expected schema, so the one repair round knows what to write.

## Closed-world tool catalogues

Pass `capabilities=CapabilityContext(...)` to `generate()` and MAGE skips its
own capability lookup. The catalogue becomes an immutable
`ResolvedCapabilities` snapshot, and a tool step that names anything outside
it fails lint and admission. An empty context means "no tools". Agent skills
are kept only when they are runtime-bound (`trust_state=RUNTIME_BOUND` with a
matching binding); discovered but unverified entries are dropped.

## Admission

A chain is returned only after `validate_runtime_chain()` accepts it:

1. strict schema of the final CARL-compatible chain;
2. lint (tool grounding, bindings, references, transforms, output contract);
3. typed load by the installed `mmar_carl` (`ReasoningChain.from_json`);
4. unresolved `$history` warnings promoted to errors.

The edit path (`MAGEGenerator.edit`) applies changes to a deep copy and runs
the same admission; on failure the original chain is untouched.

Maestro calls `validate_runtime_chain()` again on every chain it receives,
with the chain's input schema, before staging it. See
[Maestro as host](/mage/integration/maestro-host/) and
[CARL preflight](/carl/care-integration/preflight/).

## See also

- [Generation pipeline](/mage/concepts/pipeline/)
- [Python API](/mage/integration/python-api/)
