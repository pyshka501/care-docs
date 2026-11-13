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

## Which CARL Maestro runs

The Maestro app does **not** run CARL 0.5.x yet. As of this writing it pins
`mmar-carl 0.3.0+maestro.contracts.3`, built from Git commit
`f0afe4620d72dbf13e59b372ec3e550195a19d61` of the `Glazkoff/carl` development
fork, dated 2026-10-05, about a month before the 0.5.0 release on 2026-11-09. That build is CARL 0.3.0 plus a backport of the host contracts
Maestro needs: `fail_fast`, acknowledged pause and resume, `runtime_input`,
scoped structured-output and human-input inputs, and the
`CARL_TOOL_INPUT_UNRESOLVED` check. Its `FORMAT_VERSION` is `1` and it knows 16
step types.

So Maestro does not use these parts of CARL yet:

- the step types added in 0.4.0 and later: `agent`, `code`, `wait`, `map`,
  `command_plan`, `command`, `shell_session`, `claude_code`, `codex`,
  `selection`, `planner`, `decision`, `terminate`;
- embedded [chain tools](/carl/steps/chain-tools/), [Git tool
  sources](/carl/steps/tool-discovery/#tools-from-a-pinned-git-commit),
  enforced skill pinning, eager tool scheduling, and the EvoC primitives;
- the 0.5.0 behaviour changes: tool failures that fail the step, decoded JSON
  tool results, `allow_local_agent_execution`, the shared chain deadline;
- chain formats above 1. Maestro's build rejects any chain saved by 0.5.x
  (format 13–15) with `ChainFormatNewerError`. The other direction works: 0.5.2
  migrates Maestro's format-1 chains and keeps their `fail_fast`.

Moving Maestro to a 0.5.x release has not happened yet. Until it does, the
rest of this page describes the contract as Maestro uses it with its pinned
build; the CARL APIs named here exist in 0.5.2 as well.

| Piece | What it's for |
| --- | --- |
| [Preflight](/carl/care-integration/preflight/) | Ask what a chain needs (tools, MCP servers, skills, code profiles, external agents) and what is missing in a context. |
| [RunRecord](/carl/care-integration/run-record/) | A durable record of one execution: chain snapshot, input, result, timing. |
| [Chain metadata](/carl/care-integration/metadata/) | The `metadata["care"]` block on a chain: task, files, tags, and Maestro's input contract. |

## How Maestro runs a chain

The desktop app runs a saved chain through one execution boundary
(`care/harness_execution.py` in the Maestro repository). In order:

1. **Strict parse.** A chain without an explicit `fail_fast` and without a
   RE-PLAN policy gets `fail_fast: true` for the run. The chain JSON is then
   loaded with `ReasoningChain.from_dict(data, use_typed_steps=True)`. CARL's
   warnings about unresolvable `$history[...]` references are promoted to
   errors.
2. **Input contract.** The chain carries a JSON Schema in
   `metadata["care"]["runtime_input_schema"]`, bound to the chain's content
   digest. Maestro validates the user's input against it before any provider
   call.
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

- Maestro's preflight wrapper checks `missing_tools`, `missing_mcp_servers` and
  `missing_skills` only. Its pinned CARL has no code-profile, Claude Code,
  Codex or decision-credential lists.
- In 0.5.2, `ReasoningChain.set_care_metadata(...)` keeps keys it does not
  model, such as `runtime_input_schema`, but resets the modelled fields you do
  not pass. See [chain metadata](/carl/care-integration/metadata/).
