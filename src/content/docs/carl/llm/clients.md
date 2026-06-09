---
title: LLM Clients
description: OpenAI-compatible and Anthropic clients, the client interface, and auto-detection.
sidebar:
  order: 1
---

CARL talks to LLMs through clients implementing `LLMClientBase`. Pass one to
`ReasoningContext(api=...)`.

## OpenAI-compatible

`OpenAICompatibleClient` works with OpenRouter, Azure OpenAI, and local LLMs
(Ollama, vLLM, LM Studio). It's constructed from an `OpenAIClientConfig`:

```python
from mmar_carl import OpenAICompatibleClient, OpenAIClientConfig

client = OpenAICompatibleClient(OpenAIClientConfig(
    base_url="https://openrouter.ai/api/v1",
    api_key="sk-or-v1-...",
    model="qwen/qwen3-coder",
    temperature=0.7,            # default
    extra_headers={"X-Title": "My App"},
))
```

`OpenAIClientConfig` fields: `base_url`, `api_key` (required), `model` (required),
`temperature` (0.7), `max_tokens`, `timeout` (120 s), `verify_ssl`,
`extra_headers`, `extra_body`, and [`retry_policy`](/carl/llm/retries/).

## Anthropic

`AnthropicClient` is a native client (built from `AnthropicClientConfig`) that
reaches Anthropic-only features the OpenAI-compatible path can't.

```python
from mmar_carl import AnthropicClient, AnthropicClientConfig

client = AnthropicClient(AnthropicClientConfig(
    api_key="sk-ant-...",
    model="claude-3-7-sonnet-latest",   # default
    max_tokens=4096,                    # required by Anthropic
    thinking_budget=2000,               # enable extended thinking (Claude 3.7+)
    cache_system=True,                  # prompt-cache the system prompt
))
```

| `AnthropicClientConfig` field | Default | Purpose |
| --- | --- | --- |
| `api_key` | — (required) | Anthropic key (`ANTHROPIC_API_KEY` is the SDK fallback). |
| `model` | `claude-3-7-sonnet-latest` | Model id. |
| `temperature` | `0.7` | 0.0–1.0. |
| `max_tokens` | `4096` | **Required** by Anthropic (no implicit cap). |
| `timeout` | `120.0` | Seconds. |
| `base_url` | `None` | Override the API host (gateway / VPC). |
| `extra_headers` | `{}` | Extra HTTP headers. |
| `thinking_budget` | `None` | Token budget for extended thinking. |
| `cache_system` | `False` | Mark system blocks `cache_control: ephemeral` for prompt caching. |

### Anthropic-only methods

- **`get_response_with_thinking(prompt, *, system_prompt=None, retries=3)`** →
  `dict` with the structured `thinking` trace + the answer (needs `thinking_budget`).
- **`get_response_with_image(...)`** — native vision (image URL or base64).
- **`get_response_with_tools(...)`** — native Anthropic tool-calling. Convert
  OpenAI-style tool schemas with `openai_tools_to_anthropic(tools)`.

A missing SDK or key raises `AnthropicClientError`.

## The client interface

`LLMClientBase` defines the methods executors use:

| Method | Purpose |
| --- | --- |
| `get_response(prompt)` | Single completion. |
| `get_response_with_retries(prompt, retries=…)` | With retry handling. |
| `get_response_with_system(prompt, system)` | With a system prompt. |
| `get_response_with_usage(prompt)` | Returns text + token usage. |
| `get_response_with_messages(messages)` | Multi-turn (see `ChatMessage`). |
| `get_response_with_tools(...)` | Tool-calling. |
| `stream_response(prompt)` | Token streaming. |

Plus introspection: `model_name`, `temperature`, `max_tokens`, `supports_streaming`.

`ChatMessage(role, content)` (`role: "system" | "user" | "assistant"`) models
multi-turn history.

## Auto-detection

You don't have to construct a client yourself — pass any supported API object to
`ReasoningContext(api=...)` and CARL picks the right client:

- `OpenAICompatibleClient` / `AnthropicClient`
- `LLMHub` (from `mmar-llm`), `LLMHubAPI` (from `mmar-mapi`)
- Mock objects implementing `__getitem__` or `get_response` (for tests)

## See also

- [Retries](/carl/llm/retries/) · [Record & replay](/carl/llm/record-replay/)
- [Per-step model overrides](/carl/steps/llm/#per-step-llm-config)
