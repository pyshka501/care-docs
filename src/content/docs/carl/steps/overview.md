---
title: Steps Overview
description: All CARL step types, the fields every step shares, and the typed vs legacy API.
sidebar:
  order: 1
---

A CARL chain is a list of **steps**. Each step is a typed description object that
declares what to do and what it depends on. The DAG executor picks an executor
based on the step's type.

## Typed API vs legacy

Use the **typed classes** (`LLMStepDescription`, `ToolStepDescription`, …) for new
code — they give you type-checked fields and clear intent. The legacy unified
`StepDescription` class is still accepted for backward compatibility; convert it
with `legacy_step.to_typed_step()`.

## Fields every step shares

All step classes extend `StepDescriptionBase` and inherit these fields:

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `number` | `int` | — (required) | Step number in the sequence. |
| `title` | `str` | — (required) | Human-readable title. |
| `dependencies` | `list[int]` | `[]` | Step numbers this step waits for. |
| `triggered_by` | `list[str]` | `[]` | Event names that gate this step (see [event-driven steps](/carl/steps/advanced/)). Becomes ready only when **all** listed events have been emitted *and* numeric `dependencies` are met. |
| `checkpoint` | `bool` | `False` | Mark as a RE-PLAN rollback checkpoint. |
| `checkpoint_name` | `str \| None` | `None` | Optional checkpoint label. |
| `replan_enabled` | `bool \| None` | `None` | Per-step RE-PLAN override (`None` = use chain policy). |
| `metrics` | `list[MetricBase]` | `[]` | Metrics evaluated after the step runs. |
| `loop_back_to` | `int \| None` | `None` | Step to loop back to — see [loops](/carl/steps/loops/). |
| `loop_config` | `LoopConfig \| None` | `None` | Loop condition + budget guard. |
| `cache` | `StepCache \| None` | `None` | Result memoization — see [caching](/carl/steps/caching/). |

:::note
`retry_max` and `timeout` are **not** on every step. They live on
`LLMStepDescription` (see [LLM steps](/carl/steps/llm/)); tool steps configure
retries through `ToolStepConfig` / `ToolErrorRecovery` (see [tool steps](/carl/steps/tool/)).
:::

## The step types

### Foundational

| Type | Class | What it does |
| --- | --- | --- |
| `llm` | [`LLMStepDescription`](/carl/steps/llm/) | Chain-of-thought reasoning with an LLM (the default). |
| `tool` | [`ToolStepDescription`](/carl/steps/tool/) | Calls a registered Python function. |
| `memory` | [`MemoryStepDescription`](/carl/steps/memory/) | read / write / append / delete / list on shared memory. |
| `transform` | [`TransformStepDescription`](/carl/steps/transform/) | Data transforms with no LLM call. |
| `conditional` | [`ConditionalStepDescription`](/carl/steps/conditional/) | Branch to a step based on a condition. |
| `structured_output` | [`StructuredOutputStepDescription`](/carl/steps/structured-output/) | LLM output constrained to a JSON schema. |

### Advanced

These are introduced on the [advanced steps](/carl/steps/advanced/) page and get
full guides in their own sections (Orchestration, Skills, MCP, Evaluation).

| Type | Class | What it does |
| --- | --- | --- |
| `mcp` | `MCPStepDescription` | Call a tool on an MCP server. |
| `mcp_resource` | `MCPResourceStepDescription` | Read a named MCP resource into memory. |
| `agent_skill` | `AgentSkillStepDescription` | Run an [AgentSkill](https://agentskills.io) folder. |
| `agent_handoff` | `AgentHandoffStepDescription` | Delegate to a complete sub-chain. |
| `supervisor` | `SupervisorStepDescription` | LLM routes the task to one of N sub-chains. |
| `debate` | `DebateStepDescription` | Round-robin multi-agent debate + judge. |
| `parallel_sampling` | `ParallelSamplingStepDescription` | Sample N responses, vote / judge the best. |
| `human_input` | `HumanInputStepDescription` | Pause for human input (callable or webhook). |
| `tool_discovery` | `ToolDiscoveryStepDescription` | Discover + register tools at runtime. |
| `evaluation` | `EvaluationStepDescription` | Inline quality gate on another step's output. |

## Cross-cutting features

- [Loops](/carl/steps/loops/) — re-run a range of steps until a condition holds.
- [Caching](/carl/steps/caching/) — memoize a step's result within a run.
- [Dynamic references](/carl/chains/dynamic-references/) — `$history`, `$memory`, … wire steps together.
