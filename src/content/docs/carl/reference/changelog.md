---
title: Changelog
description: Release notes for mmar-carl, newest first.
sidebar:
  order: 2
---

Release notes per version. The repository keeps the long form in
[`RELEASE.md`](https://github.com/Glazkoff/carl/blob/main/RELEASE.md).

## 0.5.0

CARL 0.5.0 is the version released together with Maestro 0.5.0. It combines
three lines of work: the 0.4.0 runtime release, the pull requests listed below,
and the host contracts that Maestro needs to run chains.

### Step types

- `ClaudeCodeStepDescription` (`claude_code`) delegates a step to a headless
  Claude Code CLI agent; `check_claude_code_cli()` reports whether the CLI is
  installed (#24). See [Claude Code step](/carl/steps/claude-code/).
- `CodexStepDescription` (`codex`) delegates a step to a local Codex SDK agent;
  `check_codex_runtime()` reports whether the runtime is available (#25).
  See [Codex step](/carl/steps/codex/).
- Chain format 10 records these two step types. `PreflightReport` gains
  `required_claude_code_clis` / `missing_claude_code_clis` and
  `required_codex_runtimes` / `missing_codex_runtimes`.
- The step types that landed in 0.4.0 are part of this release as well: `wait`
  (#19), the typed `human_input` lifecycle (#20), embedded chain tools (#21),
  bounded `map` (#22), strict `code` (#23). See [0.4.0](#040) below.

### Multi-agent steps

- **Sub-agent topology is serialized** (#27). `to_dict()` now writes
  `AgentHandoffStepDescription.sub_chain`, `SupervisorStepDescription.agents`
  and `ParallelSamplingStepDescription.base_step` as nested chain snapshots,
  and loading rebuilds the real objects instead of `__placeholder__` stubs.
  Nesting is limited to 8 levels; a chain that embeds itself is rejected with
  `ValueError`. Chain format 11. Chains written at format 10 or earlier still
  load with the old placeholders.
- **Aggregation is correct and visible** (#28). `ParallelSamplingStepConfig`
  gains `answer_extractor`, `vote_normalization` (`VoteNormalization`) and
  `strict`; every outcome is labelled in `result_data["aggregation_outcome"]`
  and fallbacks emit a warning. Supervisor routing no longer matches agent
  names as bare substrings unless `allow_substring_match=True` (the one
  intentional default change). Debate gains `judge_llm_config`,
  `stop_when_unchanged`, `convergence_predicate` and reports
  `rounds_executed`.

### Evolution

- **Collaboration-topology mutations** (#30): six new `MutationKind` values
  (`wrap_in_sampling`, `wrap_in_debate`, `wrap_in_handoff`,
  `split_to_supervisor`, `insert_human_gate`, `unwrap_collaboration`), each
  enabled only by its own pool or flag on `ChainMutator`.
- **DAG-aware subgraph crossover** (#31): `ChainCrossover` and
  `ChainEvolver(crossover_rate=...)`. The default `0.0` keeps seeded runs
  identical to before. Children are tagged with `CROSSOVER_KIND`.
- See [Evolution](/carl/evolution/overview/).

### Tracing

- `ExecutionTrace` became a per-agent attribution record (#29). `TraceEvent`
  now carries `inputs` (resolved `input_mapping` values), `model`, opt-in
  `prompt` (`ReasoningContext(trace_prompts=True)`), measured `started_at` /
  `ended_at`, and a nested `sub_trace` for handoff and supervisor steps.
  `ExecutionTrace.from_dict` / `TraceEvent.from_dict` round-trip all of it.
  See [Tracing](/carl/tracing/overview/).

### Memory

- Parallel memory merge fixes (#32). The copy-on-write store now tracks the
  keys a step wrote or deleted, not whole namespaces. A read-only sibling can
  no longer revert a write, nested values are no longer shared between
  siblings, and merged writes are checked against `memory_schema`. Same-key
  conflicts resolve last-write-wins in step declaration order. See
  [Copy-on-write](/carl/memory/cow/).

### LLM clients

- The executor no longer closes an LLM client it does not own (#33). Per-step
  context copies now call `ReasoningContext.close_derived_clients()`, which
  closes only clients the context built for per-step `llm_config` overrides.
  Before the fix, chains that shared one `OpenAICompatibleClient` (a dataset
  evaluation, for example) lost in-flight requests with `APIConnectionError`.

### Host contracts used by Maestro

- **`fail_fast`** on `ReasoningChain`, `ChainBuilder.with_fail_fast()` and
  `DAGExecutor`. After the first step that fails for good, no new step starts
  and the rest are reported as skipped; `result.metadata["fail_fast"]`
  summarises the stop. Saved by `to_dict()`.
- **Acknowledged pause.** `is_paused()` is `True` only when the scheduler is
  waiting and no step is active; `paused_duration()` reports idle time;
  resuming does not replay completed steps; `cancel()` wakes a paused run; the
  chain `timeout` counts active time only.
- **Host input.** `ReasoningContext.runtime_input` holds validated structured
  input apart from the prompt text. `$outer_context` resolves to it and
  `$outer_context.<field>` reads a field. `runtime_input` is now copied into
  the per-step context snapshots, so these references work inside
  `chain.execute()`. ABI flag `HOST_RUNTIME_INPUT_ABI = 1`.
- **Input contracts.** A required tool parameter that resolves to `None` fails
  the step before the tool is called, with
  `CARL_TOOL_INPUT_UNRESOLVED: required parameter '<name>' resolved to null`.
  `StructuredOutputStepConfig.input_mapping` and
  `HumanInputStepConfig.prompt_input_mapping` scope what the model or the
  human sees (ABI flags `STRUCTURED_OUTPUT_SCOPED_INPUTS_ABI`,
  `HUMAN_INPUT_SCOPED_PROMPT_ABI`).
- **Versioned chain tools.** `ChainToolDefinition.required_tool_revisions`
  pins a host tool to a revision; the runtime compares it with the callable's
  `__carl_tool_revision__` and reports the child as unavailable on mismatch.

See [Run controls](/carl/chains/run-controls/),
[Dynamic references](/carl/chains/dynamic-references/) and
[Maestro integration](/carl/care-integration/overview/).

### Known limitations

- The default `from_json()` / `load()` path rebuilds the legacy-capable step
  types (`llm`, `tool`, `mcp`, `memory`, `transform`, `conditional`,
  `structured_output`, `command`, `shell_session`) as legacy `StepDescription` objects. Use
  `from_dict_typed()` for typed objects. See
  [JSON serialization](/carl/serialization/json/).
- `max_injections`, `memory_schema`, `step_groups`, metrics and the prompt
  template are not serialized.
- `VectorSearchStrategy` ignores `embedding_model`; the embedder is always
  `sentence-transformers/all-MiniLM-L6-v2`.
- `StepDescription.to_typed_step()` drops `retry_max` and `timeout`.

## 0.4.0

The runtime-execution release (2026-08-27). Rule of the release: a serialized
chain is input, never authority. Permissions come from the host at run time.

- **Seven step types**: `agent` (bounded tool loop with an explicit
  `finish`), `code` (one exact generated Python `run(inputs)` in a sandbox
  profile, #23), `wait` (timer / event / any-of, #19), `map` (bounded ordered
  fan-out over a JSON array, #22), `command_plan`, `command` (argv through a
  skill runtime; renamed from `bash`) and `shell_session`.
- **Host authority**: `CommandPolicy`, `CommandCapabilityRegistry`,
  `NetworkEnforcer`, `CodeExecutionPolicy` live on `ReasoningContext` and are
  never written to chain JSON.
- **Chain as a tool** (#21): `ChainToolDefinition` embeds a chain snapshot as
  an isolated, bounded tool; results come back as `ChainToolOutcome`.
- **HumanInputStep lifecycle** (#20, breaking): `fallback_value` is removed;
  the host provider is `async (HumanInputRequest) -> HumanInputResponse`;
  `as_human_input_outcome()` returns a typed status.
- **Structured output is validated** against its JSON Schema; invalid schemas
  and remote `$ref`s fail before the provider call. `jsonschema` is a core
  dependency.
- **LLM telemetry**: `get_response_with_tools_and_usage()`; cassettes record
  usage; malformed tool-call arguments are kept as the raw string.
- **Serialization**: chain format 1 → 9 with a migration ladder
  (`ReasoningChain.migrate`). `loop_back_to`, `loop_config` and
  `triggered_by` round-trip.
- **Portable artifacts** (`ArtifactInput` / `ArtifactOutput` /
  `ArtifactRecord`) and skill-runtime enforcement reports.

## 0.3.0

2026-06-02. Multi-agent steps ([handoff](/carl/orchestration/handoff/),
[supervisor](/carl/orchestration/supervisor/),
[debate](/carl/orchestration/debate/),
[parallel sampling](/carl/orchestration/parallel-sampling/),
[human input](/carl/orchestration/human-in-the-loop/)); sandboxed
[AgentSkill](/carl/skills/overview/) runtimes; `ExecutionTrace`, Gantt and
HTML playback; `ChainBuilder.from_description` and `ChainEvolver`;
`AnthropicClient`; [record/replay](/carl/llm/record-replay/); cost
estimation; dataset evaluation; [MCP](/carl/mcp/overview/) out of
experimental; pause/resume and cancellation; preflight, `RunRecord` and chain
metadata for Maestro.

## 0.2.0

2026-04-15. LLM client refactoring (removed `mmar-llm-mapi`), an examples
runner, fixes for conditional steps, serialization and input mapping.

## 0.1.0

Typed step classes, structured logging, chain timeout, per-step retry,
OpenAI-compatible API, per-step LLM config, FAST / SELF_CRITIC modes,
chain-level RE-PLAN, evaluation metrics.

## See also

- [Migration: legacy → typed steps](/carl/serialization/migration/)
- [API reference](/carl/reference/api/)
