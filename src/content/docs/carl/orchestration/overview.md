---
title: Orchestration Overview
description: Multi-agent step types (supervisor, handoff, debate, parallel sampling, human input), their typed result views and the event bus.
sidebar:
  order: 1
---

CARL has five step types for multi-agent patterns. Each one is an ordinary step
that you place in a chain next to LLM, tool or memory steps.

| Pattern | Step | Use it when | Topology in JSON |
| --- | --- | --- | --- |
| [Supervisor](/carl/orchestration/supervisor/) | `SupervisorStepDescription` | an LLM should route the task to one of N named sub-chains | `agents` stored as nested chains |
| [Handoff](/carl/orchestration/handoff/) | `AgentHandoffStepDescription` | you delegate to one fixed sub-chain with an isolated context | `sub_chain` stored as a nested chain |
| [Debate](/carl/orchestration/debate/) | `DebateStepDescription` | several roles argue in rounds, then a judge writes the verdict | only config |
| [Parallel sampling](/carl/orchestration/parallel-sampling/) | `ParallelSamplingStepDescription` | you run one LLM step N times and pick a winner by vote or by a judge | `base_step` stored as a nested step |
| [Human-in-the-loop](/carl/orchestration/human-in-the-loop/) | `HumanInputStepDescription` | a person must answer before the chain continues | only config |

Other ways to compose agents:

- [Chain tools](/carl/steps/chain-tools/): expose a whole chain as a tool that an agent can call.
- [Agent step](/carl/steps/agent/): an LLM agent loop with tool calls inside one step.
- [Claude Code step](/carl/steps/claude-code/) and [Codex step](/carl/steps/codex/): run an external coding agent as a step.

## Serialized topology

`to_dict()` / `to_json()` write the collaborators of the collaboration steps, not
only their configs. The chain format version is 11.

- `agent_handoff` writes `sub_chain` as a complete nested chain dict.
- `supervisor` writes `agents` as a map from agent name to a nested chain dict.
- `parallel_sampling` writes `base_step` as a nested step dict. It is a step, not
  a chain, so it adds no nesting level.

A nested chain carries its own `format_version`, so you can load a sub-agent on
its own. Two limits apply when you serialize:

- Nesting depth is at most 8 chain levels. A deeper chain raises `ValueError`.
- A chain that contains itself, directly or through sub-chains, raises
  `ValueError` instead of recursing.

Chains written at format 10 or earlier carry no topology. They still load: a
handoff gets a one-step `__placeholder__` sub-chain, a supervisor gets an empty
`agents` map, and parallel sampling gets a `__placeholder__` LLM base step. Replace
them before you run the chain. Callables are never serialized:
`ParallelSamplingStepConfig.answer_extractor` and
`DebateStepConfig.convergence_predicate` come back as `None`. See
[JSON serialization](/carl/serialization/json/) for the general format.

## Typed result-data views

Each step stores its details in `StepExecutionResult.result_data`, a plain `dict`.
`StepExecutionResult` has typed accessors for the common step types. An accessor
returns `None` when the step type does not match or the payload does not validate,
so it works with the walrus operator:

```python
for sr in result.step_results:
    if (debate := sr.as_debate_transcript()):
        print(debate.verdict, debate.rounds_executed, debate.converged)
        for turn in debate.transcript:          # list[DebateTurn]
            print(turn.round, turn.role, turn.argument)
    if (samples := sr.as_parallel_samples()):
        print(samples.aggregation_outcome, samples.vote_degenerate)
```

| Accessor | Step type | Returns | Main fields |
| --- | --- | --- | --- |
| `as_supervisor_decision()` | `supervisor` | `SupervisorDecision` | `agent_selected`, `routing_reply`, `routing_match_tier`, `routing_ambiguous`, `routing_candidates`, `sub_result`, `sub_chain_success`, `steps_executed` |
| `as_debate_transcript()` | `debate` | `DebateTranscript` | `verdict`, `transcript`, `rounds_executed`, `rounds_configured`, `role_call_count`, `topic`, `converged`, `convergence_reason` |
| `as_parallel_samples()` | `parallel_sampling` | `ParallelSamples` | `n_samples`, `n_successes`, `aggregation`, `candidates`, `aggregation_outcome`, `vote_distribution`, `vote_winning_count`, `vote_total`, `vote_degenerate` |
| `as_human_input_outcome()` | `human_input` | `HumanInputOutcome` | `status`, `request_id`, `elapsed_seconds`, `value`, `actor_id`, `responded_at`, `provenance`, `redacted`, `error_message` |
| `as_skill_output()` | `agent_skill` | `SkillOutput` | `skill_name`, `execution_mode`, `output_files`, `parsed_output`, `iterations` |
| `as_wait_outcome()` | `wait` | `WaitOutcome` | `trigger`, `elapsed_seconds`, `name`, `payload` |
| `as_map_outcome()` | `map` | `MapOutcome` | `items`, `total_items`, `completed_items`, `failed_items` |
| `as_code_execution_outcome()` | `code` | `CodeExecutionOutcome` | see [Code step](/carl/steps/code/) |

All view models are importable from `mmar_carl`. `SupervisorDecision`,
`DebateTranscript`, `ParallelSamples` and `SkillOutput` keep unknown keys
(`extra="allow"`); for example the judge keys `judge_reply`,
`judge_selected_index` and `judge_error` of parallel sampling are reachable through
`samples.model_extra`. `HumanInputOutcome`, `WaitOutcome` and `MapOutcome` are
strict models. Handoff has no typed view: read `result_data["sub_result"]`,
`["sub_chain_success"]` and `["steps_executed"]` directly.

## The event bus

Steps can also wait for named events instead of, or in addition to, numeric
`dependencies`.

```python
# Producer: any code that holds the context (a tool, a callback, a host)
context.emit_event("error_detected", {"code": 503})

# Consumer: a step gated on the event
LLMStepDescription(
    number=5,
    title="Handle error",
    aim="React to the detected error.",
    triggered_by=["error_detected"],
)
```

- A step with `triggered_by` becomes ready only when **all** listed events have
  been emitted **and** its numeric `dependencies` are done.
- Read the payload with [`$event.<name>`](/carl/chains/dynamic-references/). If an
  event is emitted again, the last payload wins.
- Emission is immediate and process-local. Parallel branches share the bus, and an
  event is not rolled back when the emitting step later fails.
- If no step can run because an event never fired, the executor raises
  `ValueError("Deadlock detected: ...")` and lists the unmet events.
- `triggered_by` is saved by `to_dict()` and restored by `from_dict()`.

To pause inside a step until an event arrives, use the
[Wait step](/carl/steps/wait/) with an event condition.
