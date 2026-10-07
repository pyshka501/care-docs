---
title: Quick Start
description: Install CARL and run your first reasoning chain — offline with a stub client, then with a real model.
sidebar:
  order: 2
---

Build and run a two-step reasoning chain. The first version runs offline with a
stub LLM client, so you can check your setup without an API key.

## 1. Install

```bash
pip install 'mmar-carl==0.5.0'
```

The OpenAI-compatible client is part of the core package. Python 3.12+ is
required.

## 2. Define a chain

A chain is a list of typed steps. Steps declare their `dependencies`, and the DAG
executor runs everything that can run at once.

```python
from mmar_carl import (
    Language,
    LLMClientBase,
    LLMStepDescription,
    ReasoningChain,
    ReasoningContext,
)

steps = [
    LLMStepDescription(
        number=1,
        title="Extract claims",
        aim="Pull out the key factual claims from the text.",
        reasoning_questions="What does the author assert as fact?",
        stage_action="List each distinct claim.",
        example_reasoning="Separating claims from opinion clarifies what to verify.",
    ),
    LLMStepDescription(
        number=2,
        title="Assess strength",
        aim="Judge how well-supported each claim is.",
        reasoning_questions="Which claims are backed by evidence?",
        dependencies=[1],  # waits for step 1
        stage_action="Rate each claim weak / moderate / strong.",
        example_reasoning="Evidence quality determines how much to trust a claim.",
    ),
]

chain = ReasoningChain(steps=steps, max_workers=2)
```

## 3. Run it offline

Any object that implements `LLMClientBase` can serve as the model. This stub
returns a canned answer:

```python
class EchoClient(LLMClientBase):
    """Offline stand-in for a real LLM."""

    async def get_response(self, prompt: str) -> str:
        return f"(stub answer to a {len(prompt)}-char prompt)"

    async def get_response_with_retries(self, prompt: str, retries: int = 3) -> str:
        return await self.get_response(prompt)


context = ReasoningContext(
    outer_context="Coffee was first cultivated in Yemen. It is the best drink.",
    api=EchoClient(),
    language=Language.ENGLISH,
    system_prompt="You are a careful analyst.",
)

result = chain.execute(context)
print(result.success)               # True
print(result.get_final_output())    # (stub answer to a …-char prompt)
for sr in result.step_results:
    print(sr.step_number, sr.step_title, sr.success)
```

Set `language=Language.ENGLISH` explicitly: the default language is Russian,
which changes the prompt and history wording.

For unit tests, `ChainTestHarness` (exported from `mmar_carl`) does the same with
per-step canned responses and assertions.

## 4. Run it with a real model

Swap the stub for an OpenAI-compatible client:

```python
from mmar_carl import OpenAICompatibleClient, OpenAIClientConfig

client = OpenAICompatibleClient(OpenAIClientConfig(
    base_url="https://openrouter.ai/api/v1",
    api_key="sk-or-v1-...",
    model="qwen/qwen3-coder",
))

context = ReasoningContext(
    outer_context="<your input text here>",
    api=client,
    language=Language.ENGLISH,
    system_prompt="You are a careful analyst.",
)

result = chain.execute(context)
print(result.get_final_output())
```

`chain.execute(context)` runs synchronously. In async code, use
`await chain.execute_async(context)`. See [async execution](/carl/async/overview/).

## Next steps

- [What is CARL?](/carl/getting-started/overview/): the big picture and extras.
- [Core concepts](/carl/concepts/what-is-carl/): chains, steps, DAG, context.
- [Steps overview](/carl/steps/overview/): all 25 step types.
- [Run controls](/carl/chains/run-controls/): fail-fast, pause, cancel.
