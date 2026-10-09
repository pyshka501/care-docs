---
title: Advanced Steps
description: A map of the non-foundational step types — agents, runtime execution, time, MCP, skills, orchestration and evaluation — with links to their guides.
sidebar:
  order: 10
---

Beyond the [foundational steps](/carl/steps/overview/#reasoning-and-data), CARL
ships step types for agents, code and command execution, time, MCP, skills and
multi-agent orchestration. Each has a full guide; this page is the map.

## Agents and delegation

| Step | Class · config | What it does |
| --- | --- | --- |
| [Agent](/carl/steps/agent/) | `AgentStepDescription` · `AgentStepConfig` | A bounded ReAct loop over an explicit tool allowlist. One tool call per iteration; `finish` is the only successful exit. |
| [Claude Code](/carl/steps/claude-code/) | `ClaudeCodeStepDescription` · `ClaudeCodeStepConfig` | Hands a subtask to a headless `claude` CLI agent with its own tools. |
| [Codex](/carl/steps/codex/) | `CodexStepDescription` · `CodexStepConfig` | Hands a subtask to a local Codex agent (read-only or workspace-write sandbox). |
| [Chain tools](/carl/steps/chain-tools/) | `ChainToolDefinition` (chain field, not a step) | Exposes a whole chain as an isolated, typed tool. |
| [AgentSkill](/carl/skills/overview/) | `AgentSkillStepDescription` · `AgentSkillStepConfig` | Runs an AgentSkill folder (LLM / SCRIPT / HYBRID / SUBAGENT / LLM_AGENT modes). |

## Code and commands

| Step | Class · config | What it does |
| --- | --- | --- |
| [Code](/carl/steps/code/) | `CodeStepDescription` · `CodeStepConfig` | Runs one exact `def run(inputs)` Python source under a host `CodeExecutionPolicy` profile, with input and output schemas. |
| [Command](/carl/steps/command/) | `CommandStepDescription` · `CommandStepConfig` | Runs one argv command through a runtime (`local`, `docker`, `e2b`, `firejail`) under a host `CommandPolicy`. |
| [Command plan](/carl/steps/command-plan/) | `CommandPlanStepDescription` · `CommandPlanStepConfig` | An LLM picks typed arguments for a host-registered capability; a planned command step runs it after approval. |
| [Shell session](/carl/steps/shell-session/) | `ShellSessionStepDescription` · `ShellSessionStepConfig` | Runs a static script in one shell process. |

## Time and fan-out

| Step | Class · config | What it does |
| --- | --- | --- |
| [Wait](/carl/steps/wait/) | `WaitStepDescription` · `WaitStepConfig` | Waits for a duration, an absolute time, a named event, or the first of several. |
| [Map](/carl/steps/map/) | `MapStepDescription` · `MapStepConfig` | Calls one tool for every element of a JSON array, bounded and in order. |

## MCP

| Step | Class · config | What it does |
| --- | --- | --- |
| [MCP](/carl/mcp/overview/) | `MCPStepDescription` · `MCPStepConfig` | Calls a tool on an MCP server (`stdio`, `http`, `sse`). |
| [MCP resource](/carl/mcp/resources/) | `MCPResourceStepDescription` · `MCPResourceStepConfig` | Reads a named resource into memory and history. |

## Orchestration

| Step | Class · config | What it does |
| --- | --- | --- |
| [Handoff](/carl/orchestration/handoff/) | `AgentHandoffStepDescription` · `AgentHandoffStepConfig` | Runs a complete sub-chain and merges its result back. |
| [Supervisor](/carl/orchestration/supervisor/) | `SupervisorStepDescription` · `SupervisorStepConfig` | An LLM routes the task to one of N sub-chains. |
| [Debate](/carl/orchestration/debate/) | `DebateStepDescription` · `DebateStepConfig` | Round-robin roles, then a judge. |
| [Parallel sampling](/carl/orchestration/parallel-sampling/) | `ParallelSamplingStepDescription` · `ParallelSamplingStepConfig` | N samples of one LLM step, then a vote or a judge. |
| [Human input](/carl/orchestration/human-in-the-loop/) | `HumanInputStepDescription` · `HumanInputStepConfig` | Asks a person through a host provider; typed outcome (`answered` is the only success). |

## Tools and quality

| Step | Class · config | What it does |
| --- | --- | --- |
| [Tool discovery](/carl/steps/tool-discovery/) | `ToolDiscoveryStepDescription` · `ToolDiscoveryStepConfig` | Registers tools from a module, factory or dict during the run. |
| Evaluation | `EvaluationStepDescription` · `EvaluationStepConfig` | Inline quality gate on another step's output (below). |

### Evaluation step

`EvaluationStepConfig` checks the output of `evaluates_step` against `criteria`
and reacts with `on_fail`:

| Field | Default | Purpose |
| --- | --- | --- |
| `evaluates_step` | required | Step number whose output is checked. |
| `criteria` | required | Rule expressions (`simpleeval`) or, with `evaluation_method="llm"`, statements for an LLM judge. |
| `evaluation_method` | `"rule"` | `"rule"` or `"llm"`. |
| `on_fail` | `EvalFailAction.CONTINUE` | `CONTINUE`, `ABORT` or `RETRY_WITH_FEEDBACK`. |
| `input_source` | `"$history[-1]"` | What is evaluated. |
| `max_retries` | `1` | Retries for `RETRY_WITH_FEEDBACK`. |

See also [metrics](/carl/evaluation/metrics/) for step- and chain-level scoring.
