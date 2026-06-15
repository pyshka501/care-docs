---
title: Quick Start
description: Install CARL and run your first reasoning chain in five minutes.
sidebar:
  order: 2
---

Build and run a two-step reasoning chain in about five minutes.

## 1. Install

```bash
pip install mmar-carl
```

For OpenAI-compatible providers (OpenRouter, Azure, local LLMs):

```bash
pip install 'mmar-carl[openai]'
```

## 2. Define a chain

CARL chains are lists of typed step descriptions. Steps declare their
`dependencies`, and the DAG executor parallelises everything that can run at once.

```python
from mmar_carl import (
    ReasoningChain,
    LLMStepDescription,
    ReasoningContext,
    Language,
    OpenAICompatibleClient,
    OpenAIClientConfig,
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

## 3. Run it

```python
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

`chain.execute(context)` runs synchronously. For async / streaming, use
`await chain.execute_async(context)` — see [async execution](/carl/async/overview/).

## Next steps

- [What is CARL?](/carl/getting-started/overview/) — the big picture.
- [Core concepts](/carl/concepts/what-is-carl/) — chains, steps, DAG, RAG context.
