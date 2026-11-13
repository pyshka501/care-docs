---
title: Quick Start
description: Install MAGE (the released 0.1.3 or the development line Maestro pins), generate a first chain from Python and from the CLI, and check it.
sidebar:
  order: 2
---

You need Python 3.12 or 3.13 and an OpenAI-compatible endpoint with a key
(OpenAI, OpenRouter, a local vLLM or Ollama server). MAGE makes real model
calls; `fast` mode makes one, `deep` mode at least four.

## Install

### Released: 0.1.3 from PyPI

```bash
pip install mmar-mage==0.1.3
pip install 'mmar-mage[memory]==0.1.3'   # + gigaevo-client for GigaEvo Memory
```

0.1.3 has `fast` and `deep` generation, `edit`, `evolve`, `validate` and the
memory integration. It does not have typed requests (`GenerationRequest`),
runtime admission or the semantic compiler. Its CARL requirement is open
(`mmar-carl>=0.2`), so pip picks the newest CARL; that combination was not
checked against CARL 0.5.0.

### Development line: what Maestro pins

The 0.2.0 line is not on PyPI. It requires a CARL build
(`mmar-carl==0.3.0+maestro.contracts.3.ideal.20261005.1`) that no package
index serves, so a project that uses it pins both by git revision. This is how
Maestro does it, with `uv`:

```toml
# pyproject.toml
[project]
dependencies = ["mmar-mage"]

[tool.uv.sources]
mmar-mage = { git = "https://github.com/Glazkoff/carl-mage", rev = "b7a6e273f365729ae7af02b83885cf774da3ff72" }

[tool.uv]
# Replace MAGE's unpublished CARL pin with a CARL revision you actually run.
override-dependencies = ["mmar-carl @ git+https://github.com/Glazkoff/carl.git@f0afe4620d72dbf13e59b372ec3e550195a19d61"]
```

Extras on this line: `memory` (`gigaevo-client`), `web` (keyless DuckDuckGo
search through `ddgs`), `all`.

From a checkout of the development repository:

```bash
uv sync --group dev          # project + dev tools
uv sync --group dev --all-extras
uv run mage version          # mmar-mage 0.2.0
```

## Generate a chain from Python

This works on both lines.

```python
import asyncio
from mmar_mage import MAGEConfig, generate_chain

config = MAGEConfig(
    mode="fast",            # one model call; "deep" is the default
    api_key="sk-...",
    model="gpt-4o",
    enable_memory=False,    # do not try to save to GigaEvo Memory
)

result = asyncio.run(generate_chain(
    "Analyze customer feedback and identify the top 3 issues",
    config,
))
print(result.chain_json)                       # CARL chain JSON
print(result.metadata.num_steps, result.metadata.suggested_display_name)
```

`enable_memory` is `True` by default: with a plain string task MAGE tries to
save the chain to the Memory service at `memory_base_url`
(`http://localhost:8002`). A failed save does not fail the generation, but it
costs a timeout.

Other endpoints:

```python
MAGEConfig.for_openrouter(api_key="sk-or-...", model="anthropic/claude-3.5-sonnet")
MAGEConfig.for_local(base_url="http://localhost:8000/v1")   # model "__auto__": read from /v1/models
MAGEConfig.from_toml("configs/fast.toml")                    # all fields under [mage]
MAGEConfig.from_env()                                        # MAGE_* variables
```

## Generate with a typed request

Development line only. Use a `GenerationRequest` when the chain has a fixed
input shape or must return an exact JSON object.

```python
import asyncio
from mmar_mage import (
    DataEgressPolicy, GenerationOutputContract, GenerationRequest,
    MAGEConfig, MAGEGenerator, PersistencePolicy,
)

schema = {
    "type": "object",
    "properties": {
        "total": {"type": "number"},
        "top_issues": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["total", "top_issues"],
    "additionalProperties": False,
}

request = GenerationRequest(
    current_task="Count the reported issues and name the top three",
    runtime_input_schema={
        "type": "object",
        "properties": {"reviews": {"type": "string"}},
        "required": ["reviews"],
        "additionalProperties": False,
    },
    output_contract=GenerationOutputContract(schema_name="feedback_issues", json_schema=schema),
    data_egress_policy=DataEgressPolicy(external_research="deny"),
    persistence_policy=PersistencePolicy(mode="deny"),
)

generator = MAGEGenerator(MAGEConfig(mode="fast", api_key="sk-..."))
result = asyncio.run(generator.generate(request))
print([s["step_type"] for s in result.chain_dict["steps"]])   # ends with "structured_output"
```

With an `output_contract`, the only terminal step must be `structured_output`
with the same schema name, fields and types. If the model writes something
else, MAGE reports the mismatch, tries one repair and otherwise raises
`MAGEValidationError`. At run time the chain gets the input object as
`$outer_context` (here `$outer_context.reviews`).

## Generate from the CLI

```bash
export MAGE_API_KEY=sk-...
mage generate "Classify support tickets by urgency" --mode fast --no-memory -o chain.json
mage generate "Summarise a quarterly report" --base-url http://localhost:8000/v1 --model my-model
mage validate chain.json
```

`mage validate` runs MAGE's structural check, the strict CARL type check and
`ReasoningChain.from_json`. It is not full admission: lint and
`validate_runtime_chain` are not run. See [CLI](/mage/integration/cli/).

## What was checked

The two Python examples and `mage validate` were run on the development branch
`feat/v3-ideal-loop` (acf7091) with the OpenAI client replaced by a stub that
returns a fixed chain: no network, no key. The chains loaded in CARL. A real
endpoint was not called.

## Next

- [Generation pipeline](/mage/concepts/pipeline/)
- [Typed requests and admission](/mage/concepts/typed-authoring/)
- [Run the chain with CARL](/carl/getting-started/quick-start/)
