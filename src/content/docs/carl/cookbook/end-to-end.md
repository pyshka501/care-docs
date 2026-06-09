---
title: End-to-End Tutorial
description: Build a multi-step support-triage agent from scratch — LLM, tool, memory, and a conditional.
sidebar:
  order: 2
---

This ties the pieces together: an agent that triages a support ticket using an
LLM step, a registered tool, a memory write, and a final drafting step.

## 1. Define the steps

```python
from mmar_carl import (
    ReasoningChain, ReasoningContext, Language,
    LLMStepDescription, ToolStepDescription, ToolStepConfig,
    MemoryStepDescription, MemoryStepConfig, MemoryOperation,
    OpenAICompatibleClient, OpenAIClientConfig,
)

steps = [
    LLMStepDescription(
        number=1,
        title="Classify severity",
        aim="Classify the ticket severity as low, medium, or high.",
        reasoning_questions="How urgent and impactful is this issue?",
        step_context_queries=["error", "outage", "deadline"],
        stage_action="Reply with a single word: low / medium / high.",
        example_reasoning="A production outage is high; a typo is low.",
    ),
    ToolStepDescription(
        number=2,
        title="Look up SLA",
        dependencies=[1],
        config=ToolStepConfig(
            tool_name="lookup_sla",
            input_mapping={"severity": "$history[-1]"},
        ),
    ),
    MemoryStepDescription(
        number=3,
        title="Record triage",
        dependencies=[2],
        config=MemoryStepConfig(
            operation=MemoryOperation.WRITE,
            memory_key="sla",
            value_source="$history[-1]",
            namespace="triage",
        ),
    ),
    LLMStepDescription(
        number=4,
        title="Draft reply",
        aim="Draft a customer reply that states the SLA from memory.",
        reasoning_questions="What should we tell the customer about timing?",
        dependencies=[3],
        step_context_queries=["customer", "request"],
        stage_action="Write a short, friendly reply mentioning the SLA.",
        example_reasoning="Setting clear expectations reduces follow-ups.",
    ),
]

chain = ReasoningChain(steps=steps, max_workers=2)
```

## 2. Register the tool

```python
def lookup_sla(severity: str) -> str:
    table = {"high": "1 hour", "medium": "1 business day", "low": "3 business days"}
    return table.get(severity.strip().lower(), "3 business days")
```

## 3. Run it

```python
client = OpenAICompatibleClient(OpenAIClientConfig(
    base_url="https://openrouter.ai/api/v1",
    api_key="sk-or-v1-...",
    model="qwen/qwen3-coder",
))

context = ReasoningContext(
    outer_context="Our checkout has been down for 20 minutes — customers can't pay!",
    api=client,
    language=Language.ENGLISH,
    system_prompt="You are a concise, helpful support engineer.",
)
context.register_tool("lookup_sla", lookup_sla)

result = chain.execute(context)
print(result.get_final_output())          # the drafted reply
print(result.success, len(result.step_results))
```

## 4. Inspect the run

```python
print(result.format_profiling_table())    # per-step cost / latency
print(chain.to_mermaid())                  # the DAG
result.trace.to_html("triage.html")        # animated playback
```

## Where to go next

- Add a [conditional step](/carl/steps/conditional/) to escalate `high` severity to a different path.
- Add [metrics](/carl/evaluation/metrics/) and run it over a [dataset](/carl/evaluation/datasets/).
- [Evolve](/carl/evolution/overview/) the chain to improve reply quality.
- Browse the full [cookbook](/carl/cookbook/overview/).
