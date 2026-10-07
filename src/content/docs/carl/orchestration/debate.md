---
title: Debate
description: Round-robin debate between named roles, followed by one judge call.
sidebar:
  order: 4
---

`DebateStepDescription` runs a round-robin debate. In each round every role makes
one LLM call that sees the topic and the transcript so far. After the last round a
judge call turns the transcript into a verdict.

```python
from mmar_carl import DebateStepConfig, DebateStepDescription, LLMStepConfig

DebateStepDescription(
    number=1,
    title="Debate the proposal",
    config=DebateStepConfig(
        roles=["optimist", "skeptic"],
        role_prompts={
            "optimist": "Round {round}. Argue for the proposal: {task}\n\n{transcript}",
            "skeptic": "Round {round}. Argue against the proposal: {task}\n\n{transcript}",
        },
        rounds=3,
        judge_prompt="Topic: {task}\n\nDebate:\n{transcript}\n\nState the strongest conclusion.",
        judge_llm_config=LLMStepConfig(model="openai/gpt-4o"),
        stop_when_unchanged=1,
        output_memory_key="verdict",
    ),
)
```

## DebateStepConfig

| Field | Default | Meaning |
| --- | --- | --- |
| `roles` | required | Role names in turn order, at least 2. They label the transcript. |
| `role_prompts` | `{}` | Per-role template with `{task}`, `{role}`, `{round}`, `{transcript}`. A role without a prompt uses a built-in neutral instruction. |
| `rounds` | `2` | Round budget, `>= 1`. |
| `task_source` | `"$outer_context"` | Reference for the topic. Non-string values are JSON-encoded. |
| `judge_prompt` | required | Template for the verdict call with `{task}` and `{transcript}`. |
| `output_memory_key` | `""` | Parent memory key for the verdict. Empty disables the write. |
| `output_namespace` | `"debate"` | Namespace for `output_memory_key`. |
| `llm_config` | `None` | Model for all role calls and for the judge, unless overridden. |
| `role_llm_configs` | `{}` | Per-role `LLMStepConfig` overrides. |
| `judge_llm_config` | `None` | Model for the judge call only. Falls back to `llm_config`. |
| `stop_when_unchanged` | `None` | Stop after this many consecutive rounds in which every role repeated its previous argument (compared after collapsing whitespace and case-folding). `None` disables. |
| `convergence_predicate` | `None` | Callable `(transcript: list[dict]) -> bool` checked after each round; `True` stops the debate. Exceptions are logged and treated as `False`. Not serialized. |

Prompts go through `str.format`, so write literal braces as `{{` and `}}`.

## Cost

The step makes `len(roles) * rounds_executed + 1` LLM calls. Without an early stop
`rounds_executed == rounds`. Both stop criteria are off by default.

## Result

`step_result.result` is the verdict. The typed view:

```python
t = step_result.as_debate_transcript()
t.verdict
t.transcript            # list[DebateTurn]: round, role, argument
t.rounds_executed       # rounds that actually ran
t.rounds_configured     # the configured budget
t.role_call_count       # len(transcript)
t.converged             # True if an early-stop criterion fired
t.convergence_reason    # human-readable reason, or None
```

The step emits intra-step events through `context.on_step_event`:
`debate.round_started`, `debate.turn_argument` for every turn, and
`debate.converged` on an early stop. A cancel request is checked between rounds.

Any exception in a role or judge call fails the step. There is no fallback verdict.

:::tip
Different models per role (`role_llm_configs`) and a separate judge model
(`judge_llm_config`) give more independent viewpoints than one model playing
every part.
:::

## See also

- [Parallel sampling](/carl/orchestration/parallel-sampling/): independent samples and a vote instead of an argument.
