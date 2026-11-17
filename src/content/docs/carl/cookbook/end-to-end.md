---
title: End-to-End Tutorial
description: Build a multi-step support-triage agent from scratch — LLM, tool, memory and a drafting step — and run it offline with a stub client.
sidebar:
  order: 2
---

This ties the pieces together: an agent that triages a support ticket using
an LLM step, a registered tool, a memory write and a final drafting step. The
code below runs as is, without network access: a stub client stands in for
the model. Swap in a real client for production.

## 1. Define the steps

```python
from mmar_carl import (
    ReasoningChain, ReasoningContext, Language, LLMClientBase,
    LLMStepDescription, ToolStepDescription, ToolStepConfig,
    MemoryStepDescription, MemoryStepConfig, MemoryOperation,
)

steps = [
    LLMStepDescription(
        number=1,
        title="Classify severity",
        aim="Classify the ticket severity as low, medium, or high.",
        reasoning_questions="How urgent and impactful is this issue?",
        step_context_queries=["down", "outage", "pay"],
        stage_action="Reply with a single word: low / medium / high.",
        example_reasoning="A production outage is high; a typo is low.",
    ),
    ToolStepDescription(
        number=2,
        title="Look up SLA",
        dependencies=[1],
        config=ToolStepConfig(
            tool_name="lookup_sla",
            input_mapping={"severity": "$steps.1.result"},   # the raw answer of step 1
        ),
    ),
    MemoryStepDescription(
        number=3,
        title="Record triage",
        dependencies=[2],
        config=MemoryStepConfig(
            operation=MemoryOperation.WRITE,
            memory_key="sla",
            value_source="$steps.2.result",
            namespace="triage",
        ),
    ),
    LLMStepDescription(
        number=4,
        title="Draft reply",
        aim="Draft a customer reply that states the SLA.",
        reasoning_questions="What should we tell the customer about timing?",
        dependencies=[3],
        stage_action="Write a short, friendly reply mentioning the SLA.",
        example_reasoning="Setting clear expectations reduces follow-ups.",
    ),
]
chain = ReasoningChain(steps=steps, max_workers=2)
```

:::tip[`$steps.N.result` vs `$history[-1]`]
`$history[-1]` is the last **history entry**, which includes the step header
(`Step 1. Classify severity` / `Result: high` in the context language). To
pass a step's bare output to a tool, use `$steps.<n>.result`.
:::

## 2. Register the tool

```python
def lookup_sla(severity: str) -> str:
    table = {"high": "1 hour", "medium": "1 business day", "low": "3 business days"}
    return table.get(severity.strip().lower(), "3 business days")
```

## 3. Run it

```python
class StubLLM(LLMClientBase):
    """Offline stand-in for a real client: step 1 answers 'high', step 4 drafts a reply."""
    async def get_response(self, prompt: str) -> str:
        return "We are on it: expect an update within 1 hour." if "Draft reply" in prompt else "high"
    async def get_response_with_retries(self, prompt: str, retries: int = 3) -> str:
        return await self.get_response(prompt)

context = ReasoningContext(
    outer_context="Our checkout has been down for 20 minutes - customers can't pay!",
    api=StubLLM(),   # in production: OpenAICompatibleClient(OpenAIClientConfig(...))
    language=Language.ENGLISH,
    system_prompt="You are a concise, helpful support engineer.",
)
context.register_tool("lookup_sla", lookup_sla)

result = chain.execute(context)
print(result.get_final_output())                       # the drafted reply
print(result.success, len(result.step_results))        # True 4
print(context.memory_read("sla", namespace="triage"))  # 1 hour
```

`Language` defaults to Russian; set `Language.ENGLISH` for English prompts.

## 4. Inspect the run

```python
print(result.format_profiling_table())    # per-step latency / tokens / cost
print(chain.to_mermaid())                  # the DAG
result.trace.to_html("triage.html")        # animated playback
for ev in result.trace.events:             # what each step received
    print(ev.step_number, ev.inputs)
```

## Where to go next

- Add a [conditional step](/carl/steps/conditional/) to escalate `high` severity to a different path.
- Add [metrics](/carl/evaluation/metrics/) and run it over a [dataset](/carl/evaluation/datasets/).
- [Evolve](/carl/evolution/overview/) the chain to improve reply quality.
- Record real responses once with [record & replay](/carl/llm/record-replay/) and keep tests offline.
- Browse the full [cookbook](/carl/cookbook/overview/).
