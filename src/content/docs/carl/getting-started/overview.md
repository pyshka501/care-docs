---
title: What is CARL?
description: A Python library for chain-of-thought reasoning with DAG-based parallel execution.
sidebar:
  order: 2
---

**MMAR CARL** — Collaborative Agent Reasoning Library — is a Python library for
building universal chain-of-thought reasoning systems with RAG-like context
extraction and DAG-based parallel execution.

You define a chain of reasoning **steps** with dependencies; CARL builds a
directed acyclic graph, runs everything that can run in parallel, and extracts
relevant context from your input for each step automatically.

## Key features

- **DAG-based execution** — steps parallelise automatically based on dependencies.
- **RAG-like context extraction** — substring or FAISS vector search pulls relevant context per step.
- **Many step types** — LLM, Tool, MCP, Memory, Transform, Conditional, Structured Output, AgentSkill, and multi-agent orchestration (handoff / supervisor / debate / parallel sampling / human-in-the-loop).
- **Async + streaming** — `execute_async` and `stream_async` with per-step callbacks.
- **Evolution & evaluation** — genetic search over chains, metrics, dataset evaluation, reflection.
- **Observability** — execution traces, Gantt charts, token/cost breakdowns, Langfuse.
- **OpenAI-compatible** — OpenRouter, Azure, Ollama, vLLM, LM Studio; plus a native Anthropic client.

## Installation extras

```bash
pip install mmar-carl                 # core (substring search)
pip install 'mmar-carl[vector-search]' # FAISS semantic search
pip install 'mmar-carl[openai]'        # OpenAI-compatible providers
pip install 'mmar-carl[mcp]'           # Model Context Protocol
pip install 'mmar-carl[skills]'        # AgentSkills (+ pdf + pptx)
pip install 'mmar-carl[viz]'           # PNG chart output
pip install 'mmar-carl[all]'           # everything
```

Requires Python 3.12+.

## Where to go next

- [Quick Start](/carl/getting-started/quick-start/) — your first chain.
- [Core concepts](/carl/concepts/what-is-carl/) — the mental model.
