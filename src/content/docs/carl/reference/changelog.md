---
title: Changelog
description: Release notes for mmar-carl, newest first.
sidebar:
  order: 2
---

Release notes per version. The repository keeps the long form in
[`RELEASE.md`](https://github.com/AIRI-MAESTRO/carl/blob/v0.5.2/RELEASE.md).
0.5.0, 0.5.1 and 0.5.2 were all published to PyPI as `mmar-carl` on
2026-11-09. Install the latest with `pip install 'mmar-carl==0.5.2'`
(Python 3.12+).

:::note
The Maestro app still runs an older pinned CARL build, not these releases. See
[which CARL Maestro runs](/carl/care-integration/overview/#which-carl-maestro-runs).
:::

## 0.5.2

Adds the [terminate step](/carl/steps/terminate/). Chain format 14 → 15.

- `TerminateStepDescription` (`terminate`) with `TerminateStepConfig`: exactly
  one of `output` (a literal JSON value, `null` included) or `output_source` (a
  `$` reference; a missing reference fails the step), plus a `reason`.
- The current batch settles, siblings waiting for a worker slot included. When
  several terminate steps succeed, the lowest number selects the output. Later
  steps are reported as skipped; the batch schedules no new planner actions,
  loop iterations or RE-PLAN work.
- Earlier failures still count against the verdict. Host cancellation and
  fail-fast win over termination. `result.metadata["terminated"]` and the trace
  record the step number and reason. `ReasoningResult.get_final_output()`
  returns the selected answer even after history trimming.

**Migration from 0.5.1.** Lift saved JSON with
`ReasoningChain.from_dict(ReasoningChain.migrate(raw))`; rung 15 rewrites
nothing. Readers older than 0.5.2 reject format 15. A saved snapshot that
already executed a terminate step cannot resume past it.

## 0.5.1

Adds the [decision step](/carl/steps/decision/). Chain format 13 → 14.

- `DecisionStepDescription` (`decision`) asks a decision model typed
  questions about one text or JSON state: `predicate` (thresholded
  probability), `choice` (one of 2–255 options) and `score` (an ordered
  rubric of 2–10 levels). Per-question `fallback` and `min_confidence`
  handle refusals and low confidence; the step fails closed otherwise.
- Provider adapters for OpenRouter Decisions and the direct OpenAI and Azure
  OpenAI Decisions APIs, with one answer shape in `result_data["answers"]`.
  Usage and cost are recorded when the provider reports them.
- Answers can be written to memory (`output_memory_key`, namespace
  `decision`) for conditional routing. State templates use explicit
  `input_mapping` and a byte limit.
- **Host grant.** `ReasoningContext.decision_endpoints` authorizes the exact
  request URL and the key's env var per provider. Neither the grant nor the
  key is ever in chain JSON. `PreflightReport` gains
  `required_decision_credentials` / `missing_decision_credentials`.
- Transient errors are retried within `max_retries`; provider error bodies are
  kept out of step errors. `httpx` is now a core dependency.

**Migration from 0.5.0.** Lift saved JSON with `migrate()`; rung 14 rewrites
nothing. Grant the endpoint and credential before running a decision step.
Chains without decision steps need no new configuration. Execution-trace
replay does not support decision steps. Live checks ran on OpenRouter; the
direct OpenAI and Azure adapters have offline tests only.

## 0.5.0

The collaboration and execution-control release. Chain format 9 → 13.

### New step types

| Class | `StepType` | Purpose |
| --- | --- | --- |
| [`ClaudeCodeStepDescription`](/carl/steps/claude-code/) | `claude_code` | Delegate to the local Claude Code CLI. |
| [`CodexStepDescription`](/carl/steps/codex/) | `codex` | Delegate to a local Codex SDK agent. |
| [`SelectionStepDescription`](/carl/steps/selection/) | `selection` | Pick items from a collection with no LLM call. |
| [`PlannerStepDescription`](/carl/steps/planner/) | `planner` | Select and order a bounded set of declared tool actions. |

### Local coding agents

- Claude Code and Codex steps run only when the trusted host sets
  `ReasoningContext(allow_local_agent_execution=True)`. Loading a chain never
  grants it.
- Steps can resume a session or thread and store its id for later steps; both
  validate structured output.
- Claude Code `env` overrides are no longer written to chain JSON.

### Bounded planning

- The planner chooses action IDs; the chain defines the actions, their tool
  arguments and the budget. Chosen actions run as ordinary tool steps before
  the planner's dependents.
- `on_step_event(..., "planner_actions_scheduled", payload)` reports the
  assigned step numbers.
- A complete, schema-valid plan survives a trailing transport failure. Token
  accounting includes usage from compatible streaming providers.

### Git tools and skills

- [`GitToolSource`](/carl/steps/tool-discovery/#tools-from-a-pinned-git-commit)
  registers `@carl_tool` functions or one named function from a Git checkout.
  Tools and skills can be pinned to a commit and checked against per-file
  SHA-256 digests, on cache hits too.
- AgentSkill reads stay inside the skill directory and the staged workspace.
  With `trust_policy="sha_pinned"` the step verifies the same `SKILL.md` bytes
  it parses.

### Collaboration and evolution

- Handoff sub-chains, supervisor agents and sampling base steps survive a JSON
  round trip (format 11). Per-agent traces record nested runs and aggregation
  fallbacks.
- Writes to different keys of one namespace survive the merge of parallel
  step results.
- [EvoC primitives](/carl/evolution/overview/#evoc-primitives): step catalog,
  spec validation, graph and field mutations, code-tool contracts, evaluation
  helpers, run descriptors, Pareto helpers.
- `validate_spec` checks that explicit `$steps.N` inputs refer to declared
  predecessors; the meta mutation helpers check this before accepting an edit.

### Inputs, scheduling and failures

- Host inputs go through `ReasoningContext.runtime_input` and explicit
  references. Structured-output and human-input prompts can select the fields
  they need. A missing required tool input fails before dispatch.
- Opt-in `fail_fast` stops dispatch after a terminal failure. Pause is
  acknowledged once active steps settle; resume releases queued work without
  replaying completed steps.
- Concurrent executions get separate step caches and injection budgets. Active
  steps share the remaining chain deadline.
- Experimental [`execute_eager_tools()`](/carl/steps/tool/#eager-scheduling-experimental)
  starts a tool as soon as its dependencies succeed.
- After a fallback, `StepExecutionResult.tool_name` names the tool that ran.
  JSON text results are decoded into `result_data`. Failed embedded chains and
  MCP `isError` results fail the step. Tool tag restrictions apply to primary
  and fallback calls.
- Borrowed LLM clients are no longer closed by the executor. An answerless
  completion that exhausts its token budget raises `LLMTokenLimitError`. The
  `mcp` extra is constrained to SDK 1.x.

### Breaking changes

1. **Chain format 9 → 13.** Format 12 saves `fail_fast`, `max_injections`,
   `memory_schema` and `step_groups`; format 13 adds the planner. Older readers
   reject newer snapshots with `ChainFormatNewerError`.
2. **Local agents need host approval.** Apps that use Claude Code or Codex
   steps must set `allow_local_agent_execution` in the trusted host context.
3. **Tool failures affect chain status.** Callers that consumed an MCP error or
   a failed embedded chain as a successful step must handle step failure.
4. **Steps own their response format.** The default English and Russian prompt
   wrappers carry instructions and context only. Define the required output
   format in the step or pass an explicit `PromptTemplate`.

### Migration from 0.4.0

1. Lift saved JSON with `ReasoningChain.from_dict(ReasoningChain.migrate(raw))`.
   If an old file omitted a nested sub-agent, reattach its topology from the
   original source.
2. Grant local agent execution for trusted workflows and supply Claude Code
   environment overrides at run time.
3. Older Maestro chains: migration removes legacy human-input fallback values;
   missing providers and timeouts produce typed non-success outcomes.

Details: [Migration](/carl/serialization/migration/#upgrading-a-host-to-05x).

### Known limitations (0.5.2)

- The default `from_json()` / `load()` path rebuilds `llm`, `tool`, `mcp`,
  `memory`, `transform`, `conditional`, `structured_output`, `command` and
  `shell_session` steps as legacy `StepDescription` objects. Use
  `from_dict_typed()` for typed objects.
- `StepDescription.to_typed_step()` drops `retry_max` and `timeout`.
- `ChainMutator` ignores `StepDescriptionBase.frozen`; only the `mmar_carl.meta`
  helpers honour it.
- A `ClaudeCodeStepConfig.env` present in loaded JSON is accepted, although
  `to_dict()` never writes it.

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
