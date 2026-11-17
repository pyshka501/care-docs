---
title: Steps Overview
description: All 29 CARL step types, the fields every step shares, and the typed vs legacy API.
sidebar:
  order: 1
---

A CARL chain is a list of **steps**. Each step is a typed description object that
declares what to do and what it depends on. The DAG executor picks an executor
by the step's type.

## Typed API vs legacy

Use the **typed classes** (`LLMStepDescription`, `ToolStepDescription`, …) for new
code. They give you type-checked fields and clear intent. The legacy unified
`StepDescription` class is still accepted for backward compatibility; convert it
with `legacy_step.to_typed_step()`.

To load saved JSON into typed classes, use `ReasoningChain.from_dict_typed(data)`.
`from_dict()`, `from_json()` and `load()` keep the legacy path by default (see
[ReasoningChain](/carl/chains/overview/#serialization)).

## Fields every step shares

All step classes extend `StepDescriptionBase` and inherit these fields:

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `number` | `int` | required | Step number in the sequence. |
| `title` | `str` | required | Human-readable title. |
| `dependencies` | `list[int]` | `[]` | Step numbers this step waits for. |
| `triggered_by` | `list[str]` | `[]` | Event names that gate this step (see [the event bus](/carl/orchestration/overview/#the-event-bus)). The step is ready only when **all** listed events have fired *and* numeric `dependencies` are met. |
| `checkpoint` | `bool` | `False` | Mark as a RE-PLAN rollback checkpoint. |
| `checkpoint_name` | `str \| None` | `None` | Optional checkpoint label. |
| `replan_enabled` | `bool \| None` | `None` | Per-step RE-PLAN override (`None` = use the chain policy). |
| `frozen` | `bool` | `False` | Evolution helpers must not change, retype or delete this step. Honoured by the `mmar_carl.meta` mutation helpers, not by `ChainMutator` (see [EvoC primitives](/carl/evolution/overview/#evoc-primitives)). |
| `metadata` | `dict` | `{}` | Free-form step metadata; the executor records provenance here. |
| `metrics` | `list[MetricBase]` | `[]` | Metrics evaluated after the step runs. |
| `loop_back_to` | `int \| None` | `None` | Step to loop back to. See [loops](/carl/steps/loops/). |
| `loop_config` | `LoopConfig \| None` | `None` | Loop condition and budget guard. |
| `cache` | `StepCache \| None` | `None` | Result memoization. See [caching](/carl/steps/caching/). `command`, `shell_session`, `command_plan`, `planner`, `claude_code` and `codex` reject it. |

:::note
`retry_max` and `timeout` are **not** on every step. They live on
`LLMStepDescription` (see [LLM steps](/carl/steps/llm/)). Other step types carry
their own budgets in their config: tool steps use `ToolStepConfig.timeout` and
`ToolErrorRecovery`, agent and runtime steps have explicit time and size limits.
:::

## The step types

`StepType` has 29 values in 0.5.2. `"bash"` from old chain JSON still loads as `command`.
New since 0.4.0: `claude_code`, `codex`, `selection` and `planner` (0.5.0),
`decision` (0.5.1) and `terminate` (0.5.2).

### Reasoning and data

| Type | Class | What it does |
| --- | --- | --- |
| `llm` | [`LLMStepDescription`](/carl/steps/llm/) | Chain-of-thought reasoning with one LLM call (the default). |
| `structured_output` | [`StructuredOutputStepDescription`](/carl/steps/structured-output/) | LLM output validated against a JSON Schema. |
| `tool` | [`ToolStepDescription`](/carl/steps/tool/) | Calls a registered Python function. |
| `memory` | [`MemoryStepDescription`](/carl/steps/memory/) | read / write / append / delete / list on shared memory. |
| `transform` | [`TransformStepDescription`](/carl/steps/transform/) | Data transforms with no LLM call. |
| `conditional` | [`ConditionalStepDescription`](/carl/steps/conditional/) | Routes to one branch; the others are skipped. |
| `tool_discovery` | [`ToolDiscoveryStepDescription`](/carl/steps/tool-discovery/) | Discovers and registers tools at runtime. |
| `evaluation` | `EvaluationStepDescription` | Inline quality gate on another step's output. See [metrics](/carl/evaluation/metrics/). |
| `selection` | [`SelectionStepDescription`](/carl/steps/selection/) | Picks items from a list (top-k, weighted, random, filter) with no LLM call. |
| `decision` | [`DecisionStepDescription`](/carl/steps/decision/) | Asks a decision model typed questions (predicate, choice, score) through a host-granted endpoint. |

### Agents and delegation

| Type | Class | What it does |
| --- | --- | --- |
| `agent` | [`AgentStepDescription`](/carl/steps/agent/) | Bounded ReAct loop over an explicit list of registered tools, with a required `finish`. |
| `planner` | [`PlannerStepDescription`](/carl/steps/planner/) | A model picks and orders tool actions the chain declared; they run as injected tool steps. |
| `claude_code` | [`ClaudeCodeStepDescription`](/carl/steps/claude-code/) | Hands a whole subtask to a headless Claude Code CLI agent. |
| `codex` | [`CodexStepDescription`](/carl/steps/codex/) | Hands a whole subtask to a local Codex agent through the Codex SDK. |
| `agent_skill` | `AgentSkillStepDescription` | Runs an [AgentSkill](/carl/skills/overview/) folder. |
| `agent_handoff` | `AgentHandoffStepDescription` | Delegates to a complete sub-chain. See [handoff](/carl/orchestration/handoff/). |
| `supervisor` | `SupervisorStepDescription` | An LLM routes the task to one of N sub-chains. See [supervisor](/carl/orchestration/supervisor/). |
| `debate` | `DebateStepDescription` | Round-robin multi-role debate and a judge. See [debate](/carl/orchestration/debate/). |
| `parallel_sampling` | `ParallelSamplingStepDescription` | Samples N answers, then votes or judges. See [parallel sampling](/carl/orchestration/parallel-sampling/). |
| `human_input` | `HumanInputStepDescription` | Asks a human through a host callback, with a typed outcome. See [human-in-the-loop](/carl/orchestration/human-in-the-loop/). |

A chain can also expose another chain as a callable tool. That is not a step type;
it is the top-level `chain_tools` field. See [chain tools](/carl/steps/chain-tools/).

### Execution and time

| Type | Class | What it does |
| --- | --- | --- |
| `code` | [`CodeStepDescription`](/carl/steps/code/) | Runs one exact Python source string in a strictly isolated host runtime. |
| `command` | [`CommandStepDescription`](/carl/steps/command/) | Runs one argv command through a skill runtime under a host `CommandPolicy`. |
| `command_plan` | [`CommandPlanStepDescription`](/carl/steps/command-plan/) | An LLM picks typed arguments for a host-registered command capability. |
| `shell_session` | [`ShellSessionStepDescription`](/carl/steps/shell-session/) | Runs a static script in one shell process. |
| `wait` | [`WaitStepDescription`](/carl/steps/wait/) | Waits for a timer, an absolute time, or a named event. |
| `map` | [`MapStepDescription`](/carl/steps/map/) | Bounded ordered fan-out of one tool over a JSON array. |
| `terminate` | [`TerminateStepDescription`](/carl/steps/terminate/) | Returns an explicit answer and stops the chain after the current batch. |

### MCP

| Type | Class | What it does |
| --- | --- | --- |
| `mcp` | `MCPStepDescription` | Calls a tool on an MCP server. See [MCP](/carl/mcp/overview/). |
| `mcp_resource` | `MCPResourceStepDescription` | Reads a named MCP resource into memory. See [MCP resources](/carl/mcp/resources/). |

## Authority stays with the host

Steps that run code, commands or agents follow one rule: **a serialized chain is
input, never authority.** The chain says what it wants. The host grants
permission at run time through objects that are never written to chain JSON:
`CommandPolicy`, `CommandCapabilityRegistry`, `CodeExecutionPolicy`, the network
enforcer, the human-input provider, registered tools, and two context fields:

- `ReasoningContext.allow_local_agent_execution` (default `False`) must be
  `True` before a `claude_code` or `codex` step may start a local agent.
  Loading a chain never grants it.
- `ReasoningContext.decision_endpoints` authorizes the exact URL and key
  variable for each `decision` provider.

The `claude_code` step still serializes its CLI flags (`permission_mode`,
`allowed_tools`, `extra_cli_args`, `add_dirs`), so a chain can ask for broad
agent permissions. Its `env` overrides are runtime-only and never written to
JSON. The `codex` step limits the sandbox to `read-only` or `workspace-write`.
Review chains with these steps before you grant local agent execution.

## Before you run

`chain.preflight(context)` lists what a chain needs and what is missing: tools,
MCP servers, skills, code profiles, Claude Code CLIs, the Codex runtime and
decision-model credentials. See
[preflight](/carl/care-integration/preflight/).

## Cross-cutting features

- [Loops](/carl/steps/loops/): re-run a range of steps until a condition holds.
- [Caching](/carl/steps/caching/): memoize a step's result within a run.
- [Dynamic references](/carl/chains/dynamic-references/): `$history`, `$memory`, `$outer_context`, `$steps` and more wire steps together.
- [Run controls](/carl/chains/run-controls/): fail-fast, pause, resume, cancel and timeouts.
