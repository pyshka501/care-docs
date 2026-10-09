---
title: Maestro Integration
description: How Maestro runs CARL chains — admission, runtime_input and $outer_context, preflight, fail-fast, pause and cancel, metadata and run records.
sidebar:
  order: 1
---

[Maestro](/care/getting-started/overview/) uses CARL as its chain execution
engine. This page describes the contract between the two: what Maestro puts on
a chain and a context, which CARL APIs it calls, and which CARL behaviour it
relies on. Any other host can use the same pieces.

| Piece | What it's for |
| --- | --- |
| [Preflight](/carl/care-integration/preflight/) | Ask what a chain needs (tools, MCP servers, skills, code profiles, external agents) and what is missing in a context. |
| [RunRecord](/carl/care-integration/run-record/) | A durable record of one execution: chain snapshot, input, result, timing. |
| [Chain metadata](/carl/care-integration/metadata/) | The `metadata["care"]` block on a chain: task, files, tags, and Maestro's input contract. |

## How Maestro runs a chain

The desktop app runs a saved chain through one execution boundary
(`care/harness_execution.py` in the Maestro repository). In order:

1. **Strict parse.** The chain JSON is loaded with
   `ReasoningChain.from_dict(data, use_typed_steps=True)`. CARL's warnings
   about unresolvable `$history[...]` references are promoted to errors.
   A chain with `"fail_fast": true` is refused if the installed CARL would
   drop the field.
2. **Input contract.** The chain carries a JSON Schema in
   `metadata["care"]["runtime_input_schema"]`. Maestro validates the user's
   input against it before any provider call.
3. **Context.** Maestro builds the `ReasoningContext` with
   - `runtime_input` = the validated input object, and
   - `outer_context` = the task text plus the same input as JSON, wrapped in
     an `<untrusted_runtime_input>` envelope with `<` and `>` escaped.
   LLM steps read `outer_context`; tool, map, structured-output and other
   references read `$outer_context.<field>` from `runtime_input`.
4. **Preflight.** `chain.preflight(context)` runs against the populated
   context. Any missing tool, MCP server or skill refuses the run
   (`chain_admission_failed`).
5. **Execute.** `chain.execute_async(context)` runs as a task that can be
   cancelled. The result is projected into a receipt with digests of the chain
   and the input and a bounded, redacted per-step preview.

```python
# What step 3 amounts to, without Maestro's envelope helper:
context = ReasoningContext(
    outer_context=task_text_with_input_envelope,
    runtime_input={"city": "Paris", "nights": 3},
    api=client,
)
# step config in the chain:
ToolStepConfig(tool_name="find_hotels", input_mapping={"city": "$outer_context.city"})
```

`runtime_input` is copied into every per-step context, so
`$outer_context.<field>` resolves inside `chain.execute()`. A required tool
parameter that resolves to `None` fails the step before the tool is called
with `CARL_TOOL_INPUT_UNRESOLVED`. See
[dynamic references](/carl/chains/dynamic-references/).

## Run controls Maestro uses

| Maestro action | CARL call | Notes |
| --- | --- | --- |
| Pause | `context.request_pause()` | Running steps finish; no queued step starts. |
| Status "pause requested" vs "paused" | `context.is_pause_requested()`, `context.is_paused()` | Maestro shows "paused" only when `is_paused()` is `True`: the scheduler is waiting and no step is active. |
| Resume | `context.clear_pause()` | Completed steps are not run again. No new admission. |
| Stop | `context.cancel()` and cancelling the task | Wakes a paused run; unstarted steps are reported as skipped. |
| Fail-fast | `ReasoningChain(fail_fast=True)` (from chain JSON) | After the first final failure no new step starts; `result.metadata["fail_fast"]` describes the stop. |

The chain `timeout` counts active time only; idle pause time is excluded.
Pause is process-local in Maestro: it does not survive an app restart. Details:
[run controls](/carl/chains/run-controls/) and, from the app side,
[Runs](/care/app/runs/).

## Checking the installed CARL

A host can detect the contracts before relying on them:

```python
import mmar_carl
assert getattr(mmar_carl, "HOST_RUNTIME_INPUT_ABI", 0) >= 1
```

`STRUCTURED_OUTPUT_SCOPED_INPUTS_ABI` and `HUMAN_INPUT_SCOPED_PROMPT_ABI` cover
the scoped input mappings of structured-output and human-input steps.

## Known limits

- Maestro's own preflight wrapper does not look at
  `missing_code_profiles`, `missing_claude_code_clis` or
  `missing_codex_runtimes`; those surface when the step runs.
- `ReasoningChain.set_care_metadata(...)` replaces the whole `care` block,
  including Maestro's `runtime_input_schema`. See
  [chain metadata](/carl/care-integration/metadata/).
